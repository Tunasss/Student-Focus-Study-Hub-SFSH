import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';

const PROGRAM_COPY = {
  en: {
    pageTitle: 'Program',
    practiceMix: 'Practice mix',
    mixPills: ['Meditation', 'Body scan', 'Breathwork', 'Yoga'],
    useDataToggle: 'Use schedule data',
    autoAdjustToggle: 'Adjust sessions automatically',
    sessionLength: 'Session length',
    focusRatio: 'Lecture / Lab ratio',
    priorityFocus: 'Priority focus',
    intensity: 'Intensity',
    intensityValue: 'Balanced',
    generateBtn: '+ Generate program',
    cat1Label: '01 · Reset & Ground',
    activeNow: 'Active now',
    cat2Label: '02 · Focus & Balance',
    openSoon: 'Open soon',
    weeklyPractice: 'Weekly practice',
    practiceRhythm: 'Practice Rhythm',
    weeklyScore: '3.8 / week',
    readyRecharge: 'Ready to recharge?',
    startRecovery: 'Start Recovery',
    lockedCards: [
      { name: 'Body Awareness', time: '15 min' },
      { name: 'Inner Balance', time: '20 min' },
      { name: 'Deep Recovery', time: '25 min' },
      { name: 'Calm Mind', time: '15 min' },
      { name: 'Breath & Release', time: '20 min' },
      { name: 'Restful Sleep', time: '30 min' },
    ],
  },
  vi: {
    pageTitle: 'Chương trình',
    practiceMix: 'Bộ môn thực hành',
    mixPills: ['Thiền định', 'Quét thân', 'Hơi thở', 'Yoga'],
    useDataToggle: 'Dùng dữ liệu lịch học',
    autoAdjustToggle: 'Tự động điều chỉnh phiên',
    sessionLength: 'Thời lượng phiên',
    focusRatio: 'Tỷ lệ Lý thuyết / Thực hành',
    priorityFocus: 'Mức độ ưu tiên',
    intensity: 'Cường độ',
    intensityValue: 'Cân bằng',
    generateBtn: '+ Khởi tạo chương trình',
    cat1Label: '01 · Tái tạo & Nền tảng',
    activeNow: 'Đang hoạt động',
    cat2Label: '02 · Tập trung & Cân bằng',
    openSoon: 'Sắp mở',
    weeklyPractice: 'Thực hành tuần',
    practiceRhythm: 'Nhịp thực hành',
    weeklyScore: '3.8 / tuần',
    readyRecharge: 'Sẵn sàng nạp năng lượng?',
    startRecovery: 'Bắt đầu Hồi phục',
    lockedCards: [
      { name: 'Nhận thức Thân tâm', time: '15 phút' },
      { name: 'Cân bằng Nội tại', time: '20 phút' },
      { name: 'Hồi phục Sâu', time: '25 phút' },
      { name: 'Tâm trí Tĩnh lặng', time: '15 phút' },
      { name: 'Hít thở & Thư giãn', time: '20 phút' },
      { name: 'Giấc ngủ Trọn vẹn', time: '30 phút' },
    ],
  },
};

export function PlaceholderPage({ pageKey = 'overview', title = 'Program', description = 'Practice and schedule program.' }) {
  const { lang } = useLanguage();
  const t = PROGRAM_COPY[lang] || PROGRAM_COPY.en;
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [useData, setUseData] = useState(true);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [selectedMix, setSelectedMix] = useState(0);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.program-panel-left',
        { x: -20, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.program-panel-center',
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        )
        .fromTo(
          '.program-panel-right',
          { x: 20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        );
    }, containerRef);

    return () => ctx.revert();
  }, [pageKey]);

  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-65px)] bg-black text-text px-4 sm:px-8 py-6 space-y-6"
    >
      {/* Title Bar with Accessibility Heading for Tests */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-[46px] font-extrabold tracking-tight text-white leading-tight">
            {title || t.pageTitle}
          </h1>
          <p className="text-xs text-muted mt-1">{description}</p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-accent-deep/50 px-4 py-2 text-xs font-bold text-primary hover:bg-accent-deep transition-colors"
        >
          <span>Deep Focus Space</span>
          <span>→</span>
        </Link>
      </div>

      {/* Bento Grid Layout exactly matching Image 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Control & Configuration Panel */}
        <div className="program-panel-left lg:col-span-3 rounded-3xl border border-white/10 bg-[#0d120d] p-5 space-y-5 shadow-xl">
          {/* Practice Mix Section */}
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
              {t.practiceMix}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {t.mixPills.map((pill, idx) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setSelectedMix(idx)}
                  className={`rounded-xl py-2 px-3 text-xs font-semibold text-center transition-colors ${
                    selectedMix === idx
                      ? 'bg-white text-black font-bold'
                      : 'border border-white/10 bg-white/5 text-muted hover:text-white'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">{t.useDataToggle}</span>
              <button
                type="button"
                onClick={() => setUseData((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  useData ? 'bg-primary' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    useData ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">{t.autoAdjustToggle}</span>
              <button
                type="button"
                onClick={() => setAutoAdjust((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  autoAdjust ? 'bg-primary' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    autoAdjust ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.sessionLength}</span>
              <span className="font-bold text-white">15 min</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.focusRatio}</span>
              <span className="font-bold text-white">70 / 30</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.priorityFocus}</span>
              <span className="font-bold text-white">65%</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.intensity}</span>
              <span className="font-bold text-white">{t.intensityValue}</span>
            </div>
          </div>

          {/* Pill Generate Button */}
          <button
            type="button"
            className="w-full rounded-full bg-white py-3 px-4 text-xs font-extrabold text-black shadow-md hover:bg-primary transition-colors flex items-center justify-center gap-1.5"
          >
            {t.generateBtn}
          </button>
        </div>

        {/* MIDDLE COLUMN: Program Progression Cards */}
        <div className="program-panel-center lg:col-span-6 space-y-6">
          {/* Section 01: Active Now */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted tracking-wider uppercase">
                {t.cat1Label}
              </span>
              <span className="text-[11px] font-semibold text-primary">
                {t.activeNow}
              </span>
            </div>

            {/* 3 Radiant Green Cards from Image 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                { title: 'Morning Reset', step: '2 / 5', shape: 'M100 20 L150 80 L140 160 L60 160 L50 80 Z' },
                { title: 'Deep Focus', step: '0 / 5', shape: 'M100 20 L138 68 L185 85 L165 145 L100 178 L35 145 L15 85 L62 68 Z' },
                { title: 'Stress Release', step: '2 / 5', shape: 'M100 30 C150 60 170 120 140 160 C110 180 90 180 60 160 C30 120 50 60 100 30 Z' },
              ].map((card) => (
                <div
                  key={card.title}
                  onClick={() => navigate('/')}
                  className="cursor-pointer group relative overflow-hidden rounded-3xl border border-primary/30 p-4 aspect-[4/5] flex flex-col justify-between transition-all hover:scale-[1.02]"
                  style={{
                    background: 'radial-gradient(circle at 50% 60%, rgba(219, 239, 144, 0.45) 0%, rgba(36, 49, 0, 0.95) 75%)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{card.title}</span>
                    <span className="text-white/80 group-hover:translate-x-0.5 transition-transform">›</span>
                  </div>

                  {/* Center Glowing Shape Silhouette */}
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                    <svg className="w-full h-full text-primary drop-shadow-[0_0_20px_rgba(219,239,144,0.6)]" viewBox="0 0 200 200" fill="currentColor">
                      <path d={card.shape} />
                    </svg>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-white/90">{card.step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 02: Open Soon (Frosted Locked Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted tracking-wider uppercase">
                {t.cat2Label}
              </span>
              <span className="text-[11px] font-semibold text-muted">
                {t.openSoon}
              </span>
            </div>

            {/* 6 Dark Frosted Cards with Locks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {t.lockedCards.map((card) => (
                <div
                  key={card.name}
                  className="relative rounded-2xl border border-white/5 bg-[#0d120d] p-3.5 flex flex-col justify-between aspect-[1.1/1]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text truncate max-w-[100px]">{card.name}</span>
                    <span className="text-xs text-muted">🔒</span>
                  </div>

                  {/* Frosted silhouette preview */}
                  <div className="my-auto mx-auto flex h-10 w-10 items-center justify-center text-white/10">
                    <svg className="w-full h-full fill-current" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="30" />
                    </svg>
                  </div>

                  <span className="text-[10px] text-muted">{card.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Weekly Practice Speedometer & Smart Device Recharging */}
        <div className="program-panel-right lg:col-span-3 space-y-5">
          {/* Top Card: Weekly Practice Speedometer Dial */}
          <div className="rounded-3xl border border-white/10 bg-[#0d120d] p-5 shadow-xl">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t.weeklyPractice}
            </span>

            {/* Speedometer Gauge Dial Graphic */}
            <div className="relative my-4 flex flex-col items-center justify-center">
              <svg className="h-28 w-44" viewBox="0 0 200 120">
                {/* Background arc */}
                <path
                  d="M 20 110 A 80 80 0 0 1 180 110"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Active gradient arc */}
                <path
                  d="M 20 110 A 80 80 0 0 1 145 40"
                  fill="none"
                  stroke="#dbef90"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Needle */}
                <line x1="100" y1="110" x2="135" y2="50" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="110" r="5" fill="#ffffff" />
              </svg>

              <div className="text-center mt-1">
                <p className="text-[11px] font-semibold text-muted">{t.practiceRhythm}</p>
                <p className="text-2xl font-black text-white">{t.weeklyScore}</p>
              </div>
            </div>
          </div>

          {/* Bottom Card: Smart Device Recharging Widget */}
          <div className="rounded-3xl border border-white/10 bg-[#0d120d] p-5 space-y-4 shadow-xl">
            {/* Wearable display mock with green shield */}
            <div className="mx-auto flex h-24 w-20 flex-col items-center justify-center rounded-2xl border-2 border-primary/40 bg-black p-2 shadow-inner">
              <span className="text-2xl animate-pulse">🌿</span>
              <span className="text-[9px] font-bold text-primary mt-1">Ready</span>
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white">{t.readyRecharge}</p>
              <p className="text-xs text-muted">Begin today's scheduled recovery session.</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-primary hover:text-black hover:border-primary transition-colors"
            >
              {t.startRecovery}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
