import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';

const FOCUS_COPY = {
  en: {
    back: 'Back to Overview',
    studioTag: 'STUDENT FOCUS STUDIO',
    title: 'Deep Focus',
    subtitle: '01 · MSIS207 - API Endpoint Architecture',
    practiceHeader: 'Study Sprints',
    metricLabel: 'Focus Flow Rate',
    metricValue: '92% Flow',
    metricStreak: '4x Sprint Streak',
    activeCourseTag: 'ACTIVE STUDY SPRINT',
    activeCourseTitle: 'MSIS207 · Web App Dev',
    activeCourseDesc: 'Lab Practical 4 · REST APIs',
    intervalLabel: '25m Pomodoro',
    soundLibrary: 'Library Silence',
    soundRain: 'Gentle Rain',
    soundCafe: 'Campus Cafe',
    viewOverview: 'View Overview Dashboard →',
    viewTimetable: 'View Timetable Schedule →',
    sessions: [
      { id: '01', title: 'MSIS207 · API Architecture', duration: '25 min', active: true, tag: '01 : : : : : : : :' },
      { id: '02', title: 'CS5433 · 2PC Distributed DB', duration: '25 min', active: false, tag: '02' },
      { id: '03', title: 'STAT3013 · Hypothesis Testing', duration: '20 min', active: false, tag: '03' },
      { id: '04', title: 'MATH201 · Discrete Logic', duration: '25 min', active: false, tag: '04' },
      { id: '05', title: 'Campus Break · Coffee Walk', duration: '10 min', active: false, tag: '05' },
    ],
  },
  vi: {
    back: 'Về Tổng quan',
    studioTag: 'STUDIO TẬP TRUNG HỌC TẬP',
    title: 'Tập trung sâu',
    subtitle: '01 · MSIS207 - Thiết kế API Endpoints',
    practiceHeader: 'Lộ trình phiên học',
    metricLabel: 'Tốc độ tập trung',
    metricValue: '92% Flow',
    metricStreak: 'Chuỗi 4 phiên liên tục',
    activeCourseTag: 'PHIÊN HỌC ĐANG CHẠY',
    activeCourseTitle: 'MSIS207 · Phát triển Web',
    activeCourseDesc: 'Thực hành Lab 4 · REST APIs',
    intervalLabel: 'Pomodoro 25 phút',
    soundLibrary: 'Thư viện tĩnh lặng',
    soundRain: 'Mưa êm dịu',
    soundCafe: 'Cafe học bài',
    viewOverview: 'Xem Bảng Tổng quan →',
    viewTimetable: 'Xem Thời khóa biểu →',
    sessions: [
      { id: '01', title: 'MSIS207 · Thiết kế API', duration: '25 phút', active: true, tag: '01 : : : : : : : :' },
      { id: '02', title: 'CS5433 · CSDL Phân tán 2PC', duration: '25 phút', active: false, tag: '02' },
      { id: '03', title: 'STAT3013 · Kiểm định giả thuyết', duration: '20 phút', active: false, tag: '03' },
      { id: '04', title: 'MATH201 · Logic & Rời rạc', duration: '25 phút', active: false, tag: '04' },
      { id: '05', title: 'Nghỉ giải lao · Dạo trường & Cafe', duration: '10 phút', active: false, tag: '05' },
    ],
  },
};

// Glowing 5-pointed organic radiant shield matching Behance reference style
function RadiantShield({ className = '', glow = true }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-125 animate-pulse pointer-events-none" />
      )}
      <svg
        className="w-full h-full text-primary drop-shadow-[0_0_35px_rgba(138,203,30,0.4)] dark:drop-shadow-[0_0_40px_rgba(219,239,144,0.45)]"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M100 20 L138 68 L185 85 L165 145 L100 178 L35 145 L15 85 L62 68 Z" />
        <circle cx="100" cy="112" r="32" className="fill-bg/40 dark:fill-black/45" />
        <circle cx="100" cy="112" r="14" className="fill-primary" />
      </svg>
    </div>
  );
}

export function DeepFocusPage() {
  const { lang } = useLanguage();
  const t = FOCUS_COPY[lang] || FOCUS_COPY.en;
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSeconds, setCurrentSeconds] = useState(133); // 02:13
  const [totalSeconds] = useState(1500); // 25:00 standard Pomodoro
  const [activeSession, setActiveSession] = useState('01');

  // Pomodoro timer tick
  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = window.setInterval(() => {
      setCurrentSeconds((s) => (s < totalSeconds ? s + 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, totalSeconds]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, (currentSeconds / totalSeconds) * 100);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.center-radiant-stage',
        { scale: 0.94, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.55, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.left-widget-card',
          { x: -20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        )
        .fromTo(
          '.right-session-card',
          { x: 20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.05, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        );

      // Subtle breathing ambient animation
      gsap.to('.radiant-lotus-aura', {
        scale: 1.04,
        rotation: 3,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[calc(100vh-65px)] bg-bg text-text px-4 sm:px-8 py-6 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Bar: Back to Overview & Studio Tag */}
      <div className="flex items-center justify-between z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted hover:text-text hover:border-primary/50 transition-colors shadow-xs"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs">
            ‹
          </span>
          <span>{t.back}</span>
        </button>

        <span className="text-xs font-bold tracking-wider uppercase text-primary">
          {t.studioTag}
        </span>
      </div>

      {/* Main Grid: Left Academic Widgets | Center Glowing Lotus Stage | Right Study Sprints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-4 z-10">
        {/* Left Academic Widgets: Active Course Session + Focus Flow Speedometer */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3 lg:order-1">
          {/* Active Course Session Card */}
          <div className="left-widget-card glass-card rounded-3xl p-5 relative overflow-hidden shadow-xl group">
            <div className="flex items-center justify-between mb-3">
              <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary uppercase">
                {t.activeCourseTag}
              </span>
              <span className="text-xs text-muted">💻</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-text">{t.activeCourseTitle}</h3>
              <p className="text-xs text-muted">{t.activeCourseDesc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-semibold text-muted">
              <span>{t.intervalLabel}</span>
              <span className="text-primary font-bold">Chapter 4</span>
            </div>
          </div>

          {/* Focus Flow Rate & Rhythm Card (Replacing Heart Rate) */}
          <div className="left-widget-card glass-card rounded-3xl p-5 flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.metricLabel}</p>
              <p className="text-2xl font-black text-text tracking-tight">{t.metricValue}</p>
              <p className="text-[11px] font-semibold text-primary">{t.metricStreak}</p>

              {/* Focus Alpha Waves Audio Spectrum Visualization */}
              <div className="pt-2 flex items-center gap-1 text-primary">
                <svg className="h-5 w-32 text-primary" viewBox="0 0 120 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M0 12 L15 12 L22 4 L30 20 L38 8 L46 16 L54 12 L68 12 L75 6 L82 18 L90 12 L120 12" />
                </svg>
              </div>
            </div>

            {/* Smart Focus Sprint Badge */}
            <div className="h-14 w-14 rounded-2xl border border-primary/40 bg-surface-2 flex flex-col items-center justify-center shadow-md shrink-0">
              <span className="text-base animate-pulse">⚡</span>
              <span className="text-[9px] font-extrabold text-primary mt-0.5">25m</span>
            </div>
          </div>
        </div>

        {/* Center Stage: Radiant Organic Green Shield & Media Player Controls */}
        <div className="center-radiant-stage lg:col-span-6 flex flex-col items-center justify-center text-center order-1 lg:order-2">
          {/* Radiant Lotus Core */}
          <div className="relative flex h-60 sm:h-72 w-60 sm:w-72 items-center justify-center">
            <RadiantShield className="radiant-lotus-aura w-52 sm:w-64 h-52 sm:h-64" glow={true} />
          </div>

          {/* Deep Focus Title (Urbanist H1 46px font-extrabold) */}
          <div className="mt-4 space-y-1">
            <h1 className="text-4xl sm:text-[46px] font-extrabold tracking-tight text-text leading-tight">
              {t.title}
            </h1>
            <p className="text-sm font-semibold text-muted">
              {t.subtitle}
            </p>
          </div>

          {/* Pomodoro Timeline Scrubber */}
          <div className="w-full max-w-sm mt-6 space-y-1.5">
            <div className="relative h-2 w-full rounded-full bg-surface-2 border border-border overflow-hidden cursor-pointer">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-muted px-0.5">
              <span>{formatTime(currentSeconds)}</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>

          {/* Media Player Controls */}
          <div className="flex items-center gap-4 mt-5">
            {/* Ambient Sound Mode button */}
            <button
              type="button"
              title="Ambient Soundscape"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 transition-colors shadow-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-text text-bg dark:bg-white dark:text-black shadow-xl luma-radiant-glow hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Reset Pomodoro Interval button */}
            <button
              type="button"
              title="Reset Pomodoro"
              onClick={() => setCurrentSeconds(0)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 transition-colors shadow-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Side: Study Sprints Progression List */}
        <div className="lg:col-span-3 flex flex-col order-2 lg:order-3">
          <h2 className="text-base font-extrabold text-text mb-4">
            {t.practiceHeader}
          </h2>

          <div className="relative flex flex-col gap-3">
            {/* Vertical dotted guide line */}
            <div className="absolute left-[34px] top-6 bottom-6 w-px border-l border-dashed border-border pointer-events-none" />

            {t.sessions.map((session) => {
              const isSelected = activeSession === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`right-session-card cursor-pointer rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all duration-200 ${
                    isSelected
                      ? 'border-primary/60 bg-gradient-to-r from-accent-deep/90 to-[#1b2500] text-white shadow-lg'
                      : 'glass-card text-muted hover:border-primary/40 hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isSelected
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-surface-2 text-muted'
                      }`}
                    >
                      <RadiantShield className="w-5 h-5" glow={isSelected} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-text'}`}>
                        {session.title}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted'}`}>
                        {session.duration}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-primary' : 'text-muted'}`}>
                    {session.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info & Quick Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted pt-3 border-t border-border gap-2 z-10">
        <span>SFSH Focus Studio · Urbanist Typography</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-primary hover:underline font-bold"
          >
            {t.viewOverview}
          </button>
          <button
            type="button"
            onClick={() => navigate('/timetable')}
            className="text-primary hover:underline font-bold"
          >
            {t.viewTimetable}
          </button>
        </div>
      </div>
    </div>
  );
}
