// WBS 2.4a.3 — days_left and urgency_badge.
//
//   days_left = ceil((due_at - now) / 24h)
//
//   OVERDUE : due_at < now and status != DONE
//   URGENT  : days_left < 3
//   SOON    : 3 <= days_left <= 7
//   LATER   : days_left > 7
//
// Examples (now = Monday 09:00): due Monday 10:00 -> 1 day (URGENT); due Wednesday 09:00 -> 2 (URGENT);
// due Thursday 09:00 -> 3 (SOON); due next Monday 09:00 -> 7 (SOON); due next Tuesday -> 8 (LATER).
// A task whose status is DONE has no urgency: urgency_badge is null (days_left is still reported).

const DAY_MS = 24 * 60 * 60 * 1000;

const URGENCY = Object.freeze({ OVERDUE: 'OVERDUE', URGENT: 'URGENT', SOON: 'SOON', LATER: 'LATER' });

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid date: ${value}`);
  return date;
}

// Whole days until the deadline, rounded up; 0 when due right now, negative once overdue.
function daysLeft(dueAt, now = new Date()) {
  const diff = toDate(dueAt).getTime() - toDate(now).getTime();
  // `+ 0` turns Math.ceil(-0.5) === -0 into 0.
  return Math.ceil(diff / DAY_MS) + 0;
}

function urgencyBadge({ dueAt, status }, now = new Date()) {
  if (status === 'DONE') return null;
  const due = toDate(dueAt);
  if (due.getTime() < toDate(now).getTime()) return URGENCY.OVERDUE;

  const days = daysLeft(due, now);
  if (days < 3) return URGENCY.URGENT;
  if (days <= 7) return URGENCY.SOON;
  return URGENCY.LATER;
}

// { daysLeft, urgencyBadge } for a task row.
function urgencyOf(task, now = new Date()) {
  return { daysLeft: daysLeft(task.dueAt, now), urgencyBadge: urgencyBadge(task, now) };
}

module.exports = { DAY_MS, URGENCY, daysLeft, urgencyBadge, urgencyOf };
