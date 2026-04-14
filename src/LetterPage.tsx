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

function splitLines(content: string): string[] {
  return content.split('\n');
}

// ── 장식 원 ───────────────────────────────────────
type CircleColor = 'pink' | 'mint' | 'yellow' | 'white';
const colorMap: Record<CircleColor, { base: string; highlight: string; shadow: string }> = {
  pink:   { base: 'rgba(255,212,229,0.5)', highlight: 'rgba(255,240,245,0.6)', shadow: 'rgba(255,184,209,0.4)' },
  mint:   { base: 'rgba(200,244,232,0.5)', highlight: 'rgba(232,255,248,0.6)', shadow: 'rgba(159,232,212,0.4)' },
  yellow: { base: 'rgba(255,248,200,0.5)', highlight: 'rgba(255,254,240,0.6)', shadow: 'rgba(248,236,160,0.4)' },
  white:  { base: 'rgba(255,255,255,0.5)', highlight: 'rgba(255,255,255,0.6)', shadow: 'rgba(240,232,248,0.4)' },
};

function DecorativeCircle({ color, size, opacity = 0.5, style }: {
  color: CircleColor; size: number; opacity?: number; style?: React.CSSProperties;
}) {
  const colors = colorMap[color];
  const id = `dc-${color}-${size}-${Math.random().toString(36).substr(2, 6)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ opacity, position: 'absolute', ...style }}>
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="30%" r="60%">
          <stop offset="0%"   stopColor={colors.highlight} />
          <stop offset="60%"  stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill={`url(#${id}-g)`} />
      <ellipse cx="14" cy="14" rx="5" ry="3" fill="rgba(255,255,255,0.3)" transform="rotate(-30 14 14)" />
      <circle cx="13" cy="13" r="1.5" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

// ── 캡슐 ─────────────────────────────────────────
function GlassCapsule({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'transform .3s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
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
        탭해서 열어보세요
      </p>
    </button>
  );
}

// ── 편지 카드 ─────────────────────────────────────
function LetterCard({ content, date, showDate, handleSave, navigate, isSaving }: { content: string; date: string; showDate: boolean; handleSave: () => void; navigate: (path: string) => void; isSaving: boolean }) {
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
        <img src="/images/bubble.png" alt="" style={{
          position: 'absolute', top: '14px', right: '-40px', width: '40px', height: '40px', opacity: 0.8, zIndex: 2
        }} />
        <img src="/images/bubble.png" alt="" style={{
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
      <div style={{ display: 'flex', gap: '12px', marginTop: 20 }}>
        {/* Save 버튼 */}
        {showDate && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 28px', borderRadius: 99, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: 'linear-gradient(to right, #ffd6e0, #e8d5f5, #fff5cc)',
              color: '#888', fontFamily: 'Georgia, serif',
              transition: 'all .3s', opacity: isSaving ? .6 : 1,
              animation: 'fadeIn .6s ease',
            }}
          >
            {isSaving ? '저장 중...' : 'Save'}
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

  const [stage, setStage] = useState<'capsule' | 'loading' | 'letter'>('capsule');
  const [letter, setLetter] = useState<LetterData | null>(null);
  const [shownContent, setShownContent] = useState<string>('');
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from('letters').select('*').eq('id', id).single();
      if (error || !data) { setError('편지를 찾을 수 없어요.'); return; }
      setLetter(data);
    })();
  }, [id]);

  const openCapsule = async () => {
    setStage('loading');
    if (id && letter && !letter.is_opened) {
      await supabase.from('letters').update({ is_opened: true }).eq('id', id);
    }
    setTimeout(() => {
      setStage('letter');
      if (letter) {
        setShownContent(letter.content);
        setTimeout(() => setShowDate(true), 1000);
      }
    }, 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('letter-card');
      if (!el) return;
      // 애니메이션 중인 요소들 opacity 강제 1로
      const animated = el.querySelectorAll<HTMLElement>('p, h2');
      animated.forEach(el => {
        el.style.opacity = '1';
        el.style.animation = 'none';
        el.style.transform = 'none';
      });
      // 버튼들 임시 숨김
      const buttons = el.querySelectorAll<HTMLElement>('button');
      buttons.forEach(btn => btn.style.display = 'none');
      await new Promise(r => setTimeout(r, 50));
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      // 버튼들 다시 보이게
      buttons.forEach(btn => btn.style.display = '');
      const link = document.createElement('a');
      link.download = 'future-time-capsule.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('저장 중 오류가 발생했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const allLines = letter ? splitLines(letter.content) : [];

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'linear-gradient(to bottom, #F4F0FF, #EEF6FF)',
        fontFamily: 'Georgia, serif', color: '#aaa',
      }}>
        <p>{error}</p>
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

        {/* 캡슐 */}
        {stage === 'capsule' && (
          <div style={{ animation: 'fadeIn .5s ease' }}>
            <GlassCapsule onClick={openCapsule} />
          </div>
        )}

        {/* 로딩 */}
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
                navigate={navigate}
                isSaving={isSaving}
              />
            </div>
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
