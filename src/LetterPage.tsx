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
  return /toss/i.test(ua) || !!(window as any).TossAppBridge || !!(window as any).intoss;
}

// 150자 발췌 (마침표/쉼표 우선으로 자연스럽게 끊기)
function getExcerpt(content: string, maxLength: number = 150): { text: string; isExcerpted: boolean } {
  if (content.length <= maxLength) {
    return { text: content, isExcerpted: false };
  }

  // 150자 근처에서 마침표/쉼표/줄바꿈 찾기 (130~150자 범위)
  const searchRange = content.slice(130, maxLength);
  const punctuationMatches = [...searchRange.matchAll(/[.,。、!?\n]/g)];
  
  if (punctuationMatches.length > 0) {
    // 가장 마지막 구두점에서 자르기
    const lastMatch = punctuationMatches[punctuationMatches.length - 1];
    const cutPoint = 130 + (lastMatch.index ?? 0) + 1;
    return { text: content.slice(0, cutPoint).trim() + '…', isExcerpted: true };
  }

  // 구두점 없으면 그냥 150자에서 자름
  return { text: content.slice(0, maxLength).trim() + '…', isExcerpted: true };
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

// ── 편지 카드 (실제 표시용) ─────────────────────────
function LetterCard({
  content, date, showDate, handleSave, handleShare, navigate, isSaving, letterColor,
}: {
  content: string; date: string; showDate: boolean;
  handleSave: () => void; handleShare: () => void;
  navigate: (path: string) => void; isSaving: boolean; letterColor: string | null;
}) {
  const bubbleImg = getBubbleImage(letterColor);
  return (
    <div style={{ padding: '48px 0', height: 'auto', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
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

      {/* 버튼 영역 */}
      {showDate && (
        <div style={{ display: 'flex', gap: '10px', marginTop: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Primary: 미래의 나에게 편지 쓰기 (그라데이션) */}
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px', borderRadius: 99, border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
              background: 'linear-gradient(to right, #ffd6e0, #e8d5f5, #fff5cc)',
              color: '#4A3F6B', fontFamily: 'Georgia, serif', fontStyle: 'italic',
              transition: 'all .3s', 
              boxShadow: '0 4px 16px rgba(200,160,220,0.25)',
              animation: 'fadeIn .6s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,160,220,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(200,160,220,0.25)'; }}
          >
            미래의 나에게 편지 쓰기 →
          </button>

          {/* Secondary: 간직하기 (라인) */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '11px 22px', borderRadius: 99,
              border: '1px solid rgba(180,150,220,0.4)',
              background: 'transparent', color: '#6B5EA7',
              fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic',
              cursor: isSaving ? 'wait' : 'pointer', 
              transition: 'all .2s',
              opacity: isSaving ? 0.6 : 1,
              animation: 'fadeIn .6s ease',
            }}
            onMouseEnter={e => { if (!isSaving) e.currentTarget.style.background = 'rgba(180,150,220,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {isSaving ? '간직하는 중...' : '간직하기'}
          </button>

          {/* Secondary: 공유하기 (라인) */}
          <button
            onClick={handleShare}
            style={{
              padding: '11px 22px', borderRadius: 99,
              border: '1px solid rgba(180,150,220,0.4)',
              background: 'transparent', color: '#6B5EA7',
              fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic',
              cursor: 'pointer', 
              transition: 'all .2s',
              animation: 'fadeIn .6s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,150,220,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            공유하기
          </button>
        </div>
      )}
    </div>
  );
}

// ── 1080×1080 공유 카드 (PNG 저장용 숨김 컴포넌트) ─────────
function ShareCardForCapture({
  content, date, letterColor, isExcerpted,
}: {
  content: string; date: string; letterColor: string | null; isExcerpted: boolean;
}) {
  const bubbleImg = getBubbleImage(letterColor);
  return (
    <div
      id="share-card-capture"
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1080px',
        height: '1080px',
        background: '#E2E7F7',
        padding: '100px 100px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* 상단 타이틀 */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Caveat', cursive, Georgia, serif",
          fontSize: 48, fontWeight: 400,
          color: 'rgba(160,120,210,0.9)',
          letterSpacing: '.02em',
          margin: 0,
        }}>
          Future Time Capsule
        </h1>
      </div>

      {/* 편지 본문 영역 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0' }}>
        <p style={{
          fontSize: 24, fontStyle: 'italic', color: '#2D2B6B',
          margin: '0 0 24px',
        }}>
          {date}
        </p>
        
        <div style={{ display: 'inline-flex', alignItems: 'flex-start', marginBottom: 32 }}>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: 56,
            fontStyle: 'italic', fontWeight: 400,
            color: '#4A3F6B', margin: 0,
          }}>
            Dear,
          </h2>
          <img src={bubbleImg} alt="" crossOrigin="anonymous" style={{
            width: 60, height: 60, opacity: 0.8, marginLeft: 16, marginTop: 14,
          }} />
          <img src={bubbleImg} alt="" crossOrigin="anonymous" style={{
            width: 30, height: 30, opacity: 0.8, marginLeft: -8, marginTop: 6,
          }} />
        </div>
        
        <p style={{
          fontSize: 28, lineHeight: 2, color: '#2D2B6B',
          margin: 0,
          fontFamily: 'Georgia, serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'keep-all',
        }}>
          {content}
        </p>

        {isExcerpted && (
          <p style={{
            fontSize: 18, fontStyle: 'italic',
            color: 'rgba(45,43,107,0.5)',
            margin: '32px 0 0',
          }}>
            전문은 메일에 도착했어요
          </p>
        )}
      </div>

      {/* 하단 워터마크 */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22, fontStyle: 'italic',
          color: 'rgba(45,43,107,0.5)',
          margin: 0,
          letterSpacing: '.05em',
        }}>
          Dear, Me
        </p>
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
  const [showCaptureCard, setShowCaptureCard] = useState(false);

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
          .maybeSingle();

        if (dbError) {
          console.error('[LetterPage] supabase error:', dbError);
          setError('편지를 불러오는 중 문제가 생겼어요.');
          return;
        }
        if (!data) {
          setError('편지를 찾을 수 없어요. 링크가 만료되었거나 잘못된 주소일 수 있어요.');
          return;
        }
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
    if (!letter) return;
    setStage('loading');
    if (id && !letter.is_opened) {
      supabase.from('letters').update({ is_opened: true }).eq('id', id).then(() => {});
    }
    setTimeout(() => {
      setStage('letter');
      setShownContent(letter.content);
      setTimeout(() => setShowDate(true), 1000);
    }, 2000);
  };

  // 1080×1080 PNG 저장 (간직하기)
  const handleSave = async () => {
    if (!letter) return;
    setIsSaving(true);
    
    try {
      // 폰트 로딩 완료 대기
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 숨겨진 캡처 카드 표시
      setShowCaptureCard(true);
      
      // DOM 렌더링 + 이미지 로드 대기
      await new Promise(r => setTimeout(r, 200));

      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('share-card-capture');
      if (!el) {
        setToast('저장에 실패했어요.');
        return;
      }

      const canvas = await html2canvas(el, {
        width: 1080,
        height: 1080,
        scale: 2, // 더 선명하게
        useCORS: true,
        backgroundColor: '#E2E7F7',
        logging: false,
      });

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
        setToast('편지를 간직했어요 🤍');
      }, 'image/png');
      
    } catch (e) {
      console.error('[LetterPage] save error:', e);
      setToast('저장 중 오류가 발생했어요.');
    } finally {
      setShowCaptureCard(false);
      setIsSaving(false);
    }
  };

  // 공유하기
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: '퓨쳐타임캡슐',
      text: '미래의 나에게서 편지가 도착했어요',
      url: shareUrl,
    };

    try {
      if (navigator.share && !isInToss()) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setToast('링크가 복사되었어요');
        return;
      }
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setToast('링크가 복사되었어요');
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('[LetterPage] share error:', e);
      setToast('공유에 실패했어요.');
    }
  };

  // 발췌 텍스트 (저장용)
  const excerpt = letter ? getExcerpt(letter.content, 150) : { text: '', isExcerpted: false };

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

        {/* 1080×1080 PNG 저장용 숨김 카드 */}
        {showCaptureCard && letter && (
          <ShareCardForCapture
            content={excerpt.text}
            date={letter.created_at ? formatDate(letter.created_at) : ''}
            letterColor={letter.letter_color}
            isExcerpted={excerpt.isExcerpted}
          />
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
