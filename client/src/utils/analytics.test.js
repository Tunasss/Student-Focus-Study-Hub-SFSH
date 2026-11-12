import { describe, expect, test } from 'vitest';
import {
  computeMaxDailyMinutes,
  formatDayChartLabel,
  formatFocusDuration,
  getDailyRangeForOverview,
  toIsoDateTimeWithOffset,
} from './analytics';

describe('analytics utils', () => {
  test('toIsoDateTimeWithOffset emits valid ISO-8601 datetime with offset', () => {
    const iso = toIsoDateTimeWithOffset(new Date('2026-11-12T10:15:30.000Z'));
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  test('formatFocusDuration formats minutes cleanly in EN and VI', () => {
    expect(formatFocusDuration(0, 'en')).toBe('0m');
    expect(formatFocusDuration(25, 'en')).toBe('25m');
    expect(formatFocusDuration(90, 'en')).toBe('1h 30m');
    expect(formatFocusDuration(120, 'vi')).toBe('2 giờ');
    expect(formatFocusDuration(75, 'vi')).toBe('1g 15p');
  });

  test('getDailyRangeForOverview maps all to 30d and keeps 7d/30d', () => {
    expect(getDailyRangeForOverview('7d')).toBe('7d');
    expect(getDailyRangeForOverview('30d')).toBe('30d');
    expect(getDailyRangeForOverview('all')).toBe('30d');
  });

  test('formatDayChartLabel formats YYYY-MM-DD cleanly', () => {
    const label = formatDayChartLabel('2026-11-12', 'en');
    expect(label).toMatch(/11\/12|12/);
  });

  test('computeMaxDailyMinutes finds highest daily value safely', () => {
    expect(computeMaxDailyMinutes([])).toBe(0);
    expect(computeMaxDailyMinutes([{ focusMinutes: 25 }, { focusMinutes: 75 }])).toBe(75);
  });
});

