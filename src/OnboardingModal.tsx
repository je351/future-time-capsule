// src/OnboardingModal.tsx
// 첫 방문 시 1회만 자동 표시되는 온보딩 모달

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'ftc_onboarding_seen';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // 약간의 딜레이 후 표시 (페이지 로딩 후 자연스럽게)
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
              background: 'linear-gradient(160deg, #fdf6ff 0%, #f5f0ff 50%, #fef9f5 100%)',
              borderRadius: '2.5rem',
              boxShadow: '0 24px 60px rgba(140, 100, 200, 0.18), 0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.9)',
            }}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 z-10 p-1.5 rounded-full transition-all"
              style={{ color: '#C0B0D8', background: 'rgba(200,180,230,0.15)' }}
            >
              <X size={16} />
            </button>

            {/* 상단 캡슐 장식 */}
            <div className="flex justify-center pt-10 pb-2">
              <div className="flex gap-2 items-end">
                {[
                  { color: '#E8DFFF', size: 36, delay: 0 },
                  { color: '#FFE4D6', size: 48, delay: 0.08 },
                  { color: '#D6F5EE', size: 36, delay: 0.16 },
                  { color: '#D6EEFF', size: 28, delay: 0.24 },
                ].map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: c.delay + 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      width: c.size,
                      height: c.size,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, white, ${c.color})`,
                      boxShadow: `0 4px 16px ${c.color}99`,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 본문 */}
            <div className="px-8 pt-4 pb-2">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: '1.8rem',
                  color: '#CFBCF5',
                  fontWeight: 700,
                  marginBottom: 12,
                  lineHeight: 1.2,
                }}
              >
                Future Time Capsule
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{ fontSize: 15, color: '#6A5A8A', lineHeight: 1.9, marginBottom: 20 }}
              >
                오늘의 나를<br />
                미래의 내가 알아줬으면.<br />
                <br />
                <span style={{ fontSize: 13, color: '#9A8ABB' }}>
                  그때의 나를 알아주는 건<br />결국 나 자신이에요.
                </span>
              </motion.p>
            </div>

            {/* CTA 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{ padding: '0 24px 28px' }}
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
                  background: 'linear-gradient(to right, #C4B0F0, #A090D8)',
                  color: 'white',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  boxShadow: '0 4px 20px rgba(160, 130, 220, 0.35)',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                지금 미래의 나에게 편지 쓰기 →
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
