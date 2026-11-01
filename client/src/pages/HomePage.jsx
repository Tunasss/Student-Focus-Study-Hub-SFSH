import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeToggle } from '../theme/ThemeToggle';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const SHOWCASE_STAGES = [
  {
    id: 'timetable',
    eyebrow: 'THỜI KHÓA BIỂU THÔNG MINH',
    title: 'Đồng bộ file .ics trong 1 chạm. Không trùng lịch, không rối mắt.',
    description:
      'Tự động bóc tách mã môn học, phòng học và ca học từ Google Calendar hoặc cổng đào tạo. Mọi thay đổi được sắp xếp chuẩn xác theo lưới thời gian thực.',
    metric: '< 0.5 giây',
    metricLabel: 'Tốc độ phân tích lịch học .ics',
    badge: 'TKB_HK1_2026-2027.ics • Đã xác thực',
    courses: [
      { code: 'MSIS207', name: 'Phát triển ứng dụng web', time: '13:00 – 16:15', room: 'Phòng C206', day: 'Thứ 4', accent: 'border-primary/40 bg-primary/15 text-primary' },
      { code: 'CS5433', name: 'Các hệ CSDL phân tán', time: '13:00 – 17:00', room: 'Phòng B5.04', day: 'Thứ 5', accent: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' },
      { code: 'STAT3013', name: 'Phân tích thống kê', time: '07:30 – 11:30', room: 'Phòng B5.04', day: 'Thứ 7', accent: 'border-sky-500/40 bg-sky-500/15 text-sky-400' },
    ],
  },
  {
    id: 'focus',
    eyebrow: 'FOCUS ROOM & POMODORO',
    title: 'Không gian tĩnh lặng tuyệt đối. Giữ trọn trạng thái Deep Work.',
    description:
      'Kết hợp đồng hồ Pomodoro chuẩn nhịp sinh học cùng âm thanh nền giúp não bộ duy trì ngưỡng tập trung cao độ mà không bị kiệt sức.',
    metric: '98% Flow',
    metricLabel: 'Hiệu suất duy trì sự tập trung',
    badge: 'Phiên #7 • 25:00 Deep Work',
    courses: [
      { code: 'POMO #7', name: 'Thiết kế kiến trúc REST API', time: '25 phút tập trung', room: 'Hoàn tất 100%', day: 'Hôm nay', accent: 'border-primary/40 bg-primary/15 text-primary' },
      { code: 'BREAK', name: 'Nghỉ ngắn phục hồi thị giác', time: '5 phút thư giãn', room: 'Nhịp thở 4-7-8', day: 'Tự động', accent: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' },
      { code: 'POMO #8', name: 'Tối ưu hóa truy vấn phân mảnh', time: '25 phút tiếp theo', room: 'Sẵn sàng', day: 'Tiếp nối', accent: 'border-amber-500/40 bg-amber-500/15 text-amber-400' },
    ],
  },
  {
    id: 'biorhythm',
    eyebrow: 'AI BIO-CIRCADIAN ENGINE',
    title: 'Học đúng môn, vào đúng thời điểm não bộ nhạy bén nhất.',
    description:
      'Hệ thống phân tích lịch sử phiên học để phát hiện khung giờ vàng của riêng bạn, tự động gợi ý các học phần nặng lý thuyết vào lúc năng lượng đạt đỉnh.',
    metric: '08:30 – 10:30',
    metricLabel: 'Khung giờ vàng tiếp thu lý thuyết',
    badge: 'AI Bio-Sync • Cá nhân hóa 100%',
    courses: [
      { code: 'PEAK 98%', name: 'Khung sáng: Tư duy thuật toán & CSDL', time: '08:30 – 10:30', room: 'Năng lượng đỉnh', day: 'Ưu tiên #1', accent: 'border-primary/40 bg-primary/15 text-primary' },
      { code: 'FLOW 86%', name: 'Khung chiều: Lập trình giao diện Web', time: '13:30 – 16:00', room: 'Thực hành code', day: 'Ưu tiên #2', accent: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' },
      { code: 'REVIEW 74%', name: 'Khung tối: Ôn tập đề cương & Flashcard', time: '20:00 – 21:30', room: 'Ghi nhớ sâu', day: 'Ưu tiên #3', accent: 'border-sky-500/40 bg-sky-500/15 text-sky-400' },
    ],
  },
];

const LIVE_NOTIFICATIONS = [
  { icon: '⚡', tag: 'BIO-SYNC', text: 'Nhịp sinh học đạt 98% — Khung giờ vàng học CS5433', time: 'Vừa xong' },
  { icon: '📅', tag: 'TIMETABLE', text: 'Đã đồng bộ 11 ca học từ TKB_HK1_2026-2027.ics', time: '1 phút trước' },
  { icon: '🎯', tag: 'POMODORO', text: 'Hoàn tất chuỗi 7 ngày Deep Work liên tiếp', time: '3 phút trước' },
  { icon: '🔔', tag: 'DEADLINE', text: 'Nhắc nhở: CS101 Lab 3 hạn nộp 20:00 tối nay', time: '5 phút trước' },
];

const APPLE_BENTO_SPECS = [
  {
    colSpan: 'lg:col-span-7',
    eyebrow: 'ĐỒNG BỘ LỊCH HỌC TỨC THÌ',
    metric: '100%',
    title: 'Tương thích chuẩn iCalendar (.ics) từ Google Calendar & Trường đại học.',
    desc: 'Chỉ cần kéo thả file .ics, thuật toán tự động nhận diện thứ, tiết học, phòng giảng đường và làm sạch các môn mẫu cũ.',
    tag: 'Zero-Overlap Grid',
  },
  {
    colSpan: 'lg:col-span-5',
    eyebrow: 'CHUYỂN ĐỘNG MƯỢT MÀ',
    metric: '60 fps',
    title: 'Kiến trúc đồ họa GPU-Composited.',
    desc: 'Mọi hiệu ứng cuộn và popup đều vận hành hoàn toàn trên tầng Transform & Opacity, phản hồi tức thì ở mọi thao tác.',
    tag: 'GSAP Engine',
  },
  {
    colSpan: 'lg:col-span-5',
    eyebrow: 'NHỊP SINH HỌC NHẬN THỨC',
    metric: '+42%',
    title: 'Tăng thời lượng tập trung sâu mỗi tuần.',
    desc: 'Biểu đồ sóng năng lượng 7 ngày giúp bạn phân bổ sức học hợp lý trước các kỳ thi giữa kỳ và cuối kỳ.',
    tag: 'Bio-Rhythm AI',
  },
  {
    colSpan: 'lg:col-span-7',
    eyebrow: 'BẢO VỆ DEADLINE & ĐỀ CƯƠNG',
    metric: '24/7',
    title: 'Theo dõi sát sao từng chương đề cương và hạn nộp bài tập lớn.',
    desc: 'Không còn cảm giác quá tải. Mọi bài Lab, đồ án và chương học đều được chia nhỏ thành các phiên Pomodoro khả thi.',
    tag: 'Smart Syllabus',
  },
];

export function HomePage() {
  const rootRef = useRef(null);
  const stageCardRef = useRef(null);
  const toastRef = useRef(null);

  const [activeStage, setActiveStage] = useState(0);
  const [isStagePaused, setIsStagePaused] = useState(false);
  const [activeToast, setActiveToast] = useState(0);

  // 1. Master Apple-style GSAP Intro + ScrollTrigger Reveal + Floating Elements (60fps transform/autoAlpha only)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo(
          '.apple-nav',
          { y: -20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, clearProps: 'opacity,visibility,transform' }
        )
        .fromTo(
          '.apple-hero-eyebrow',
          { y: 20, autoAlpha: 0, scale: 0.95 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.apple-hero-title',
          { y: 32, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.65, clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        )
        .fromTo(
          '.apple-hero-sub',
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, clearProps: 'opacity,visibility,transform' },
          '-=0.4'
        )
        .fromTo(
          '.apple-hero-cta',
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        )
        .fromTo(
          '.apple-device-mockup',
          { y: 40, scale: 0.96, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.75, ease: 'power2.out', clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        )
        .fromTo(
          '.apple-floating-chip',
          { y: 20, scale: 0.9, autoAlpha: 0 },
          {
            y: 0,
            scale: 1,
            autoAlpha: 1,
            stagger: 0.08,
            duration: 0.45,
            clearProps: 'opacity,visibility,transform',
          },
          '-=0.4'
        );

      // Continuous subtle floating widgets around the Apple device stage
      gsap.to('.float-chip-a', {
        y: -7,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.float-chip-b', {
        y: 7,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.4,
      });
      gsap.to('.float-chip-c', {
        y: -6,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });

      // Horizontal infinite ticker ribbon (GPU xPercent)
      gsap.to('.apple-ticker-track', {
        xPercent: -50,
        duration: 24,
        ease: 'none',
        repeat: -1,
      });

      // Scroll-triggered reveals for sections
      gsap.utils.toArray('.apple-reveal-section').forEach((section) => {
        gsap.fromTo(
          section,
          { y: 36, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.65,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: section,
              start: 'top 86%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // Scroll-triggered Bento cards stagger
      gsap.fromTo(
        '.apple-bento-item',
        { y: 28, autoAlpha: 0, scale: 0.98 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: {
            trigger: '.apple-bento-grid',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // 2. Auto-cycling Product Stage (every 4.8s unless hovered)
  useEffect(() => {
    if (isStagePaused) return undefined;
    const id = window.setInterval(() => {
      setActiveStage((prev) => (prev + 1) % SHOWCASE_STAGES.length);
    }, 4800);
    return () => window.clearInterval(id);
  }, [isStagePaused]);

  useLayoutEffect(() => {
    if (!stageCardRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.stage-dynamic-item',
        { y: 16, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.38,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        }
      );
      gsap.fromTo(
        '.stage-progress-fill',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 4.7, ease: 'none' }
      );
    }, stageCardRef);
    return () => ctx.revert();
  }, [activeStage]);

  // 3. Auto-cycling Live Notification Popup in Hero Device Stage
  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveToast((prev) => (prev + 1) % LIVE_NOTIFICATIONS.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (!toastRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        toastRef.current,
        { y: 10, scale: 0.96, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.32,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        }
      );
    }, toastRef);
    return () => ctx.revert();
  }, [activeToast]);

  const currentStage = SHOWCASE_STAGES[activeStage];
  const currentToast = LIVE_NOTIFICATIONS[activeToast];

  return (
    <div ref={rootRef} className="min-h-screen bg-bg text-text selection:bg-primary selection:text-primary-fg overflow-x-hidden">
      {/* Sticky Apple-Style Frosted Top Navigation */}
      <header className="apple-nav sticky top-0 z-50 border-b border-border/60 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-xs">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold tracking-tight text-text">Student Focus</span>
              <span className="hidden sm:inline-block rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                OS 2.0
              </span>
            </div>
          </Link>

          <nav aria-label="Điều hướng trang chủ" className="hidden md:flex items-center gap-7 text-xs font-medium text-muted">
            <a href="#showcase-stage" className="hover:text-text transition-colors">
              Trải nghiệm
            </a>
            <a href="#statement-section" className="hover:text-text transition-colors">
              Nhịp sinh học AI
            </a>
            <a href="#bento-specs" className="hover:text-text transition-colors">
              Tính năng Pro
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-full border border-border bg-surface-2/80 px-4 py-1.5 text-xs font-semibold text-text hover:border-primary/50 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-fg shadow-xs luma-glow-sm hover:opacity-95 transition-opacity"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-24 sm:space-y-32 pb-24">
        {/* SECTION 1: APPLE KEYNOTE HERO & INTERACTIVE HARDWARE MOCKUP */}
        <section className="relative mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20 text-center">
          <div className="apple-hero-eyebrow inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary luma-glow-sm">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>STUDENT FOCUS & STUDY HUB • THẾ HỆ MỚI</span>
          </div>

          <h1 className="apple-hero-title mx-auto mt-6 max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-text leading-[1.06]">
            Học tập đỉnh cao.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-300 to-primary">
              Đồng điệu nhịp sinh học.
            </span>
          </h1>

          <p className="apple-hero-sub mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
            Từ thời khóa biểu <code className="text-text font-semibold">.ics</code> tự động đến phòng tập trung Pomodoro và AI phân tích năng lượng nhận thức. Tất cả hội tụ trong một không gian chuẩn mực, mượt mà ở 60fps.
          </p>

          <div className="apple-hero-cta mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-fg shadow-md luma-glow hover:opacity-95 transition-opacity"
            >
              <span>Đăng nhập không gian học tập</span>
              <span>→</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-7 py-3.5 text-sm font-semibold text-text hover:border-primary/50 transition-colors"
            >
              <span>Tạo tài khoản miễn phí</span>
            </Link>
          </div>

          {/* Apple-Style Pro Display Mockup with Auto-Running Floating Popups */}
          <div className="relative mx-auto mt-14 max-w-5xl">
            {/* Floating Ambient Widget Left */}
            <div className="apple-floating-chip float-chip-a will-change-transform hidden lg:flex items-center gap-3 glass-card rounded-2xl px-4 py-3 text-left absolute -left-6 top-10 z-20 shadow-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary text-base">
                ⚡
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">AI BIO-RHYTHM</p>
                <p className="text-xs font-bold text-text">98% Peak Focus</p>
              </div>
            </div>

            {/* Floating Ambient Widget Right */}
            <div className="apple-floating-chip float-chip-b will-change-transform hidden lg:flex items-center gap-3 glass-card rounded-2xl px-4 py-3 text-left absolute -right-6 top-20 z-20 shadow-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-base">
                📅
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">CA HỌC TIẾP THEO</p>
                <p className="text-xs font-bold text-text">MSIS207 • Phòng C206</p>
              </div>
            </div>

            {/* Floating Ambient Widget Bottom Left */}
            <div className="apple-floating-chip float-chip-c will-change-transform hidden lg:flex items-center gap-3 glass-card rounded-2xl px-4 py-3 text-left absolute -left-4 bottom-8 z-20 shadow-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 text-base">
                🔥
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">DEEP WORK STREAK</p>
                <p className="text-xs font-bold text-text">7 ngày liên tiếp • 3.5h/ngày</p>
              </div>
            </div>

            {/* Main Pro Display Window */}
            <div className="apple-device-mockup will-change-transform glass-card rounded-[2rem] border border-border/90 p-3 sm:p-5 shadow-2xl luma-glow">
              {/* macOS / iPadOS Window Top Bar + Dynamic Island Live Popup */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-3 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-[11px] font-semibold text-muted">sfsh.edu.vn — Studio</span>
                </div>

                {/* Dynamic Island Auto-Running Markup Popup */}
                <div
                  ref={toastRef}
                  className="will-change-transform inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-surface-2 px-3.5 py-1 text-xs shadow-xs"
                >
                  <span>{currentToast.icon}</span>
                  <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {currentToast.tag}
                  </span>
                  <span className="font-medium text-text truncate max-w-[220px] sm:max-w-xs">
                    {currentToast.text}
                  </span>
                  <span className="text-[10px] text-muted hidden sm:inline">{currentToast.time}</span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Live Preview</span>
                </div>
              </div>

              {/* Inside Mockup Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 text-left">
                {/* Left Mockup Column: Focus Ring */}
                <div className="md:col-span-5 rounded-2xl border border-border/70 bg-surface-2/70 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Nhịp độ hôm nay</span>
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      Optimal Flow
                    </span>
                  </div>

                  <div className="my-5 flex items-center gap-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="stroke-border" strokeWidth="8" fill="transparent" />
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
                      <span className="absolute text-lg font-black text-text">85%</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">3.5 / 4.0 giờ Deep Work</p>
                      <p className="mt-1 text-xs text-muted">
                        7 phiên Pomodoro hoàn tất. Năng lượng nhận thức đang ở vùng đỉnh.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                    <span className="text-muted">Môn ưu tiên:</span>
                    <span className="font-bold text-primary">CS5433 • CSDL Phân tán</span>
                  </div>
                </div>

                {/* Right Mockup Column: Live Synced Timetable Preview */}
                <div className="md:col-span-7 rounded-2xl border border-border/70 bg-surface-2/70 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Lịch học tuần đã đồng bộ (.ics)
                      </span>
                      <h2 className="text-sm font-bold text-text mt-0.5">Học kỳ 1 • 2026–2027</h2>
                    </div>
                    <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-text">
                      GMT+7 • 11 ca học
                    </span>
                  </div>

                  <div className="my-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                      <span className="inline-block rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                        MSIS207
                      </span>
                      <p className="mt-1.5 text-xs font-bold text-text truncate">Phát triển ứng dụng web</p>
                      <p className="mt-1 text-[11px] text-muted">13:00 – 16:15 • C206</p>
                    </div>

                    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
                      <span className="inline-block rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">
                        CS5433
                      </span>
                      <p className="mt-1.5 text-xs font-bold text-text truncate">CSDL phân tán</p>
                      <p className="mt-1 text-[11px] text-muted">13:00 – 17:00 • B5.04</p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <span className="inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        STAT3013
                      </span>
                      <p className="mt-1.5 text-xs font-bold text-text truncate">Phân tích thống kê</p>
                      <p className="mt-1 text-[11px] text-muted">07:30 – 11:30 • B5.04</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                    <span className="text-muted">Tự động loại bỏ môn trùng & tách mã học phần</span>
                    <Link to="/login" className="font-bold text-primary hover:underline">
                      Mở lịch của bạn →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTINUOUS GPU TICKER RIBBON */}
        <div className="border-y border-border/60 bg-surface-2/40 py-3.5 overflow-hidden">
          <div className="apple-ticker-track will-change-transform flex w-max items-center gap-10 text-xs font-semibold text-muted">
            {[
              '⚡ Đồng bộ Google Calendar (.ics) trong 1 giây',
              '🧠 AI Bio-Rhythm cá nhân hóa khung giờ vàng',
              '⏱️ Pomodoro Focus Room không xao nhãng',
              '📊 Phân tích tiến độ đề cương trực quan',
              '🛡️ Cảnh báo sớm Deadline bài tập & đồ án',
              '✨ Chuyển động 60fps GPU-Accelerated',
              '⚡ Đồng bộ Google Calendar (.ics) trong 1 giây',
              '🧠 AI Bio-Rhythm cá nhân hóa khung giờ vàng',
              '⏱️ Pomodoro Focus Room không xao nhãng',
              '📊 Phân tích tiến độ đề cương trực quan',
              '🛡️ Cảnh báo sớm Deadline bài tập & đồ án',
              '✨ Chuyển động 60fps GPU-Accelerated',
            ].map((item, index) => (
              <span key={index} className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 2: APPLE TYPOGRAPHY SCROLL REVEAL STATEMENT */}
        <section id="statement-section" className="apple-reveal-section mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            TRIẾT LÝ THIẾT KẾ
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text leading-tight">
            Không chỉ là công cụ quản lý thời gian.{' '}
            <span className="text-muted">
              Đó là hệ điều hành bảo vệ năng lượng nhận thức của sinh viên đại học.
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted leading-relaxed">
            Mỗi thành phần trên giao diện đều được tinh giản tối đa để bạn biết chính xác ca học tiếp theo ở phòng nào, bài tập nào sắp đến hạn và khi nào nên bước vào trạng thái tập trung sâu.
          </p>
        </section>

        {/* SECTION 3: INTERACTIVE DYNAMIC PRODUCT STAGE (AUTO-PLAYING TABS) */}
        <section
          id="showcase-stage"
          onMouseEnter={() => setIsStagePaused(true)}
          onMouseLeave={() => setIsStagePaused(false)}
          className="apple-reveal-section mx-auto max-w-6xl px-4 sm:px-6 space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                TRÌNH DIỄN TÍNH NĂNG ĐỘNG
              </span>
              <h2 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
                Ba trụ cột. Một trải nghiệm liền mạch.
              </h2>
            </div>

            {/* Apple Segmented Control Pills */}
            <div className="inline-flex rounded-2xl border border-border bg-surface-2/80 p-1.5 gap-1">
              {SHOWCASE_STAGES.map((stage, idx) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    activeStage === idx
                      ? 'bg-primary text-primary-fg shadow-xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {idx === 0 ? '1. Thời khóa biểu' : idx === 1 ? '2. Focus Room' : '3. AI Bio-Rhythm'}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={stageCardRef}
            className="glass-card rounded-[2rem] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center luma-glow-sm"
          >
            {/* Left Stage Copy */}
            <div className="lg:col-span-5 space-y-5">
              <span className="stage-dynamic-item inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{currentStage.eyebrow}</span>
              </span>

              <h3 className="stage-dynamic-item text-2xl sm:text-3xl font-extrabold tracking-tight text-text leading-snug">
                {currentStage.title}
              </h3>

              <p className="stage-dynamic-item text-xs sm:text-sm text-muted leading-relaxed">
                {currentStage.description}
              </p>

              <div className="stage-dynamic-item rounded-2xl border border-border bg-surface-2/70 p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-primary">{currentStage.metric}</p>
                  <p className="text-xs text-muted">{currentStage.metricLabel}</p>
                </div>
                <Link
                  to="/login"
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-fg hover:opacity-95 transition-opacity"
                >
                  Dùng thử →
                </Link>
              </div>

              {/* Auto-play GPU scaleX progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-muted">
                  <span>{isStagePaused ? 'Đang tạm dừng trình diễn' : 'Tự động chuyển phân khu'}</span>
                  <span>{activeStage + 1} / {SHOWCASE_STAGES.length}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-border/60 overflow-hidden">
                  <div className="stage-progress-fill h-full w-full bg-primary origin-left will-change-transform" />
                </div>
              </div>
            </div>

            {/* Right Dynamic Interactive Cards */}
            <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-surface-2/60 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-bold text-text">{currentStage.badge}</span>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  Real-time Sync
                </span>
              </div>

              <div className="space-y-3">
                {currentStage.courses.map((item) => (
                  <div
                    key={item.code}
                    className="stage-dynamic-item will-change-transform rounded-2xl border border-border/80 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`rounded-xl border px-2.5 py-1 text-xs font-bold ${item.accent}`}>
                        {item.code}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-text">{item.name}</h4>
                        <p className="text-xs text-muted">{item.time} • {item.room}</p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted border border-border">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: APPLE PRO BENTO ARCHITECTURE SPECS */}
        <section id="bento-specs" className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              KIẾN TRÚC HIỆU NĂNG CAO
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
              Sức mạnh bên trong từng chi tiết.
            </h2>
          </div>

          <div className="apple-bento-grid grid grid-cols-1 lg:grid-cols-12 gap-5">
            {APPLE_BENTO_SPECS.map((spec) => (
              <div
                key={spec.title}
                className={`apple-bento-item will-change-transform ${spec.colSpan} glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {spec.eyebrow}
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {spec.tag}
                  </span>
                </div>

                <div className="my-6 space-y-2">
                  <p className="text-4xl sm:text-5xl font-black tracking-tight text-primary">
                    {spec.metric}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-text leading-snug">
                    {spec.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {spec.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted">Sẵn sàng trên tài khoản của bạn</span>
                  <Link to="/login" className="font-bold text-primary hover:underline">
                    Khám phá →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: APPLE FINALE CALL TO ACTION */}
        <section className="apple-reveal-section mx-auto max-w-5xl px-4 sm:px-6">
          <div className="glass-card rounded-[2.25rem] p-8 sm:p-14 text-center space-y-6 luma-glow border border-primary/30">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1 text-xs font-bold text-primary">
              <span>✨</span>
              <span>SẴN SÀNG CHO HỌC KỲ MỚI</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-text max-w-2xl mx-auto leading-tight">
              Bắt đầu hành trình học tập thông minh ngay hôm nay.
            </h2>

            <p className="text-sm sm:text-base text-muted max-w-xl mx-auto">
              Đăng nhập để đồng bộ lịch học <code className="text-text font-semibold">.ics</code>, theo dõi nhịp sinh học và mở khóa toàn bộ công cụ tập trung.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-bold text-primary-fg shadow-lg luma-glow-sm hover:opacity-95 transition-opacity"
              >
                <span>Đăng nhập ngay</span>
                <span>→</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-8 py-4 text-sm font-semibold text-text hover:border-primary/50 transition-colors"
              >
                <span>Tạo tài khoản mới</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
