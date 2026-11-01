import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const AUTO_POPUPS = [
  {
    id: 'popup-bio',
    badge: 'AI BIO-SYNC LIVE',
    icon: '🧠',
    title: 'Đỉnh tập trung 98% (Optimal Flow)',
    detail: 'Nhịp sinh học đang ở vùng hiệu suất cao nhất cho các môn lập trình & thuật toán.',
    metric: '+18% vs hôm qua',
    accent: 'text-primary bg-primary/15 border-primary/30',
    route: '/focus',
    cta: 'Vào Focus Room',
  },
  {
    id: 'popup-class',
    badge: 'LỊCH HỌC SẮP TỚI',
    icon: '📅',
    title: 'MSIS207 • Phát triển ứng dụng web',
    detail: '13:00 – 16:15 tại Phòng C206 (Tiết 6–9). Đã đồng bộ từ TKB_HK1_2026-2027.ics.',
    metric: 'Bắt đầu sau 45p',
    accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    route: '/timetable',
    cta: 'Mở Thời khóa biểu',
  },
  {
    id: 'popup-pomo',
    badge: 'DEEP WORK STREAK',
    icon: '⏱️',
    title: 'Hoàn thành Phiên Pomodoro #7',
    detail: 'Tổng thời gian tập trung hôm nay đạt 3.5 / 4.0 giờ. Chuỗi 7 ngày liên tiếp không gián đoạn!',
    metric: '210 phút tích lũy',
    accent: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
    route: '/focus',
    cta: 'Tiếp tục phiên #8',
  },
  {
    id: 'popup-deadline',
    badge: 'CẢNH BÁO DEADLINE',
    icon: '⚡',
    title: 'CS101 Lab 3 • Functions Exercises',
    detail: 'Hạn nộp trước 20:00 tối nay qua cổng bài tập trường. Đã hoàn thành 80% checklist.',
    metric: 'Còn 18 giờ',
    accent: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    route: '/deadlines',
    cta: 'Kiểm tra Deadline',
  },
];

const TELEMETRY_STREAM = [
  {
    time: 'Vừa xong',
    tag: 'SYNC',
    text: 'Đồng bộ thành công 11 ca học từ TKB_HK1_2026-2027.ics',
    score: '100%',
  },
  {
    time: '4 phút trước',
    tag: 'FOCUS',
    text: 'Hoàn tất 25 phút Deep Work môn Các hệ cơ sở dữ liệu phân tán (CS5433)',
    score: '+25m',
  },
  {
    time: '19 phút trước',
    tag: 'BIO-AI',
    text: 'Cập nhật ngưỡng năng lượng nhận thức buổi sáng: 98% Peak Rhythm',
    score: 'Peak',
  },
  {
    time: '42 phút trước',
    tag: 'SYLLABUS',
    text: 'Đánh dấu hoàn thành Chương 4: Kiến trúc RESTful API & Express (MSIS207)',
    score: 'Ch.4',
  },
  {
    time: '1 giờ trước',
    tag: 'REMINDER',
    text: 'Tự động kích hoạt nhắc nhở phòng học B5.04 cho môn Phân tích thống kê',
    score: 'B5.04',
  },
];

const COURSE_MASTERY = [
  {
    code: 'MSIS207.R11.CTTT',
    name: 'Phát triển ứng dụng web',
    room: 'Phòng C206',
    progress: 0.88,
    percent: '88%',
    sessions: '14/16 buổi',
    status: 'Đạt chuẩn cao',
  },
  {
    code: 'CS5433.R11.CTTT',
    name: 'Các hệ cơ sở dữ liệu phân tán',
    room: 'Phòng B5.04',
    progress: 0.76,
    percent: '76%',
    sessions: '12/16 buổi',
    status: 'Đang tăng tốc',
  },
  {
    code: 'STAT3013.R11.CTTT',
    name: 'Phân tích thống kê',
    room: 'Phòng B5.04',
    progress: 0.82,
    percent: '82%',
    sessions: '13/16 buổi',
    status: 'Ổn định',
  },
  {
    code: 'MSIS4263.R11.CTTT',
    name: 'Các ứng dụng thông minh và hỗ trợ ra quyết định',
    room: 'Phòng C211',
    progress: 0.7,
    percent: '70%',
    sessions: '11/16 buổi',
    status: 'Đúng tiến độ',
  },
];

const DEEP_WORK_MODULES = [
  {
    code: 'SPRINT-01',
    title: 'Tối ưu hóa giao diện Luma Glass & GSAP 60fps',
    course: 'MSIS207 • Web App Dev',
    duration: '50 phút (2x Pomodoro)',
    energy: 'Năng lượng cao',
    badge: 'Đang ưu tiên',
  },
  {
    code: 'SPRINT-02',
    title: 'Thực hành phân mảnh ngang & đồng thuận 2PC',
    course: 'CS5433 • CSDL Phân tán',
    duration: '50 phút (2x Pomodoro)',
    energy: 'Tập trung sâu',
    badge: 'Khung 08:30',
  },
  {
    code: 'SPRINT-03',
    title: 'Kiểm định giả thuyết ANOVA & Hồi quy bội',
    course: 'STAT3013 • Phân tích thống kê',
    duration: '25 phút (1x Pomodoro)',
    energy: 'Ôn tập nhanh',
    badge: 'Khung 14:00',
  },
];

export function PlaceholderPage({ title, description }) {
  const containerRef = useRef(null);
  const popupCardRef = useRef(null);
  const sentinelRef = useRef(null);

  const isOverview = title === 'Tổng quan';

  // Auto-running popup state
  const [activePopupIndex, setActivePopupIndex] = useState(0);
  const [isPopupPaused, setIsPopupPaused] = useState(false);
  const [selectedModalItem, setSelectedModalItem] = useState(null);

  // Vertical Infinite Scroll cycles (starts with 1 full cycle of 4 sections, appends as user scrolls down)
  const [cycles, setCycles] = useState([1]);

  // 1. Initial 60fps GPU-only entrance & continuous ambient animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.bento-header',
        { y: -16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' }
      );

      tl.fromTo(
        '.bento-card',
        { y: 22, autoAlpha: 0, scale: 0.98 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          stagger: 0.05,
          duration: 0.42,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        },
        '-=0.2'
      );

      // GPU-accelerated progress bars using scaleX (NEVER animate width)
      gsap.fromTo(
        '.bento-progress-bar',
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: (i, target) => Number(target.dataset.scale || 0.85),
          duration: 0.9,
          ease: 'power2.out',
          stagger: 0.06,
          delay: 0.15,
        }
      );

      // GPU-accelerated weekly wave bars using scaleY
      gsap.fromTo(
        '.bento-wave-bar',
        { scaleY: 0, transformOrigin: 'bottom center' },
        {
          scaleY: 1,
          duration: 0.7,
          stagger: 0.04,
          ease: 'back.out(1.4)',
          delay: 0.2,
        }
      );

      // Subtle floating HUD pills (transform y only)
      gsap.to('.bento-float-1', {
        y: -5,
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      gsap.to('.bento-float-2', {
        y: 5,
        duration: 3.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.3,
      });

      // Vertical infinite telemetry stream marquee (GPU transform yPercent only)
      gsap.to('.telemetry-marquee-track', {
        yPercent: -50,
        duration: 18,
        ease: 'none',
        repeat: -1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [title]);

  // 2. Auto-running markup popup cycle timer + GPU entrance tween on change
  useEffect(() => {
    if (!isOverview || isPopupPaused) return undefined;
    const timer = window.setInterval(() => {
      setActivePopupIndex((prev) => (prev + 1) % AUTO_POPUPS.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [isOverview, isPopupPaused]);

  useLayoutEffect(() => {
    if (!isOverview || !popupCardRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        popupCardRef.current,
        { y: 12, scale: 0.97, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.35,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        }
      );
      gsap.fromTo(
        '.popup-timer-bar',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 4.1, ease: 'none' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activePopupIndex, isOverview]);

  // 3. Animate newly appended infinite scroll cycle sections smoothly at 60fps
  useLayoutEffect(() => {
    if (!isOverview || cycles.length <= 1 || !containerRef.current) return undefined;
    const latestCycle = cycles[cycles.length - 1];
    const selector = `[data-cycle="${latestCycle}"] .cycle-animate-card`;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        { y: 24, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.42,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [cycles, isOverview]);

  // 4. IntersectionObserver for Vertical Infinite Scroll (appends next cycle when reaching bottom sentinel)
  useEffect(() => {
    if (!isOverview || typeof IntersectionObserver === 'undefined') return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          setCycles((prev) => {
            if (prev.length >= 12) return prev; // safety cap for DOM memory while keeping infinite feel
            return [...prev, prev.length + 1];
          });
        }
      },
      { rootMargin: '320px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isOverview]);

  if (!isOverview) {
    return (
      <section ref={containerRef} className="space-y-6">
        <div className="bento-header flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>SFSH MODULE</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">{title}</h1>
          </div>
        </div>

        <div className="bento-card glass-card relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center luma-glow-sm">
          <div className="relative z-10 max-w-md mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-2xl">
              🌱
            </div>
            <p className="text-base font-medium text-text">{description}</p>
            <p className="text-xs text-muted">Tính năng đang được chuẩn bị để mang lại trải nghiệm tối ưu nhất.</p>
            <div className="pt-2">
              <Link
                to="/timetable"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
              >
                <span>Xem Thời khóa biểu tuần</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentPopup = AUTO_POPUPS[activePopupIndex];

  return (
    <section ref={containerRef} className="space-y-8 pb-16">
      {/* Top Hero Header & Auto-Running Live Popup HUD */}
      <div className="bento-header grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left Title & Bio Status Pills */}
        <div className="xl:col-span-7 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>AI BIO-RHYTHM • 60FPS ENGINE</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="bento-float-1 will-change-transform inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2/90 px-3 py-1.5 text-xs font-semibold text-text">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>⚡ 98% Nhịp sinh học</span>
              </div>
              <div className="bento-float-2 will-change-transform inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2/90 px-3 py-1.5 text-xs font-semibold text-text">
                <span>🔥</span>
                <span>Chuỗi 7 ngày học tập</span>
              </div>
            </div>
          </div>

          <div className="my-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted max-w-2xl leading-relaxed">
              {description} Cuộn dọc xuống dưới để khám phá nối tiếp vô tận các phân khu phân tích nhịp sinh học, lịch học và tiến độ học phần.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              to="/timetable"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-fg shadow-xs luma-glow-sm hover:opacity-95 transition-opacity"
            >
              <span>📅 Mở Thời khóa biểu</span>
              <span>→</span>
            </Link>
            <Link
              to="/focus"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface-2/80 px-4 py-2.5 text-xs font-bold text-text hover:border-primary/40 transition-colors"
            >
              <span>⏱️ Bắt đầu Pomodoro</span>
            </Link>
            <span className="ml-auto text-[11px] font-medium text-muted hidden sm:inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Đang hiển thị {cycles.length} chu kỳ phân khu
            </span>
          </div>
        </div>

        {/* Right Auto-Running Markup Popup HUD */}
        <div
          onMouseEnter={() => setIsPopupPaused(true)}
          onMouseLeave={() => setIsPopupPaused(false)}
          className="xl:col-span-5 glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden luma-glow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                LIVE AI POPUP FEED {isPopupPaused ? '(TẠM DỪNG)' : '(TỰ ĐỘNG CHẠY)'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {AUTO_POPUPS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePopupIndex(idx)}
                  aria-label={`Chuyển sang popup ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-colors ${
                    idx === activePopupIndex ? 'w-5 bg-primary' : 'w-2 bg-border hover:bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Animated Markup Popup Card */}
          <div
            ref={popupCardRef}
            className="will-change-transform my-3 rounded-2xl border border-border/90 bg-surface-2/90 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-lg">
                  {currentPopup.icon}
                </span>
                <div>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${currentPopup.accent}`}>
                    {currentPopup.badge}
                  </span>
                  <h2 className="mt-1 text-sm font-bold text-text leading-snug">
                    {currentPopup.title}
                  </h2>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-bold text-primary border border-border">
                {currentPopup.metric}
              </span>
            </div>

            <p className="mt-2.5 text-xs text-muted leading-relaxed">
              {currentPopup.detail}
            </p>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedModalItem(currentPopup)}
                className="text-xs font-semibold text-muted hover:text-text transition-colors"
              >
                🔍 Xem chi tiết popup
              </button>
              <Link
                to={currentPopup.route}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>{currentPopup.cta}</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* GPU scaleX progress bar for popup auto-cycle */}
          <div className="h-1 w-full rounded-full bg-border/50 overflow-hidden">
            <div className="popup-timer-bar h-full w-full bg-primary origin-left will-change-transform" />
          </div>
        </div>
      </div>

      {/* Modal Popup when user clicks any card/popup for inspection */}
      {selectedModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          onClick={() => setSelectedModalItem(null)}
        >
          <div
            className="glass-card max-w-md w-full rounded-3xl p-6 space-y-4 border border-primary/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                <span>{selectedModalItem.icon || '✨'}</span>
                <span>{selectedModalItem.badge || 'AI INSIGHT POPUP'}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedModalItem(null)}
                className="rounded-xl border border-border px-2.5 py-1 text-xs font-bold text-muted hover:text-text"
              >
                Đóng ✕
              </button>
            </div>
            <h3 className="text-lg font-bold text-text">{selectedModalItem.title}</h3>
            <p className="text-xs text-muted leading-relaxed">{selectedModalItem.detail}</p>
            <div className="rounded-2xl border border-border bg-surface-2/80 p-3.5 text-xs flex items-center justify-between">
              <span className="text-muted">Chỉ số ghi nhận:</span>
              <span className="font-bold text-primary">{selectedModalItem.metric}</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedModalItem(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-text"
              >
                Đóng
              </button>
              {selectedModalItem.route && (
                <Link
                  to={selectedModalItem.route}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-fg"
                >
                  {selectedModalItem.cta || 'Đi tới phân khu →'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VERTICAL INFINITE SCROLL SECTIONS (Cuộn trang dọc nối tiếp vô tận các phân khu) */}
      <div className="space-y-12">
        {cycles.map((cycleNumber) => (
          <div
            key={cycleNumber}
            data-cycle={cycleNumber}
            className="space-y-8"
          >
            {/* Cycle Divider Header for Cycle >= 2 */}
            {cycleNumber > 1 && (
              <div className="cycle-animate-card flex items-center gap-4 pt-4">
                <div className="h-px flex-1 bg-border" />
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                  <span>♾️</span>
                  <span>PHÂN KHU MỞ RỘNG • CHU KỲ #{cycleNumber}</span>
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            {/* PHÂN KHU 1: BENTO COMMAND CENTER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Phân khu {cycleNumber}.1 • Trung tâm điều khiển nhịp sinh học
                </span>
                <span className="text-xs text-muted">GPU 60fps • Transform-Only</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Bento 1: Circular Focus Rhythm (Col-span 2) */}
                <div className="bento-card cycle-animate-card lg:col-span-2 glass-card relative overflow-hidden rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Trạng thái tập trung</span>
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      Optimal Flow • Chu kỳ #{cycleNumber}
                    </span>
                  </div>

                  <div className="my-5 flex flex-col sm:flex-row items-center gap-6">
                    {/* SVG Circular Progress Ring */}
                    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-border/50"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-primary"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset="37.6"
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black tracking-tight text-text">85%</span>
                        <span className="text-[10px] text-muted uppercase font-bold">Mục tiêu ngày</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-center sm:text-left">
                      <h3 className="text-lg font-bold text-text">3.5 / 4.0 giờ đã hoàn thành</h3>
                      <p className="text-xs text-muted leading-relaxed">
                        Bạn đã hoàn thành 7 phiên Pomodoro hiệu quả trong ngày hôm nay. Năng suất ghi nhận ở mức tối ưu.
                      </p>
                      <div className="pt-1 flex items-center justify-center sm:justify-start gap-3">
                        <Link
                          to="/focus"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                        >
                          <span>Mở Focus Room</span>
                          <span>→</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedModalItem({
                              badge: 'BÁO CÁO POMODORO',
                              icon: '🎯',
                              title: 'Phân tích 7 phiên Pomodoro hôm nay',
                              detail:
                                'Tỉ lệ hoàn thành 100% không bị ngắt quãng. Khung giờ 08:30 - 11:00 đạt hiệu suất nhận thức cao nhất.',
                              metric: '85% Mục tiêu ngày (210 phút)',
                              route: '/focus',
                              cta: 'Bắt đầu phiên mới',
                            })
                          }
                          className="text-xs font-semibold text-muted hover:text-text"
                        >
                          • Mở Popup thống kê
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Linear Meter using GPU scaleX */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-muted mb-1.5">
                      <span>Mức năng lượng nhận thức</span>
                      <span className="text-text font-bold">Cao (Bio-Peak 85%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
                      <div
                        className="bento-progress-bar h-full w-full rounded-full bg-gradient-to-r from-primary to-emerald-400 origin-left will-change-transform"
                        data-scale="0.85"
                      />
                    </div>
                  </div>
                </div>

                {/* Bento 2: Ca học tiếp theo (Col-span 1) */}
                <div className="bento-card cycle-animate-card glass-card rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Lịch học tiếp theo</span>
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </div>

                  <div className="my-4 space-y-2">
                    <span className="inline-block rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                      MSIS207
                    </span>
                    <h4 className="text-base font-bold text-text leading-snug">Phát triển ứng dụng web</h4>
                    <div className="space-y-1 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <span>🕒</span>
                        <span>13:00 – 16:15</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>Phòng C206 • Tiết 6-9</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/timetable"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/90 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
                  >
                    <span>Thời khóa biểu</span>
                    <span>→</span>
                  </Link>
                </div>

                {/* Bento 3: Deadline quan trọng (Col-span 1) */}
                <div className="bento-card cycle-animate-card glass-card rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Deadline sắp tới</span>
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
                      Hạn chót 24h
                    </span>
                  </div>

                  <div className="my-4 space-y-2">
                    <span className="inline-block rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">
                      CS101 Lab 3
                    </span>
                    <h4 className="text-base font-bold text-text leading-snug">Functions exercises</h4>
                    <p className="text-xs text-muted">Nộp qua portal bài tập trường trước 20:00 tối nay.</p>
                  </div>

                  <Link
                    to="/deadlines"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-surface-2/90 py-2.5 px-4 text-xs font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
                  >
                    <span>Chi tiết Deadline</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* PHÂN KHU 2: NHỊP SINH HỌC 7 NGÀY & LUỒNG TELEMETRY CUỘN TỰ ĐỘNG */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Phân khu {cycleNumber}.2 • Biểu đồ năng lượng & Luồng sự kiện tự động
                </span>
                <span className="text-xs text-muted">Auto-Scrolling Markup Stream</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 7-Day Wave Bar Card */}
                <div className="bento-card cycle-animate-card lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">Nhịp sinh học 7 ngày</span>
                      <h4 className="text-base font-bold text-text mt-0.5">Biểu đồ phân bổ năng lượng tuần</h4>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary">
                      26/10 – 01/11
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-3 h-32 items-end pt-3">
                    {[
                      { day: 'T2', height: '65%', active: true },
                      { day: 'T3', height: '45%', active: false },
                      { day: 'T4', height: '90%', active: true },
                      { day: 'T5', height: '80%', active: true },
                      { day: 'T6', height: '60%', active: false },
                      { day: 'T7', height: '95%', active: true, today: true },
                      { day: 'CN', height: '35%', active: false },
                    ].map((item) => (
                      <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="relative w-full rounded-xl bg-surface-2/60 overflow-hidden flex items-end h-24">
                          <div
                            className={`bento-wave-bar w-full rounded-xl will-change-transform ${
                              item.today
                                ? 'bg-primary luma-glow-sm'
                                : item.active
                                ? 'bg-primary/70'
                                : 'bg-muted/30'
                            }`}
                            style={{ height: item.height }}
                          />
                        </div>
                        <span className={`text-[11px] font-semibold ${item.today ? 'text-primary' : 'text-muted'}`}>
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vertical Infinite Auto-Scrolling Telemetry Feed */}
                <div className="bento-card cycle-animate-card lg:col-span-5 glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span>Luồng hoạt động trực tiếp</span>
                    </span>
                    <span className="text-[11px] font-semibold text-muted">Auto-Scroll ∞</span>
                  </div>

                  <div className="relative h-40 overflow-hidden rounded-2xl border border-border/60 bg-surface-2/40 p-3">
                    <div className="telemetry-marquee-track will-change-transform space-y-2.5">
                      {[...TELEMETRY_STREAM, ...TELEMETRY_STREAM].map((event, idx) => (
                        <div
                          key={`${event.tag}-${idx}`}
                          onClick={() =>
                            setSelectedModalItem({
                              badge: `TELEMETRY • ${event.tag}`,
                              icon: '⚡',
                              title: event.text,
                              detail: `Sự kiện được ghi nhận tự động vào lúc ${event.time} trên hệ thống đồng bộ học tập SFSH.`,
                              metric: event.score,
                              route: '/timetable',
                              cta: 'Kiểm tra lịch học',
                            })
                          }
                          className="cursor-pointer rounded-xl border border-border/70 bg-surface/90 p-2.5 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                {event.tag}
                              </span>
                              <span className="text-[10px] text-muted">{event.time}</span>
                            </div>
                            <p className="mt-1 truncate text-xs font-medium text-text">{event.text}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-primary">{event.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PHÂN KHU 3: MA TRẬN HỌC PHẦN ĐÃ ĐỒNG BỘ TỪ ICS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Phân khu {cycleNumber}.3 • Tiến độ học phần học kỳ 1 (2026–2027)
                </span>
                <Link to="/syllabus" className="text-xs font-semibold text-primary hover:underline">
                  Xem toàn bộ đề cương →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {COURSE_MASTERY.map((course) => (
                  <div
                    key={`${cycleNumber}-${course.code}`}
                    onClick={() =>
                      setSelectedModalItem({
                        badge: course.code,
                        icon: '📚',
                        title: course.name,
                        detail: `Địa điểm học: ${course.room} • Đã hoàn thành ${course.sessions}. Trạng thái hiện tại: ${course.status}.`,
                        metric: `Tiến độ ${course.percent}`,
                        route: '/syllabus',
                        cta: 'Mở Đề cương môn học',
                      })
                    }
                    className="bento-card cycle-animate-card cursor-pointer glass-card rounded-3xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
                          {course.code}
                        </span>
                        <span className="text-[11px] font-semibold text-muted">{course.room}</span>
                      </div>
                      <h4 className="mt-3 text-sm font-bold text-text leading-snug">{course.name}</h4>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">{course.sessions}</span>
                        <span className="font-bold text-primary">{course.percent}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                        <div
                          className="bento-progress-bar h-full w-full rounded-full bg-primary origin-left will-change-transform"
                          data-scale={course.progress}
                          style={{ transform: `scaleX(${course.progress})` }}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted">{course.status}</span>
                        <span className="text-[11px] font-semibold text-primary">Chi tiết ↗</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PHÂN KHU 4: GỢI Ý AI WELLNESS & SPRINT DEEP WORK */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Phân khu {cycleNumber}.4 • Lộ trình Deep Work & Gợi ý AI Wellness
                </span>
                <span className="text-xs text-muted">Tự động cá nhân hóa</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* AI Study Recommendation */}
                <div className="bento-card cycle-animate-card lg:col-span-5 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between luma-glow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Gợi ý AI Wellness</span>
                    </span>
                    <span className="text-xs text-muted">Chu kỳ #{cycleNumber}</span>
                  </div>

                  <div className="my-4 space-y-2">
                    <h4 className="text-lg font-bold text-text">
                      Khung giờ vàng tiếp thu lý thuyết: 08:30 – 10:30
                    </h4>
                    <p className="text-xs text-muted leading-relaxed">
                      Dựa trên dữ liệu 10 phiên Pomodoro gần nhất, mức độ tập trung của bạn đạt đỉnh cao nhất vào buổi sáng. Hãy
                      sắp xếp môn <strong>Các hệ cơ sở dữ liệu phân tán</strong> và <strong>Phân tích thống kê</strong> vào khung giờ này.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to="/focus"
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-xs luma-glow-sm hover:opacity-90 transition-opacity"
                    >
                      <span>Vào Focus Room ngay</span>
                      <span>→</span>
                    </Link>
                    <Link
                      to="/syllabus"
                      className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold text-text hover:bg-surface-2 transition-colors"
                    >
                      <span>Xem đề cương</span>
                    </Link>
                  </div>
                </div>

                {/* Deep Work Sprint Cards */}
                <div className="bento-card cycle-animate-card lg:col-span-7 glass-card rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Kế hoạch Sprint Deep Work đề xuất
                    </span>
                    <span className="text-xs font-semibold text-primary">3 phiên sẵn sàng</span>
                  </div>

                  <div className="space-y-2.5">
                    {DEEP_WORK_MODULES.map((sprint) => (
                      <div
                        key={`${cycleNumber}-${sprint.code}`}
                        onClick={() =>
                          setSelectedModalItem({
                            badge: sprint.code,
                            icon: '🚀',
                            title: sprint.title,
                            detail: `Học phần: ${sprint.course} • Thời lượng khuyến nghị: ${sprint.duration} (${sprint.energy}).`,
                            metric: sprint.badge,
                            route: '/focus',
                            cta: 'Khởi chạy Sprint trong Focus Room',
                          })
                        }
                        className="cursor-pointer rounded-2xl border border-border/80 bg-surface-2/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-primary/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary">{sprint.code}</span>
                            <span className="text-[11px] text-muted">• {sprint.course}</span>
                          </div>
                          <h5 className="text-xs font-bold text-text">{sprint.title}</h5>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-lg bg-surface px-2.5 py-1 text-[11px] font-medium text-muted border border-border">
                            {sprint.duration}
                          </span>
                          <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
                            {sprint.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel for Vertical Infinite Scroll + Manual Load / Back to top controls */}
      <div
        ref={sentinelRef}
        className="glass-card rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary/25"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary font-bold">
            ♾️
          </span>
          <div>
            <p className="text-xs font-bold text-text">
              Cuộn dọc vô tận (Vertical Infinite Scroll Active • Đã mở {cycles.length} chu kỳ)
            </p>
            <p className="text-[11px] text-muted">
              Cuộn xuống để tự động nối tiếp phân khu mới hoặc nhấn nút bên cạnh để nạp ngay lập tức.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCycles((prev) => [...prev, prev.length + 1])}
            className="rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-fg shadow-xs hover:opacity-95 transition-opacity"
          >
            + Nạp thêm phân khu (#{cycles.length + 1})
          </button>
          {cycles.length > 1 && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="rounded-2xl border border-border bg-surface-2 px-3.5 py-2 text-xs font-semibold text-text hover:border-primary/40 transition-colors"
            >
              ↑ Lên đầu trang
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
