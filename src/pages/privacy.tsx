// app/privacy/page.tsx  (또는 pages/privacy.tsx)
// Future Time Capsule — 개인정보처리방침

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-sm leading-relaxed text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-gray-400 mb-10">시행일: 2026년 4월 1일</p>

      <p className="mb-10">
        넥스트스타(이하 "회사")는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」을
        준수하여 아래와 같이 개인정보처리방침을 운영합니다.
      </p>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제1조 (수집하는 개인정보 항목 및 수집 방법)
        </h2>
        <table className="w-full border-collapse text-sm mb-2">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left text-gray-500 font-normal w-28">구분</th>
              <th className="py-2 pr-4 text-left text-gray-500 font-normal">수집 항목</th>
              <th className="py-2 text-left text-gray-500 font-normal">수집 목적</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["무료 서비스", "발신자 이메일 주소", "편지 발송"],
              ["유료 서비스", "발신자 이메일, 수신자 이메일", "편지 발송 및 결제 확인"],
              ["결제", "결제 정보 (Stripe 직접 처리)", "서비스 요금 청구"],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-600">{a}</td>
                <td className="py-2 pr-4 text-gray-800">{b}</td>
                <td className="py-2 text-gray-800">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-500 text-xs mt-2">
          * 결제 카드 정보는 회사 서버에 저장되지 않으며, Stripe이 직접 처리합니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제2조 (개인정보의 보유 및 이용 기간)
        </h2>
        <ol className="list-decimal list-inside space-y-2 pl-1">
          <li>편지 발송 완료 후 이메일 주소 및 편지 내용은 30일 후 자동 삭제됩니다.</li>
          <li>
            단, 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 결제 관련 기록은 5년간
            보관합니다.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제3조 (개인정보의 제3자 제공)
        </h2>
        <p className="mb-2">
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우는
          예외로 합니다.
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따른 요청이 있는 경우</li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제4조 (개인정보 처리 위탁)
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left text-gray-500 font-normal">수탁업체</th>
              <th className="py-2 text-left text-gray-500 font-normal">위탁 업무</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Stripe, Inc.", "결제 처리"],
              ["Resend", "이메일 발송"],
              ["Supabase, Inc.", "데이터베이스 운영"],
            ].map(([company, task]) => (
              <tr key={company} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-800">{company}</td>
                <td className="py-2 text-gray-800">{task}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제5조 (이용자의 권리)
        </h2>
        <p className="mb-2">
          이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다.
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>개인정보 열람 요청</li>
          <li>개인정보 정정·삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
        </ol>
        <p className="mt-2">
          위 권리 행사는{" "}
          <a
            href="mailto:je@nextstar.kr"
            className="underline text-gray-600"
          >
            je@nextstar.kr
          </a>
          으로 이메일을 보내주시면 됩니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제6조 (개인정보 보호책임자)
        </h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {[
              ["성명", "송준철"],
              ["소속", "넥스트스타"],
              ["이메일", "je@nextstar.kr"],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-500 w-24">{label}</td>
                <td className="py-2 text-gray-800">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">제7조 (쿠키 사용)</h2>
        <p>
          서비스는 현재 별도의 쿠키를 사용하지 않습니다. 향후 쿠키를 사용할 경우 본 방침을
          업데이트하여 안내합니다.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          제8조 (개인정보처리방침 변경)
        </h2>
        <p>
          이 개인정보처리방침은 법령·정책 변경에 따라 개정될 수 있으며, 변경 시 서비스 내
          공지를 통해 사전에 안내합니다.
        </p>
      </section>

      <p className="text-xs text-gray-400 mt-16 border-t border-gray-100 pt-6">
        문의: je@nextstar.kr
      </p>
    </main>
  );
}
