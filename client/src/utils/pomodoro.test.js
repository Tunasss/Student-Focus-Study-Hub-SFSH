import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateRemainingTime,
  DEFAULT_TIMER_SETTINGS,
  formatTime,
  getInitialPomodoroState,
  loadPersistedSession,
  persistSession,
  POMODORO_STORAGE_KEY,
  resetPomodoroSession,
  skipToNextPhase,
  startPomodoroSession,
  tickPomodoroSession,
} from './pomodoro';

describe('pomodoro engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTime', () => {
    it('formats seconds into mm:ss string', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(59)).toBe('00:59');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(1500)).toBe('25:00');
      expect(formatTime(300)).toBe('05:00');
      expect(formatTime(900)).toBe('15:00');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatTime(-10)).toBe('00:00');
      expect(formatTime(null)).toBe('00:00');
    });
  });

  describe('getInitialPomodoroState', () => {
    it('creates a fresh idle state with default settings', () => {
      const state = getInitialPomodoroState(DEFAULT_TIMER_SETTINGS);
      expect(state.phase).toBe('focus');
      expect(state.status).toBe('idle');
      expect(state.remainingSeconds).toBe(1500);
      expect(state.durationSeconds).toBe(1500);
      expect(state.cycleCount).toBe(1);
      expect(state.accumulatedSeconds).toBe(0);
    });
  });

  describe('start, tick and pause transitions', () => {
    it('starts session and transitions status to running', () => {
      const now = 1000000;
      vi.setSystemTime(now);

      const state = getInitialPomodoroState();
      const started = startPomodoroSession(state);

      expect(started.status).toBe('running');
      expect(started.startedAt).toBe(now);
      expect(started.lastTickAt).toBe(now);
    });

    it('ticks and decrements remaining seconds properly', () => {
      const start = 1000000;
      vi.setSystemTime(start);

      let state = startPomodoroSession(getInitialPomodoroState());

      // Advance 10 seconds
      vi.setSystemTime(start + 10000);
      state = tickPomodoroSession(state);

      expect(state.remainingSeconds).toBe(1490);
      expect(state.accumulatedSeconds).toBe(10);
      expect(state.status).toBe('running');
    });

    it('transitions to completed when focus time runs out', () => {
      const start = 1000000;
      vi.setSystemTime(start);

      let state = startPomodoroSession(getInitialPomodoroState());

      // Advance full 1500 seconds (25 mins)
      vi.setSystemTime(start + 1500000);
      state = tickPomodoroSession(state);

      expect(state.remainingSeconds).toBe(0);
      expect(state.status).toBe('completed');
    });
  });

  describe('phase transitions (4-cycle rule)', () => {
    it('advances from focus to short break for cycles 1, 2, 3', () => {
      const state = {
        ...getInitialPomodoroState(),
        phase: 'focus',
        cycleCount: 1,
        status: 'completed',
      };

      const next = skipToNextPhase(state, DEFAULT_TIMER_SETTINGS);
      expect(next.phase).toBe('shortBreak');
      expect(next.remainingSeconds).toBe(300); // 5 min
      expect(next.cycleCount).toBe(1);
    });

    it('advances from focus to long break after 4th cycle', () => {
      const state = {
        ...getInitialPomodoroState(),
        phase: 'focus',
        cycleCount: 4,
        status: 'completed',
      };

      const next = skipToNextPhase(state, DEFAULT_TIMER_SETTINGS);
      expect(next.phase).toBe('longBreak');
      expect(next.remainingSeconds).toBe(900); // 15 min
      expect(next.cycleCount).toBe(4);
    });

    it('increments cycle and returns to focus after a break', () => {
      const state = {
        ...getInitialPomodoroState(),
        phase: 'shortBreak',
        cycleCount: 1,
        status: 'completed',
      };

      const next = skipToNextPhase(state, DEFAULT_TIMER_SETTINGS);
      expect(next.phase).toBe('focus');
      expect(next.remainingSeconds).toBe(1500);
      expect(next.cycleCount).toBe(2);
    });
  });

  describe('session persistence & reload recovery', () => {
    it('persists session to localStorage and recovers exact remaining time', () => {
      const start = 1000000;
      vi.setSystemTime(start);

      const state = startPomodoroSession(getInitialPomodoroState());
      persistSession(state);

      expect(localStorage.getItem(POMODORO_STORAGE_KEY)).toBeTruthy();

      // Simulate browser reload 40 seconds later
      vi.setSystemTime(start + 40000);
      const recovered = loadPersistedSession(DEFAULT_TIMER_SETTINGS);

      expect(recovered).not.toBeNull();
      expect(recovered.status).toBe('running');
      expect(recovered.remainingSeconds).toBe(1460);
      expect(recovered.accumulatedSeconds).toBe(40);
    });

    it('resets session and clears storage', () => {
      const state = startPomodoroSession(getInitialPomodoroState());
      persistSession(state);

      const reset = resetPomodoroSession(state, DEFAULT_TIMER_SETTINGS);
      expect(reset.status).toBe('idle');
      expect(reset.remainingSeconds).toBe(1500);
      expect(loadPersistedSession()).toBeNull();
    });
  });

  describe('calculateRemainingTime', () => {
    it('computes accurate remaining delta regardless of interval jitter', () => {
      const startedAt = 1000000;
      const durationSeconds = 1500;
      const currentTime = startedAt + 120000; // 2 minutes later

      const remaining = calculateRemainingTime(startedAt, durationSeconds, currentTime);
      expect(remaining).toBe(1380); // 23 minutes left
    });
  });
});
