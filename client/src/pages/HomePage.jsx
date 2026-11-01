import { useLayoutEffect, useRef, useState } from 'react';
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
    nav: {
      studio: 'Studio',
      program: 'Program',
      timetable: 'Timetable',
      login: 'Sign In',
      register: 'Get Started',
    },
    hero: {
      tag: 'LUMA · GREEN SCHEDULE & FOCUS STUDIO',
      titleLine1: 'One experience.',
      titleLine2: 'Built around you.',
      subtitle:
        'Design your daily study routine around general active timeframes with full custom slot control. Integrated timetable and deep focus sessions.',
      ctaPrimary: 'Sign In to Workspace',
      ctaSecondary: 'Create Free Account',
    },
    showcase: {
      tabStudio: 'Deep Focus Studio',
      tabProgram: 'Program & Schedule Grid',
      focusTitle: 'Deep Focus',
      focusSubtitle: '01 · Reset & Ground',
      focusActiveTag: 'Active Session · 20 min',
      programTitle: 'Schedule Mix',
      programSubtitle: 'Automated + Custom Slots',
      stat1: 'Active Timeframe',
      stat1Val: '08:00 – 17:00',
      stat2: 'Custom Slots',
      stat2Val: '100% Configurable',
      stat3: 'Timetable Sync',
      stat3Val: 'Zero Overlap',
    },
    features: {
      headerTag: 'SMART SCHEDULE ARCHITECTURE',
      headerTitle: 'A clean workflow for university life.',
      card1Title: 'Active Timeframe Structuring',
      card1Desc:
        'Organize lecture periods, lab hours, and deep work intervals around your peak daily activity hours.',
      card2Title: '1-Tap .ICS Timetable Sync',
      card2Desc:
        'Upload your university or Google Calendar file. Automatically formats class codes, locations, and timings with zero duplicates.',
      card3Title: 'Distraction-Free Focus Studio',
      card3Desc:
        'A dedicated deep focus player with ambient soundscapes and visual cues for optimal productivity.',
    },
    finale: {
      title: 'Ready to elevate your study routine?',
      subtitle: 'Experience the clean green interface designed for focus and seamless scheduling.',
      ctaLogin: 'Sign In',
      ctaRegister: 'Start Free',
    },
  },
  vi: {
    nav: {
      studio: 'Không gian',
      program: 'Chương trình',
      timetable: 'Thời khóa biểu',
      login: 'Đăng nhập',
      register: 'Bắt đầu',
    },
    hero: {
      tag: 'LUMA · KHÔNG GIAN LỊCH TRÌNH & TẬP TRUNG',
      titleLine1: 'Một trải nghiệm.',
      titleLine2: 'Xoay quanh nhịp của bạn.',
      subtitle:
        'Thiết kế lịch trình học tập theo khung giờ hoạt động chung và linh hoạt tùy biến riêng. Tích hợp thời khóa biểu và phòng tập trung sâu.',
      ctaPrimary: 'Đăng nhập Không gian',
      ctaSecondary: 'Tạo tài khoản miễn phí',
    },
    showcase: {
      tabStudio: 'Không gian Tập trung Sâu',
      tabProgram: 'Khung Lịch trình & Chương trình',
      focusTitle: 'Tập trung sâu',
      focusSubtitle: '01 · Tái tạo & Nền tảng',
      focusActiveTag: 'Phiên đang chạy · 20 phút',
      programTitle: 'Bộ khung Thời gian',
      programSubtitle: 'Tự động + Tùy biến riêng',
      stat1: 'Khung giờ hoạt động',
      stat1Val: '08:00 – 17:00',
      stat2: 'Tùy chỉnh riêng',
      stat2Val: 'Linh hoạt 100%',
      stat3: 'Đồng bộ Thời khóa biểu',
      stat3Val: 'Không trùng giờ',
    },
    features: {
      headerTag: 'KIẾN TRÚC LỊCH TRÌNH TINH GỌN',
      headerTitle: 'Quy trình học tập khoa học cho sinh viên.',
      card1Title: 'Quy hoạch Khung giờ Hoạt động',
      card1Desc:
        'Sắp xếp ca học trên giảng đường, giờ làm đồ án và khung tập trung dựa trên thói quen hoạt động thực tế trong ngày.',
      card2Title: 'Đồng bộ .ICS Trong 1 Chạm',
      card2Desc:
        'Kéo thả file lịch từ Google Calendar hoặc cổng đào tạo. Tự động bóc tách mã môn, phòng học mà không bị trùng lắp.',
      card3Title: 'Không gian Tập trung Tĩnh lặng',
      card3Desc:
        'Đồng hồ tập trung tối giản với âm thanh nền tự nhiên giúp bạn duy trì trạng thái Deep Work hiệu quả.',
    },
    finale: {
      title: 'Sẵn sàng nâng tầm lịch trình học tập?',
      subtitle: 'Trải nghiệm giao diện Green tinh giản, hiện đại và chuẩn mực.',
      ctaLogin: 'Đăng nhập',
      ctaRegister: 'Bắt đầu miễn phí',
    },
  },
};

export function HomePage() {
  const { lang } = useLanguage();
  const t = HOME_COPY[lang] || HOME_COPY.en;

  const rootRef = useRef(null);
  const [activeTab, setActiveTab] = useState('studio');

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.home-hero-badge',
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.home-hero-title',
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.home-hero-desc',
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        )
        .fromTo(
          '.home-hero-cta',
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        )
        .fromTo(
          '.home-showcase-stage',
          { scale: 0.95, y: 32, autoAlpha: 0 },
          { scale: 1, y: 0, autoAlpha: 1, duration: 0.75, ease: 'power2.out', clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        );

      // Continuous breathing animation for glowing centerpiece
      gsap.to('.hero-glowing-lotus', {
        scale: 1.06,
        rotation: 4,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Scroll reveals
      gsap.utils.toArray('.home-scroll-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.55,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-black text-text selection:bg-primary selection:text-black overflow-x-hidden font-sans">
      {/* Top Navbar matching Image 1 & 4 */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/5 bg-black/85 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white">
            <LotusIcon className="h-5 w-5" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white">Luma</span>
        </Link>

        {/* Center Floating Pill Navigation */}
        <nav className="floating-pill-nav hidden sm:flex items-center rounded-full px-2 py-1 gap-1">
          <a href="#showcase" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-white transition-colors">
            {t.nav.studio}
          </a>
          <a href="#features" className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted hover:text-white transition-colors">
            {t.nav.program}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white hover:border-primary/50 transition-colors"
          >
            {t.nav.login}
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-black hover:bg-primary transition-colors"
          >
            {t.nav.register}
          </Link>
        </div>
      </header>

      <main className="space-y-24 sm:space-y-32 pb-24">
        {/* HERO SECTION: Urbanist Typography & Glowing Accent 01 */}
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-8 sm:pt-20 text-center">
          <div className="home-hero-badge inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent-deep/60 px-4 py-1 text-xs font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>{t.hero.tag}</span>
          </div>

          <h1 className="home-hero-title mx-auto mt-6 max-w-4xl text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-white leading-[1.04]">
            {t.hero.titleLine1}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-deep via-primary to-white">
              {t.hero.titleLine2}
            </span>
          </h1>

          <p className="home-hero-desc mx-auto mt-6 max-w-2xl text-base sm:text-[18px] text-muted leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="home-hero-cta mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-black shadow-lg hover:bg-primary transition-colors"
            >
              {t.hero.ctaPrimary} →
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:border-primary/50 transition-colors"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* MAIN SHOWCASE STAGE: Direct Faithful Mockup of Images 1, 3 & 4 */}
          <div id="showcase" className="home-showcase-stage relative mx-auto mt-14 max-w-5xl">
            {/* Top Showcase Switcher Tabs */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'studio'
                    ? 'bg-white text-black shadow-md'
                    : 'border border-white/10 bg-white/5 text-muted hover:text-white'
                }`}
              >
                {t.showcase.tabStudio}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'program'
                    ? 'bg-white text-black shadow-md'
                    : 'border border-white/10 bg-white/5 text-muted hover:text-white'
                }`}
              >
                {t.showcase.tabProgram}
              </button>
            </div>

            {/* Laptop Display Mockup Window */}
            <div className="relative rounded-[2.5rem] border border-white/15 bg-[#0a0d0a] p-3 sm:p-6 shadow-2xl luma-radiant-glow overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-white/20" />
                  <span className="h-3 w-3 rounded-full bg-white/20" />
                  <span className="h-3 w-3 rounded-full bg-white/20" />
                  <span className="ml-2 text-xs font-semibold text-muted">luma.studio · Urbanist Design</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Interactive Preview</span>
                </div>
              </div>

              {/* Tab 1 Content: Deep Focus Stage (Images 1 & 3) */}
              {activeTab === 'studio' ? (
                <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left mini widget */}
                  <div className="lg:col-span-3 space-y-3 text-left">
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                      <span className="text-xl">🧘</span>
                      <p className="text-xs font-bold text-white mt-1">Focus Posture</p>
                      <p className="text-[10px] text-muted">20m Grounding</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                      <p className="text-[10px] text-muted uppercase">Pace</p>
                      <p className="text-xl font-black text-white">58 bpm</p>
                    </div>
                  </div>

                  {/* Center glowing lotus */}
                  <div className="lg:col-span-6 flex flex-col items-center justify-center text-center py-4">
                    <div className="relative flex h-48 w-48 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-primary/25 blur-3xl scale-125" />
                      <svg
                        className="hero-glowing-lotus w-40 h-40 text-primary drop-shadow-[0_0_40px_rgba(219,239,144,0.6)]"
                        viewBox="0 0 200 200"
                        fill="currentColor"
                      >
                        <path d="M100 20 L138 68 L185 85 L165 145 L100 178 L35 145 L15 85 L62 68 Z" />
                        <circle cx="100" cy="112" r="28" className="fill-black/40" />
                        <circle cx="100" cy="112" r="12" className="fill-primary" />
                      </svg>
                    </div>

                    <h2 className="text-3xl font-black text-white mt-2">{t.showcase.focusTitle}</h2>
                    <p className="text-xs font-semibold text-muted">{t.showcase.focusSubtitle}</p>

                    {/* Scrubber */}
                    <div className="w-56 mt-4 space-y-1">
                      <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-2/5 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted">
                        <span>02:13</span>
                        <span>20:00</span>
                      </div>
                    </div>
                  </div>

                  {/* Right sessions list */}
                  <div className="lg:col-span-3 space-y-2 text-left">
                    <p className="text-xs font-bold text-white mb-2">Your Practice</p>
                    <div className="rounded-xl border border-primary/50 bg-accent-deep/70 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">01 · Reset</p>
                        <p className="text-[10px] text-primary">20 min</p>
                      </div>
                      <span className="text-[10px] font-mono text-primary font-bold">01 : : :</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 flex items-center justify-between text-xs text-muted">
                      <div>
                        <p className="font-bold text-text">02 · Breath</p>
                        <p className="text-[10px]">15 min</p>
                      </div>
                      <span className="text-[10px] font-mono">02</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2 Content: Program Grid (Image 4) */
                <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-left">
                  {/* Left Column Mix */}
                  <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{t.showcase.programTitle}</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <span className="rounded-lg bg-white text-black py-1 px-2 text-center font-bold">Study</span>
                      <span className="rounded-lg border border-white/10 bg-white/5 py-1 px-2 text-center text-muted">Lab</span>
                      <span className="rounded-lg border border-white/10 bg-white/5 py-1 px-2 text-center text-muted">Lecture</span>
                      <span className="rounded-lg border border-white/10 bg-white/5 py-1 px-2 text-center text-muted">Revision</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-[11px] space-y-1.5 text-muted">
                      <div className="flex justify-between"><span>Session</span><span className="text-white font-bold">25 min</span></div>
                      <div className="flex justify-between"><span>Ratio</span><span className="text-white font-bold">70 / 30</span></div>
                    </div>
                  </div>

                  {/* Middle Column Active Cards */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="flex justify-between text-xs font-bold text-muted">
                      <span>01 · Reset & Ground</span>
                      <span className="text-primary">Active now</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl border border-primary/40 bg-accent-deep/60 p-3 aspect-square flex flex-col justify-between">
                        <span className="text-xs font-bold text-white">Morning Reset</span>
                        <span className="text-2xl text-center">🌱</span>
                        <span className="text-[10px] font-mono font-bold text-primary">2 / 5</span>
                      </div>
                      <div className="rounded-2xl border border-primary/40 bg-accent-deep/60 p-3 aspect-square flex flex-col justify-between">
                        <span className="text-xs font-bold text-white">Deep Focus</span>
                        <span className="text-2xl text-center">✨</span>
                        <span className="text-[10px] font-mono font-bold text-primary">0 / 5</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Weekly Gauge */}
                  <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/60 p-4 text-center">
                    <p className="text-[11px] font-bold text-muted uppercase">Weekly Practice</p>
                    <p className="text-2xl font-black text-white mt-2">3.8 / week</p>
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <Link to="/login" className="inline-block rounded-full bg-white text-black py-1.5 px-4 text-xs font-bold hover:bg-primary transition-colors">
                        Explore Full →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: 3 PILLARS ARCHITECTURE (ZERO BIO/APPLE JARGON) */}
        <section id="features" className="home-scroll-reveal mx-auto max-w-6xl px-4 sm:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {t.features.headerTag}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t.features.headerTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-white/10 bg-[#0d120d] p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl">⏱️</span>
                <h3 className="text-lg font-bold text-white mt-4">{t.features.card1Title}</h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">{t.features.card1Desc}</p>
              </div>
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between text-xs text-primary font-bold">
                <span>08:00 – 17:00</span>
                <span>Active Window</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d120d] p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl">📅</span>
                <h3 className="text-lg font-bold text-white mt-4">{t.features.card2Title}</h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">{t.features.card2Desc}</p>
              </div>
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between text-xs text-primary font-bold">
                <span>.ICS Calendar Format</span>
                <span>Auto-Parse</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d120d] p-7 flex flex-col justify-between">
              <div>
                <span className="text-3xl">🌱</span>
                <h3 className="text-lg font-bold text-white mt-4">{t.features.card3Title}</h3>
                <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed">{t.features.card3Desc}</p>
              </div>
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between text-xs text-primary font-bold">
                <span>Full Focus Studio</span>
                <span>Urbanist UI</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FINALE CTA */}
        <section className="home-scroll-reveal mx-auto max-w-4xl px-4 sm:px-8">
          <div
            className="rounded-[2.5rem] p-8 sm:p-14 text-center space-y-6 border border-primary/30"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(219, 239, 144, 0.25) 0%, rgba(13, 18, 13, 0.98) 75%)',
            }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black text-xl shadow-lg">
              <LotusIcon className="h-6 w-6" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-xl mx-auto">
              {t.finale.title}
            </h2>

            <p className="text-sm sm:text-base text-muted max-w-lg mx-auto">
              {t.finale.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/login"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-black shadow-lg hover:bg-primary transition-colors"
              >
                {t.finale.ctaLogin} →
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white hover:border-primary/50 transition-colors"
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
