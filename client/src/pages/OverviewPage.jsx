import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';
import { RecommendationBanner } from '../components/RecommendationBanner';
import { analyticsApi, getBrowserTimeZone, sessionsApi } from '../lib/api';
import { formatCourseInfo } from '../utils/courseFormat';
import {
  computeMaxDailyMinutes,
  formatDayChartLabel,
  formatFocusDuration,
  formatSessionTimestamp,
  getDailyRangeForOverview,
} from '../utils/analytics';

const RANGE_OPTIONS = [
  { key: '7d', en: '7 Days', vi: '7 ngày' },
  { key: '30d', en: '30 Days', vi: '30 ngày' },
  { key: 'all', en: 'All Time', vi: 'Tất cả' },
];

export function OverviewPage() {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [overview, setOverview] = useState({
    totalFocusMinutes: 0,
    completedTasksCount: 0,
    overdueTasksCount: 0,
    currentStreakDays: 0,
    courseBreakdown: [],
  });
  const [dailyDays, setDailyDays] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);

  const tz = useMemo(() => getBrowserTimeZone(), []);
  const formattedToday = useMemo(
    () =>
      new Intl.DateTimeFormat(isVi ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    [isVi]
  );

  const t = isVi
    ? {
        eyebrow: 'PHÂN TÍCH HỌC TẬP · OVERVIEW',
        pageTitle: 'Tổng quan',
        subtitle: `${formattedToday} · Thống kê thời gian tập trung & tiến độ môn học (${tz})`,
        startFocusBtn: '+ Vào Focus Room',
        kpiFocus: 'Tổng thời gian tập trung',
        kpiFocusSub: (r) => (r === 'all' ? 'Toàn thời gian' : r === '30d' ? '30 ngày gần nhất' : '7 ngày gần nhất'),
        kpiStreak: 'Chuỗi ngày học liên tiếp',
        kpiStreakUnit: (n) => (n === 1 ? '1 ngày' : `${n} ngày`),
        kpiStreakActive: 'Đang duy trì rất tốt',
        kpiStreakZero: 'Bắt đầu 1 phiên để tạo chuỗi',
        kpiCompleted: 'Nhiệm vụ hoàn thành',
        kpiCompletedSub: 'Đã chốt trong kỳ',
        kpiOverdue: 'Deadline quá hạn',
        kpiOverdueAlert: 'Cần xử lý ngay',
        kpiOverdueClear: 'Đúng tiến độ',
        dailyTitle: 'Nhịp độ học tập hàng ngày',
        dailySubtitle: (r) =>
          r === '30d' ? 'Biểu đồ phút tập trung & nhiệm vụ (30 ngày)' : 'Biểu đồ phút tập trung & nhiệm vụ (7 ngày)',
        dailyEmptyHint: 'Chưa có phiên Pomodoro nào hoàn thành trong giai đoạn này.',
        minutesLabel: 'phút tập trung',
        tasksDoneLabel: 'bài xong',
        sessionsTitle: 'Phiên Focus gần đây',
        sessionsEmpty: 'Chưa có lịch sử phiên học nào.',
        startSprintCta: 'Bắt đầu phiên 25 phút →',
        statusCompleted: 'Hoàn thành',
        statusAbandoned: 'Dừng sớm',
        generalStudy: 'Tự học chung',
        quickActions: 'Truy cập nhanh',
        actTimetable: 'Thời khóa biểu',
        actSyllabus: 'Giáo trình',
        actDeadlines: 'Deadline',
        coursesTitle: 'Tiến độ & Thời lượng theo môn học',
        coursesSubtitle: 'Tính tổng hợp dựa trên các mục đề cương, deadline (toàn kỳ) và giờ tập trung.',
        coursesEmptyTitle: 'Chưa có môn học nào',
        coursesEmptyDesc: 'Nhập file .ICS ở trang Thời khóa biểu để hệ thống theo dõi tiến độ từng môn học.',
        goTimetable: 'Mở Thời khóa biểu →',
        itemsDone: (done, total) => `${done}/${total} mục hoàn thành`,
        loadError: 'Không thể tải dữ liệu phân tích. Đang hiển thị giá trị mặc định.',
      }
    : {
        eyebrow: 'STUDY ANALYTICS · OVERVIEW',
        pageTitle: 'Overview',
        subtitle: `${formattedToday} · Focus telemetry & curriculum mastery (${tz})`,
        startFocusBtn: '+ Enter Focus Room',
        kpiFocus: 'Total Focus Time',
        kpiFocusSub: (r) => (r === 'all' ? 'All recorded time' : r === '30d' ? 'Last 30 days' : 'Last 7 days'),
        kpiStreak: 'Current Study Streak',
        kpiStreakUnit: (n) => (n === 1 ? '1 day' : `${n} days`),
        kpiStreakActive: 'Keep the momentum going',
        kpiStreakZero: 'Log 1 sprint to start',
        kpiCompleted: 'Completed Tasks',
        kpiCompletedSub: 'Finished in range',
        kpiOverdue: 'Overdue Tasks',
        kpiOverdueAlert: 'Needs immediate focus',
        kpiOverdueClear: 'All caught up',
        dailyTitle: 'Daily Study Activity',
        dailySubtitle: (r) => (r === '30d' ? 'Focus minutes & completed tasks (Last 30 days)' : 'Focus minutes & completed tasks (Last 7 days)'),
        dailyEmptyHint: 'No completed focus sessions yet in this window.',
        minutesLabel: 'focus min',
        tasksDoneLabel: 'tasks done',
        sessionsTitle: 'Recent Focus Sessions',
        sessionsEmpty: 'No logged focus sessions yet.',
        startSprintCta: 'Start a 25m sprint →',
        statusCompleted: 'Completed',
        statusAbandoned: 'Abandoned',
        generalStudy: 'General Study',
        quickActions: 'Quick Navigation',
        actTimetable: 'Timetable',
        actSyllabus: 'Syllabus',
        actDeadlines: 'Deadlines',
        coursesTitle: 'Course Progress & Focus Breakdown',
        coursesSubtitle: 'Combines all-time syllabus/task mastery with focus time in the selected range.',
        coursesEmptyTitle: 'No Enrolled Courses Yet',
        coursesEmptyDesc: 'Import your Google Calendar (.ics) timetable to unlock per-course progress & focus analytics.',
        goTimetable: 'Open Timetable →',
        itemsDone: (done, total) => `${done}/${total} items done`,
        loadError: 'Unable to load analytics metrics right now.',
      };

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErrorMsg('');
      const dailyRange = getDailyRangeForOverview(range);

      const [overviewRes, dailyRes, sessionsRes] = await Promise.allSettled([
        analyticsApi.getOverview({ range, tz }),
        analyticsApi.getDailyActivity({ range: dailyRange, tz }),
        sessionsApi.listSessions({ limit: 6 }),
      ]);

      if (cancelled) return;

      let hadFailure = false;

      if (overviewRes.status === 'fulfilled' && overviewRes.value && typeof overviewRes.value === 'object') {
        const val = overviewRes.value;
        setOverview({
          totalFocusMinutes: Number(val.totalFocusMinutes) || 0,
          completedTasksCount: Number(val.completedTasksCount) || 0,
          overdueTasksCount: Number(val.overdueTasksCount) || 0,
          currentStreakDays: Number(val.currentStreakDays) || 0,
          courseBreakdown: Array.isArray(val.courseBreakdown) ? val.courseBreakdown : [],
        });
      } else {
        hadFailure = true;
      }

      if (dailyRes.status === 'fulfilled' && Array.isArray(dailyRes.value?.days)) {
        setDailyDays(dailyRes.value.days);
      } else {
        setDailyDays([]);
      }

      if (sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value)) {
        setRecentSessions(sessionsRes.value);
      } else {
        setRecentSessions([]);
      }

      if (hadFailure && overviewRes.reason?.status !== 404) {
        setErrorMsg(overviewRes.reason?.message || t.loadError);
      }

      setHoveredDayIndex(null);
      setLoading(false);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [range, tz, t.loadError]);

  useLayoutEffect(() => {
    if (loading || hasAnimatedRef.current || !containerRef.current) return;
    hasAnimatedRef.current = true;
    const ctx = gsap.context(() => {
      gsap.from('.overview-stagger', {
        y: 14,
        opacity: 0,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  const courseLookup = useMemo(() => {
    const map = new Map();
    for (const c of overview.courseBreakdown) {
      map.set(c.courseId, c);
    }
    return map;
  }, [overview.courseBreakdown]);

  const maxMinutes = useMemo(() => computeMaxDailyMinutes(dailyDays), [dailyDays]);
  const dailyWindowSummary = useMemo(() => {
    let mins = 0;
    let tasks = 0;
    for (const d of dailyDays) {
      mins += Number(d.focusMinutes) || 0;
      tasks += Number(d.tasksCompleted) || 0;
    }
    return { mins, tasks };
  }, [dailyDays]);

  const dailyRangeUsed = getDailyRangeForOverview(range);
  const activeDay =
    hoveredDayIndex !== null && dailyDays[hoveredDayIndex]
      ? dailyDays[hoveredDayIndex]
      : dailyDays[dailyDays.length - 1] || null;

  function handleCourseNavigate(courseId) {
    if (courseId && typeof localStorage !== 'undefined') {
      localStorage.setItem('sfsh_active_course_id', String(courseId));
    }
    navigate('/syllabus');
  }

  return (
    <div ref={containerRef} className="px-4 sm:px-8 py-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <header className="overview-stagger flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{t.eyebrow}</span>
          <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-text mt-1">
            {t.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Range Switcher */}
          <div
            role="group"
            aria-label="Analytics range"
            className="inline-flex items-center rounded-full border border-border/80 bg-surface/80 p-1"
          >
            {RANGE_OPTIONS.map((opt) => {
              const isSelected = range === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setRange(opt.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected ? 'bg-primary text-primary-fg shadow-xs' : 'text-muted hover:text-text'
                  }`}
                >
                  {isVi ? opt.vi : opt.en}
                </button>
              );
            })}
          </div>

          <Link
            to="/focus"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity"
          >
            <span>{t.startFocusBtn}</span>
          </Link>
        </div>
      </header>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400"
        >
          {errorMsg}
        </div>
      )}

      {/* Next Study Action Recommendation Banner (WBS 3.3) */}
      <div className="overview-stagger">
        <RecommendationBanner />
      </div>

      {/* Top 4 KPI Cards */}
      <section className="overview-stagger grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div data-testid="kpi-focus-time" className="glass-card rounded-3xl p-4 sm:p-5 border border-border/80">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">{t.kpiFocus}</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-text tabular-nums">
            {loading ? '—' : formatFocusDuration(overview.totalFocusMinutes, lang)}
          </p>
          <p className="mt-1 text-[11px] text-muted">{t.kpiFocusSub(range)}</p>
        </div>

        <div data-testid="kpi-streak" className="glass-card rounded-3xl p-4 sm:p-5 border border-border/80">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">{t.kpiStreak}</span>
            <span className={`h-2 w-2 rounded-full ${overview.currentStreakDays > 0 ? 'bg-emerald-400' : 'bg-muted/50'}`} />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-primary tabular-nums">
            {loading ? '—' : t.kpiStreakUnit(overview.currentStreakDays)}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {overview.currentStreakDays > 0 ? t.kpiStreakActive : t.kpiStreakZero}
          </p>
        </div>

        <Link
          to="/deadlines"
          data-testid="kpi-completed-tasks"
          className="glass-card rounded-3xl p-4 sm:p-5 border border-border/80 hover:border-primary/40 transition-colors block"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">{t.kpiCompleted}</span>
            <span className="h-2 w-2 rounded-full bg-sky-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-text tabular-nums">
            {loading ? '—' : overview.completedTasksCount}
          </p>
          <p className="mt-1 text-[11px] text-muted">{t.kpiCompletedSub}</p>
        </Link>

        <Link
          to="/deadlines"
          data-testid="kpi-overdue-tasks"
          className={`glass-card rounded-3xl p-4 sm:p-5 border transition-colors block ${
            overview.overdueTasksCount > 0
              ? 'border-rose-500/40 bg-rose-500/[0.04] hover:border-rose-500/60'
              : 'border-border/80 hover:border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">{t.kpiOverdue}</span>
            <span
              className={`h-2 w-2 rounded-full ${
                overview.overdueTasksCount > 0 ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
            />
          </div>
          <p
            className={`mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums ${
              overview.overdueTasksCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {loading ? '—' : overview.overdueTasksCount}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {overview.overdueTasksCount > 0 ? t.kpiOverdueAlert : t.kpiOverdueClear}
          </p>
        </Link>
      </section>

      {/* Middle Bento Grid: Daily Activity Chart (7 cols) + Recent Sessions & Quick Nav (5 cols) */}
      <section className="overview-stagger grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Study Activity Chart */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border border-border/80 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text tracking-tight">{t.dailyTitle}</h2>
              <p className="text-xs text-muted mt-0.5">{t.dailySubtitle(dailyRangeUsed)}</p>
            </div>

            {activeDay && (
              <div
                data-testid="daily-active-summary"
                className="rounded-2xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-right"
              >
                <p className="text-[10px] font-mono font-bold text-primary uppercase">
                  {formatDayChartLabel(activeDay.date, lang)}
                </p>
                <p className="text-xs font-bold text-text">
                  {activeDay.focusMinutes} {t.minutesLabel} · {activeDay.tasksCompleted} {t.tasksDoneLabel}
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-44 rounded-2xl bg-surface-2/60 animate-pulse" />
          ) : dailyDays.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted border border-dashed border-border/60 rounded-2xl">
              {t.dailyEmptyHint}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                data-testid="daily-activity-bars"
                className={`flex items-end ${dailyDays.length > 10 ? 'gap-1' : 'gap-2 sm:gap-3'} h-44 pt-4 px-1 border-b border-border/60`}
              >
                {dailyDays.map((day, index) => {
                  const mins = Number(day.focusMinutes) || 0;
                  const heightPct = maxMinutes > 0 && mins > 0 ? Math.max(8, Math.round((mins / maxMinutes) * 100)) : 4;
                  const isHighlighted =
                    hoveredDayIndex !== null ? hoveredDayIndex === index : index === dailyDays.length - 1;
                  const hasStudy = mins > 0;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      onMouseEnter={() => setHoveredDayIndex(index)}
                      onFocus={() => setHoveredDayIndex(index)}
                      onClick={() => setHoveredDayIndex(index)}
                      aria-label={`${day.date}: ${mins} ${t.minutesLabel}`}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 pb-1 group cursor-pointer focus:outline-none"
                    >
                      {day.tasksCompleted > 0 && (
                        <span
                          title={`${day.tasksCompleted} ${t.tasksDoneLabel}`}
                          className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0"
                        />
                      )}
                      <div
                        className={`w-full max-w-[30px] rounded-t-lg transition-all duration-200 ${
                          hasStudy
                            ? isHighlighted
                              ? 'bg-primary shadow-sm'
                              : 'bg-primary/45 group-hover:bg-primary/75'
                            : 'bg-border/60 group-hover:bg-border'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex items-center justify-between text-[10px] font-mono text-muted px-1">
                {dailyDays.length <= 7 ? (
                  dailyDays.map((d) => (
                    <span key={d.date} className="truncate text-center flex-1">
                      {formatDayChartLabel(d.date, lang)}
                    </span>
                  ))
                ) : (
                  <>
                    <span>{formatDayChartLabel(dailyDays[0]?.date, lang)}</span>
                    <span>{formatDayChartLabel(dailyDays[Math.floor(dailyDays.length / 2)]?.date, lang)}</span>
                    <span>{formatDayChartLabel(dailyDays[dailyDays.length - 1]?.date, lang)}</span>
                  </>
                )}
              </div>

              {maxMinutes === 0 && (
                <p className="text-[11px] text-muted/80 text-center pt-1">{t.dailyEmptyHint}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted">
            <span>
              {formatFocusDuration(dailyWindowSummary.mins, lang)} · {dailyWindowSummary.tasks} {t.tasksDoneLabel}
            </span>
            <span className="inline-flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-primary" /> {t.minutesLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" /> {t.tasksDoneLabel}
              </span>
            </span>
          </div>
        </div>

        {/* Right Column: Recent Focus Sessions + Quick Nav */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-border/80 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-text tracking-tight">{t.sessionsTitle}</h2>
              <Link to="/focus" className="text-xs font-bold text-primary hover:underline">
                {t.startSprintCta}
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-2xl bg-surface-2/60 animate-pulse" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-5 text-center space-y-2">
                <p className="text-xs text-muted">{t.sessionsEmpty}</p>
                <Link
                  to="/focus"
                  className="inline-flex items-center rounded-full bg-primary/15 border border-primary/40 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/25 transition-colors"
                >
                  {t.startSprintCta}
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {recentSessions.map((sess) => {
                  const course = sess.courseId ? courseLookup.get(sess.courseId) : null;
                  const isDone = sess.status === 'COMPLETED';
                  const courseLabel = course
                    ? `${formatCourseInfo({ code: course.courseCode, name: course.courseName }).code} · ${formatCourseInfo({ code: course.courseCode, name: course.courseName }).name}`
                    : t.generalStudy;

                  return (
                    <li
                      key={sess.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface/60 px-3.5 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text truncate">{courseLabel}</p>
                        <p className="text-[10px] font-mono text-muted mt-0.5">
                          {formatSessionTimestamp(sess.startedAt, lang)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-text">{sess.minutes}m</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isDone
                              ? 'border-primary/40 bg-primary/15 text-primary'
                              : 'border-amber-400/40 bg-amber-400/15 text-amber-400'
                          }`}
                        >
                          {isDone ? t.statusCompleted : t.statusAbandoned}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Quick Navigation Links */}
          <div className="glass-card rounded-3xl p-5 border border-border/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t.quickActions}</h3>
            <div className="grid grid-cols-3 gap-2">
              <Link
                to="/timetable"
                className="rounded-2xl border border-border/70 bg-surface/70 px-3 py-2.5 text-center text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-colors"
              >
                {t.actTimetable}
              </Link>
              <Link
                to="/syllabus"
                className="rounded-2xl border border-border/70 bg-surface/70 px-3 py-2.5 text-center text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-colors"
              >
                {t.actSyllabus}
              </Link>
              <Link
                to="/deadlines"
                className="rounded-2xl border border-border/70 bg-surface/70 px-3 py-2.5 text-center text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-colors"
              >
                {t.actDeadlines}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Course Progress & Focus Breakdown */}
      <section className="overview-stagger glass-card rounded-3xl p-5 sm:p-6 border border-border/80 space-y-4">
        <div>
          <h2 className="text-base font-bold text-text tracking-tight">{t.coursesTitle}</h2>
          <p className="text-xs text-muted mt-0.5">{t.coursesSubtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface-2/60 animate-pulse" />
            ))}
          </div>
        ) : overview.courseBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-6 sm:p-8 text-center space-y-3">
            <h3 className="text-sm font-bold text-text">{t.coursesEmptyTitle}</h3>
            <p className="text-xs text-muted max-w-md mx-auto">{t.coursesEmptyDesc}</p>
            <Link
              to="/timetable"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-fg hover:opacity-90 transition-opacity"
            >
              {t.goTimetable}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {overview.courseBreakdown.map((course) => {
              const info = formatCourseInfo({ code: course.courseCode, name: course.courseName });
              const pct = Math.min(100, Math.max(0, Number(course.progressPct) || 0));

              return (
                <button
                  key={course.courseId}
                  type="button"
                  onClick={() => handleCourseNavigate(course.courseId)}
                  className="text-left rounded-2xl border border-border/70 bg-surface/60 p-4 space-y-2.5 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-block rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                        {info.code}
                      </span>
                      <h3 className="text-sm font-bold text-text truncate mt-1 group-hover:text-primary transition-colors">
                        {info.name}
                      </h3>
                    </div>
                    <span className="text-lg font-extrabold text-primary tabular-nums shrink-0">{pct}%</span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden border border-border/50">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                    <span>{t.itemsDone(course.completedItems, course.totalItems)}</span>
                    <span>{formatFocusDuration(course.focusMinutes, lang)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

