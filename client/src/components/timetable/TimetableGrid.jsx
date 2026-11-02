import { useMemo } from 'react';
import { ClassCard } from './ClassCard';
import {
  computeEventLayout,
  END_HOUR,
  HOUR_HEIGHT,
  START_HOUR,
} from '../../utils/timetable';

export function TimetableGrid({ weekDays, events = [], loading = false, onOpenUpload }) {
  const hours = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  }, []);

  const totalGridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  // Group events by dayOfWeek (1 = Monday ... 7 = Sunday)
  const dayEventsMap = useMemo(() => {
    const map = new Map();
    for (let d = 1; d <= 7; d++) {
      map.set(d, []);
    }

    for (const ev of events) {
      const day = ev.dayOfWeek;
      if (day >= 1 && day <= 7) {
        map.get(day).push(ev);
      }
    }

    const layoutMap = new Map();
    for (const [day, dayEvs] of map.entries()) {
      layoutMap.set(day, computeEventLayout(dayEvs, START_HOUR, HOUR_HEIGHT));
    }
    return layoutMap;
  }, [events]);

  const hasEvents = events.length > 0;

  return (
    <div
      data-testid="timetable-grid"
      className="relative rounded-3xl border border-border bg-surface shadow-xs overflow-hidden transition-all"
    >
      <div className="overflow-x-auto min-w-full">
        <div className="min-w-[760px]">
          {/* Header row: Time gutter corner + 7 weekday headers */}
          <div className="sticky top-0 z-30 grid grid-cols-[64px_repeat(7,1fr)] border-b border-border bg-surface/95 backdrop-blur-sm">
            <div className="flex items-center justify-center border-r border-border p-3 text-[11px] font-medium text-muted">
              GMT+7
            </div>

            {weekDays.map((day) => (
              <div
                key={day.dayOfWeek}
                data-testid={`day-header-${day.dayOfWeek}`}
                className={`flex flex-col items-center justify-center py-3 px-2 border-r last:border-r-0 border-border transition-colors ${
                  day.isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
                }`}
              >
                <span className="text-xs font-medium text-muted">{day.label}</span>
                <span
                  className={`mt-1 flex h-7 w-7 items-center justify-center rounded-xl text-sm font-semibold transition-transform ${
                    day.isToday
                      ? 'bg-primary text-primary-fg shadow-xs scale-105'
                      : 'text-text'
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>
            ))}
          </div>

          {/* Grid body with time labels and 7 day columns */}
          <div
            className="relative grid grid-cols-[64px_repeat(7,1fr)] select-none"
            style={{ height: `${totalGridHeight}px` }}
          >
            {/* Time labels column */}
            <div className="relative border-r border-border bg-surface/50">
              {hours.slice(0, -1).map((h, i) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted"
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Horizontal guideline dividers across all columns */}
            <div className="pointer-events-none absolute inset-x-0 inset-y-0 left-[64px]">
              {hours.slice(0, -1).map((h, i) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-b border-border/50"
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                />
              ))}
            </div>

            {/* 7 day columns */}
            {weekDays.map((day) => {
              const dayLayout = dayEventsMap.get(day.dayOfWeek) || [];

              return (
                <div
                  key={day.dayOfWeek}
                  data-testid={`day-column-${day.dayOfWeek}`}
                  className={`relative border-r last:border-r-0 border-border transition-colors ${
                    day.isToday ? 'bg-primary/[0.02] dark:bg-primary/[0.04]' : ''
                  }`}
                >
                  {/* Class events in this day */}
                  {!loading &&
                    dayLayout.map((event) => (
                      <ClassCard key={`${event.scheduleId || event.courseId}-${event.start}`} event={event} />
                    ))}
                </div>
              );
            })}

            {/* Loading Skeleton Overlay */}
            {loading && (
              <div
                data-testid="timetable-skeleton"
                className="absolute inset-0 left-[64px] z-20 grid grid-cols-7 bg-surface/60 backdrop-blur-[2px] transition-opacity"
              >
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="relative p-2 border-r last:border-r-0 border-border/40">
                    {i % 2 === 0 && (
                      <div
                        className="animate-pulse rounded-xl bg-muted/15 border border-border/40 p-3"
                        style={{ height: '110px', marginTop: `${(i * 35) % 180 + 30}px` }}
                      >
                        <div className="h-4 w-16 rounded-md bg-muted/20 mb-2" />
                        <div className="h-3 w-28 rounded-md bg-muted/15 mb-2" />
                        <div className="h-3 w-20 rounded-md bg-muted/15" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when no events exist in this week */}
      {!loading && !hasEvents && (
        <div
          data-testid="timetable-empty"
          className="absolute inset-0 left-0 sm:left-[64px] z-10 flex flex-col items-center justify-center p-8 bg-surface/90 backdrop-blur-xs text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-text">
            Chưa có lịch học tuần này
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            Tuần này bạn chưa có lịch học nào. Bạn có thể nhập file lịch học .ics hoặc chuyển sang tuần kế tiếp.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg shadow-xs hover:opacity-90 transition-opacity"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Nhập lịch học (.ics)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
