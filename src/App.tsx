import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Calendar, Mail, X, RefreshCw, Info, Clock } from 'lucide-react';

import { supabase } from './supabase';

// ─── 토스페이 타입 선언 ──────────────────────────────
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
    };
    // 앱인토스 환경: TossSDK (미니앱 내 결제 브릿지)
    TossSDK?: {
      payment: {
        request: (options: Record<string, unknown>) => Promise<{ paymentKey: string; orderId: string; amount: number }>;
      };
    };
  }
}

// ─── 상수 ───────────────────────────────────────────
// 앱인토스 콘솔에서 발급받은 Client Key로 교체하세요
const TOSSPAY_CLIENT_KEY = 'test_ck_placeholder'; // TODO: 앱인토스 콘솔 → 수익화 → 토스페이 Client Key

const QUESTIONS = [
  "지금 이 순간, 미래의 나에게 전하고 싶은 한 마디는?",
  "1년 후의 나는 지금 나를 어떻게 볼까?",
  "요즘 가장 자주 드는 감정은 무엇인가요?",
  "지금 결정하지 못하고 있는 것이 있나요?",
  "오늘 하루, 기억하고 싶은 순간은?",
  "지금의 나를 가장 잘 표현하는 단어는?",
  "미래의 나에게 부탁하고 싶은 것이 있다면?",
];

const CAPSULE_COLORS = ['#E8DFFF', '#FFE4D6', '#D6F5EE', '#D6EEFF'];
const CAPSULE_NAMES = ['라벤더', '피치', '민트', '스카이'];
const CAPSULE_MAPPING = {
  '#E8DFFF': { image: '/images/bubble-lavender.png', text: '기다림의 보답' },
  '#FFE4D6': { image: '/images/bubble-peach.png', text: '피어나는 용기' },
  '#D6F5EE': { image: '/images/bubble-mint.png', text: '새로운 시작' },
  '#D6EEFF': { image: '/images/bubble-blue.png', text: '진실된 마음' },
};

const BORDER_CAPSULES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  color: CAPSULE_COLORS[i % 4],
  size: 12 + Math.floor(Math.random() * 8),
  initialProgress: i / 12,
}));

type DeliveryOption = '3days' | '1week' | '1month';

// ─── 캡슐 애니메이션 훅 ─────────────────────────────
function useCapsuleAnimation(isSpinning: boolean) {
  const [progress, setProgress] = useState(
    BORDER_CAPSULES.map(c => c.initialProgress)
  );
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  useEffect(() => {
    const speed = isSpinning ? 0.006 : 0.0008;
    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        const delta = (time - lastTimeRef.current) / 16.67;
        setProgress(prev => prev.map(p => (p + speed * delta) % 1));
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isSpinning]);

  return progress;
}

function progressToPos(progress: number, w: number, h: number) {
  const perimeter = 2 * (w + h);
  const dist = progress * perimeter;
  if (dist < w) return { x: dist, y: 0 };
  if (dist < w + h) return { x: w, y: dist - w };
  if (dist < 2 * w + h) return { x: w - (dist - w - h), y: h };
  return { x: 0, y: h - (dist - 2 * w - h) };
}

// ─── 결제 모달 ──────────────────────────────────────
function PaymentModal({
  deliveryOption,
  deliveryDate,
  selectedColor,
  onClose,
  onFreeFallback,
  onPaid,
}: {
  deliveryOption: DeliveryOption;
  deliveryDate: string;
  selectedColor: string | null;
  onClose: () => void;
  onFreeFallback: () => void;
  onPaid: () => void;
}) {
  const [isPaying, setIsPaying] = useState(false);
  const label = deliveryOption === '1week' ? '1주일 후' : '1달 후';
  const colorName = selectedColor
    ? CAPSULE_NAMES[CAPSULE_COLORS.indexOf(selectedColor)] ?? ''
    : '';

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const orderId = `ftc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // ── 앱인토스 미니앱 환경: TossSDK 브릿지 사용 ──
      if (window.TossSDK) {
        await window.TossSDK.payment.request({
          amount: 1000,
          orderId,
          orderName: `Future Time Capsule — ${label} 편지 발송`,
          customerName: '편지 작성자',
        });
        setIsPaying(false);
        onPaid();
        return;
      }

      // ── 일반 웹 환경 (개발/테스트): TossPayments SDK ──
      if (!window.TossPayments) {
        throw new Error('TossPayments SDK가 로드되지 않았습니다.');
      }
      const tossPayments = window.TossPayments(TOSSPAY_CLIENT_KEY);
      await tossPayments.requestPayment('카드', {
        amount: 1000,
        orderId,
        orderName: `Future Time Capsule — ${label} 편지 발송`,
        customerName: '편지 작성자',
        successUrl: `${window.location.origin}/?payment=success`,
        failUrl: `${window.location.origin}/?payment=fail`,
      });

      // requestPayment는 리다이렉트 방식이므로 아래는 팝업 방식일 때만 실행됨
      setIsPaying(false);
      onPaid();
    } catch (e: unknown) {
      setIsPaying(false);
      const err = e as { code?: string; message?: string };
      // 사용자가 직접 취소한 경우 — 에러 표시 없이 조용히 닫기
      if (
        err?.code === 'USER_CANCEL' ||
        err?.message?.toLowerCase().includes('cancel') ||
        err?.message?.toLowerCase().includes('취소')
      ) return;
      console.error('결제 실패:', e);
      alert('결제에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        className="relative w-full max-w-sm bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/60"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={18} />
        </button>

        <div className="p-8 space-y-6 text-center">
          {selectedColor && (
            <div
              className="mx-auto w-16 h-16 rounded-full border-4 border-white shadow-lg"
              style={{ background: selectedColor }}
            />
          )}

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">편지 발송 확인</p>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {label}에 편지가<br />도착합니다
            </h2>
            <p className="text-sm text-slate-500 mt-2">{deliveryDate}</p>
            {colorName && (
              <p className="text-xs text-slate-400 mt-1">편지지 색: {colorName}</p>
            )}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">결제 금액</p>
            <p className="text-3xl font-extrabold text-slate-900">
              1,000<span className="text-lg font-semibold text-slate-500">원</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">1회 단건 결제 · 토스페이</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={isPaying}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-bold text-base shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPaying ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                결제창 여는 중...
              </>
            ) : (
              '1,000원 결제하고 보내기'
            )}
          </button>

          <button
            onClick={onFreeFallback}
            disabled={isPaying}
            className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2 disabled:opacity-40"
          >
            3일 후 무료로 보내기
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CapsuleModal({
  selectedColor,
  scheduledAt,
  onClose,
}: {
  selectedColor: string;
  scheduledAt: Date;
  onClose: () => void;
}) {
  const capsuleData = CAPSULE_MAPPING[selectedColor as keyof typeof CAPSULE_MAPPING];
  const month = scheduledAt.getMonth() + 1;
  const day = scheduledAt.getDate();

  const handleShare = async () => {
    const text = `미래의 나에게 편지를 보냈어요 ✉️\n${month}월 ${day}일에 도착합니다.\n어떤 색 캡슐이 나왔는지 확인해보세요 🫧\n소중한 분과 함께 캡슐을 열어봐요!`;
    const url = 'https://future-time-capsule.vercel.app';
    if (navigator.share) {
      try { await navigator.share({ title: 'Future Time Capsule', text, url }); } catch { /* 취소 */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      alert('복사됐어요!');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative w-full max-w-xs overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #fdf6ff 0%, #f0f4ff 50%, #fef9f0 100%)',
          borderRadius: '2.5rem',
          boxShadow: '0 8px 40px rgba(180,150,220,0.25)',
          border: '1px solid rgba(255,255,255,0.8)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full transition-all z-10"
          style={{ color: '#C0B0D8', background: 'rgba(200,180,230,0.15)' }}
        >
          <X size={16} />
        </button>

        {/* 구슬 영역 */}
        <div className="flex flex-col items-center pt-12 pb-6 px-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="mb-4"
          >
            {capsuleData ? (
              <img
                src={capsuleData.image}
                alt={capsuleData.text}
                style={{ width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(200,160,240,0.4))' }}
              />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: selectedColor, opacity: 0.7 }} />
            )}
          </motion.div>

          {/* 텍스트 */}
          <p style={{ fontSize: 11, letterSpacing: '0.2em', color: '#C0A8E0', marginBottom: 12, fontStyle: 'italic' }}>
            {capsuleData?.text ?? ''}
          </p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: '#4A3F6B', marginBottom: 8, textAlign: 'center', lineHeight: 1.4 }}>
            편지가 캡슐에 담겼어요
          </h2>
          <p style={{ fontSize: 14, color: '#8A7AAA', textAlign: 'center', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: '#6A5A9A' }}>{month}월 {day}일</span>에<br />편지가 도착합니다.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px', borderRadius: 99, border: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
              background: 'linear-gradient(to right, #ffd6e0, #e8d5f5, #fff5cc)',
              color: '#8A7AAA', fontFamily: 'Georgia, serif',
              transition: 'all .3s',
              boxShadow: '0 2px 12px rgba(200,160,220,0.2)',
            }}
          >
            확인
          </button>
          <button
            onClick={handleShare}
            style={{
              width: '100%', padding: '10px', borderRadius: 99,
              border: '1px solid rgba(180,150,220,0.25)',
              background: 'transparent', color: '#B0A0CC',
              fontSize: 13, fontFamily: 'Georgia, serif', fontStyle: 'italic',
              cursor: 'pointer', transition: 'all .2s',
            }}
          >
            공유하기 ↗
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── 메인 앱 ────────────────────────────────────────
export default function App() {
  const [letterContent, setLetterContent] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('3days');
  const [currentQuestion, setCurrentQuestion] = useState(
    () => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]
  );
  const [sentCount, setSentCount] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [capsulePhase, setCapsulePhase] = useState<'idle' | 'spinning' | 'selected'>('idle');

  const [showPayment, setShowPayment] = useState(false);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [modalData, setModalData] = useState<{ color: string; scheduledAt: Date } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const [editorSize, setEditorSize] = useState({ w: 600, h: 400 });

  const [toast, setToast] = useState<{ message: string; visible: boolean; type: 'success' | 'error' }>({
    message: '', visible: false, type: 'success',
  });

  const capsuleProgress = useCapsuleAnimation(isSpinning);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase.from('letters').select('*', { count: 'exact', head: true });
      if (count !== null) setSentCount(count);
    };
    fetchCount();
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setEditorSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(editorRef.current);
    return () => ro.disconnect();
  }, []);

  const getScheduledDate = (option: DeliveryOption) => {
    const date = new Date();
    switch (option) {
      case '3days': date.setDate(date.getDate() + 3); break;
      case '1week': date.setDate(date.getDate() + 7); break;
      case '1month': date.setMonth(date.getMonth() + 1); break;
    }
    return date;
  };

  const getDeliveryDate = (option: DeliveryOption) =>
    getScheduledDate(option).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

  const deliveryDate = getDeliveryDate(deliveryOption);

  const handleRandomQuestion = () => {
    const others = QUESTIONS.filter(q => q !== currentQuestion);
    setCurrentQuestion(others[Math.floor(Math.random() * others.length)]);
  };

  const spinAndSelect = (): Promise<string> => {
    return new Promise(resolve => {
      setIsSpinning(true);
      setCapsulePhase('spinning');
      setTimeout(() => {
        setIsSpinning(false);
        const picked = CAPSULE_COLORS[Math.floor(Math.random() * CAPSULE_COLORS.length)];
        setSelectedColor(picked);
        setCapsulePhase('selected');
        resolve(picked);
      }, 2000);
    });
  };

  const validate = () => {
    if (!letterContent.trim()) { showToast('편지 내용을 작성해주세요.', 'error'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('올바른 이메일 주소를 입력해주세요.', 'error'); return false; }
    return true;
  };

  const saveLetter = async (color: string, isPaid: boolean, option: DeliveryOption) => {
    setIsSending(true);
    const scheduled = getScheduledDate(option);
    const { error } = await supabase.from('letters').insert([{
      content: letterContent.trim(),
      email: email.trim(),
      delivery_option: option,
      scheduled_at: scheduled.toISOString(),
      letter_color: color,
      is_paid: isPaid,
      amount: isPaid ? 1000 : 0,
    }]);
    setIsSending(false);
    if (error) { showToast('편지 저장에 실패했어요. 잠시 후 다시 시도해주세요.', 'error'); return false; }
    setSentCount(prev => prev + 1);
    setModalData({ color, scheduledAt: scheduled });
    setShowCapsuleModal(true);
    setLetterContent('');
    setEmail('');
    setCapsulePhase('idle');
    setSelectedColor(null);
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    const color = await spinAndSelect();
    if (deliveryOption === '3days') {
      await saveLetter(color, false, '3days');
    } else {
      setShowPayment(true);
    }
  };

  // 결제 성공 후 호출
  const handlePaid = async () => {
    setShowPayment(false);
    if (selectedColor) await saveLetter(selectedColor, true, deliveryOption);
  };

  const handleFreeFallback = async () => {
    setShowPayment(false);
    setDeliveryOption('3days');
    if (selectedColor) await saveLetter(selectedColor, false, '3days');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const isPaidOption = deliveryOption === '1week' || deliveryOption === '1month';

  const letterBg = selectedColor
    ? `${selectedColor}80`
    : 'rgba(255,255,255,0.8)';

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">

      <div className="fixed inset-0 z-0 bg-slate-100">
        <iframe
          src="https://my.spline.design/interactivecubes-9uHdtgILwWujqbe1zui1cGzx/"
          frameBorder="0"
          width="100%"
          height="100%"
          className="w-full h-full object-cover"
          title="Spline 3D Background"
        />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] pointer-events-none" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl flex flex-col min-h-screen">

        <header className="mb-8 flex flex-col items-center text-center space-y-1">
          <div className="mb-2">
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '3rem', fontWeight: 700, color: '#CFBCF5', lineHeight: 1.1, margin: 0 }}>
              Future
            </p>
            <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1rem', fontWeight: 400, color: '#B8A8E0', letterSpacing: '0.25em', marginTop: '2px' }}>
              TIME CAPSULE
            </p>
          </div>
          <p className="text-base text-slate-500 font-medium">
            미래의 나에게 보내는 편지
          </p>
        </header>

        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 shadow-sm whitespace-nowrap max-w-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <p className="text-sm font-semibold text-slate-700">
              현재 <span className="text-violet-600 font-bold">{sentCount.toLocaleString()}</span>명이 미래의 나에게 편지를 보냈습니다
            </p>
          </div>
        </div>

        <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          <div className="lg:col-span-8 space-y-4">

            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-violet-500 uppercase tracking-wider shrink-0">시간배송원</span>
                  <p className="text-sm font-medium text-slate-700 break-keep">"{currentQuestion}"</p>
                </div>
                <button
                  onClick={handleRandomQuestion}
                  className="text-slate-400 hover:text-violet-500 transition-colors shrink-0 ml-2"
                  title="다른 질문 보기"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{ borderRadius: '1.5rem', overflow: 'hidden' }}
              >
                <svg width="100%" height="100%" className="absolute inset-0">
                  {BORDER_CAPSULES.map((capsule, i) => {
                    const pos = progressToPos(capsuleProgress[i], editorSize.w, editorSize.h);
                    const isHighlighted =
                      capsulePhase === 'selected' && selectedColor === capsule.color;
                    return (
                      <circle
                        key={capsule.id}
                        cx={pos.x}
                        cy={pos.y}
                        r={isHighlighted ? capsule.size * 1.5 : capsule.size / 2}
                        fill={capsule.color}
                        opacity={isHighlighted ? 1 : capsulePhase === 'spinning' ? 0.9 : 0.65}
                        stroke="white"
                        strokeWidth={isHighlighted ? 2 : 1}
                        style={{ transition: 'r 0.4s ease, opacity 0.4s ease' }}
                      />
                    );
                  })}
                </svg>
              </div>

              <div
                ref={editorRef}
                className="backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 md:p-8 relative focus-within:ring-2 focus-within:ring-violet-500/20 transition-all duration-700"
                style={{ background: letterBg }}
              >
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  미래의 나에게
                </label>
                <textarea
                  value={letterContent}
                  onChange={e => {
                    if (e.target.value.length <= 2000) setLetterContent(e.target.value);
                  }}
                  placeholder="Dear,"
                  className="w-full min-h-[400px] bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed text-slate-800 placeholder:text-slate-300 p-0 outline-none"
                  spellCheck={false}
                />
                <div className="absolute bottom-6 right-8 text-xs font-mono text-slate-400 bg-slate-100/50 px-2 py-1 rounded-md">
                  {letterContent.length} / 2000
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">

            <button
              onClick={() => setIsAboutOpen(true)}
              className="w-full py-3 px-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 font-semibold text-sm hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm"
            >
              <Info size={16} className="text-violet-500 group-hover:scale-110 transition-transform" />
              About Future Time Capsule
            </button>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6 md:p-8 space-y-8">

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Calendar size={16} className="text-violet-500" />
                  언제 받을까요?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['3days', '1week', '1month'] as DeliveryOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setDeliveryOption(opt)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 border relative ${
                        deliveryOption === opt
                          ? 'bg-violet-500 text-white border-violet-500 shadow-md scale-105'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                      }`}
                    >
                      {opt === '3days' && (
                        <span className="flex flex-col items-center gap-0.5">
                          <span>3일 후</span>
                          
                        </span>
                      )}
                      {opt === '1week' && (
                        <span className="flex flex-col items-center gap-0.5">
                          <span>1주일 후</span>
                          
                        </span>
                      )}
                      {opt === '1month' && (
                        <span className="flex flex-col items-center gap-0.5">
                          <span>1달 후</span>
                          
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="bg-violet-50/60 rounded-xl p-3 text-center border border-violet-100">
                  <p className="text-xs text-slate-500 mb-1">예상 도착일</p>
                  <p className="text-sm font-bold text-violet-700">{deliveryDate}</p>
                </div>

                {isPaidOption && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3"
                  >
                    <span className="text-amber-500 text-xs">✦</span>
                    <p className="text-xs text-amber-700 font-medium">
                      더 오래 기다릴수록 더 특별한 편지가 됩니다
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Mail size={16} className="text-violet-500" />
                  내 이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="my@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none text-sm"
                />
                <p className="text-xs text-slate-400 leading-snug">
                  편지는 정해진 날 이메일로 도착해요. 스팸함을 꼭 확인해주세요!
                </p>
              </div>

              <button
                onClick={handleSend}
                disabled={isSending || capsulePhase === 'spinning'}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/30 transform transition-all duration-200 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {capsulePhase === 'spinning' ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    캡슐 추첨 중...
                  </span>
                ) : (
                  <>
                    <span>{isSending ? '보내는 중...' : '미래로 보내기'}</span>
                    <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-3 items-start">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  계정 없이 바로 편지를 보낼 수 있어요. 편지 관리가 필요하면 나중에 가입하세요.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-500 opacity-80">
              <Clock size={14} />
              <span className="text-xs font-medium">시간 배송원이 편지를 안전하게 미래로 전달해요</span>
            </div>
          </div>
        </main>

        <footer className="mt-12 py-8 text-center border-t border-slate-200/50 space-y-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Future Time Capsule. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 text-xs text-slate-400">
            <a href="/terms" className="hover:text-violet-500 transition-colors">이용약관</a>
            <a href="/privacy" className="hover:text-violet-500 transition-colors">개인정보처리방침</a>
            <a href="mailto:je@nextstar.kr" className="hover:text-violet-500 transition-colors">문의</a>
          </div>
        </footer>
      </div>

      {/* 결제 모달 */}
      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            deliveryOption={deliveryOption}
            deliveryDate={deliveryDate}
            selectedColor={selectedColor}
            onClose={() => {
              setShowPayment(false);
              // 결제 취소 시 캡슐 상태 초기화 — 편지지 색이 남지 않도록
              setSelectedColor(null);
              setCapsulePhase('idle');
            }}
            onFreeFallback={handleFreeFallback}
            onPaid={handlePaid}
          />
        )}
      </AnimatePresence>

      {/* 캡슐 당첨 모달 */}
      <AnimatePresence>
        {showCapsuleModal && modalData && (
          <CapsuleModal
            selectedColor={modalData.color}
            scheduledAt={modalData.scheduledAt}
            onClose={() => {
              setShowCapsuleModal(false);
              setModalData(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* 토스트 */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <Send size={16} /> : <Info size={16} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About 모달 */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAboutOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/30 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-800 hover:bg-white/20 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
                <div className="space-y-4 text-slate-800 leading-relaxed">
                  <h2 style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem', color: '#CFBCF5', fontWeight: 700 }}>
                    Future Time Capsule
                  </h2>
                  <p className="text-sm text-slate-600">
                    미래의 나에게 편지를 보내고, 설정한 날짜에 이메일로 받는 서비스예요.
                    평범한 어느 날, 과거의 내가 보낸 편지를 발견하는 감정 — 그것이 이 서비스의 전부입니다.
                  </p>
                  <div className="bg-violet-50 rounded-xl p-4 text-xs text-violet-700 space-y-1">
                    <p>✦ 3일 후 — 무료</p>
                    <p>✦ 1주일 후 — 1,000원</p>
                    <p>✦ 1달 후 — 1,000원</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
