import { describe, expect, test } from 'vitest';
import {
  computeEventLayout,
  formatTimeRange,
  formatTimeShort,
  getCoursePalette,
  getWeekDates,
  getWeekRangeStrings,
  parseTimeToMinutes,
} from './timetable';

describe('timetable utilities', () => {
  test('getCoursePalette returns a consistent palette for the same course code', () => {
    const p1 = getCoursePalette('CS101');
    const p2 = getCoursePalette('CS101');
    expect(p1.id).toBe(p2.id);
    expect(p1.card).toBeDefined();
    expect(p1.badge).toBeDefined();
    expect(p1.dot).toBeDefined();
  });

  test('getWeekDates returns 7 days starting with Monday (dayOfWeek 1..7)', () => {
    const fixedDate = new Date('2026-10-28T10:00:00'); // Wednesday
    const week = getWeekDates(fixedDate);
    expect(week).toHaveLength(7);
    expect(week[0].dayOfWeek).toBe(1); // Monday
    expect(week[0].label).toBe('T2');
    expect(week[0].dateString).toBe('2026-10-26');
    expect(week[6].dayOfWeek).toBe(7); // Sunday
    expect(week[6].label).toBe('CN');
    expect(week[6].dateString).toBe('2026-11-01');
  });

  test('getWeekRangeStrings formats range properly for API', () => {
    const fixedDate = new Date('2026-10-28T10:00:00');
    const range = getWeekRangeStrings(fixedDate);
    expect(range.from).toBe('2026-10-26');
    expect(range.to).toBe('2026-11-02');
    expect(range.displayLabel).toContain('26/10');
  });

  test('parseTimeToMinutes handles both ISO string and simple HH:mm', () => {
    expect(parseTimeToMinutes('08:30')).toBe(510);
    expect(parseTimeToMinutes('2026-10-26T08:30')).toBe(510);
    expect(parseTimeToMinutes('2026-10-26T14:15:00')).toBe(855);
  });

  test('formatTimeShort and formatTimeRange format times cleanly', () => {
    expect(formatTimeShort('2026-10-26T08:30')).toBe('08:30');
    expect(formatTimeRange('2026-10-26T08:00', '2026-10-26T10:30')).toBe('08:00 - 10:30');
  });

  test('computeEventLayout calculates positions and side-by-side layout for overlapping classes', () => {
    const events = [
      {
        id: 1,
        courseCode: 'CS101',
        courseName: 'Computer Science',
        start: '2026-10-26T08:00',
        end: '2026-10-26T10:00',
      },
      {
        id: 2,
        courseCode: 'MATH201',
        courseName: 'Calculus',
        start: '2026-10-26T09:00',
        end: '2026-10-26T11:00',
      },
      {
        id: 3,
        courseCode: 'ENG102',
        courseName: 'English',
        start: '2026-10-26T14:00',
        end: '2026-10-26T16:00',
      },
    ];

    const layout = computeEventLayout(events, 7, 64);
    expect(layout).toHaveLength(3);

    const ev1 = layout.find((e) => e.id === 1);
    const ev2 = layout.find((e) => e.id === 2);
    const ev3 = layout.find((e) => e.id === 3);

    // ev1 and ev2 overlap between 09:00 and 10:00 -> side by side
    expect(ev1.totalColumns).toBe(2);
    expect(ev2.totalColumns).toBe(2);
    expect(ev1.column).not.toBe(ev2.column);
    expect(ev1.widthPercent).toBe(50);
    expect(ev2.widthPercent).toBe(50);
    expect(ev1.leftPercent + ev2.leftPercent).toBe(50); // One is 0%, one is 50%

    // ev3 does not overlap with 1 or 2
    expect(ev3.totalColumns).toBe(1);
    expect(ev3.column).toBe(0);
    expect(ev3.widthPercent).toBe(100);
    expect(ev3.leftPercent).toBe(0);

    // top and height calculations
    // 08:00 is 1 hour after START_HOUR (07:00) -> top = 64px
    expect(ev1.top).toBe(64);
    // 2 hours duration -> 2 * 64 - 4 = 124px
    expect(ev1.height).toBe(124);
  });
});
