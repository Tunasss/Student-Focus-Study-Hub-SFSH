import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, subDays } from 'date-fns';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '../i18n/languageContext';
import { scheduleApi } from '../lib/api';
import { getCoursePalette, getWeekDates, getWeekRangeStrings } from '../utils/timetable';
import { TimetableGrid } from '../components/timetable/TimetableGrid';
import { IcsUploadModal } from '../components/timetable/IcsUploadModal';

gsap.registerPlugin(useGSAP);

const TIMETABLE_COPY = {
  en: {
    badge: 'WEEKLY TIMETABLE',
    title: 'Class Schedule & Rooms',
    subtitle: 'Track classes Monday through Sunday with instant Google Calendar (.ics) sync.',
    importBtn: 'Import ICS',
    clearBtn: 'Clear Timetable',
    confirmClearTitle: 'Clear Current Timetable?',
    confirmClearMsg: 'Are you sure you want to remove all classes from the current schedule view?',
    confirmClearAction: 'Yes, Clear All',
    cancel: 'Cancel',
    toastClearSuccess: 'Timetable cleared successfully!',
    prevWeek: 'Previous week',
    today: 'Today',
    nextWeek: 'Next week',
    coursesLabel: 'Courses:',
    retry: 'Retry',
    loadError: 'Unable to load schedule for this week.',
    toastSuccess: (count) => `Successfully imported ${count} classes into your timetable!`,
    daysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  vi: {
    badge: 'THỜI KHÓA BIỂU TUẦN',
    title: 'Lịch học & Giảng đường',
    subtitle: 'Theo dõi các ca học từ Thứ 2 đến Chủ Nhật, hỗ trợ đồng bộ file lịch Google Calendar (.ics).',
    importBtn: 'Nhập lịch ICS',
    clearBtn: 'Xóa TKB',
    confirmClearTitle: 'Xóa thời khóa biểu?',
    confirmClearMsg: 'Bạn có chắc chắn muốn xóa toàn bộ lịch học đang hiển thị trên thời khóa biểu không?',
    confirmClearAction: 'Đồng ý xóa',
    cancel: 'Hủy',
    toastClearSuccess: 'Đã xóa thời khóa biểu thành công!',
    prevWeek: 'Tuần trước',
    today: 'Hôm nay',
    nextWeek: 'Tuần sau',
    coursesLabel: 'Môn học:',
    retry: 'Thử lại',
    loadError: 'Không thể tải lịch học cho tuần này.',
    toastSuccess: (count) => `Đã nhập thành công ${count} lịch học vào thời khóa biểu!`,
    daysShort: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
  },
};

export function TimetablePage() {
  const { lang } = useLanguage();
  const t = TIMETABLE_COPY[lang] || TIMETABLE_COPY.en;

  const containerRef = useRef(null);
  const [pivotDate, setPivotDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const weekDays = useMemo(() => {
    const raw = getWeekDates(pivotDate);
    return raw.map((d, idx) => ({
      ...d,
      label: t.daysShort[idx] || d.label,
    }));
  }, [pivotDate, t.daysShort]);

  const range = useMemo(() => getWeekRangeStrings(pivotDate), [pivotDate]);

  // Unique courses for legend
  const coursesLegend = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const parenMatch = !ev.courseCode ? ev.courseName?.match(/\(([^()]+)\)$/) : null;
      const code = ev.courseCode || parenMatch?.[1];
      const name = parenMatch ? ev.courseName.replace(/\s*\([^()]+\)$/, '') : ev.courseName;
      const key = code || name || String(ev.courseId);
      if (!map.has(key)) {
        map.set(key, {
          key,
          code,
          name,
          palette: getCoursePalette(key),
        });
      }
    }
    return Array.from(map.values());
  }, [events]);

  useEffect(() => {
    let cancelled = false;

    scheduleApi
      .getSchedule(range.from, range.to)
      .then((data) => {
        if (!cancelled) {
          setEvents(data?.events || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || t.loadError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, refreshKey, t.loadError]);

  // 60fps GPU-only entrance for class cards only
  useGSAP(
    () => {
      if (loading) return;
      const cards = containerRef.current?.querySelectorAll('[data-testid="class-card"]');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 6 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.012,
            duration: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        );
      }
    },
    { scope: containerRef, dependencies: [loading, events], revertOnUpdate: true },
  );

  function handlePrevWeek() {
    setLoading(true);
    setPivotDate((current) => subDays(current, 7));
  }

  function handleNextWeek() {
    setLoading(true);
    setPivotDate((current) => addDays(current, 7));
  }

  function handleToday() {
    setLoading(true);
    setPivotDate(new Date());
    setRefreshKey((k) => k + 1);
  }

  function handleRetry() {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }

  function handleUploadSuccess(result) {
    const count = result?.schedulesImported || result?.eventsRead || 0;
    setToastMessage(t.toastSuccess(count));
    setLoading(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleConfirmClear() {
    setEvents([]);
    setIsClearConfirmOpen(false);
    setToastMessage(t.toastClearSuccess);
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <div
      ref={containerRef}
      className="min-h-[calc(100vh-65px)] w-full px-4 sm:px-8 py-6 space-y-6 font-sans"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl bg-success/10 border border-success/20 px-4 py-3 text-sm font-medium text-success shadow-xs"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded-lg p-1 hover:bg-success/15 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header section (Compact & Streamlined) */}
      <div className="timetable-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{t.badge}</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            {t.subtitle}
          </p>
        </div>

        {/* Header Action Buttons (Import ICS + Clear Timetable) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>Asia/Ho_Chi_Minh (GMT+7)</span>
          </div>

          {events.length > 0 && (
            <button
              type="button"
              data-testid="clear-timetable-button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-danger/30 bg-danger/10 px-3.5 py-2 text-xs font-bold text-danger hover:bg-danger/20 transition-colors shadow-2xs"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{t.clearBtn}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="import-ics-button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{t.importBtn}</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Week Switcher (Compact Rounded Design) */}
      <div className="timetable-toolbar glass-card flex flex-col gap-3 rounded-2xl p-3.5 sm:flex-row sm:items-center sm:justify-between border border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-0.5">
            <button
              type="button"
              data-testid="prev-week-btn"
              onClick={handlePrevWeek}
              aria-label={t.prevWeek}
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              data-testid="today-btn"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-text hover:bg-surface rounded-lg transition-colors"
            >
              {t.today}
            </button>

            <button
              type="button"
              data-testid="next-week-btn"
              onClick={handleNextWeek}
              aria-label={t.nextWeek}
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <span data-testid="week-range-label" className="text-xs sm:text-sm font-bold text-text pl-1 sm:pl-2">
            {range.displayLabel}
          </span>
        </div>

        {/* Legend for courses */}
        {coursesLegend.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 sm:py-0 text-xs">
            <span className="text-muted shrink-0 text-[11px] font-semibold">{t.coursesLabel}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {coursesLegend.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-0.5 text-[11px] font-bold text-text"
                >
                  <span className={`h-2 w-2 rounded-full ${c.palette.dot}`} />
                  <span className="truncate max-w-[120px]">{c.code || c.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-2xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-lg bg-danger/15 px-3 py-1 font-medium hover:bg-danger/20 transition-colors"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Main Timetable Grid */}
      <TimetableGrid
        weekDays={weekDays}
        events={events}
        loading={loading}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Confirmation Modal for Clearing Timetable */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 border border-border shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger/15 text-danger text-xl">
                🗑️
              </span>
              <div>
                <h3 className="text-base font-bold text-text">{t.confirmClearTitle}</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{t.confirmClearMsg}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                data-testid="confirm-clear-action-btn"
                onClick={handleConfirmClear}
                className="rounded-full bg-danger px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                {t.confirmClearAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ICS Upload Modal */}
      <IcsUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
