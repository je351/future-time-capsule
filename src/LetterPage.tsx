import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

type LetterData = {
  id: string;
  content: string;
  letter_color: string | null;
  scheduled_at: string;
  created_at: string;
  is_opened: boolean | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const BUBBLE_MAP: Record<string, string> = {
  '#E8DFFF': '/images/bubble-lavender.webp',
  '#FFE4D6': '/images/bubble-peach.webp',
  '#D6F5EE': '/images/bubble-mint.webp',
  '#D6EEFF': '/images/bubble-blue.webp',
};

function getBubbleImage(letterColor: string | null): string {
  if (!letterColor) return '/images/bubble-lavender.webp';
  return BUBBLE_MAP[letterColor] ?? '/images/bubble-lavender.webp';
}

// 앱인토스 환경 감지
function isInToss(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  // 토스 in-app browser는 UA에 'toss' 포함
  return /toss/i.test(ua) || !!(window as any).TossAppBridge || !!(window as any).intoss;
}

// ── 캡슐 ─────────────────────────────────────────
function GlassCapsule({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'transform .3s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="200" height="280" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(200,160,220,0.35))' }}>
        <defs>
          <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFB8D9" />
            <stop offset="33%"  stopColor="#E0C3FC" />
            <stop offset="66%"  stopColor="#B8E0FF" />
            <stop offset="100%" stopColor="#FFF8B8" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
          </linearGradient>
          <linearGradient id="innerGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="cglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <path d="M40 80 L40 200 Q40 250 100 250 Q160 250 160 200 L160 80"
          fill="url(#glassGrad)" stroke="url(#holoGrad)" strokeWidth="4" filter="url(#cglow)" />
        <path d="M55 90 L55 190 Q55 230 100 230 Q145 230 145 190 L145 90"
          fill="url(#innerGlow)" opacity="0.5" />
        <ellipse cx="100" cy="80" rx="60" ry="15"
          fill="url(#glassGrad)" stroke="url(#holoGrad)" strokeWidth="4" filter="url(#cglow)" />
        <path d="M60 80 Q60 40 100 35 Q140 40 140 80"
          fill="url(#glassGrad)" stroke="url(#holoGrad)" strokeWidth="4" filter="url(#cglow)" />
        <ellipse cx="100" cy="35" rx="15" ry="8" fill="url(#holoGrad)" filter="url(#cglow)" />
        <ellipse cx="70" cy="150" rx="8" ry="30" fill="rgba(255,255,255,0.4)" transform="rotate(-15 70 150)" />
        <ellipse cx="130" cy="120" rx="4" ry="15" fill="rgba(255,255,255,0.3)" transform="rotate(15 130 120)" />
        <rect x="75" y="130" width="50" height="60" rx="3"
          fill="rgba(255,255,255,0.5)" transform="rotate(-5 100 160)" />
        <line x1="82" y1="145" x2="115" y2="143" stroke="rgba(200,180,220,0.6)" strokeWidth="2" transform="rotate(-5 100 160)" />
        <line x1="82" y1="155" x2="110" y2="153" stroke="rgba(200,180,220,0.6)" strokeWidth="2" transform="rotate(-5 100 160)" />
        <line x1="82" y1="165" x2="105" y2="163" stroke="rgba(200,180,220,0.6)" strokeWidth="2" transform="rotate(-5 100 160)" />
        <circle cx="80" cy="180" r="3" fill="white" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="120" cy="140" r="2" fill="white" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
      <p style={{ fontSize: 13, color: '#B8A0D4', fontStyle: 'italic', letterSpacing: '.08em', animation: 'pulse 2s ease-in-out infinite' }}>
        {disabled ? '편지 불러오는 중...' : '탭해서 열어보세요'}
      </p>
    </button>
  );
}

// ── 편지 카드 ─────────────────────────────────────
function LetterCard({
  content, date, showDate, handleSave, handleShare, navigate, isSaving, letterColor,
}: {
  content: string; date: string; showDate: boolean;
  handleSave: () => void; handleShare: () => void;
  navigate: (path: string) => void; isSaving: boolean; letterColor: string | null;
}) {
  const bubbleImg = getBubbleImage(letterColor);
  return (
    <div className="relative w-full mx-auto" style={{ padding: '48px 0', height: 'auto', maxWidth: '800px' }}>
      {showDate && (
        <p style={{
          fontSize: 13, fontStyle: 'italic', color: '#2D2B6B',
          textAlign: 'left',
          marginBottom: 20,
          animation: 'fadeIn .6s ease forwards',
        }}>
          {date}
        </p>
      )}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 28,
          fontStyle: 'italic', fontWeight: 400,
          color: '#4A3F6B', marginBottom: 20, margin: '0 0 20px',
          textAlign: 'left',
        }}>
          Dear,
        </h2>
        <img src={bubbleImg} alt="" style={{
          position: 'absolute', top: '14px', right: '-40px', width: '40px', height: '40px', opacity: 0.8, zIndex: 2
        }} />
        <img src={bubbleImg} alt="" style={{
          position: 'absolute', top: '10px', right: '-60px', width: '20px', height: '20px', opacity: 0.8, zIndex: 1
        }} />
      </div>
      <div style={{ overflow: 'hidden' }}>
        <p style={{
          fontSize: 16, lineHeight: 2, color: '#2D2B6B',
          margin: 0,
          fontFamily: 'Georgia, serif',
          whiteSpace: 'pre-wrap',
          width: '100%', wordBreak: 'keep-all',
          animation: 'fadeInUp .5s ease forwards',
          opacity: 0,
          textAlign: 'left',
        }}>
          {content}
        </p>
      </div>

      {/* 버튼들 */}
      <div style={{ display: 'flex', gap: '12px', marginTop: 20, flexWrap: 'wrap' }}>
        {/* Save 버튼 */}
        {showDate && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 28px', borderRadius: 99, border: 'none',
              cursor: isSaving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 500,
              background: 'linear-gradient(to right, #ffd6e0, #e8d5f5, #fff5cc)',
              color: '#888', fontFamily: 'Georgia, serif',
              transition: 'all .3s', opacity: isSaving ? .6 : 1,
              animation: 'fadeIn .6s ease',
            }}
          >
            {isSaving ? '저장 중...' : '이미지 저장'}
          </button>
        )}

        {/* 공유하기 버튼 */}
        {showDate && (
          <button
            onClick={handleShare}
            style={{
              padding: '8px 28px', borderRadius: 99, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: 'linear-gradient(to right, #d6e8ff, #e8d5f5, #ffe4f0)',
              color: '#888', fontFamily: 'Georgia, serif',
              transition: 'all .3s',
              animation: 'fadeIn .6s ease',
            }}
          >
            공유하기
          </button>
        )}

        {/* 새 편지 버튼 */}
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', borderRadius: 99,
            border: '1px solid rgba(180,150,220,0.3)',
            background: 'transparent', color: '#6B5EA7',
            fontSize: 15, fontFamily: 'Georgia, serif', fontStyle: 'italic',
            cursor: 'pointer', transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,150,220,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          미래의 나에게 편지 쓰기 →
        </button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────
export default function LetterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<'fetching' | 'capsule' | 'loading' | 'letter'>('fetching');
  const [letter, setLetter] = useState<LetterData | null>(null);
  const [shownContent, setShownContent] = useState<string>('');
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 토스트 자동 숨김
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // 편지 데이터 조회
  useEffect(() => {
    if (!id) {
      setError('잘못된 링크예요.');
      return;
    }
    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('letters')
          .select('*')
          .eq('id', id)
          .maybeSingle(); // ★ single → maybeSingle: 0개 결과를 에러로 처리하지 않음

        if (dbError) {
          console.error('[LetterPage] supabase error:', dbError);
          setError('편지를 불러오는 중 문제가 생겼어요.');
          return;
        }
        if (!data) {
          setError('편지를 찾을 수 없어요. 링크가 만료되었거나 잘못된 주소일 수 있어요.');
          return;
        }
        // 본문이 비어있는 케이스도 방어
        if (!data.content || !data.content.trim()) {
          setError('편지 내용이 비어있어요.');
          return;
        }
        setLetter(data as LetterData);
        setStage('capsule');
      } catch (e) {
        console.error('[LetterPage] unexpected error:', e);
        setError('알 수 없는 오류가 발생했어요.');
      }
    })();
  }, [id]);

  const openCapsule = async () => {
    if (!letter) return; // ★ letter 없으면 클릭 무시
    setStage('loading');
    if (id && !letter.is_opened) {
      // 비동기 업데이트는 await 안 걸어도 됨 (UX 빠르게)
      supabase.from('letters').update({ is_opened: true }).eq('id', id).then(() => {});
    }
    setTimeout(() => {
      setStage('letter');
      setShownContent(letter.content);
      setTimeout(() => setShowDate(true), 1000);
    }, 2000);
  };

  // 이미지 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 폰트 로딩 완료 대기
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('letter-card');
      if (!el) {
        setToast('저장할 영역을 찾을 수 없어요.');
        return;
      }

      // 애니메이션 강제 종료
      const animated = el.querySelectorAll<HTMLElement>('p, h2');
      animated.forEach(node => {
        node.style.opacity = '1';
        node.style.animation = 'none';
        node.style.transform = 'none';
      });

      // 버튼 임시 숨김
      const buttons = el.querySelectorAll<HTMLElement>('button');
      buttons.forEach(btn => (btn.style.display = 'none'));

      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#E2E7F7',
        logging: false,
      });

      // 버튼 복원
      buttons.forEach(btn => (btn.style.display = ''));

      // 다운로드
      canvas.toBlob((blob) => {
        if (!blob) {
          setToast('이미지 생성에 실패했어요.');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `future-time-capsule-${id?.slice(0, 8) || 'letter'}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setToast('이미지가 저장되었어요 ✨');
      }, 'image/png');
    } catch (e) {
      console.error('[LetterPage] save error:', e);
      setToast('저장 중 오류가 발생했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 공유하기
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: '퓨쳐타임캡슐',
      text: '미래의 나에게서 편지가 도착했어요 💌',
      url: shareUrl,
    };

    try {
      // 1순위: Web Share API (모바일 네이티브 공유시트)
      if (navigator.share && !isInToss()) {
        await navigator.share(shareData);
        return;
      }
      // 2순위: 클립보드 복사
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setToast('링크가 복사되었어요 📋');
        return;
      }
      // 3순위: 폴백 (구형 브라우저)
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setToast('링크가 복사되었어요 📋');
    } catch (e: any) {
      // 사용자가 공유 취소한 건 에러 아님
      if (e?.name === 'AbortError') return;
      console.error('[LetterPage] share error:', e);
      setToast('공유에 실패했어요.');
    }
  };

  // ─── 렌더링 ───
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'linear-gradient(to bottom, #F4F0FF, #EEF6FF)',
        fontFamily: 'Georgia, serif', color: '#7B6E9A',
        padding: '0 24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 320 }}>{error}</p>
        <button onClick={() => navigate('/')} style={{
          padding: '10px 24px', borderRadius: 99, border: 'none',
          background: '#EDE8FF', color: '#7B5EA7', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#E2E7F7',
        padding: '48px 16px',
        fontFamily: 'Georgia, serif',
      }}>

        {/* 상단 손글씨 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Caveat', cursive",
            fontSize: 28, fontWeight: 400,
            color: 'rgba(160,120,210,0.8)',
            letterSpacing: '.02em',
          }}>
            Future Time Capsule
          </h1>
        </div>

        {/* 데이터 로딩 중 */}
        {stage === 'fetching' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            animation: 'fadeIn .3s ease',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2.5px solid rgba(200,160,240,0.3)',
              borderTopColor: '#C8A0E8',
              animation: 'spin .9s linear infinite',
            }} />
            <p style={{ fontSize: 13, color: '#B8A0D4', fontStyle: 'italic' }}>편지를 찾는 중...</p>
          </div>
        )}

        {/* 캡슐 */}
        {stage === 'capsule' && (
          <div style={{ animation: 'fadeIn .5s ease' }}>
            <GlassCapsule onClick={openCapsule} disabled={!letter} />
          </div>
        )}

        {/* 캡슐 여는 중 */}
        {stage === 'loading' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            animation: 'fadeIn .3s ease',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '2.5px solid rgba(200,160,240,0.3)',
              borderTopColor: '#C8A0E8',
              animation: 'spin .9s linear infinite',
            }} />
            <p style={{ fontSize: 13, color: '#B8A0D4', fontStyle: 'italic' }}>편지를 꺼내는 중...</p>
          </div>
        )}

        {/* 편지 */}
        {stage === 'letter' && letter && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20,
            width: '100%',
            padding: '48px 16px',
            animation: 'fadeIn .5s ease',
          }}>
            <div id="letter-card" style={{ width: '100%', padding: '0 40px 48px 40px' }}>
              <LetterCard
                content={shownContent}
                date={letter.created_at ? formatDate(letter.created_at) : ''}
                showDate={showDate}
                handleSave={handleSave}
                handleShare={handleShare}
                navigate={navigate}
                isSaving={isSaving}
                letterColor={letter.letter_color}
              />
            </div>
          </div>
        )}

        {/* 토스트 */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(45, 43, 107, 0.92)', color: 'white',
            padding: '12px 24px', borderRadius: 99,
            fontSize: 13, fontFamily: 'Georgia, serif',
            boxShadow: '0 8px 24px rgba(45,43,107,0.25)',
            animation: 'fadeInUp .3s ease',
            zIndex: 1000,
          }}>
            {toast}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>
    </>
  );
}
