import { addDays, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';

export const START_HOUR = 7;
export const END_HOUR = 21;
export const HOUR_HEIGHT = 64; // px per hour

export const COURSE_PALETTES = [
  {
    id: 'emerald',
    card: 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100 border-emerald-300/80 dark:border-emerald-700/60 shadow-xs hover:border-emerald-400 hover:shadow-md',
    badge: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 border-emerald-400/40',
    dot: 'bg-emerald-500',
    accent: '#10b981',
  },
  {
    id: 'indigo',
    card: 'bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-100 border-indigo-300/80 dark:border-indigo-700/60 shadow-xs hover:border-indigo-400 hover:shadow-md',
    badge: 'bg-indigo-600/15 text-indigo-800 dark:text-indigo-200 border-indigo-400/40',
    dot: 'bg-indigo-500',
    accent: '#6366f1',
  },
  {
    id: 'sky',
    card: 'bg-sky-100/90 dark:bg-sky-950/70 text-sky-900 dark:text-sky-100 border-sky-300/80 dark:border-sky-700/60 shadow-xs hover:border-sky-400 hover:shadow-md',
    badge: 'bg-sky-600/15 text-sky-800 dark:text-sky-200 border-sky-400/40',
    dot: 'bg-sky-500',
    accent: '#0ea5e9',
  },
  {
    id: 'amber',
    card: 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100 border-amber-300/80 dark:border-amber-700/60 shadow-xs hover:border-amber-400 hover:shadow-md',
    badge: 'bg-amber-600/15 text-amber-800 dark:text-amber-200 border-amber-400/40',
    dot: 'bg-amber-500',
    accent: '#f59e0b',
  },
  {
    id: 'rose',
    card: 'bg-rose-100/90 dark:bg-rose-950/70 text-rose-900 dark:text-rose-100 border-rose-300/80 dark:border-rose-700/60 shadow-xs hover:border-rose-400 hover:shadow-md',
    badge: 'bg-rose-600/15 text-rose-800 dark:text-rose-200 border-rose-400/40',
    dot: 'bg-rose-500',
    accent: '#f43f5e',
  },
  {
    id: 'purple',
    card: 'bg-purple-100/90 dark:bg-purple-950/70 text-purple-900 dark:text-purple-100 border-purple-300/80 dark:border-purple-700/60 shadow-xs hover:border-purple-400 hover:shadow-md',
    badge: 'bg-purple-600/15 text-purple-800 dark:text-purple-200 border-purple-400/40',
    dot: 'bg-purple-500',
    accent: '#a855f7',
  },
  {
    id: 'teal',
    card: 'bg-teal-100/90 dark:bg-teal-950/70 text-teal-900 dark:text-teal-100 border-teal-300/80 dark:border-teal-700/60 shadow-xs hover:border-teal-400 hover:shadow-md',
    badge: 'bg-teal-600/15 text-teal-800 dark:text-teal-200 border-teal-400/40',
    dot: 'bg-teal-500',
    accent: '#14b8a6',
  },
  {
    id: 'orange',
    card: 'bg-orange-100/90 dark:bg-orange-950/70 text-orange-900 dark:text-orange-100 border-orange-300/80 dark:border-orange-700/60 shadow-xs hover:border-orange-400 hover:shadow-md',
    badge: 'bg-orange-600/15 text-orange-800 dark:text-orange-200 border-orange-400/40',
    dot: 'bg-orange-500',
    accent: '#f97316',
  },
];

export function getCoursePalette(key) {
  if (!key) return COURSE_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COURSE_PALETTES.length;
  return COURSE_PALETTES[index];
}

const VI_WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const VI_WEEKDAYS_LONG = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

export function getWeekDates(pivot = new Date()) {
  const monday = startOfWeek(pivot, { weekStartsOn: 1 });
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return {
      date: d,
      dateString: format(d, 'yyyy-MM-dd'),
      dayOfWeek: i + 1, // 1 (Mon) to 7 (Sun)
      label: VI_WEEKDAYS[i],
      longLabel: VI_WEEKDAYS_LONG[i],
      formattedDate: format(d, 'dd/MM'),
      dayNumber: format(d, 'd'),
      isToday: isSameDay(d, today),
    };
  });
}

export function getWeekRangeStrings(pivot = new Date()) {
  const monday = startOfWeek(pivot, { weekStartsOn: 1 });
  const sunday = endOfWeek(pivot, { weekStartsOn: 1 });
  return {
    from: format(monday, 'yyyy-MM-dd'),
    to: format(addDays(sunday, 1), 'yyyy-MM-dd'), // API uses exclusive [from, to)
    displayLabel: `${format(monday, 'dd/MM')} – ${format(sunday, 'dd/MM/yyyy')}`,
  };
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // If format is ISO local: "2026-10-26T08:30" or "08:30"
  const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
  const [hours, minutes] = timePart.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function formatTimeShort(timeStr) {
  if (!timeStr) return '';
  const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr;
  const parts = timePart.split(':');
  return `${parts[0]}:${parts[1]}`;
}

export function formatTimeRange(startStr, endStr) {
  return `${formatTimeShort(startStr)} - ${formatTimeShort(endStr)}`;
}

/**
 * Computes side-by-side positioning for overlapping events in a single day.
 * Implements interval graph coloring with column packing.
 */
export function computeEventLayout(events, startHour = START_HOUR, hourHeight = HOUR_HEIGHT) {
  if (!events || events.length === 0) return [];

  const prepared = events.map((event) => {
    const startMin = parseTimeToMinutes(event.start);
    const endMin = parseTimeToMinutes(event.end);
    return {
      ...event,
      startMin,
      endMin: Math.max(endMin, startMin + 30), // Minimum 30 mins for visibility
    };
  });

  // Sort by start time, then duration descending
  prepared.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  // Determine overlapping groups
  const columns = [];
  const assigned = prepared.map((event) => {
    let col = columns.findIndex((colEvents) => {
      const last = colEvents[colEvents.length - 1];
      return last.endMin <= event.startMin;
    });

    if (col === -1) {
      col = columns.length;
      columns.push([]);
    }

    columns[col].push(event);
    return { ...event, column: col };
  });

  // Compute cluster totalColumns for each event
  return assigned.map((event, _, all) => {
    const overlapping = all.filter((other) => other.startMin < event.endMin && other.endMin > event.startMin);
    const totalColumns = Math.max(...overlapping.map((o) => o.column + 1), 1);

    const top = Math.max(0, ((event.startMin - startHour * 60) / 60) * hourHeight);
    const durationHours = (event.endMin - event.startMin) / 60;
    const height = Math.max(durationHours * hourHeight - 4, 38);

    const widthPercent = 100 / totalColumns;
    const leftPercent = event.column * widthPercent;

    return {
      ...event,
      totalColumns,
      top,
      height,
      widthPercent,
      leftPercent,
      palette: getCoursePalette(event.courseCode || event.courseName || String(event.courseId || '')),
    };
  });
}
