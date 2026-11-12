/**
 * Analytics & Session Formatting Helpers (WBS 3.4)
 */

export function toIsoDateTimeWithOffset(input = Date.now()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const pad = (n) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

export function formatFocusDuration(totalMinutes, lang = 'en') {
  const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const isVi = lang === 'vi';
  if (mins === 0) return isVi ? '0 phút' : '0m';

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours === 0) return isVi ? `${rem} phút` : `${rem}m`;
  if (rem === 0) return isVi ? `${hours} giờ` : `${hours}h`;
  return isVi ? `${hours}g ${rem}p` : `${hours}h ${rem}m`;
}

export function getDailyRangeForOverview(overviewRange) {
  return overviewRange === '30d' || overviewRange === 'all' ? '30d' : '7d';
}

export function formatDayChartLabel(isoDateStr, lang = 'en') {
  if (!isoDateStr || typeof isoDateStr !== 'string') return '';
  const parts = isoDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDateStr;

  const [y, m, d] = parts;
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate);
}

export function formatSessionTimestamp(isoStr, lang = 'en') {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function computeMaxDailyMinutes(days = []) {
  if (!Array.isArray(days) || days.length === 0) return 0;
  return days.reduce((max, item) => Math.max(max, Number(item?.focusMinutes) || 0), 0);
}

