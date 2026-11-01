import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLanguage } from '../i18n/languageContext';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  gsap.registerPlugin(ScrollTrigger);
}

const HOME_COPY = {
  en: {
    nav: {
      demo: 'Live Demo',
      botanical: 'Bio-Rhythm',
      ecosystem: 'Ecosystem',
      login: 'Sign In',
      register: 'Get Started',
    },
    hero: {
      tag: 'LUMA GREEN • BIO-STUDY OS',
      titleLine1: 'One experience.',
      titleLine2: 'Built around you.',
      subtitle: 'Visual timetable sync. Botanical focus studio. Circadian AI.',
      ctaPrimary: 'Enter Study Hub',
      ctaSecondary: 'Create Account',
      watchBadge: 'Apple Watch • Bio-Sync',
      watchStatus: '98% Optimal Rhythm',
      streakBadge: '7-Day Deep Work',
    },
    demos: {
      sectionTag: 'INTERACTIVE MINI STUDIO',
      sectionTitle: 'Touch the workflow.',
      // Demo 1: Botanical Focus Orb
      orbTag: 'BOTANICAL POMODORO',
      orbTitle: 'Breathe. Focus. Flow.',
      orbStart: 'Start Live Demo',
      orbPause: 'Pause Session',
      orbReset: 'Reset',
      modes: ['🌱 Forest Rain', '🍃 Matcha Alpha', '🌿 Night Lotus'],
      // Demo 2: Interactive ICS Sync
      icsTag: 'INSTANT .ICS ENGINE',
      icsTitle: 'One tap. Full week synced.',
      icsBtnSync: '⚡ Simulate .ics Drop',
      icsBtnReset: '↺ Replay Sync',
      icsSyncedBadge: '11 Classes Placed • Zero Overlap',
      days: ['MON', 'WED', 'THU', 'FRI', 'SAT'],
    },
    showcase: {
      sectionTag: 'GREEN WELLNESS ECOSYSTEM',
      sectionTitle: 'Your rhythm. Your practice.',
      card1Tag: 'MIND & BODY',
      card1Title: 'Circadian Energy Wave',
      card1Stat: '08:30 – 10:30 AM Peak',
      card2Tag: 'WEARABLE SYNC',
      card2Title: 'Mindful Break Alerts',
      card2Stat: '62 BPM Calm State',
      card3Tag: 'SMART SYLLABUS',
      card3Title: 'Visual Chapter Mastery',
      card3Stat: '88% Semester Pace',
    },
    finale: {
      title: 'Ready for your best semester?',
      ctaLogin: 'Sign In',
      ctaRegister: 'Start Free',
    },
  },
  vi: {
    nav: {
      demo: 'Demo Trực tiếp',
      botanical: 'Nhịp Sinh Học',
      ecosystem: 'Hệ Sinh Thái',
      login: 'Đăng nhập',
      register: 'Bắt đầu',
    },
    hero: {
      tag: 'LUMA GREEN • HỆ ĐIỀU HÀNH HỌC TẬP',
      titleLine1: 'Một trải nghiệm.',
      titleLine2: 'Xoay quanh nhịp của bạn.',
      subtitle: 'Đồng bộ lịch .ics trực quan. Phòng tập trung sinh thái. AI nhịp sinh học.',
      ctaPrimary: 'Đăng nhập Không gian',
      ctaSecondary: 'Tạo tài khoản',
      watchBadge: 'Đồng bộ Nhịp Sinh Học',
      watchStatus: '98% Năng lượng Đỉnh',
      streakBadge: 'Chuỗi 7 Ngày Deep Work',
    },
    demos: {
      sectionTag: 'TRẢI NGHIỆM TƯƠNG TÁC TRỰC TIẾP',
      sectionTitle: 'Chạm thử tính năng ngay trên trang.',
      orbTag: 'POMODORO SINH THÁI',
      orbTitle: 'Hít thở. Tập trung. Thăng hoa.',
      orbStart: 'Chạy thử Pomodoro',
      orbPause: 'Tạm dừng',
      orbReset: 'Đặt lại',
      modes: ['🌱 Mưa Rừng Xanh', '🍃 Sóng Alpha Trà Xanh', '🌿 Sen Đêm Tĩnh Lặng'],
      icsTag: 'ĐỒNG BỘ LỊCH .ICS TỨC THÌ',
      icsTitle: 'Một chạm. Lên lịch cả tuần.',
      icsBtnSync: '⚡ Thử thả file .ics',
      icsBtnReset: '↺ Chạy lại hiệu ứng',
      icsSyncedBadge: 'Đã xếp 11 ca học • Không trùng giờ',
      days: ['T2', 'T4', 'T5', 'T6', 'T7'],
    },
    showcase: {
      sectionTag: 'HỆ SINH THÁI WELLNESS XANH',
      sectionTitle: 'Nhịp điệu của bạn. Không gian của bạn.',
      card1Tag: 'TÂM TRÍ & NĂNG LƯỢNG',
      card1Title: 'Sóng Năng Lượng Sinh Học',
      card1Stat: 'Đỉnh 08:30 – 10:30 Sáng',
      card2Tag: 'ĐỒNG HỒ THÔNG MINH',
      card2Title: 'Nhắc Nghỉ Phục Hồi Thị Giác',
      card2Stat: '62 BPM Trạng Thái Tĩnh',
      card3Tag: 'ĐỀ CƯƠNG TRỰC QUAN',
      card3Title: 'Theo Dõi Tiến Độ Chương',
      card3Stat: '88% Tiến Độ Học Kỳ',
    },
    finale: {
      title: 'Sẵn sàng cho học kỳ rực rỡ nhất?',
      ctaLogin: 'Đăng nhập',
      ctaRegister: 'Đăng ký miễn phí',
    },
  },
};

const DEMO_TIMETABLE_BLOCKS = [
  { dayIdx: 0, code: 'PE231', room: 'Field A', top: '12%', height: '32%', color: 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200' },
  { dayIdx: 1, code: 'MSIS207', room: 'C206', top: '42%', height: '42%', color: 'bg-primary/25 border-primary/60 text-primary' },
  { dayIdx: 2, code: 'CS5433', room: 'B5.04', top: '38%', height: '46%', color: 'bg-teal-500/25 border-teal-400/50 text-teal-200' },
  { dayIdx: 3, code: 'MSIS4263', room: 'C211', top: '18%', height: '36%', color: 'bg-lime-500/25 border-lime-400/50 text-lime-200' },
  { dayIdx: 4, code: 'STAT3013', room: 'B5.04', top: '15%', height: '48%', color: 'bg-emerald-400/25 border-emerald-300/60 text-emerald-100' },
];

export function HomePage() {
  const { lang } = useLanguage();
  const t = HOME_COPY[lang] || HOME_COPY.en;

  const rootRef = useRef(null);
  const icsGridRef = useRef(null);

  // Interactive Mini Demo 1: Botanical Focus Orb state
  const [timerRunning, setTimerRunning] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [soundMode, setSoundMode] = useState(0);

  // Interactive Mini Demo 2: ICS Sync state
  const [icsSyncKey, setIcsSyncKey] = useState(1);

  // Countdown tick for interactive Pomodoro mini-demo
  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 25 * 60));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const formattedTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  // Master 60fps GSAP animations (transform + autoAlpha only)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.apple-hero-item',
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.08, clearProps: 'opacity,visibility,transform' }
      ).fromTo(
        '.apple-stage-visual',
        { y: 32, scale: 0.96, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, clearProps: 'opacity,visibility,transform' },
        '-=0.35'
      );

      // Continuous organic breathing for Green Botanical Lotus Sculpture
      gsap.to('.botanical-lotus-core', {
        scale: 1.07,
        rotation: 8,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.botanical-lotus-outer', {
        scale: 0.94,
        rotation: -6,
        duration: 5.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Floating hardware pills
      gsap.to('.float-pill-1', {
        y: -8,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.float-pill-2', {
        y: 8,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.4,
      });

      // Scroll-triggered section reveals
      gsap.utils.toArray('.apple-scroll-section').forEach((sec) => {
        gsap.fromTo(
          sec,
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: sec,
              start: 'top 86%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Triggered animation when user clicks "Simulate .ics Drop"
  useLayoutEffect(() => {
    if (!icsGridRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.demo-ics-block',
        { y: -18, scale: 0.88, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.4,
          stagger: 0.07,
          ease: 'back.out(1.4)',
          clearProps: 'opacity,visibility,transform',
        }
      );
    }, icsGridRef);
    return () => ctx.revert();
  }, [icsSyncKey]);

  return (
    <div ref={rootRef} className="min-h-screen bg-bg text-text selection:bg-primary selection:text-primary-fg overflow-x-hidden">
      {/* Sticky Minimal Apple + Luma Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-xs">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9.5 6 7 9.5 7 13a5 5 0 0010 0c0-3.5-2.5-7-5-11zm0 15a3 3 0 01-3-3c0-2 1.5-4.5 3-7 1.5 2.5 3 5 3 7a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-sm font-extrabold tracking-tight text-text">Luma</span>
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              SFSH
            </span>
          </Link>

          <nav aria-label="Home navigation" className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted">
            <a href="#live-demos" className="hover:text-text transition-colors">
              {t.nav.demo}
            </a>
            <a href="#green-ecosystem" className="hover:text-text transition-colors">
              {t.nav.botanical}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-full border border-border bg-surface-2 px-4 py-1.5 text-xs font-semibold text-text hover:border-primary/50 transition-colors"
            >
              {t.nav.login}
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-flex rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-fg shadow-xs luma-glow-sm hover:opacity-95 transition-opacity"
            >
              {t.nav.register}
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-20 sm:space-y-28 pb-24">
        {/* SECTION 1: VISUAL-FIRST APPLE + LUMA GREEN BOTANICAL HERO */}
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14 text-center">
          <div className="apple-hero-item inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-bold tracking-wider text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{t.hero.tag}</span>
          </div>

          <h1 className="apple-hero-item mx-auto mt-5 max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-text leading-[1.04]">
            {t.hero.titleLine1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-300 to-lime-300">
              {t.hero.titleLine2}
            </span>
          </h1>

          <p className="apple-hero-item mx-auto mt-4 max-w-xl text-sm sm:text-base font-medium text-muted">
            {t.hero.subtitle}
          </p>

          <div className="apple-hero-item mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-fg shadow-md luma-glow hover:opacity-95 transition-opacity"
            >
              <span>{t.hero.ctaPrimary}</span>
              <span>→</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:border-primary/50 transition-colors"
            >
              <span>{t.hero.ctaSecondary}</span>
            </Link>
          </div>

          {/* CENTERPIECE VISUAL STAGE: Glowing Luma Green Botanical Lotus + Multi-Device Showcase */}
          <div className="apple-stage-visual relative mx-auto mt-12 max-w-5xl">
            {/* Floating Left Pill: Apple Watch Bio-Sync */}
            <div className="float-pill-1 will-change-transform hidden lg:flex items-center gap-3 glass-card rounded-2xl px-4 py-3 text-left absolute -left-4 top-12 z-20 shadow-xl border border-primary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C9.5 6 7 9.5 7 13a5 5 0 0010 0c0-3.5-2.5-7-5-11z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{t.hero.watchBadge}</p>
                <p className="text-xs font-extrabold text-text">{t.hero.watchStatus}</p>
              </div>
            </div>

            {/* Floating Right Pill: 7-Day Streak */}
            <div className="float-pill-2 will-change-transform hidden lg:flex items-center gap-3 glass-card rounded-2xl px-4 py-3 text-left absolute -right-4 bottom-12 z-20 shadow-xl border border-emerald-400/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 text-lg">
                🌿
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">BIO-STREAK</p>
                <p className="text-xs font-extrabold text-text">{t.hero.streakBadge}</p>
              </div>
            </div>

            {/* Visual Stage Frame (Matches Luma Behance Green Lotus + Device Mockups) */}
            <div className="glass-card rounded-[2.25rem] border border-primary/25 p-5 sm:p-8 shadow-2xl overflow-hidden relative">
              <div
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-[1.75rem] p-6 sm:p-8 border border-white/10"
                style={{
                  background:
                    'radial-gradient(circle at 30% 50%, rgba(163, 230, 53, 0.22), rgba(16, 185, 129, 0.08) 45%, rgba(10, 14, 10, 0.95) 85%)',
                }}
              >
                {/* Left Visual: Glowing Botanical Lotus Sculpture */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
                  <div className="relative flex h-52 w-52 items-center justify-center">
                    {/* Outer Botanical Petal Aura */}
                    <svg
                      className="botanical-lotus-outer will-change-transform absolute inset-0 h-full w-full text-emerald-400/30"
                      viewBox="0 0 200 200"
                      fill="currentColor"
                    >
                      <path d="M100 10 C125 45, 155 65, 155 105 C155 140, 130 165, 100 180 C70 165, 45 140, 45 105 C45 65, 75 45, 100 10 Z" />
                      <path
                        d="M100 25 C140 50, 175 80, 165 125 C155 155, 125 170, 100 180 C75 170, 45 155, 35 125 C25 80, 60 50, 100 25 Z"
                        opacity="0.55"
                      />
                    </svg>

                    {/* Inner Glowing Lime Lotus Core */}
                    <svg
                      className="botanical-lotus-core will-change-transform relative z-10 h-36 w-36 text-primary drop-shadow-[0_0_24px_rgba(163,230,53,0.55)]"
                      viewBox="0 0 200 200"
                      fill="currentColor"
                    >
                      <path d="M100 22 C120 58, 142 82, 142 114 C142 142, 123 162, 100 172 C77 162, 58 142, 58 114 C58 82, 80 58, 100 22 Z" />
                      <circle cx="100" cy="115" r="24" className="fill-bg/80" />
                      <circle cx="100" cy="115" r="10" className="fill-primary" />
                    </svg>

                    {/* Center Bio Percentage */}
                    <div className="absolute bottom-2 rounded-full border border-primary/40 bg-bg/90 px-3.5 py-1 text-xs font-black text-primary">
                      98% BIO-FLOW
                    </div>
                  </div>
                </div>

                {/* Right Visual: Sleek Hardware UI Preview (Zero Long Paragraphs) */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {/* Visual Card A: Today's Rhythm Ring */}
                  <div className="rounded-3xl border border-white/10 bg-black/55 p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">FOCUS RING</span>
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="my-4 flex items-center gap-4">
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="38" className="stroke-white/10" strokeWidth="9" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r="38"
                            className="stroke-primary"
                            strokeWidth="9"
                            strokeDasharray="238.7"
                            strokeDashoffset="35.8"
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <span className="absolute text-base font-black text-white">85%</span>
                      </div>
                      <div>
                        <p className="text-xl font-black text-white">3.5 hrs</p>
                        <p className="text-xs text-emerald-300/80">7 Pomodoros Done</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {[65, 85, 95, 75, 90, 100, 80].map((v, idx) => (
                        <div key={idx} className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${v}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Card B: Live Class Card */}
                  <div className="rounded-3xl border border-white/10 bg-black/55 p-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        MSIS207.R11
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-300">13:00 – 16:15</span>
                    </div>
                    <div className="my-4">
                      <p className="text-base font-bold text-white">Web App Development</p>
                      <p className="mt-1 text-xs text-white/60">📍 Room C206 • Synced via .ics</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                      <span className="text-emerald-300 font-semibold">● Bio-Peak Match</span>
                      <span className="text-white/70 font-bold">GMT+7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE MINI DEMOS (POMODORO ORB + 1-TAP ICS TIMETABLE) */}
        <section id="live-demos" className="apple-scroll-section mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.demos.sectionTag}</span>
              <h2 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
                {t.demos.sectionTitle}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* MINI DEMO 1: Interactive Botanical Pomodoro & Soundscape Orb */}
            <div className="lg:col-span-5 glass-card rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between border border-primary/25">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{t.demos.orbTag}</span>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  Interactive
                </span>
              </div>

              <h3 className="mt-2 text-xl font-extrabold text-text">{t.demos.orbTitle}</h3>

              {/* Interactive Glowing Timer Ring */}
              <div className="my-6 flex flex-col items-center">
                <div
                  onClick={() => setTimerRunning((r) => !r)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setTimerRunning((r) => !r)}
                  className="cursor-pointer group relative flex h-44 w-44 items-center justify-center rounded-full border border-primary/30 bg-surface-2/80 shadow-inner transition-transform hover:scale-105"
                >
                  <svg className="absolute inset-0 h-full w-full -rotate-90 p-2" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" className="stroke-border" strokeWidth="4" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      className="stroke-primary"
                      strokeWidth="5"
                      strokeDasharray="276.4"
                      strokeDashoffset={276.4 * (1 - secondsLeft / (25 * 60))}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-xs font-bold text-primary block">🌱</span>
                    <span className="text-3xl font-black tracking-tight text-text">{formattedTimer}</span>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
                      {timerRunning ? '● FLOWING' : '❚❚ PAUSED'}
                    </span>
                  </div>
                </div>

                {/* Soundscape Selector Pills */}
                <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                  {t.demos.modes.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSoundMode(idx)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                        soundMode === idx
                          ? 'bg-primary text-primary-fg'
                          : 'border border-border bg-surface-2 text-muted hover:text-text'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="flex-1 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-95 transition-opacity"
                >
                  {timerRunning ? t.demos.orbPause : t.demos.orbStart}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSecondsLeft(25 * 60);
                    setTimerRunning(true);
                  }}
                  className="rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-xs font-semibold text-muted hover:text-text transition-colors"
                >
                  {t.demos.orbReset}
                </button>
              </div>
            </div>

            {/* MINI DEMO 2: Interactive 1-Tap .ICS Visual Timetable Grid */}
            <div className="lg:col-span-7 glass-card rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between border border-primary/25">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{t.demos.icsTag}</span>
                  <h3 className="mt-1 text-xl font-extrabold text-text">{t.demos.icsTitle}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIcsSyncKey((k) => k + 1)}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-fg shadow-xs luma-glow-sm hover:opacity-95 transition-opacity"
                >
                  {icsSyncKey === 1 ? t.demos.icsBtnSync : t.demos.icsBtnReset}
                </button>
              </div>

              {/* Visual Mini Timetable Canvas */}
              <div
                ref={icsGridRef}
                className="my-5 rounded-2xl border border-border bg-surface-2/70 p-3.5 overflow-hidden"
              >
                <div className="grid grid-cols-5 gap-2 border-b border-border/60 pb-2 text-center">
                  {t.demos.days.map((day) => (
                    <span key={day} className="text-[11px] font-bold text-muted">
                      {day}
                    </span>
                  ))}
                </div>

                <div className="relative mt-2 grid grid-cols-5 gap-2 h-48">
                  {[0, 1, 2, 3, 4].map((colIdx) => {
                    const block = DEMO_TIMETABLE_BLOCKS.find((b) => b.dayIdx === colIdx);
                    return (
                      <div key={colIdx} className="relative rounded-xl bg-surface/60 border border-border/40 p-1">
                        {block && (
                          <div
                            className={`demo-ics-block will-change-transform absolute inset-x-1 rounded-xl border p-2 flex flex-col justify-between ${block.color}`}
                            style={{ top: block.top, height: block.height }}
                          >
                            <span className="text-[10px] font-black">{block.code}</span>
                            <span className="text-[10px] opacity-85">📍 {block.room}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {t.demos.icsSyncedBadge}
                </span>
                <Link to="/login" className="font-bold text-text hover:text-primary transition-colors">
                  TKB_HK1.ics →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: VISUAL GREEN WELLNESS BENTO CARDS (HIGH VISUALS, MINIMAL TEXT) */}
        <section id="green-ecosystem" className="apple-scroll-section mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.showcase.sectionTag}</span>
            <h2 className="mt-1 text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
              {t.showcase.sectionTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Visual Card 1: Green Bio-Wave Graphic */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t.showcase.card1Tag}</span>
                <h3 className="mt-1 text-lg font-extrabold text-text">{t.showcase.card1Title}</h3>
              </div>

              {/* Visual Wave Bars */}
              <div className="my-6 flex items-end justify-between gap-2 h-28 px-2">
                {[45, 70, 95, 85, 60, 90, 50].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      className={`w-full rounded-xl ${
                        i === 2 || i === 5 ? 'bg-primary luma-glow-sm' : 'bg-emerald-500/40'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <span className="font-bold text-primary">{t.showcase.card1Stat}</span>
                <span>🌱</span>
              </div>
            </div>

            {/* Visual Card 2: Apple Watch Botanical Face Graphic */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {t.showcase.card2Tag}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-text">{t.showcase.card2Title}</h3>
              </div>

              {/* Apple Watch Squircle Visual */}
              <div className="my-5 flex justify-center">
                <div
                  className="flex h-32 w-28 flex-col items-center justify-center rounded-[2rem] border-2 border-primary/40 p-3 shadow-lg"
                  style={{
                    background: 'radial-gradient(circle, rgba(163, 230, 53, 0.25), rgba(10, 16, 10, 0.95))',
                  }}
                >
                  <span className="text-2xl">🍃</span>
                  <span className="mt-1 text-xs font-black text-white">BREATHE</span>
                  <span className="text-[10px] font-bold text-primary">4-7-8 Calm</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <span className="font-bold text-emerald-400">{t.showcase.card2Stat}</span>
                <span>⌚</span>
              </div>
            </div>

            {/* Visual Card 3: Visual Syllabus Mastery Ring & Pills */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">
                  {t.showcase.card3Tag}
                </span>
                <h3 className="mt-1 text-lg font-extrabold text-text">{t.showcase.card3Title}</h3>
              </div>

              <div className="my-5 space-y-2.5">
                {[
                  { code: 'MSIS207', pct: '88%' },
                  { code: 'STAT3013', pct: '82%' },
                  { code: 'CS5433', pct: '76%' },
                ].map((c) => (
                  <div key={c.code} className="rounded-xl border border-border bg-surface-2/70 p-2.5">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-text">{c.code}</span>
                      <span className="text-primary">{c.pct}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: c.pct }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <span className="font-bold text-lime-400">{t.showcase.card3Stat}</span>
                <span>✨</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: MINIMAL APPLE FINALE CTA */}
        <section className="apple-scroll-section mx-auto max-w-4xl px-4 sm:px-6">
          <div
            className="glass-card rounded-[2.25rem] p-8 sm:p-12 text-center space-y-6 border border-primary/35 luma-glow"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(163, 230, 53, 0.2), rgba(15, 22, 15, 0.95) 75%)',
            }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-fg text-xl shadow-md">
              🌱
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-text">
              {t.finale.title}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-fg shadow-md hover:opacity-95 transition-opacity"
              >
                {t.finale.ctaLogin} →
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-border bg-surface-2 px-8 py-3.5 text-sm font-semibold text-text hover:border-primary/50 transition-colors"
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
