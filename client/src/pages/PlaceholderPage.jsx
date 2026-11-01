import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';

const OVERVIEW_COPY = {
  en: {
    pageTitle: 'Overview',
    subtitle: 'Monday, April 8, 2026 · Real-time academic overview',
    dateFilter: 'Last 7 days',
    startFocusBtn: '+ Enter Focus Room',
    metrics: [
      { label: 'Active Courses', value: '5/6', dot: 'bg-primary' },
      { label: 'Deadlines', value: '3 Pending', dot: 'bg-rose-500' },
      { label: 'Weekly Study', value: '24.5 hrs', dot: 'bg-emerald-400' },
      { label: 'Focus Rate', value: '92%', dot: 'bg-primary' },
      { label: 'On-Time Rate', value: '94.2%', dot: 'bg-sky-400' },
    ],
    quickActions: {
      title: 'Quick Actions',
      focus: '+ Start 25m Focus Sprint',
      timetable: '📅 Open Weekly Timetable',
      ics: '⚡ Import .ICS Timetable',
    },
    deadlinesQueue: {
      title: 'Priority Deadlines Queue',
      seeAll: 'View All Deadlines',
      items: [
        {
          code: 'MSIS207',
          title: 'Lab 4 · Express CRUD & REST API',
          desc: 'Submit GitHub repository link and Swagger OpenAPI documentation before midnight.',
          due: 'Due Tonight · 23:59',
          badge: 'Critical',
          badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
          dot: 'bg-rose-500',
        },
        {
          code: 'CS5433',
          title: 'Assignment 2 · 2PC Distributed DB Protocol',
          desc: 'Complete coordinator failure recovery simulation and commit consensus benchmark.',
          due: 'Due in 2 days · 17:00',
          badge: 'Warning',
          badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
          dot: 'bg-amber-500',
        },
        {
          code: 'STAT3013',
          title: 'Quiz 3 · Regression & Hypothesis Testing',
          desc: 'Online LMS 30-minute timed quiz covering multiple linear regression and p-values.',
          due: 'Saturday · 08:00',
          badge: 'Scheduled',
          badgeColor: 'border-primary/30 bg-primary/10 text-primary',
          dot: 'bg-primary',
        },
      ],
    },
    nextDaySchedule: {
      title: "Next Day's Class Schedule",
      dateLabel: 'Tuesday · 3 Classes Scheduled',
      seeAll: 'Full Schedule',
      classes: [
        {
          time: '13:00 – 16:15',
          code: 'MSIS207',
          name: 'Web Application Development',
          room: 'Room C206 · Practical Lab',
          type: 'Lab Sprint',
          dot: 'bg-primary',
        },
        {
          time: '07:30 – 11:30',
          code: 'STAT3013',
          name: 'Statistical Analysis',
          room: 'Room B5.04 · Main Hall',
          type: 'Lecture',
          dot: 'bg-amber-400',
        },
        {
          time: '13:00 – 17:00',
          code: 'CS5433',
          name: 'Distributed Database Systems',
          room: 'Room B5.04 · Hall B',
          type: 'Theory & Lab',
          dot: 'bg-sky-400',
        },
      ],
    },
    weeklyTrend: {
      title: 'Study Pace & Hours Trend',
      subtitle: 'Weekly study utilization % and total hours (Goal: 25 hrs)',
      tooltipDay: 'Wed',
      tooltipHours: 'Study: 6.5 hrs',
      tooltipRate: 'Focus: 94%',
      days: [
        { day: '2 Sun', height: '35%', hours: '2.5h' },
        { day: '3 Mon', height: '65%', hours: '4.5h' },
        { day: '4 Tue', height: '75%', hours: '5.2h' },
        { day: '5 Wed', height: '95%', hours: '6.5h', active: true },
        { day: '6 Thu', height: '55%', hours: '4.0h' },
        { day: '7 Fri', height: '45%', hours: '3.2h' },
        { day: '8 Sat', height: '70%', hours: '5.0h' },
      ],
    },
    performanceCard: {
      title: 'Current Efficiency & On-Time Performance',
      subtitle: 'Weekly on-time vs delayed assignment submissions',
      statLabel: 'On-time Rate',
      statValue: '94.2%',
      streakLabel: '4-Week Streak',
    },
  },
  vi: {
    pageTitle: 'Tổng quan',
    subtitle: 'Thứ Hai, 8 tháng 4 · Báo cáo học tập thời gian thực',
    dateFilter: '7 ngày qua',
    startFocusBtn: '+ Vào phòng Focus',
    metrics: [
      { label: 'Môn đang học', value: '5/6 môn', dot: 'bg-primary' },
      { label: 'Hạn nộp bài', value: '3 bài tập', dot: 'bg-rose-500' },
      { label: 'Giờ học tuần', value: '24.5 giờ', dot: 'bg-emerald-400' },
      { label: 'Độ tập trung', value: '92%', dot: 'bg-primary' },
      { label: 'Tỷ lệ đúng hạn', value: '94.2%', dot: 'bg-sky-400' },
    ],
    quickActions: {
      title: 'Thao tác nhanh',
      focus: '+ Bắt đầu phiên học 25m',
      timetable: '📅 Mở Thời khóa biểu',
      ics: '⚡ Đồng bộ lịch .ICS',
    },
    deadlinesQueue: {
      title: 'Hàng đợi Deadline Ưu tiên',
      seeAll: 'Xem tất cả',
      items: [
        {
          code: 'MSIS207',
          title: 'Lab 4 · Express CRUD & REST API',
          desc: 'Nộp link GitHub repo và tài liệu Swagger OpenAPI trước nửa đêm.',
          due: 'Hạn chót: Tối nay · 23:59',
          badge: 'Khẩn cấp',
          badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
          dot: 'bg-rose-500',
        },
        {
          code: 'CS5433',
          title: 'Bài tập 2 · Giao thức 2PC CSDL Phân tán',
          desc: 'Hoàn thiện mô phỏng điều phối viên phục hồi lỗi và đánh giá thông lượng.',
          due: 'Hạn chót: Còn 2 ngày · 17:00',
          badge: 'Cảnh báo',
          badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
          dot: 'bg-amber-500',
        },
        {
          code: 'STAT3013',
          title: 'Kiểm tra 3 · Hồi quy & Kiểm định giả thuyết',
          desc: 'Bài trắc nghiệm 30 phút trên hệ thống LMS về mô hình hồi quy tuyến tính.',
          due: 'Thứ Bảy · 08:00',
          badge: 'Đã lên lịch',
          badgeColor: 'border-primary/30 bg-primary/10 text-primary',
          dot: 'bg-primary',
        },
      ],
    },
    nextDaySchedule: {
      title: 'Danh sách môn học ngày tiếp theo',
      dateLabel: 'Thứ Ba · 3 Ca học đã xếp lịch',
      seeAll: 'Xem lịch đầy đủ',
      classes: [
        {
          time: '13:00 – 16:15',
          code: 'MSIS207',
          name: 'Phát triển ứng dụng Web',
          room: 'Phòng C206 · Thực hành Lab',
          type: 'Thực hành',
          dot: 'bg-primary',
        },
        {
          time: '07:30 – 11:30',
          code: 'STAT3013',
          name: 'Phân tích thống kê',
          room: 'Phòng B5.04 · Giảng đường',
          type: 'Lý thuyết',
          dot: 'bg-amber-400',
        },
        {
          time: '13:00 – 17:00',
          code: 'CS5433',
          name: 'Các hệ CSDL phân tán',
          room: 'Phòng B5.04 · Phòng B',
          type: 'Lý thuyết & Thảo luận',
          dot: 'bg-sky-400',
        },
      ],
    },
    weeklyTrend: {
      title: 'Tiến độ học tập & Giờ học tuần',
      subtitle: 'Tỷ lệ phân bổ thời gian học (Mục tiêu tuần: 25 giờ)',
      tooltipDay: 'Thứ 4',
      tooltipHours: 'Tập trung: 6.5 giờ',
      tooltipRate: 'Hiệu suất: 94%',
      days: [
        { day: 'CN', height: '35%', hours: '2.5h' },
        { day: 'T2', height: '65%', hours: '4.5h' },
        { day: 'T3', height: '75%', hours: '5.2h' },
        { day: 'T4', height: '95%', hours: '6.5h', active: true },
        { day: 'T5', height: '55%', hours: '4.0h' },
        { day: 'T6', height: '45%', hours: '3.2h' },
        { day: 'T7', height: '70%', hours: '5.0h' },
      ],
    },
    performanceCard: {
      title: 'Hiệu suất hiện tại & Tỷ lệ đúng hạn',
      subtitle: 'Tỷ lệ nộp bài tập đúng hạn so với trễ hạn theo tuần',
      statLabel: 'Tỷ lệ đúng hạn',
      statValue: '94.2%',
      streakLabel: 'Chuỗi 4 tuần liên tục',
    },
  },
};

export function PlaceholderPage({
  pageKey = 'overview',
  title = 'Overview',
  description = 'Study Hub overview and scheduling.',
}) {
  const { lang } = useLanguage();
  const t = OVERVIEW_COPY[lang] || OVERVIEW_COPY.en;
  const containerRef = useRef(null);

  const [completedItems, setCompletedItems] = useState({});

  const isOverview = pageKey === 'overview' || title === 'Overview' || title === 'Tổng quan';
  const resolvedTitle = isOverview ? t.pageTitle : title;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(
        '.dash-metric-pill',
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.35, clearProps: 'opacity,transform' }
      )
        .fromTo(
          '.dash-card-left',
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.08, duration: 0.4, clearProps: 'opacity,transform' },
          '-=0.2'
        )
        .fromTo(
          '.dash-card-right',
          { x: 16, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.08, duration: 0.4, clearProps: 'opacity,transform' },
          '-=0.3'
        );
    }, containerRef);

    return () => ctx.revert();
  }, [pageKey, title]);

  function toggleComplete(id) {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Non-overview placeholder views (Syllabus, Deadlines fallback)
  if (!isOverview) {
    return (
      <div ref={containerRef} className="px-4 sm:px-8 py-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">SFSH MODULE</span>
          <h1 className="text-3xl sm:text-[42px] font-extrabold tracking-tight text-text mt-1">{resolvedTitle}</h1>
          <p className="text-sm text-muted mt-1">{description}</p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary text-2xl">
            🌱
          </div>
          <p className="text-base font-semibold text-text">{description}</p>
          <p className="text-xs text-muted">
            {lang === 'vi'
              ? 'Mô-đun đang hoạt động và đồng bộ với thời khóa biểu của bạn.'
              : 'Module active and synchronized with your academic timetable.'}
          </p>
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

  // EXACT REPLICATION OF OPERATIONS DASHBOARD LAYOUT (STUDENT ACADEMIC CONTENT)
  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-65px)] bg-bg text-text px-4 sm:px-8 py-6 space-y-6 overflow-x-hidden font-sans max-w-7xl mx-auto w-full"
    >
      {/* 1. TOP METRIC PILLS RAIL (MATCHING THE TOP OF THE SCREENSHOT) */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
        {t.metrics.map((m) => (
          <div
            key={m.label}
            className="dash-metric-pill glass-card shrink-0 flex items-center gap-2 rounded-full px-3.5 py-1.5 border border-border shadow-2xs"
          >
            <span className={`h-2 w-2 rounded-full ${m.dot}`} />
            <span className="text-muted">{m.label}:</span>
            <span className="font-extrabold text-text">{m.value}</span>
          </div>
        ))}
      </div>

      {/* 2. DASHBOARD TITLE & ACTION CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
            {resolvedTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="glass-card text-xs font-semibold text-muted rounded-full px-3.5 py-1.5 border border-border">
            {t.dateFilter} ▾
          </span>
          <Link
            to="/focus"
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-fg shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>⏱️</span>
            <span>{t.startFocusBtn}</span>
          </Link>
        </div>
      </div>

      {/* 3. MAIN BENTO GRID (LEFT: QUICK ACTIONS, DEADLINE QUEUE, NEXT DAY CLASSES | RIGHT: PACE TREND, EFFICIENCY CHART) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* CARD 1: Quick Actions */}
          <div className="dash-card-left glass-card rounded-3xl p-5 space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.quickActions.title}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Link
                to="/focus"
                className="rounded-2xl border border-border bg-surface-2 p-3 text-center text-xs font-bold text-text hover:border-primary/50 hover:bg-primary/10 transition-colors"
              >
                {t.quickActions.focus}
              </Link>
              <Link
                to="/timetable"
                className="rounded-2xl border border-border bg-surface-2 p-3 text-center text-xs font-bold text-text hover:border-primary/50 hover:bg-primary/10 transition-colors"
              >
                {t.quickActions.timetable}
              </Link>
              <Link
                to="/timetable"
                className="rounded-2xl border border-border bg-surface-2 p-3 text-center text-xs font-bold text-text hover:border-primary/50 hover:bg-primary/10 transition-colors"
              >
                {t.quickActions.ics}
              </Link>
            </div>
          </div>

          {/* CARD 2: Alert Priority Queue (MATCHING ALERT PRIORITY QUEUE IN SCREENSHOT) */}
          <div className="dash-card-left glass-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="text-xs font-bold uppercase tracking-wider text-text">
                  {t.deadlinesQueue.title}
                </span>
              </div>
              <Link to="/deadlines" className="text-xs font-bold text-primary hover:underline">
                {t.deadlinesQueue.seeAll}
              </Link>
            </div>

            <div className="space-y-3">
              {t.deadlinesQueue.items.map((item) => {
                const isDone = completedItems[item.code];
                return (
                  <div
                    key={item.code}
                    className={`rounded-2xl border p-4 transition-all duration-150 ${
                      item.badgeColor
                    } ${isDone ? 'opacity-50 line-through' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                        <span className="text-xs font-extrabold text-text">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-current">
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-muted mt-2 leading-relaxed">{item.desc}</p>

                    <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                      <span className="font-bold text-text">{item.due}</span>
                      <button
                        type="button"
                        onClick={() => toggleComplete(item.code)}
                        className="rounded-full bg-surface px-3 py-1 text-[11px] font-bold text-text hover:bg-primary hover:text-primary-fg transition-colors"
                      >
                        {isDone ? '✓ Completed' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: Next Day's Class Schedule (MATCHING RECENT ACTIVITY IN SCREENSHOT) */}
          <div className="dash-card-left glass-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📚</span>
                <span className="text-xs font-bold uppercase tracking-wider text-text">
                  {t.nextDaySchedule.title}
                </span>
              </div>
              <Link to="/timetable" className="text-xs font-bold text-primary hover:underline">
                {t.nextDaySchedule.seeAll}
              </Link>
            </div>

            <p className="text-xs text-muted">{t.nextDaySchedule.dateLabel}</p>

            <div className="space-y-2.5">
              {t.nextDaySchedule.classes.map((c) => (
                <div
                  key={c.code}
                  className="rounded-2xl border border-border bg-surface-2 p-3.5 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.dot} shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-extrabold text-primary">
                          {c.code}
                        </span>
                        <p className="text-xs font-bold text-text">{c.name}</p>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">{c.room}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-text">{c.time}</p>
                    <span className="text-[10px] text-muted">{c.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* CARD 4: Study Pace Trend (MATCHING FLEET UTILIZATION TREND IN SCREENSHOT) */}
          <div className="dash-card-right glass-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.weeklyTrend.title}
                </span>
                <p className="text-xs text-muted mt-0.5">{t.weeklyTrend.subtitle}</p>
              </div>
              <span className="text-sm text-primary">↗</span>
            </div>

            {/* Vertical Bar Chart Graphic with Active Day Highlight */}
            <div className="relative pt-6 pb-2">
              <div className="flex items-end justify-between gap-2 h-44 px-2">
                {t.weeklyTrend.days.map((bar) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Active tooltip badge for Wednesday */}
                    {bar.active && (
                      <div className="glass-card rounded-xl px-2.5 py-1 text-[10px] font-bold text-center border border-primary/50 shadow-md mb-1 animate-bounce">
                        <span className="text-primary block">{t.weeklyTrend.tooltipHours}</span>
                        <span className="text-muted text-[9px] block">{t.weeklyTrend.tooltipRate}</span>
                      </div>
                    )}

                    <div
                      className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ${
                        bar.active
                          ? 'bg-gradient-to-t from-primary via-accent-lime to-white shadow-md'
                          : 'bg-primary/25 hover:bg-primary/40'
                      }`}
                      style={{ height: bar.height }}
                    />
                    <span className={`text-[10px] font-semibold ${bar.active ? 'text-primary font-bold' : 'text-muted'}`}>
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 5: On-Time Performance Area Wave (MATCHING ON-TIME DELIVERY PERFORMANCE IN SCREENSHOT) */}
          <div className="dash-card-right glass-card rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.performanceCard.title}
                </span>
                <p className="text-xs text-muted mt-0.5">{t.performanceCard.subtitle}</p>
              </div>
              <span className="text-xs font-bold text-primary">{t.performanceCard.streakLabel}</span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-black text-text">{t.performanceCard.statValue}</span>
              <span className="text-xs font-semibold text-emerald-500">↑ +3.8% this month</span>
            </div>

            {/* Smooth Wave Area Chart */}
            <div className="relative h-32 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="performanceWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sfsh-primary)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--sfsh-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 90 Q 60 70, 120 78 T 240 50 T 360 40 T 500 20 L 500 120 L 0 120 Z"
                  fill="url(#performanceWaveGradient)"
                />
                <path
                  d="M 0 90 Q 60 70, 120 78 T 240 50 T 360 40 T 500 20"
                  fill="none"
                  stroke="var(--sfsh-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="500" cy="20" r="5" fill="var(--sfsh-primary)" />
              </svg>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>Goal: 90% on-time completion</span>
              <span className="font-bold text-primary">Grade A Academic Status</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
