// src/OnboardingModal.tsx
// 첫 방문 시 1회만 자동 표시되는 온보딩 모달

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'ftc_onboarding_seen';

// 구슬 11개 위치/크기 (첨부 이미지 참고 — 왼쪽에서 아래로 흩뿌리기)
const BUBBLES = [
  { size: 140, top: -30,  left: -20,  opacity: 0.3,  blur: 2, delay: 0.1  },
  { size: 60,  top: 65,   left: 88,   opacity: 0.25, blur: 1, delay: 0.18 },
  { size: 35,  top: 115,  left: 48,   opacity: 0.2,  blur: 1, delay: 0.24 },
  { size: 20,  top: 155,  left: 18,   opacity: 0.18, blur: 1, delay: 0.28 },
  { size: 55,  top: 182,  left: 52,   opacity: 0.22, blur: 1, delay: 0.32 },
  { size: 30,  top: 205,  left: 108,  opacity: 0.18, blur: 1, delay: 0.36 },
  { size: 45,  top: 252,  left: 28,   opacity: 0.2,  blur: 1, delay: 0.4  },
  { size: 25,  top: 292,  left: 88,   opacity: 0.16, blur: 1, delay: 0.44 },
  { size: 18,  top: 325,  left: 12,   opacity: 0.15, blur: 1, delay: 0.48 },
  { size: 35,  top: 352,  left: 58,   opacity: 0.18, blur: 1, delay: 0.52 },
  { size: 15,  top: 385,  left: 102,  opacity: 0.12, blur: 1, delay: 0.56 },
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative w-full max-w-sm overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.82)',
              borderRadius: '2.5rem',
              boxShadow: '0 24px 60px rgba(140, 100, 200, 0.15), 0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid rgba(255,255,255,0.9)',
              minHeight: 420,
            }}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 z-20 p-1.5 rounded-full transition-all"
              style={{ color: '#C0B0D8', background: 'rgba(200,180,230,0.15)' }}
            >
              <X size={16} />
            </button>

            {/* 구슬 11개 */}
            <div className="absolute inset-0 z-0 overflow-hidden" style={{ borderRadius: '2.5rem' }}>
              {BUBBLES.map((b, i) => (
                <motion.img
                  key={i}
                  src="/images/bubble-lavender.png"
                  alt=""
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: b.opacity, scale: 1 }}
                  transition={{ delay: b.delay, duration: 0.5, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    width: b.size,
                    height: b.size,
                    top: b.top,
                    left: b.left,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    filter: `blur(${b.blur}px)`,
                  }}
                />
              ))}
            </div>

            {/* 본문 — 구슬 위 오버레이 */}
            <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: 420 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '28px 28px 0 28px', textAlign: 'center' }}>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: '1.4rem',
                    color: '#CFBCF5',
                    fontWeight: 700,
                    marginBottom: 40,
                    lineHeight: 1.3,
                  }}
                >
                  Future Time Capsule
                </motion.h1>

                {/* 메인 카피 — 구슬 위 오버레이, 한 줄 */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#5A4A7A',
                    lineHeight: 1.5,
                    marginBottom: 16,
                    whiteSpace: 'nowrap',
                  }}
                >
                  오늘의 나를, 미래의 내가 알아준다면.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.68 }}
                  style={{ fontSize: 13, color: '#9A8ABB', lineHeight: 1.7 }}
                >
                  미래의 나에게 편지를 보내요.
                </motion.p>
              </div>

              {/* CTA 버튼 */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                style={{ padding: '24px 24px 28px' }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 99,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #ffd6e0, #e8d5f5, #d5e8ff)',
                    color: '#8A7AAA',
                    fontFamily: 'inherit',
                    letterSpacing: '-0.01em',
                    boxShadow: '0 4px 20px rgba(200, 160, 220, 0.3)',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  나에게 편지 쓰기 →
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
