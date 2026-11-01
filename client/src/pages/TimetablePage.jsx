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

  // Lightweight 60fps GPU-only entrance for class cards only (no heavy layout or header re-tweening)
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
            stagger: 0.015,
            duration: 0.22,
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

  return (
    <div ref={containerRef} className="space-y-6">
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

      {/* Header section */}
      <div className="timetable-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{t.badge}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t.subtitle}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>Asia/Ho_Chi_Minh (GMT+7)</span>
          </div>

          <button
            type="button"
            data-testid="import-ics-button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-sm luma-glow-sm hover:opacity-90 transition-opacity"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{t.importBtn}</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Week Switcher (Zero backdrop-blur for 60fps scroll) */}
      <div className="timetable-toolbar glass-card flex flex-col gap-3.5 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-1">
            <button
              type="button"
              data-testid="prev-week-btn"
              onClick={handlePrevWeek}
              aria-label={t.prevWeek}
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              data-testid="today-btn"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-text hover:bg-surface rounded-lg transition-colors"
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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <span data-testid="week-range-label" className="text-sm font-semibold text-text pl-1 sm:pl-2">
            {range.displayLabel}
          </span>
        </div>

        {/* Legend for courses */}
        {coursesLegend.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 sm:py-0 text-xs">
            <span className="text-muted shrink-0">{t.coursesLabel}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {coursesLegend.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 font-medium text-text"
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

      {/* ICS Upload Modal */}
      <IcsUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
