import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../i18n/languageContext';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LotusIcon } from '../components/AppShell';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_COPY = {
  en: {
    hero: {
      badge: 'STUDENT SCHEDULE & FOCUS STUDIO',
      titleLine1: 'One experience.',
      titleLine2: 'Built around you.',
      taglines: [
        'Automated .ICS Timetable Sync',
        '25/5 Pomodoro Focus Studio',
        'Zero Collision Smart Scheduling',
      ],
      subtitle:
        'A distraction-free workspace for university students. Synchronize your .ics timetable, time-block daily active hours, and master course assignments in one unified interface.',
      ctaPrimary: 'Sign In to Workspace',
      ctaSecondary: 'Create Free Account',
    },
    stats: [
      { num: '100%', label: 'Automatic .ICS Parser', dot: 'bg-primary' },
      { num: '25m', label: 'Pomodoro Focus Sprints', dot: 'bg-emerald-400' },
      { num: 'Zero', label: 'Schedule Class Collisions', dot: 'bg-primary' },
      { num: '60 FPS', label: 'GPU-Accelerated Smoothness', dot: 'bg-sky-400' },
    ],
    floatingPopups: {
      synced: '⚡ 11 Classes Auto-Scheduled',
      syncedSub: 'Portal & Google Cal Sync',
      onTime: '🎯 94.2% On-Time Completion',
      onTimeSub: 'Academic Pace: Grade A',
      focus: '⏱️ 4x Pomodoro Streak · 92% Flow',
      focusSub: 'Active Study Sprint',
    },
    demos: {
      tag: 'INTERACTIVE SOFTWARE PREVIEW',
      title: 'Real tools designed for high-performance semesters.',
      tabTimetable: 'Weekly Timetable Sync',
      tabFocus: 'Pomodoro Study Room',
      tabDeadlines: 'Course Milestones',
      // Timetable Demo
      syncBtn: '⚡ Simulate .ICS Import',
      syncDone: '11 Classes Synced · Zero Collision',
      syncRoomLabel: 'Room C206 • 13:00 – 16:15',
      // Focus Demo
      pomoCourse: 'MSIS207 · Web Application Development',
      pomoSprint: 'Pomodoro Sprint 3 of 4',
      pomoStart: 'Start Timer',
      pomoPause: 'Pause Timer',
      pomoReset: 'Reset',
      soundscapes: ['🎧 Library Silence', '🌧️ Gentle Rain', '☕ Campus Cafe'],
    },
    pillars: {
      tag: 'CORE MODULES',
      title: 'Engineered for simplicity and speed.',
      card1Title: 'Active Hours Scheduling',
      card1Desc:
        'Structure lectures, lab practicals, and independent study blocks around your natural peak productive hours.',
      card2Title: 'Instant .ICS Timetable Parser',
      card2Desc:
        'Upload your Google Calendar or university portal file. Automatically deduplicates course codes and maps classroom locations.',
      card3Title: 'Clean Focus Timer',
      card3Desc:
        'Built-in customizable Pomodoro study intervals with minimal distraction and ambient soundscapes.',
    },
    finale: {
      title: 'Ready for your best academic term?',
      subtitle: 'Open your timetable, start a focus sprint, and keep deadlines under control.',
      ctaLogin: 'Sign In Now',
      ctaRegister: 'Start Free',
    },
  },
  vi: {
    hero: {
      badge: 'KHÔNG GIAN LỊCH TRÌNH & TẬP TRUNG HỌC TẬP',
      titleLine1: 'Một trải nghiệm.',
      titleLine2: 'Xoay quanh nhịp của bạn.',
      taglines: [
        'Đồng bộ thời khóa biểu tự động .ICS',
        'Phòng tập trung Pomodoro 25/5',
        'Kiểm soát 100% deadline không trễ hạn',
      ],
      subtitle:
        'Không gian học tập không xao nhãng dành cho sinh viên đại học. Đồng bộ thời khóa biểu .ics, quản lý khung giờ hoạt động hiệu quả và theo dõi hạn nộp bài tập.',
      ctaPrimary: 'Đăng nhập Không gian',
      ctaSecondary: 'Tạo tài khoản miễn phí',
    },
    stats: [
      { num: '100%', label: 'Tự động bóc tách .ICS', dot: 'bg-primary' },
      { num: '25 phút', label: 'Phiên học Pomodoro tối ưu', dot: 'bg-emerald-400' },
      { num: '0 Ca', label: 'Trùng lịch xếp môn học', dot: 'bg-primary' },
      { num: '60 FPS', label: 'Trải nghiệm mượt mà', dot: 'bg-sky-400' },
    ],
    floatingPopups: {
      synced: '⚡ 11 Ca học tự động xếp lịch',
      syncedSub: 'Đồng bộ Google Cal & Portal',
      onTime: '🎯 94.2% Tỷ lệ nộp bài đúng hạn',
      onTimeSub: 'Xếp loại học tập: Loại A',
      focus: '⏱️ 4x Pomodoro Streak · 92% Flow',
      focusSub: 'Phiên tập trung chuyên sâu',
    },
    demos: {
      tag: 'TRẢI NGHIỆM TƯƠNG TÁC PHẦN MỀM',
      title: 'Công cụ thực tế hỗ trợ kết quả học tập tối đa.',
      tabTimetable: 'Đồng bộ Thời khóa biểu',
      tabFocus: 'Phòng Tập trung Pomodoro',
      tabDeadlines: 'Tiến độ Đề cương & Hạn nộp',
      syncBtn: '⚡ Thử nạp file .ICS',
      syncDone: 'Đã xếp 11 ca học · Không trùng giờ',
      syncRoomLabel: 'Phòng C206 • 13:00 – 16:15',
      pomoCourse: 'MSIS207 · Phát triển ứng dụng Web',
      pomoSprint: 'Phiên Pomodoro 3 trên 4',
      pomoStart: 'Bắt đầu',
      pomoPause: 'Tạm dừng',
      pomoReset: 'Đặt lại',
      soundscapes: ['🎧 Thư viện tĩnh lặng', '🌧️ Mưa êm dịu', '☕ Cafe học bài'],
    },
    pillars: {
      tag: 'TÍNH NĂNG NÒNG CỐT',
      title: 'Tối giản, mượt mà và trực quan.',
      card1Title: 'Phân bổ Khung giờ Hoạt động',
      card1Desc:
        'Sắp xếp ca học giảng đường, phòng Lab và thời gian tự học theo nhịp thời gian sinh hoạt thực tế của bạn.',
      card2Title: 'Bóc tách File .ICS Tức thì',
      card2Desc:
        'Kéo thả file từ Google Calendar hoặc cổng trường. Tự động chuẩn hóa mã môn, phòng học và thời gian bắt đầu/kết thúc.',
      card3Title: 'Đồng hồ Pomodoro Tập trung',
      card3Desc:
        'Theo dõi phiên học 25 phút chuyên sâu với âm thanh nền hỗ trợ giữ nhịp tập trung bền bỉ.',
    },
    finale: {
      title: 'Sẵn sàng nâng cao năng suất học tập?',
      subtitle: 'Mở thời khóa biểu, bắt đầu phiên học tập trung và làm chủ tiến độ học kỳ.',
      ctaLogin: 'Đăng nhập ngay',
      ctaRegister: 'Tạo tài khoản miễn phí',
    },
  },
};

const DEMO_CLASSES = [
  { day: 'Mon', code: 'PE231', name: 'Physical Education', room: 'Field A', time: '15:25 – 17:00', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { day: 'Tue', code: 'MATH201', name: 'Calculus II', room: 'Room C302', time: '09:45 – 11:45', color: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { day: 'Wed', code: 'MSIS207', name: 'Web App Development', room: 'Room C206', time: '13:00 – 16:15', color: 'border-primary/40 bg-primary/10 text-primary' },
  { day: 'Thu', code: 'CS5433', name: 'Distributed Databases', room: 'Room B5.04', time: '13:00 – 17:00', color: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  { day: 'Sat', code: 'STAT3013', name: 'Statistical Analysis', room: 'Room B5.04', time: '07:30 – 11:30', color: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400' },
];

export function HomePage() {
  const { lang } = useLanguage();
  const t = HOME_COPY[lang] || HOME_COPY.en;
  const rootRef = useRef(null);

  // Demo interactive states
  const [activeTab, setActiveTab] = useState('timetable');
  const [timerRunning, setTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(21 * 60 + 45); // 21:45
  const [selectedSound, setSelectedSound] = useState(0);
  const [syncedKey, setSyncedKey] = useState(1);
  const [taglineIndex, setTaglineIndex] = useState(0);

  // Cycling kinetic tagline index
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTaglineIndex((idx) => (idx + 1) % t.hero.taglines.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [t.hero.taglines.length]);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 25 * 60));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const formattedTimer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.home-hero-badge',
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.home-hero-title',
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.2'
        )
        .fromTo(
          '.home-hero-ticker',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.home-hero-desc',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.home-hero-cta',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.home-stats-bar',
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' },
          '-=0.2'
        )
        .fromTo(
          '.home-interactive-stage',
          { y: 24, scale: 0.97, autoAlpha: 0 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: 'power2.out', clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        );

      // Gentle floating sine motion for floating popups (GPU compositor only)
      gsap.to('.float-popup-1', {
        y: -6,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.float-popup-2', {
        y: 6,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.float-popup-3', {
        y: -5,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Scroll reveals with once: true to prevent scroll FPS drop
      gsap.utils.toArray('.home-scroll-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 22, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.45,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-text overflow-x-hidden font-sans">
      {/* Top Navbar: Clean Brand + Action Controls (No Studio/Program pill) */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-border bg-surface/75 backdrop-blur-2xl">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary group-hover:scale-105 transition-transform shadow-xs">
            <LotusIcon className="h-5 w-5" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-text">Luma</span>
        </Link>

        {/* Right action controls */}
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-text hover:border-primary/50 transition-colors"
          >
            {lang === 'vi' ? 'Đăng nhập' : 'Sign In'}
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-text text-bg dark:bg-white dark:text-black px-4 py-1.5 text-xs font-extrabold shadow-sm hover:bg-primary hover:text-black transition-colors"
          >
            {lang === 'vi' ? 'Bắt đầu' : 'Get Started'}
          </Link>
        </div>
      </header>

      <main className="space-y-20 sm:space-y-28 pb-24">
        {/* HERO SECTION */}
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-8 sm:pt-16 text-center">
          <div className="home-hero-badge inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="home-hero-title mx-auto mt-6 max-w-4xl text-4xl sm:text-6xl lg:text-[66px] font-extrabold tracking-tight text-text leading-[1.05]">
            {t.hero.titleLine1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-deep via-primary to-text dark:to-white">
              {t.hero.titleLine2}
            </span>
          </h1>

          {/* Kinetic cycling tagline badge */}
          <div className="home-hero-ticker mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary font-black uppercase text-[10px]">Highlight:</span>
            <span className="text-text transition-all duration-300">
              {t.hero.taglines[taglineIndex]}
            </span>
          </div>

          <p className="home-hero-desc mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="home-hero-cta mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="rounded-full bg-text text-bg dark:bg-white dark:text-black px-8 py-3.5 text-sm font-extrabold shadow-md hover:bg-primary hover:text-black transition-colors"
            >
              {t.hero.ctaPrimary} →
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-border bg-surface px-8 py-3.5 text-sm font-semibold text-text hover:border-primary/50 transition-colors"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* STATS TICKER BAR */}
          <div className="home-stats-bar mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {t.stats.map((s) => (
              <div key={s.label} className="glass-card rounded-2xl p-4 text-center border border-border shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  <span className="text-xl sm:text-2xl font-black text-text tracking-tight">{s.num}</span>
                </div>
                <p className="text-[11px] font-semibold text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* INTERACTIVE SOFTWARE DEMO PREVIEW (WITH FLOATING MODERN POPUPS) */}
          <div className="home-interactive-stage relative mx-auto mt-14 max-w-5xl">
            {/* FLOATING POPUP 1 (Top-Left: Timetable Sync) */}
            <div className="float-popup-1 gpu-layer absolute -top-6 -left-2 sm:-left-8 z-30 hidden md:flex items-center gap-2.5 glass-card rounded-2xl px-4 py-2.5 border border-primary/40 shadow-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary text-sm font-bold">
                ⚡
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-text">{t.floatingPopups.synced}</p>
                <p className="text-[10px] text-muted">{t.floatingPopups.syncedSub}</p>
              </div>
            </div>

            {/* FLOATING POPUP 2 (Top-Right: On-Time Rate) */}
            <div className="float-popup-2 gpu-layer absolute -top-7 -right-2 sm:-right-8 z-30 hidden md:flex items-center gap-2.5 glass-card rounded-2xl px-4 py-2.5 border border-primary/40 shadow-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                🎯
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-text">{t.floatingPopups.onTime}</p>
                <p className="text-[10px] text-muted">{t.floatingPopups.onTimeSub}</p>
              </div>
            </div>

            {/* FLOATING POPUP 3 (Bottom-Right: Pomodoro Streak) */}
            <div className="float-popup-3 gpu-layer absolute -bottom-6 right-4 sm:right-10 z-30 hidden md:flex items-center gap-2.5 glass-card rounded-2xl px-4 py-2 border border-primary/40 shadow-xl">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/20 text-primary text-xs font-bold">
                ⏱️
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-text">{t.floatingPopups.focus}</p>
                <p className="text-[10px] text-muted">{t.floatingPopups.focusSub}</p>
              </div>
            </div>

            {/* Demo Switcher Pills */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('timetable')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'timetable'
                    ? 'bg-text text-bg dark:bg-white dark:text-black shadow-md'
                    : 'border border-border bg-surface text-muted hover:text-text'
                }`}
              >
                {t.demos.tabTimetable}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('focus')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'focus'
                    ? 'bg-text text-bg dark:bg-white dark:text-black shadow-md'
                    : 'border border-border bg-surface text-muted hover:text-text'
                }`}
              >
                {t.demos.tabFocus}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('deadlines')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'deadlines'
                    ? 'bg-text text-bg dark:bg-white dark:text-black shadow-md'
                    : 'border border-border bg-surface text-muted hover:text-text'
                }`}
              >
                {t.demos.tabDeadlines}
              </button>
            </div>

            {/* Software Showcase Frame with Frosted Glass */}
            <div className="glass-card rounded-[2.25rem] p-4 sm:p-7 shadow-2xl text-left border border-border">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-border" />
                  <span className="h-3 w-3 rounded-full bg-border" />
                  <span className="h-3 w-3 rounded-full bg-border" />
                  <span className="ml-2 text-xs font-semibold text-muted">SFSH Web Workspace · Urbanist</span>
                </div>
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span>Live Interactive Preview</span>
                </span>
              </div>

              {/* DEMO 1: WEEKLY TIMETABLE SIMULATOR */}
              {activeTab === 'timetable' && (
                <div className="pt-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-text">TKB_HK1_2026-2027.ics</h3>
                      <p className="text-xs text-muted">Google Calendar & Portal Schedule Sync</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{t.demos.syncDone}</span>
                      <button
                        type="button"
                        onClick={() => setSyncedKey((k) => k + 1)}
                        className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity"
                      >
                        {t.demos.syncBtn}
                      </button>
                    </div>
                  </div>

                  {/* 5-Day Class Grid */}
                  <div key={syncedKey} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                    {DEMO_CLASSES.map((c) => (
                      <div
                        key={c.code}
                        className={`rounded-2xl border p-3 flex flex-col justify-between transition-transform hover:scale-[1.02] shadow-xs ${c.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider">{c.day}</span>
                          <span className="rounded bg-black/20 dark:bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold">
                            {c.code}
                          </span>
                        </div>
                        <div className="my-3">
                          <p className="text-xs font-bold text-text truncate">{c.name}</p>
                          <p className="text-[11px] opacity-85 mt-0.5">📍 {c.room}</p>
                        </div>
                        <span className="text-[10px] font-semibold opacity-90">{c.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DEMO 2: POMODORO STUDY TIMER */}
              {activeTab === 'focus' && (
                <div className="pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
                    <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-primary/30 bg-surface-2 shadow-inner">
                      <div className="text-center">
                        <span className="text-3xl font-black text-text tracking-tight">{formattedTimer}</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">
                          {timerRunning ? 'Focusing' : 'Paused'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                        {t.demos.pomoSprint}
                      </span>
                      <h4 className="text-lg font-bold text-text mt-1.5">{t.demos.pomoCourse}</h4>
                      <p className="text-xs text-muted">Chapter 4: RESTful API Architecture & Authentication</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {t.demos.soundscapes.map((sound, idx) => (
                        <button
                          key={sound}
                          type="button"
                          onClick={() => setSelectedSound(idx)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selectedSound === idx
                              ? 'bg-primary text-primary-fg font-bold'
                              : 'border border-border bg-surface text-muted hover:text-text'
                          }`}
                        >
                          {sound}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setTimerRunning((r) => !r)}
                        className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity"
                      >
                        {timerRunning ? t.demos.pomoPause : t.demos.pomoStart}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSeconds(25 * 60);
                          setTimerRunning(true);
                        }}
                        className="rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted hover:text-text transition-colors"
                      >
                        {t.demos.pomoReset}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DEMO 3: COURSE MILESTONES & DEADLINE CHECKLIST */}
              {activeTab === 'deadlines' && (
                <div className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { code: 'MSIS207', task: 'Lab 4 · Express CRUD API', due: 'Tonight 20:00', badge: 'Urgent', status: '80% complete' },
                    { code: 'CS5433', task: 'Assignment 2 · 2PC Protocol', due: 'In 3 days', badge: 'In Progress', status: '45% complete' },
                    { code: 'STAT3013', task: 'Quiz 3 · Hypothesis Testing', due: 'Saturday 08:00', badge: 'Scheduled', status: 'Ready' },
                  ].map((item) => (
                    <div key={item.code} className="rounded-2xl border border-border bg-surface-2/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                          {item.code}
                        </span>
                        <span className="text-[10px] font-bold text-rose-500 uppercase">{item.badge}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text">{item.task}</h4>
                        <p className="text-xs text-muted mt-0.5">Due: {item.due}</p>
                      </div>
                      <div className="pt-2 border-t border-border flex justify-between text-[11px] font-semibold text-muted">
                        <span>Progress</span>
                        <span className="text-primary font-bold">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3 CORE PILLARS */}
        <section className="home-scroll-reveal mx-auto max-w-6xl px-4 sm:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {t.pillars.tag}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
              {t.pillars.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl">⏱️</span>
                <h3 className="text-lg font-bold text-text mt-4">{t.pillars.card1Title}</h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">{t.pillars.card1Desc}</p>
              </div>
              <div className="pt-4 border-t border-border mt-6 flex justify-between text-xs text-primary font-bold">
                <span>08:00 – 17:00</span>
                <span>Active Hours</span>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl">📅</span>
                <h3 className="text-lg font-bold text-text mt-4">{t.pillars.card2Title}</h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">{t.pillars.card2Desc}</p>
              </div>
              <div className="pt-4 border-t border-border mt-6 flex justify-between text-xs text-primary font-bold">
                <span>.ICS Calendar Format</span>
                <span>Auto-Parse</span>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🎯</span>
                <h3 className="text-lg font-bold text-text mt-4">{t.pillars.card3Title}</h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">{t.pillars.card3Desc}</p>
              </div>
              <div className="pt-4 border-t border-border mt-6 flex justify-between text-xs text-primary font-bold">
                <span>Full Focus Studio</span>
                <span>Pomodoro 25/5</span>
              </div>
            </div>
          </div>
        </section>

        {/* FINALE CALL TO ACTION */}
        <section className="home-scroll-reveal mx-auto max-w-4xl px-4 sm:px-8">
          <div className="glass-card rounded-[2.5rem] p-8 sm:p-14 text-center space-y-6 border border-primary/30 luma-glow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-fg text-xl shadow-sm">
              <LotusIcon className="h-6 w-6" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text max-w-xl mx-auto">
              {t.finale.title}
            </h2>

            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
              {t.finale.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="rounded-full bg-text text-bg dark:bg-white dark:text-black px-8 py-3.5 text-sm font-extrabold shadow-md hover:bg-primary hover:text-black transition-colors"
              >
                {t.finale.ctaLogin} →
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-border bg-surface px-8 py-3.5 text-sm font-semibold text-text hover:border-primary/50 transition-colors"
              >
                {t.finale.ctaRegister}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
