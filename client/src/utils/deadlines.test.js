import { describe, expect, test } from 'vitest';
import {
  defaultDeadlineInputValue,
  formatDaysLeftLabel,
  getUrgencyConfig,
  toIsoWithTimezoneOffset,
  toLocalDateTimeInputValue,
} from './deadlines';

describe('deadlines utils', () => {
  test('toIsoWithTimezoneOffset outputs ISO-8601 datetime with explicit offset', () => {
    const iso = toIsoWithTimezoneOffset('2026-11-20T23:59');
    expect(iso).toMatch(/^2026-11-20T23:59:00(?:[+-]\d{2}:\d{2}|Z)$/);
  });

  test('toLocalDateTimeInputValue round-trips valid ISO strings', () => {
    const iso = toIsoWithTimezoneOffset('2026-11-20T14:30');
    expect(toLocalDateTimeInputValue(iso)).toBe('2026-11-20T14:30');
    expect(toLocalDateTimeInputValue('')).toBe('');
    expect(toLocalDateTimeInputValue('invalid')).toBe('');
  });

  test('defaultDeadlineInputValue defaults to tomorrow at 23:59', () => {
    const now = new Date('2026-11-12T10:00:00');
    expect(defaultDeadlineInputValue(now)).toBe('2026-11-13T23:59');
  });

  test('formatDaysLeftLabel formats EN and VI accurately', () => {
    expect(formatDaysLeftLabel(-2, 'OVERDUE', 'TODO', 'en')).toBe('Overdue by 2 days');
    expect(formatDaysLeftLabel(-1, 'OVERDUE', 'TODO', 'vi')).toBe('Quá hạn 1 ngày');
    expect(formatDaysLeftLabel(0, 'URGENT', 'TODO', 'en')).toBe('Due today');
    expect(formatDaysLeftLabel(1, 'URGENT', 'TODO', 'vi')).toBe('Còn 1 ngày');
    expect(formatDaysLeftLabel(5, 'SOON', 'TODO', 'en')).toBe('Due in 5 days');
    expect(formatDaysLeftLabel(5, null, 'DONE', 'vi')).toBe('Đã hoàn thành');
  });

  test('getUrgencyConfig maps badges and DONE state properly', () => {
    expect(getUrgencyConfig('OVERDUE', 'TODO', 'en').key).toBe('OVERDUE');
    expect(getUrgencyConfig('URGENT', 'DOING', 'vi').label).toBe('Khẩn cấp');
    expect(getUrgencyConfig(null, 'DONE', 'en').key).toBe('DONE');
  });
});

