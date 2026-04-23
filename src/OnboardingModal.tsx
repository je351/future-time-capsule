// src/OnboardingModal.tsx
// About 버튼(ℹ️)을 눌렀을 때만 표시되는 온보딩 모달

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

// 구슬 5개 — blur 제거, opacity만으로 그림자 느낌
const BUBBLES = [
  { size: 140, top: -30,  left: -20,  opacity: 0.28, delay: 0.1  },
  { size: 60,  top: 65,   left: 88,   opacity: 0.22, delay: 0.18 },
  { size: 35,  top: 155,  left: 18,   opacity: 0.18, delay: 0.26 },
  { size: 55,  top: 240,  left: 52,   opacity: 0.2,  delay: 0.34 },
  { size: 25,  top: 340,  left: 88,   opacity: 0.15, delay: 0.42 },
];

export default function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const handleClose = () => {
    onClose();
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
                  src="/images/bubble-lavender.webp"
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
