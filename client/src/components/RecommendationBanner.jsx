import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/languageContext';
import { getBrowserTimeZone, recommendationApi } from '../lib/api';
import { formatCourseInfo } from '../utils/courseFormat';
import { formatDaysLeftLabel } from '../utils/deadlines';
import {
  DEFAULT_TIMER_SETTINGS,
  POMODORO_SETTINGS_KEY,
  getInitialPomodoroState,
  loadPersistedSession,
  persistSession,
} from '../utils/pomodoro';

function loadSavedTimerSettings() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(POMODORO_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_TIMER_SETTINGS, ...JSON.parse(saved) };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_TIMER_SETTINGS;
}

const URGENCY_STYLES = {
  OVERDUE: 'border-rose-500/40 bg-rose-500/15 text-rose-400',
  URGENT: 'border-orange-500/40 bg-orange-500/15 text-orange-400',
  SOON: 'border-amber-400/40 bg-amber-400/15 text-amber-400',
  LATER: 'border-sky-400/40 bg-sky-400/15 text-sky-400',
};

export function RecommendationBanner({ refreshKey = 0 }) {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFormula, setShowFormula] = useState(false);

  const t = isVi
    ? {
        eyebrow: 'ĐỀ XUẤT HỌC TẬP TIẾP THEO · SCORE ENGINE',
        taskTag: 'NHIỆM VỤ ƯU TIÊN SỐ 1',
        topicTag: 'ÔN TẬP ĐỀ CƯƠNG SẮP TỚI',
        emptyTag: 'CHƯA CÓ GỢI Ý HỌC TẬP',
        priorityScore: 'Điểm ưu tiên',
        startFocusCta: 'Vào Focus Room ngay →',
        openSyllabusCta: 'Xem đề cương →',
        viewAllTasks: (n) => `Đứng đầu trong ${n} nhiệm vụ đang mở`,
        linkedTopic: 'Chủ đề:',
        autoLinked: '(Tự động chọn chương tiếp theo)',
        statusDoing: 'ĐANG HỌC',
        statusTodo: 'CHƯA HỌC',
        breakdownBtn: 'Giải thích điểm số',
        hideBreakdownBtn: 'Ẩn chi tiết điểm',
        baseTermLabel: 'Độ gấp deadline',
        topicTermLabel: 'Điểm cộng chủ đề',
        overdueTermLabel: 'Điểm cộng quá hạn',
        totalTermLabel: 'Tổng điểm ưu tiên',
        formulaCaption:
          'Công thức: 10 / (max(daysLeft, 0) + 0.5) + (chủ đề DOING ? 5 : 2) + (quá hạn ? 3 : 0)',
        nextClassLabel: 'Buổi học gần nhất:',
        emptyTitle: 'Sẵn sàng lên kế hoạch học tập',
        emptyDesc:
          'Nhập thời khóa biểu (.ics), trích xuất đề cương hoặc tạo deadline đầu tiên để hệ thống tính toán lộ trình học tiếp theo.',
        importIcsCta: 'Nhập Thời khóa biểu →',
        addTaskCta: '+ Tạo Deadline',
        urgency: {
          OVERDUE: 'QUÁ HẠN',
          URGENT: 'KHẨN CẤP',
          SOON: 'SẮP TỚI',
          LATER: 'THONG THẢ',
        },
      }
    : {
        eyebrow: 'NEXT STUDY ACTION · EXPLAINABLE RECOMMENDATION',
        taskTag: 'TOP PRIORITY DEADLINE',
        topicTag: 'UPCOMING CLASS TOPIC',
        emptyTag: 'NO ACTIVE SUGGESTION',
        priorityScore: 'Priority Score',
        startFocusCta: 'Start Focus Session →',
        openSyllabusCta: 'Open Syllabus →',
        viewAllTasks: (n) => `Ranked #1 of ${n} open task${n === 1 ? '' : 's'}`,
        linkedTopic: 'Topic:',
        autoLinked: '(Auto-linked next chapter)',
        statusDoing: 'DOING',
        statusTodo: 'TODO',
        breakdownBtn: 'Score Breakdown',
        hideBreakdownBtn: 'Hide Breakdown',
        baseTermLabel: 'Deadline urgency',
        topicTermLabel: 'Topic status bonus',
        overdueTermLabel: 'Overdue penalty bonus',
        totalTermLabel: 'Total priority score',
        formulaCaption:
          'Formula: 10 / (max(daysLeft, 0) + 0.5) + (topic DOING ? 5 : 2) + (overdue ? 3 : 0)',
        nextClassLabel: 'Next class:',
        emptyTitle: 'Ready to Rank Your Study Plan',
        emptyDesc:
          'Import your .ics timetable, extract syllabus chapters, or add a deadline so the engine can recommend what to study next.',
        importIcsCta: 'Import Timetable →',
        addTaskCta: '+ Add Deadline',
        urgency: {
          OVERDUE: 'OVERDUE',
          URGENT: 'URGENT',
          SOON: 'SOON',
          LATER: 'LATER',
        },
      };

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendation() {
      if (!recommendationApi?.getNextAction) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMsg('');
      try {
        const tz = getBrowserTimeZone();
        const data = await recommendationApi.getNextAction({ tz });
        if (cancelled) return;
        if (data && typeof data === 'object') {
          setRecommendation(data);
        } else {
          setRecommendation(null);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err?.message || '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecommendation();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function handleLaunchFocusRoom() {
    const courseId = recommendation?.course?.id || recommendation?.task?.courseId || null;
    const topicId = recommendation?.topic?.id || recommendation?.task?.topicId || null;

    try {
      const settings = loadSavedTimerSettings();
      const existing = loadPersistedSession(settings) || getInitialPomodoroState(settings);
      const updated = {
        ...existing,
        activeCourseId: courseId ?? existing.activeCourseId,
        activeTopicId: topicId ?? existing.activeTopicId,
      };
      persistSession(updated);
      if (courseId && typeof localStorage !== 'undefined') {
        localStorage.setItem('sfsh_active_course_id', String(courseId));
      }
    } catch {
      // ignore storage errors
    }

    navigate('/focus');
  }

  function handleOpenSyllabus() {
    const courseId = recommendation?.course?.id || recommendation?.task?.courseId || null;
    if (courseId && typeof localStorage !== 'undefined') {
      localStorage.setItem('sfsh_active_course_id', String(courseId));
    }
    navigate('/syllabus');
  }

  if (loading) {
    return (
      <section
        data-testid="recommendation-skeleton"
        aria-busy="true"
        className="glass-card rounded-3xl p-5 sm:p-6 border border-border/80 animate-pulse space-y-3"
      >
        <div className="h-3.5 w-48 rounded-full bg-surface-2" />
        <div className="h-6 w-3/4 rounded-xl bg-surface-2" />
        <div className="h-4 w-1/2 rounded-xl bg-surface-2" />
      </section>
    );
  }

  if (errorMsg || !recommendation) {
    return null;
  }

  const { kind, task, topic, topicAutoLinked, course, score, scoreBreakdown, nextClass, openTaskCount, reason } =
    recommendation;

  if (kind === 'EMPTY') {
    return (
      <section
        data-testid="recommendation-banner"
        data-recommendation-kind="EMPTY"
        className="glass-card rounded-3xl p-5 sm:p-6 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              {t.eyebrow}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-text">{t.emptyTitle}</h2>
          <p className="text-xs text-muted max-w-2xl">{t.emptyDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/timetable"
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-fg hover:opacity-90 transition-opacity"
          >
            {t.importIcsCta}
          </Link>
          <Link
            to="/deadlines"
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 transition-colors"
          >
            {t.addTaskCta}
          </Link>
        </div>
      </section>
    );
  }

  const courseInfo = course ? formatCourseInfo(course) : null;
  const isTask = kind === 'TASK' && task;
  const urgencyBadge = isTask ? task.urgencyBadge || (task.status === 'OVERDUE' ? 'OVERDUE' : 'SOON') : null;
  const urgencyClass = urgencyBadge ? URGENCY_STYLES[urgencyBadge] || URGENCY_STYLES.SOON : '';

  return (
    <section
      data-testid="recommendation-banner"
      data-recommendation-kind={kind}
      className="glass-card rounded-3xl p-5 sm:p-6 border border-primary/40 bg-gradient-to-br from-primary/[0.08] via-surface/90 to-surface/90 shadow-lg space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left & Center details */}
        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>{isTask ? t.taskTag : t.topicTag}</span>
            </span>

            {courseInfo && (
              <span className="rounded-lg border border-border bg-surface/90 px-2.5 py-0.5 text-[11px] font-mono font-bold text-text">
                {courseInfo.code} · {courseInfo.name}
              </span>
            )}

            {urgencyBadge && (
              <span
                data-testid="recommendation-urgency-badge"
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-extrabold uppercase ${urgencyClass}`}
              >
                {t.urgency[urgencyBadge] || urgencyBadge} · {formatDaysLeftLabel(task.daysLeft, urgencyBadge, task.status, lang)}
              </span>
            )}

            {isTask && openTaskCount > 0 && (
              <span className="text-[11px] font-mono text-muted">{t.viewAllTasks(openTaskCount)}</span>
            )}
          </div>

          <h2
            data-testid="recommendation-title"
            className="text-lg sm:text-xl font-extrabold tracking-tight text-text"
          >
            {isTask ? task.title : topic?.title}
          </h2>

          {/* Linked syllabus topic or upcoming class */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            {topic && (
              <div className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-text/80">{t.linkedTopic}</span>
                <span
                  data-testid="recommendation-topic-title"
                  className="font-semibold text-primary"
                >
                  {topic.title}
                </span>
                <span className="rounded bg-surface-2 border border-border/70 px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted">
                  {topic.status === 'DOING' ? t.statusDoing : t.statusTodo}
                </span>
                {topicAutoLinked && (
                  <span className="text-[11px] italic text-muted">{t.autoLinked}</span>
                )}
              </div>
            )}

            {!isTask && nextClass && (
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-text/80 font-sans font-semibold">{t.nextClassLabel}</span>
                <span>{nextClass.start}</span>
                {nextClass.location && <span>· {nextClass.location}</span>}
              </div>
            )}
          </div>

          {/* Inline scorebreakdown pills for TASK */}
          {isTask && scoreBreakdown && (
            <div
              data-testid="recommendation-score-pills"
              className="flex flex-wrap items-center gap-2 pt-1"
            >
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[11px] font-mono font-extrabold text-primary">
                <span>{t.priorityScore}:</span>
                <span data-testid="recommendation-score-value">{score}</span>
              </span>

              <span className="rounded-full border border-border/80 bg-surface/80 px-2.5 py-1 text-[11px] font-mono text-muted">
                {t.baseTermLabel}: <strong className="text-text">+{scoreBreakdown.baseUrgencyScore}</strong>
              </span>

              <span className="rounded-full border border-border/80 bg-surface/80 px-2.5 py-1 text-[11px] font-mono text-muted">
                {t.topicTermLabel}: <strong className="text-text">+{scoreBreakdown.topicDoingBonus}</strong>
              </span>

              {scoreBreakdown.overdueBonus > 0 && (
                <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-mono text-rose-400">
                  {t.overdueTermLabel}: <strong>+{scoreBreakdown.overdueBonus}</strong>
                </span>
              )}

              <button
                type="button"
                data-testid="toggle-score-breakdown-btn"
                onClick={() => setShowFormula((v) => !v)}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer ml-1"
              >
                {showFormula ? t.hideBreakdownBtn : t.breakdownBtn}
              </button>
            </div>
          )}

          {!isTask && reason && (
            <p className="text-xs text-muted font-mono pt-0.5">{reason}</p>
          )}
        </div>

        {/* Right Action CTAs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="recommendation-start-focus-btn"
            onClick={handleLaunchFocusRoom}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-fg shadow-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span>{t.startFocusCta}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSyllabus}
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface/90 px-4 py-2.5 text-xs font-semibold text-text hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
          >
            {t.openSyllabusCta}
          </button>
        </div>
      </div>

      {/* Expandable Explainable Score Breakdown Drawer */}
      {isTask && scoreBreakdown && showFormula && (
        <div
          data-testid="recommendation-breakdown-panel"
          className="rounded-2xl border border-border/80 bg-surface/90 p-4 space-y-2.5 text-xs"
        >
          <p className="font-mono text-text font-semibold">{reason}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
            <div className="rounded-xl border border-border/60 bg-surface-2/50 p-2.5">
              <span className="text-[10px] text-muted block">{t.baseTermLabel}</span>
              <span className="text-sm font-bold text-text">+{scoreBreakdown.baseUrgencyScore}</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface-2/50 p-2.5">
              <span className="text-[10px] text-muted block">{t.topicTermLabel}</span>
              <span className="text-sm font-bold text-text">+{scoreBreakdown.topicDoingBonus}</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface-2/50 p-2.5">
              <span className="text-[10px] text-muted block">{t.overdueTermLabel}</span>
              <span className="text-sm font-bold text-text">+{scoreBreakdown.overdueBonus}</span>
            </div>
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-2.5">
              <span className="text-[10px] text-primary block">{t.totalTermLabel}</span>
              <span className="text-sm font-extrabold text-primary">{score}</span>
            </div>
          </div>
          <p className="text-[11px] font-mono text-muted">{t.formulaCaption}</p>
        </div>
      )}
    </section>
  );
}
