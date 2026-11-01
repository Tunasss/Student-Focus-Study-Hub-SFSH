import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';

const FOCUS_COPY = {
  en: {
    back: 'Back',
    title: 'Deep Focus',
    subtitle: '01 · Reset & Ground',
    practiceHeader: 'Your Practice',
    heartLabel: 'Heart rate',
    heartValue: '58 bpm',
    sessions: [
      { id: '01', title: 'Reset & Ground', duration: '20 min', active: true, tag: '01 : : : : : : : :' },
      { id: '02', title: 'Breath & Release', duration: '15 min', active: false, tag: '02' },
      { id: '03', title: 'Inner Balance', duration: '22 min', active: false, tag: '03' },
      { id: '04', title: 'Body Awareness', duration: '24 min', active: false, tag: '04' },
      { id: '05', title: 'Deep Recovery', duration: '30 min', active: false, tag: '05' },
    ],
  },
  vi: {
    back: 'Quay lại',
    title: 'Tập trung sâu',
    subtitle: '01 · Tái tạo & Nền tảng',
    practiceHeader: 'Lộ trình luyện tập',
    heartLabel: 'Nhịp tim',
    heartValue: '58 bpm',
    sessions: [
      { id: '01', title: 'Tái tạo & Nền tảng', duration: '20 phút', active: true, tag: '01 : : : : : : : :' },
      { id: '02', title: 'Hít thở & Giải phóng', duration: '15 phút', active: false, tag: '02' },
      { id: '03', title: 'Cân bằng Nội tại', duration: '22 phút', active: false, tag: '03' },
      { id: '04', title: 'Nhận thức Thân tâm', duration: '24 phút', active: false, tag: '04' },
      { id: '05', title: 'Hồi phục Sâu', duration: '30 phút', active: false, tag: '05' },
    ],
  },
};

// Glowing lotus polygon shape from Image 1 & 3
function RadiantShield({ className = '', glow = true }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-150 animate-pulse pointer-events-none" />
      )}
      <svg
        className="w-full h-full text-primary drop-shadow-[0_0_40px_rgba(219,239,144,0.45)]"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        {/* Modern 5-pointed organic lotus shield from Image 1 & 3 */}
        <path d="M100 20 L138 68 L185 85 L165 145 L100 178 L35 145 L15 85 L62 68 Z" />
        <circle cx="100" cy="112" r="32" className="fill-black/35" />
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
  const [totalSeconds] = useState(1200); // 20:00
  const [activeSession, setActiveSession] = useState('01');

  // Timer tick
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

  const progressPercent = (currentSeconds / totalSeconds) * 100;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.center-radiant-stage',
        { scale: 0.92, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.65, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.left-widget-card',
          { x: -24, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.4'
        )
        .fromTo(
          '.right-session-card',
          { x: 24, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.06, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.4'
        );

      // Continuous breathing animation for radiant shield
      gsap.to('.radiant-lotus-aura', {
        scale: 1.05,
        rotation: 4,
        duration: 4.5,
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
      className="relative min-h-[calc(100vh-65px)] bg-black text-text px-4 sm:px-8 py-6 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Bar: Back Button */}
      <div className="flex items-center justify-between z-20">
        <button
          type="button"
          onClick={() => navigate('/program')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-muted hover:text-white hover:border-primary/40 transition-colors"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs">
            ‹
          </span>
          <span>{t.back}</span>
        </button>

        <span className="text-xs font-semibold tracking-wider uppercase text-muted">
          STUDENT PRACTICE STUDIO
        </span>
      </div>

      {/* Main Grid: Left Widgets | Center Glowing Lotus Stage | Right Session Path */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-4 z-10">
        {/* Left Bottom Widgets matching Image 1 & 3 */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3 lg:order-1">
          {/* Top Video Thumbnail Card */}
          <div className="left-widget-card relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d120d] p-3 aspect-[16/10] flex items-center justify-center group shadow-xl">
            {/* Minimalist monochrome focus visual silhouette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
            <div className="relative z-20 flex flex-col items-center justify-center text-center p-3">
              <span className="text-2xl mb-1">🧘</span>
              <p className="text-xs font-bold text-white tracking-wide">Flow Posture</p>
              <p className="text-[10px] text-muted">Active Routine · 20m</p>
            </div>
            {/* Expand icon top right */}
            <button
              type="button"
              className="absolute top-3 right-3 z-20 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white hover:bg-white/20 transition-colors"
            >
              ⤢
            </button>
          </div>

          {/* Bottom Heart Rate / Activity Pulse Card */}
          <div className="left-widget-card rounded-3xl border border-white/10 bg-[#0d120d] p-4 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[11px] font-semibold text-muted">{t.heartLabel}</p>
              <p className="text-2xl font-black text-white tracking-tight mt-0.5">{t.heartValue}</p>
              {/* ECG Pulse wave line */}
              <div className="mt-2 flex items-center gap-1 text-primary">
                <svg className="h-4 w-28 text-primary" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M0 10 L30 10 L38 2 L45 18 L52 8 L60 10 L100 10" />
                </svg>
              </div>
            </div>

            {/* Smart wearable mockup with glowing lime heart */}
            <div className="h-14 w-12 rounded-2xl border-2 border-primary/50 bg-black flex flex-col items-center justify-center shadow-lg">
              <span className="text-sm animate-pulse">💚</span>
              <span className="text-[8px] font-bold text-primary mt-0.5">58</span>
            </div>
          </div>
        </div>

        {/* Center Stage: Huge Ambient Radiant Green Lotus & Player Controls matching Image 1 & 3 */}
        <div className="center-radiant-stage lg:col-span-6 flex flex-col items-center justify-center text-center order-1 lg:order-2">
          {/* Radiant Lotus Core */}
          <div className="relative flex h-64 sm:h-72 w-64 sm:w-72 items-center justify-center">
            <RadiantShield className="radiant-lotus-aura w-56 sm:w-64 h-56 sm:h-64" glow={true} />
          </div>

          {/* Deep Focus Title (Urbanist H1 46px font-extrabold) */}
          <div className="mt-4 space-y-1">
            <h1 className="text-4xl sm:text-[46px] font-extrabold tracking-tight text-white leading-tight">
              {t.title}
            </h1>
            <p className="text-sm font-semibold text-muted">
              {t.subtitle}
            </p>
          </div>

          {/* Audio Scrubber Timeline Bar */}
          <div className="w-full max-w-sm mt-6 space-y-1.5">
            <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden cursor-pointer">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-muted">
              <span>{formatTime(currentSeconds)}</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>

          {/* Media Player Controls */}
          <div className="flex items-center gap-4 mt-5">
            {/* Volume / Sound button */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
              </svg>
            </button>

            {/* Big Circular Play/Pause Button with Glowing Border */}
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-xl luma-radiant-glow hover:scale-105 active:scale-95 transition-transform"
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

            {/* Timer / Loop button */}
            <button
              type="button"
              onClick={() => setCurrentSeconds(0)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Side: "Your Practice" Progression List matching Image 1 & 3 */}
        <div className="lg:col-span-3 flex flex-col order-2 lg:order-3">
          <h2 className="text-base font-extrabold text-white mb-4">
            {t.practiceHeader}
          </h2>

          <div className="relative flex flex-col gap-3">
            {/* Vertical dotted guide line */}
            <div className="absolute left-[38px] top-6 bottom-6 w-px border-l border-dashed border-white/20 pointer-events-none" />

            {t.sessions.map((session) => {
              const isSelected = activeSession === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`right-session-card cursor-pointer rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all duration-200 ${
                    isSelected
                      ? 'border-primary/60 bg-gradient-to-r from-accent-deep/80 to-[#1b2500] text-white shadow-lg'
                      : 'border-white/10 bg-[#0d120d] text-muted hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                        isSelected
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-white/10 bg-white/5 text-muted'
                      }`}
                    >
                      <RadiantShield className="w-6 h-6" glow={isSelected} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-text'}`}>
                        {session.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{session.duration}</p>
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

      {/* Footer Info Pill */}
      <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-white/5 z-10">
        <span>Urbanist Typography · Pitch Black #000000</span>
        <button
          type="button"
          onClick={() => navigate('/program')}
          className="text-primary hover:underline font-bold"
        >
          View Program Grid →
        </button>
      </div>
    </div>
  );
}
