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
        'A distraction-free academic workspace for university students. Synchronize your .ics timetable, protect your peak active hours, and master course assignments in one unified interface.',
      ctaPrimary: 'Sign In to Workspace',
      ctaSecondary: 'Create Free Account',
    },
    features: {
      timetable: {
        tag: '01 / TIMETABLE & .ICS CALENDAR SYNC',
        title: 'Automatic timetable parsing. Zero scheduling collisions.',
        desc: 'Never manually retype lecture hours or search for classroom numbers. Upload your university portal or Google Calendar .ics export, and Luma instantly structures your entire semester with zero room or time collisions.',
        bullets: [
          'Instant .ICS parsing in under 200ms with deduplicated course codes',
          'Automatic lecture hall & laboratory mapping (E32, C206, B5.04)',
          'Intelligent active hour alignment tailored to your circadian rhythm',
        ],
        fileName: 'TKB_HK1_2026-2027.ics',
        syncStatus: '11 Classes Synced · 0 Overlaps',
        syncBtn: '⚡ Simulate .ICS Import',
      },
      focus: {
        tag: '02 / DEEP FOCUS STUDIO & POMODORO',
        title: 'Distraction-free flow. Scientifically-paced study intervals.',
        desc: 'Enter an acoustic sanctuary designed for deep academic work. Pair scientifically-backed 25/5 Pomodoro intervals with curated ambient soundscapes to maintain high-retention focus without mental fatigue.',
        bullets: [
          '25-minute Pomodoro focus sprints with gentle break transitions',
          'Curated ambient audio soundscapes: Library silence, rain, and campus cafe',
          'Real-time flow state and consecutive streak tracking',
        ],
        sprintBadge: 'Pomodoro Sprint 3 of 4',
        courseName: 'MSIS207 · Web Application Development',
        courseTopic: 'Chapter 4: RESTful API Architecture & Authentication',
        btnStart: 'Start Timer',
        btnPause: 'Pause Timer',
        btnReset: 'Reset',
        soundscapes: ['🎧 Library Silence', '🌧️ Gentle Rain', '☕ Campus Cafe'],
        flowRate: 'Flow State: 94%',
      },
      deadlines: {
        tag: '03 / COURSE MILESTONES & DEADLINE RADAR',
        title: 'Master course syllabi. Eliminate late assignment submissions.',
        desc: 'Keep high-stakes coursework under control with proactive priority queues. From urgent midnight programming labs to semester milestones, track every deliverable against your personal academic pace.',
        bullets: [
          'Priority triage: Critical (Tonight), Approaching (2 Days), Scheduled',
          'Proactive completion pacing (94.2% on-time submission rate · Grade A pace)',
          'Direct alignment with weekly course syllabi and lab deliverables',
        ],
        queueStatus: '3 Pending Assignments · 94.2% On-Time Pace',
        items: [
          { id: 1, code: 'MSIS207', title: 'Lab 4 · Express CRUD & REST API', due: 'Tonight · 23:59', badge: 'CRITICAL', badgeColor: 'text-rose-500 bg-rose-500/15 border-rose-500/30' },
          { id: 2, code: 'CS5433', title: 'Assignment 2 · 2PC Distributed DB Protocol', due: 'In 2 days · 17:00', badge: 'WARNING', badgeColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30' },
          { id: 3, code: 'STAT3013', title: 'Quiz 3 · Hypothesis Testing & ANOVA', due: 'Saturday · 08:00', badge: 'SCHEDULED', badgeColor: 'text-primary bg-primary/15 border-primary/30' },
        ],
        markDone: 'Mark Done',
        completedLabel: 'Completed',
      },
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
    features: {
      timetable: {
        tag: '01 / ĐỒNG BỘ THỜI KHÓA BIỂU & .ICS',
        title: 'Xếp lịch học tự động. Giải quyết triệt để trùng lịch.',
        desc: 'Không bao giờ phải nhập lịch thủ công từng môn hay tra cứu phòng học. Chỉ cần kéo thả file .ics từ cổng trường hoặc Google Calendar, hệ thống sẽ tự động bóc tách mã môn, phòng học, giảng đường và thời gian học tức thì.',
        bullets: [
          'Bóc tách file .ics siêu tốc dưới 0.2 giây, tự chuẩn hóa mã môn',
          'Tự động định vị phòng học & giảng đường (E32, C206, B5.04)',
          'Tránh xung đột lịch học và cân đối khung giờ sinh hoạt cá nhân',
        ],
        fileName: 'TKB_HK1_2026-2027.ics',
        syncStatus: 'Đã xếp 11 ca học · 0 ca trùng giờ',
        syncBtn: '⚡ Thử nạp file .ICS',
      },
      focus: {
        tag: '02 / PHÒNG TẬP TRUNG CHUYÊN SÂU & POMODORO',
        title: 'Không gian tĩnh lặng. Nhịp Pomodoro tối đa hiệu suất.',
        desc: 'Bước vào không gian học tập loại bỏ hoàn toàn xao nhãng. Kết hợp chu kỳ Pomodoro 25/5 khoa học cùng hệ thống âm thanh tự nhiên giúp não bộ duy trì trạng thái tập trung sâu suốt buổi học.',
        bullets: [
          'Phiên tập trung 25 phút chuẩn khoa học kèm chuông báo nhẹ nhàng',
          'Âm thanh nền chọn lọc: Thư viện tĩnh lặng, Mưa rào, Cafe sinh viên',
          'Theo dõi trạng thái dòng chảy (Flow State) và chuỗi học liên tục',
        ],
        sprintBadge: 'Phiên Pomodoro 3 trên 4',
        courseName: 'MSIS207 · Phát triển ứng dụng Web',
        courseTopic: 'Chương 4: Kiến trúc RESTful API & Xác thực người dùng',
        btnStart: 'Bắt đầu',
        btnPause: 'Tạm dừng',
        btnReset: 'Đặt lại',
        soundscapes: ['🎧 Thư viện tĩnh lặng', '🌧️ Mưa êm dịu', '☕ Cafe học bài'],
        flowRate: 'Trạng thái tập trung: 94%',
      },
      deadlines: {
        tag: '03 / QUẢN TRỊ DEADLINE & ĐỀ CƯƠNG',
        title: 'Làm chủ đề cương môn học. 100% không trễ hạn nộp bài.',
        desc: 'Kiểm soát khối lượng bài tập lớn, đồ án chuyên ngành và bài kiểm tra theo hàng đợi ưu tiên thông minh. Cảnh báo sớm theo thời gian thực giúp bạn hoàn thành bài tập đúng hạn với điểm số tối đa.',
        bullets: [
          'Phân luồng ưu tiên: Khẩn cấp (Tối nay), Cận kề (2 ngày), Dự kiến',
          'Đo lường tiến độ học tập chủ động (94.2% nộp bài đúng hạn - Hạng A)',
          'Gắn liền trực tiếp với đề cương môn học của từng giảng viên',
        ],
        queueStatus: '3 Bài tập chờ nộp · Tỷ lệ đúng hạn 94.2%',
        items: [
          { id: 1, code: 'MSIS207', title: 'Lab 4 · Express CRUD & REST API', due: 'Tối nay · 23:59', badge: 'KHẨN CẤP', badgeColor: 'text-rose-500 bg-rose-500/15 border-rose-500/30' },
          { id: 2, code: 'CS5433', title: 'Bài tập 2 · Giao thức 2PC CSDL Phân tán', due: 'Còn 2 ngày · 17:00', badge: 'CẬN KỀ', badgeColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30' },
          { id: 3, code: 'STAT3013', title: 'Kiểm tra 3 · Kiểm định giả thuyết & ANOVA', due: 'Thứ 7 · 08:00', badge: 'DỰ KIẾN', badgeColor: 'text-primary bg-primary/15 border-primary/30' },
        ],
        markDone: 'Đánh dấu xong',
        completedLabel: 'Đã hoàn thành',
      },
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
  { day: 'Mon', dayVi: 'T2', code: 'PE231', nameEn: 'Physical Education', nameVi: 'Giáo dục thể chất', room: 'Field A', time: '15:25 – 17:00', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { day: 'Tue', dayVi: 'T3', code: 'MATH201', nameEn: 'Calculus II', nameVi: 'Giải tích II', room: 'Room C302', time: '09:45 – 11:45', color: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { day: 'Wed', dayVi: 'T4', code: 'MSIS207', nameEn: 'Web App Development', nameVi: 'Phát triển ứng dụng Web', room: 'Room C206', time: '13:00 – 16:15', color: 'border-primary/40 bg-primary/10 text-primary' },
  { day: 'Thu', dayVi: 'T5', code: 'CS5433', nameEn: 'Distributed Databases', nameVi: 'CSDL Phân tán', room: 'Room B5.04', time: '13:00 – 17:00', color: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  { day: 'Sat', dayVi: 'T7', code: 'STAT3013', nameEn: 'Statistical Analysis', nameVi: 'Phân tích thống kê', room: 'Room B5.04', time: '07:30 – 11:30', color: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400' },
];

export function HomePage() {
  const { lang } = useLanguage();
  const t = HOME_COPY[lang] || HOME_COPY.en;
  const rootRef = useRef(null);

  // Interactive states for each dedicated section
  const [syncedKey, setSyncedKey] = useState(1);
  const [timerRunning, setTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(21 * 60 + 45); // 21:45
  const [selectedSound, setSelectedSound] = useState(0);
  const [completedItems, setCompletedItems] = useState({});
  const [taglineIndex, setTaglineIndex] = useState(0);

  // Cycling kinetic tagline index in Hero
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTaglineIndex((idx) => (idx + 1) % t.hero.taglines.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [t.hero.taglines.length]);

  // Pomodoro countdown timer in Focus Section
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
        );

      // Scroll reveals with once: true for 60fps performance
      gsap.utils.toArray('.home-scroll-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 26, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
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
      {/* Top Navbar */}
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

      <main className="space-y-12 sm:space-y-16 pb-24">
        {/* HERO SECTION: Clean, spacious, Apple-like minimalism */}
        <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-8 sm:pt-20 text-center">
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
        </section>

        {/* CORE FEATURE 1: DEDICATED TIMETABLE & .ICS SYNC ZONE */}
        <section className="home-scroll-reveal mx-auto max-w-6xl px-4 sm:px-8 py-12 sm:py-20 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Description & Highlights */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t.features.timetable.tag}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text leading-tight">
                {t.features.timetable.title}
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                {t.features.timetable.desc}
              </p>

              {/* Bullet Points with Checkmark Circles */}
              <div className="space-y-3 pt-2">
                {t.features.timetable.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-text/90">{b}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setSyncedKey((k) => k + 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-fg shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t.features.timetable.syncBtn}
                </button>
              </div>
            </div>

            {/* Right Column: Large Timetable Interactive Mockup Card */}
            <div className="lg:col-span-7">
              <div className="glass-card rounded-[2rem] p-5 sm:p-7 shadow-2xl border border-border text-left">
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary text-base">
                      📅
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm font-extrabold text-text">{t.features.timetable.fileName}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted">Google Calendar & Portal iCal Protocol</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {t.features.timetable.syncStatus}
                  </span>
                </div>

                {/* 5-Day Classes Grid */}
                <div key={syncedKey} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-5">
                  {DEMO_CLASSES.map((c) => (
                    <div
                      key={c.code}
                      className={`rounded-2xl border p-3 flex flex-col justify-between transition-transform hover:scale-[1.02] shadow-xs ${c.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {lang === 'vi' ? c.dayVi : c.day}
                        </span>
                        <span className="rounded bg-black/20 dark:bg-white/20 px-1.5 py-0.5 text-[10px] font-extrabold">
                          {c.code}
                        </span>
                      </div>
                      <div className="my-3">
                        <p className="text-xs font-bold text-text truncate">
                          {lang === 'vi' ? c.nameVi : c.nameEn}
                        </p>
                        <p className="text-[11px] opacity-85 mt-0.5">📍 {c.room}</p>
                      </div>
                      <span className="text-[10px] font-semibold opacity-90">{c.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURE 2: DEDICATED DEEP FOCUS STUDIO ZONE */}
        <section className="home-scroll-reveal mx-auto max-w-6xl px-4 sm:px-8 py-12 sm:py-20 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Focus Studio Interactive Player Widget */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="glass-card rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-border text-left relative overflow-hidden">
                {/* Radiant blooming aura glow behind timer */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center relative z-10">
                  {/* Circular Timer Ring */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center">
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-primary/30 bg-surface-2/80 shadow-inner luma-radiant-glow">
                      <div className="text-center">
                        <span className="text-4xl font-black text-text tracking-tight">{formattedTimer}</span>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mt-1.5 flex items-center justify-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${timerRunning ? 'bg-primary animate-ping' : 'bg-muted'}`} />
                          <span>{timerRunning ? (lang === 'vi' ? 'Đang tập trung' : 'Focusing') : (lang === 'vi' ? 'Tạm dừng' : 'Paused')}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sprint Details & Soundscapes */}
                  <div className="sm:col-span-7 space-y-4">
                    <div>
                      <span className="inline-flex rounded-md bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {t.features.focus.sprintBadge}
                      </span>
                      <h4 className="text-lg font-bold text-text mt-2">{t.features.focus.courseName}</h4>
                      <p className="text-xs text-muted mt-0.5">{t.features.focus.courseTopic}</p>
                    </div>

                    {/* Soundscape Pills */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        {lang === 'vi' ? 'Âm thanh nền học tập:' : 'Acoustic Soundscapes:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {t.features.focus.soundscapes.map((sound, idx) => (
                          <button
                            key={sound}
                            type="button"
                            onClick={() => setSelectedSound(idx)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              selectedSound === idx
                                ? 'bg-primary text-primary-fg font-bold shadow-xs'
                                : 'border border-border bg-surface text-muted hover:text-text'
                            }`}
                          >
                            {sound}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timer Action Controls */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setTimerRunning((r) => !r)}
                        className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        {timerRunning ? t.features.focus.btnPause : t.features.focus.btnStart}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSeconds(25 * 60);
                          setTimerRunning(true);
                        }}
                        className="rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
                      >
                        {t.features.focus.btnReset}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Description & Highlights */}
            <div className="lg:col-span-5 space-y-5 text-left order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t.features.focus.tag}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text leading-tight">
                {t.features.focus.title}
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                {t.features.focus.desc}
              </p>

              {/* Bullet Points with Checkmark Circles */}
              <div className="space-y-3 pt-2">
                {t.features.focus.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-text/90">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURE 3: DEDICATED COURSE MILESTONES & DEADLINE RADAR ZONE */}
        <section className="home-scroll-reveal mx-auto max-w-6xl px-4 sm:px-8 py-12 sm:py-20 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Description & Highlights */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{t.features.deadlines.tag}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text leading-tight">
                {t.features.deadlines.title}
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                {t.features.deadlines.desc}
              </p>

              {/* Bullet Points with Checkmark Circles */}
              <div className="space-y-3 pt-2">
                {t.features.deadlines.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-text/90">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Large Priority Deadline Queue Card */}
            <div className="lg:col-span-7">
              <div className="glass-card rounded-[2rem] p-5 sm:p-7 shadow-2xl border border-border text-left space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 text-sm font-bold">
                      ⚡
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-text">{t.features.deadlines.queueStatus}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">Academic Pace: Grade A</span>
                </div>

                {/* 3 Deadline Cards */}
                <div className="space-y-3 pt-1">
                  {t.features.deadlines.items.map((item) => {
                    const isDone = completedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isDone
                            ? 'border-emerald-500/30 bg-emerald-500/5 opacity-75'
                            : 'border-border bg-surface-2/60 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                              {item.code}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase border ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCompletedItems((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className={`rounded-full px-3 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500 text-black border-emerald-500'
                                : 'border-border bg-surface hover:border-primary/50 text-text'
                            }`}
                          >
                            {isDone ? `✓ ${t.features.deadlines.completedLabel}` : t.features.deadlines.markDone}
                          </button>
                        </div>

                        <div className="my-2.5">
                          <h4 className={`text-sm font-bold text-text ${isDone ? 'line-through opacity-60' : ''}`}>
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted mt-0.5">Due: {item.due}</p>
                        </div>

                        {/* Progress bar */}
                        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-semibold text-muted">
                          <span>Progress</span>
                          <span className="text-primary font-bold">{isDone ? '100%' : `${item.pct}%`}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-accent-deep to-primary transition-all duration-300"
                            style={{ width: isDone ? '100%' : `${item.pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINALE CALL TO ACTION */}
        <section className="home-scroll-reveal mx-auto max-w-4xl px-4 sm:px-8 pt-6">
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
