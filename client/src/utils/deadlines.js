const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Formats a Date (or ISO string) into `YYYY-MM-DDTHH:mm` in the local timezone
 * for `<input type="datetime-local">`.
 */
export function toLocalDateTimeInputValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * Default deadline for new tasks: tomorrow at 23:59 local time.
 */
export function defaultDeadlineInputValue(now = new Date()) {
  const target = new Date(now.getTime() + DAY_MS);
  target.setHours(23, 59, 0, 0);
  return toLocalDateTimeInputValue(target);
}

/**
 * Converts a `<input type="datetime-local">` value (`YYYY-MM-DDTHH:mm`) into
 * an ISO-8601 string with explicit local timezone offset (e.g. `+07:00`),
 * matching the API's `z.iso.datetime({ offset: true })` contract.
 */
export function toIsoWithTimezoneOffset(localDateTimeStr) {
  if (!localDateTimeStr) return null;
  const date = new Date(localDateTimeStr);
  if (Number.isNaN(date.getTime())) return null;

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad2(Math.floor(absOffset / 60));
  const offsetMins = pad2(absOffset % 60);

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}${sign}${offsetHours}:${offsetMins}`;
}

export function formatDeadlineDate(value, lang = 'en') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDaysLeftLabel(daysLeft, urgencyBadge, status, lang = 'en') {
  const isVi = lang === 'vi';
  if (status === 'DONE') {
    return isVi ? 'Đã hoàn thành' : 'Completed';
  }
  if (typeof daysLeft !== 'number' || Number.isNaN(daysLeft)) {
    return '';
  }

  if (urgencyBadge === 'OVERDUE' || daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    if (overdueDays === 0) return isVi ? 'Vừa quá hạn' : 'Just overdue';
    if (overdueDays === 1) return isVi ? 'Quá hạn 1 ngày' : 'Overdue by 1 day';
    return isVi ? `Quá hạn ${overdueDays} ngày` : `Overdue by ${overdueDays} days`;
  }

  if (daysLeft === 0) return isVi ? 'Hạn hôm nay' : 'Due today';
  if (daysLeft === 1) return isVi ? 'Còn 1 ngày' : 'Due in 1 day';
  return isVi ? `Còn ${daysLeft} ngày` : `Due in ${daysLeft} days`;
}

export function getUrgencyConfig(urgencyBadge, status, lang = 'en') {
  const isVi = lang === 'vi';

  if (status === 'DONE' || urgencyBadge === null) {
    return {
      key: 'DONE',
      label: isVi ? 'Hoàn thành' : 'Completed',
      badgeClass: 'border-primary/40 bg-primary/15 text-primary',
      dotClass: 'bg-primary',
      cardAccentClass: 'border-primary/25 bg-primary/[0.03]',
    };
  }

  switch (urgencyBadge) {
    case 'OVERDUE':
      return {
        key: 'OVERDUE',
        label: isVi ? 'Quá hạn' : 'Overdue',
        badgeClass: 'border-rose-500/40 bg-rose-500/15 text-rose-400',
        dotClass: 'bg-rose-500',
        cardAccentClass: 'border-rose-500/35 bg-rose-500/[0.03]',
      };
    case 'URGENT':
      return {
        key: 'URGENT',
        label: isVi ? 'Khẩn cấp' : 'Urgent',
        badgeClass: 'border-amber-400/50 bg-amber-400/15 text-amber-400',
        dotClass: 'bg-amber-400',
        cardAccentClass: 'border-amber-400/30 bg-amber-400/[0.02]',
      };
    case 'SOON':
      return {
        key: 'SOON',
        label: isVi ? 'Sắp đến hạn' : 'Soon',
        badgeClass: 'border-sky-400/40 bg-sky-400/15 text-sky-400',
        dotClass: 'bg-sky-400',
        cardAccentClass: 'border-border/80 bg-surface/40',
      };
    case 'LATER':
    default:
      return {
        key: 'LATER',
        label: isVi ? 'Còn nhiều thời gian' : 'Later',
        badgeClass: 'border-border/80 bg-surface-2 text-muted',
        dotClass: 'bg-muted/70',
        cardAccentClass: 'border-border/60 bg-surface/20',
      };
  }
}

