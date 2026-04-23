import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type LetterRow = {
  id: string;
  email: string;
  content: string;
  delivery_option: string;
  scheduled_at: string;
  created_at: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatKoreanDateTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const nowIso = new Date().toISOString();
    const { data: letters, error: fetchError } = await supabase
      .from("letters")
      .select("id, email, content, delivery_option, scheduled_at, created_at")
      .eq("is_sent", false)
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pendingLetters = (letters ?? []) as LetterRow[];
    if (pendingLetters.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, failed: 0, message: "No letters to send." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    let failed = 0;
    const failures: Array<{ id: string; reason: string }> = [];

    for (const letter of pendingLetters) {
      const writtenAt = formatKoreanDateTime(letter.created_at ?? letter.scheduled_at);
      const emailText = [
        "안녕하세요. 퓨쳐타임캡슐 시간배송원입니다.",
        "과거의 당신이 미래의 당신에게 편지를 남겼어요.",
        "",
        `작성일: ${writtenAt}`,
        "",
        "[편지 원문]",
        letter.content,
        "",
        "──────────────────────────",
        "토스 앱에서 편지를 열어보세요.",
        `https://toss.im/_m/future-timecapsule?deep_link_value=intoss://future-timecapsule/letter/${letter.id}`,
        "",
        "토스 앱이 없다면 아래 링크로 열어보세요.",
        `https://future-time-capsule.vercel.app/letter/${letter.id}`,
      ].join("\n");

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Future Time Capsule <futuretimecapsule@nextstar.kr>",
          to: [letter.email],
          subject: "과거의 당신이 편지를 보냈어요 ✉",
          text: emailText,
        }),
      });

      if (!resendResponse.ok) {
        failed += 1;
        const errorText = await resendResponse.text();
        failures.push({ id: letter.id, reason: errorText || "Resend request failed" });
        continue;
      }

      const { error: updateError } = await supabase
        .from("letters")
        .update({ is_sent: true })
        .eq("id", letter.id);

      if (updateError) {
        failed += 1;
        failures.push({ id: letter.id, reason: updateError.message });
        continue;
      }

      sent += 1;
    }

    return new Response(JSON.stringify({ ok: true, total: pendingLetters.length, sent, failed, failures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
