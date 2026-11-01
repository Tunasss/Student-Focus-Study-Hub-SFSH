import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';

const OVERVIEW_COPY = {
  en: {
    pageTitle: 'Overview',
    description: 'Next study recommendations and schedule focus analytics at a glance.',
    studyMix: 'Study Mix & Filters',
    mixPills: ['Lecture', 'Lab Work', 'Self-Study', 'Revision'],
    autoSyncToggle: 'Auto-sync .ics timetable',
    autoAdjustToggle: 'Adaptive study intervals',
    pomoLength: 'Pomodoro length',
    studyBreakRatio: 'Study / Break ratio',
    priorityCourse: 'Priority course',
    intensity: 'Pacing',
    intensityValue: 'Balanced (25/5)',
    addCustomBtn: '+ Add Custom Study Slot',
    cat1Label: "01 · Today's Priority Classes",
    activeNow: 'Active semester',
    cat2Label: '02 · Enrolled Course Modules',
    allCourses: 'Semester 1 · 2026–2027',
    weeklyPace: 'Weekly Study Pace',
    weeklyHours: '24.5 hrs / week',
    nextClassTitle: 'Next Class Reminder',
    nextClassName: 'MSIS207 · Web App Dev',
    nextClassRoom: 'Room C206 • 13:00 – 16:15',
    openTimetable: 'Open Timetable →',
    activeClasses: [
      { code: 'MSIS207', title: 'Web App Development', time: '13:00 – 16:15', room: 'Room C206', shape: 'M100 20 L138 68 L185 85 L165 145 L100 178 L35 145 L15 85 L62 68 Z' },
      { code: 'CS5433', title: 'Distributed Databases', time: '13:00 – 17:00', room: 'Room B5.04', shape: 'M100 20 L150 80 L140 160 L60 160 L50 80 Z' },
      { code: 'STAT3013', title: 'Statistical Analysis', time: '07:30 – 11:30', room: 'Room B5.04', shape: 'M100 30 C150 60 170 120 140 160 C110 180 90 180 60 160 C30 120 50 60 100 30 Z' },
    ],
    otherCourses: [
      { code: 'MSIS4263', name: 'Decision Support Apps', credits: '3 Credits' },
      { code: 'MATH201', name: 'Calculus II', credits: '4 Credits' },
      { code: 'CS101', name: 'Data Structures Lab', credits: '3 Credits' },
      { code: 'ENG102', name: 'Academic English', credits: '2 Credits' },
      { code: 'PE231', name: 'Physical Education 1', credits: '1 Credit' },
      { code: 'PROJ202', name: 'Capstone Project', credits: '3 Credits' },
    ],
  },
  vi: {
    pageTitle: 'Tổng quan',
    description: 'Gợi ý học tiếp theo và thống kê thời gian tập trung sẽ hiển thị ở đây.',
    studyMix: 'Bộ lọc & Khung học tập',
    mixPills: ['Lý thuyết', 'Thực hành', 'Tự học', 'Ôn tập'],
    autoSyncToggle: 'Tự động đồng bộ lịch .ics',
    autoAdjustToggle: 'Tối ưu phiên tập trung',
    pomoLength: 'Thời lượng Pomodoro',
    studyBreakRatio: 'Tỷ lệ Học / Nghỉ',
    priorityCourse: 'Môn ưu tiên',
    intensity: 'Nhịp độ',
    intensityValue: 'Cân bằng (25/5)',
    addCustomBtn: '+ Thêm khung giờ tự chọn',
    cat1Label: '01 · Ca học hôm nay',
    activeNow: 'Học kỳ hiện tại',
    cat2Label: '02 · Các học phần đã đăng ký',
    allCourses: 'Học kỳ 1 · 2026–2027',
    weeklyPace: 'Nhịp học tập tuần',
    weeklyHours: '24.5 giờ / tuần',
    nextClassTitle: 'Ca học kế tiếp',
    nextClassName: 'MSIS207 · Phát triển web',
    nextClassRoom: 'Phòng C206 • 13:00 – 16:15',
    openTimetable: 'Xem Thời khóa biểu →',
    activeClasses: [
      { code: 'MSIS207', title: 'Phát triển ứng dụng web', time: '13:00 – 16:15', room: 'Phòng C206', shape: 'M100 20 L138 68 L185 85 L165 145 L100 178 L35 145 L15 85 L62 68 Z' },
      { code: 'CS5433', title: 'Các hệ CSDL phân tán', time: '13:00 – 17:00', room: 'Phòng B5.04', shape: 'M100 20 L150 80 L140 160 L60 160 L50 80 Z' },
      { code: 'STAT3013', title: 'Phân tích thống kê', time: '07:30 – 11:30', room: 'Phòng B5.04', shape: 'M100 30 C150 60 170 120 140 160 C110 180 90 180 60 160 C30 120 50 60 100 30 Z' },
    ],
    otherCourses: [
      { code: 'MSIS4263', name: 'Ứng dụng thông minh', credits: '3 Tín chỉ' },
      { code: 'MATH201', name: 'Toán rời rạc & Giải tích', credits: '4 Tín chỉ' },
      { code: 'CS101', name: 'Thực hành Cấu trúc DL', credits: '3 Tín chỉ' },
      { code: 'ENG102', name: 'Tiếng Anh học thuật', credits: '2 Tín chỉ' },
      { code: 'PE231', name: 'Giáo dục thể chất 1', credits: '1 Tín chỉ' },
      { code: 'PROJ202', name: 'Đồ án cơ sở ngành', credits: '3 Tín chỉ' },
    ],
  },
};

export function PlaceholderPage({ pageKey = 'overview', title = 'Overview', description = 'Study Hub overview and scheduling.' }) {
  const { lang } = useLanguage();
  const t = OVERVIEW_COPY[lang] || OVERVIEW_COPY.en;
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [autoSync, setAutoSync] = useState(true);
  const [adaptivePomo, setAdaptivePomo] = useState(true);
  const [selectedMix, setSelectedMix] = useState(0);

  const isOverview = pageKey === 'overview' || title === 'Overview' || title === 'Tổng quan';
  const resolvedTitle = isOverview ? t.pageTitle : title;
  const resolvedDesc = isOverview ? t.description : description;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.bento-col-1',
        { x: -18, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.bento-col-2',
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        )
        .fromTo(
          '.bento-col-3',
          { x: 18, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' },
          '-=0.25'
        );
    }, containerRef);

    return () => ctx.revert();
  }, [pageKey, title]);

  if (!isOverview) {
    return (
      <div ref={containerRef} className="px-4 sm:px-8 py-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">SFSH MODULE</span>
          <h1 className="text-3xl sm:text-[42px] font-extrabold tracking-tight text-text mt-1">{resolvedTitle}</h1>
          <p className="text-sm text-muted mt-1">{resolvedDesc}</p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-2xl">
            🌱
          </div>
          <p className="text-base font-semibold text-text">{resolvedDesc}</p>
          <p className="text-xs text-muted">Mô-đun đang hoạt động và đồng bộ với thời khóa biểu của bạn.</p>
          <div className="pt-2">
            <Link
              to="/timetable"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity"
            >
              <span>{lang === 'vi' ? 'Mở Thời khóa biểu' : 'Open Timetable'}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-65px)] bg-bg text-text px-4 sm:px-8 py-6 space-y-6"
    >
      {/* Title Header with Tests Accessibility Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-[42px] font-extrabold tracking-tight text-text leading-tight">
            {resolvedTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">{resolvedDesc}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/focus"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity"
          >
            <span>⏱️ {lang === 'vi' ? 'Vào Focus Room' : 'Enter Focus Room'}</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* BENTO GRID EXACTLY MATCHING IMAGE 4 FORMAT (STUDENT ACADEMIC CONTENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COL 1: Study Mix & Controls Panel */}
        <div className="bento-col-1 lg:col-span-3 glass-card rounded-3xl p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2.5">
              {t.studyMix}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {t.mixPills.map((pill, idx) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setSelectedMix(idx)}
                  className={`rounded-xl py-2 px-3 text-xs font-bold text-center transition-colors ${
                    selectedMix === idx
                      ? 'bg-text text-bg dark:bg-white dark:text-black shadow-xs'
                      : 'border border-border bg-surface-2 text-muted hover:text-text'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">{t.autoSyncToggle}</span>
              <button
                type="button"
                onClick={() => setAutoSync((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  autoSync ? 'bg-primary' : 'bg-muted/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    autoSync ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">{t.autoAdjustToggle}</span>
              <button
                type="button"
                onClick={() => setAdaptivePomo((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  adaptivePomo ? 'bg-primary' : 'bg-muted/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    adaptivePomo ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-border text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.pomoLength}</span>
              <span className="font-bold text-text">25 min</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.studyBreakRatio}</span>
              <span className="font-bold text-text">25 / 5 min</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.priorityCourse}</span>
              <span className="font-bold text-primary">MSIS207</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted">{t.intensity}</span>
              <span className="font-bold text-text">{t.intensityValue}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/focus')}
            className="w-full rounded-full bg-text text-bg dark:bg-white dark:text-black py-3 px-4 text-xs font-extrabold shadow-sm hover:bg-primary hover:text-black transition-colors flex items-center justify-center gap-1.5"
          >
            {t.addCustomBtn}
          </button>
        </div>

        {/* COL 2: Class Progression & Course Modules */}
        <div className="bento-col-2 lg:col-span-6 space-y-6">
          {/* Section 01: Priority Classes Today (Radiant Green Glow cards matching Image 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted tracking-wider uppercase">
                {t.cat1Label}
              </span>
              <span className="text-xs font-bold text-primary">
                {t.activeNow}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {t.activeClasses.map((item) => (
                <div
                  key={item.code}
                  onClick={() => navigate('/timetable')}
                  className="cursor-pointer group relative overflow-hidden rounded-3xl border border-primary/40 p-4 aspect-[4/5] flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 60%, rgba(219, 239, 144, 0.35) 0%, rgba(36, 49, 0, 0.95) 75%)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="truncate pr-1">{item.code}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-primary">›</span>
                  </div>

                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                    <svg className="w-full h-full text-primary drop-shadow-[0_0_16px_rgba(219,239,144,0.6)]" viewBox="0 0 200 200" fill="currentColor">
                      <path d={item.shape} />
                    </svg>
                  </div>

                  <div className="text-white space-y-0.5">
                    <p className="text-xs font-bold leading-tight truncate">{item.title}</p>
                    <p className="text-[10px] text-white/75">{item.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 02: Enrolled Course Modules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted tracking-wider uppercase">
                {t.cat2Label}
              </span>
              <span className="text-xs font-semibold text-muted">
                {t.allCourses}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {t.otherCourses.map((course) => (
                <div
                  key={course.code}
                  className="glass-card rounded-2xl p-3.5 flex flex-col justify-between aspect-[1.15/1]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-extrabold text-primary">
                      {course.code}
                    </span>
                    <span className="text-[10px] text-muted">📚</span>
                  </div>
                  <p className="text-xs font-bold text-text truncate my-1">{course.name}</p>
                  <span className="text-[10px] font-semibold text-muted">{course.credits}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COL 3: Weekly Speedometer Dial & Next Class Reminder */}
        <div className="bento-col-3 lg:col-span-3 space-y-5">
          {/* Speedometer Gauge Dial Graphic */}
          <div className="glass-card rounded-3xl p-5">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t.weeklyPace}
            </span>

            <div className="relative my-4 flex flex-col items-center justify-center">
              <svg className="h-28 w-44" viewBox="0 0 200 120">
                <path
                  d="M 20 110 A 80 80 0 0 1 180 110"
                  fill="none"
                  stroke="rgba(128, 128, 128, 0.2)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 110 A 80 80 0 0 1 145 40"
                  fill="none"
                  stroke="var(--sfsh-primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <line x1="100" y1="110" x2="135" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="110" r="5" fill="currentColor" />
              </svg>

              <div className="text-center mt-1">
                <p className="text-[11px] font-semibold text-muted">Semester Goal: 25h</p>
                <p className="text-2xl font-black text-text">{t.weeklyHours}</p>
              </div>
            </div>
          </div>

          {/* Next Class Reminder Widget */}
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">{t.nextClassTitle}</span>
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-text">{t.nextClassName}</p>
              <p className="text-xs text-muted">{t.nextClassRoom}</p>
            </div>

            <Link
              to="/timetable"
              className="inline-block w-full text-center rounded-full border border-border bg-surface-2 py-2 text-xs font-bold text-text hover:border-primary/50 transition-colors"
            >
              {t.openTimetable}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
