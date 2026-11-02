/**
 * Core Pomodoro Engine & Session Recovery Utilities
 * Implements Section 6.4 of Project Master v4:
 *   - 25m focus / 5m short break, 15m long break after every 4 focus cycles.
 *   - States: idle, running, paused, completed, abandoned.
 *   - Reload persistence: stores startedAt, lastTickAt, and accumulatedMs in localStorage
 *     so browser reloads restore active sessions accurately using Date.now().
 */

export const POMODORO_STORAGE_KEY = 'sfsh_pomodoro_session';
export const POMODORO_SETTINGS_KEY = 'sfsh_pomodoro_settings';

export const DEFAULT_TIMER_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundNotification: true,
};

/**
 * Formats seconds into standard mm:ss digital format
 */
export function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Calculates remaining seconds using wall-clock delta to prevent drift on tab sleep/throttling
 */
export function calculateRemainingTime(startedAt, durationSeconds, currentTime = Date.now(), pausedRemaining = null) {
  if (pausedRemaining !== null) {
    return Math.max(0, pausedRemaining);
  }
  if (!startedAt) {
    return durationSeconds;
  }
  const elapsedSec = Math.floor((currentTime - startedAt) / 1000);
  return Math.max(0, durationSeconds - elapsedSec);
}

/**
 * Generates fresh initial idle Pomodoro state
 */
export function getInitialPomodoroState(settings = DEFAULT_TIMER_SETTINGS) {
  const duration = (settings.focusMinutes || 25) * 60;
  return {
    phase: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
    status: 'idle', // 'idle' | 'running' | 'paused' | 'completed' | 'abandoned'
    durationSeconds: duration,
    remainingSeconds: duration,
    startedAt: null,
    lastTickAt: null,
    accumulatedSeconds: 0,
    cycleCount: 1, // Current cycle (1, 2, 3, 4...)
    activeCourseId: null,
    activeTopicId: null,
  };
}

/**
 * Starts or restarts a session
 */
export function startPomodoroSession(state) {
  const now = Date.now();
  return {
    ...state,
    status: 'running',
    startedAt: now,
    lastTickAt: now,
  };
}

/**
 * Pauses a running session
 */
export function pausePomodoroSession(state) {
  if (state.status !== 'running') return state;
  return {
    ...state,
    status: 'paused',
    pausedRemaining: state.remainingSeconds,
  };
}

/**
 * Resumes a paused session
 */
export function resumePomodoroSession(state) {
  if (state.status !== 'paused') return state;
  const now = Date.now();
  // Compute synthetic startedAt so delta calculation continues seamlessly
  const elapsedBeforePause = state.durationSeconds - (state.pausedRemaining ?? state.remainingSeconds);
  const newStartedAt = now - elapsedBeforePause * 1000;

  return {
    ...state,
    status: 'running',
    startedAt: newStartedAt,
    lastTickAt: now,
    pausedRemaining: null,
  };
}

/**
 * Ticks session by comparing current wall-clock time with startedAt
 */
export function tickPomodoroSession(state) {
  if (state.status !== 'running' || !state.startedAt) {
    return state;
  }

  const now = Date.now();
  const remaining = calculateRemainingTime(state.startedAt, state.durationSeconds, now);
  const accumulated = state.durationSeconds - remaining;

  if (remaining <= 0) {
    return {
      ...state,
      remainingSeconds: 0,
      accumulatedSeconds: state.durationSeconds,
      status: 'completed',
      lastTickAt: now,
    };
  }

  return {
    ...state,
    remainingSeconds: remaining,
    accumulatedSeconds: Math.max(state.accumulatedSeconds, accumulated),
    lastTickAt: now,
  };
}

/**
 * Advances to the next phase based on standard 4-cycle Pomodoro rules:
 *   - After focus (cycle 1, 2, 3) -> short break
 *   - After focus (cycle 4) -> long break
 *   - After short/long break -> focus of next cycle
 */
export function skipToNextPhase(state, settings = DEFAULT_TIMER_SETTINGS) {
  const isFocus = state.phase === 'focus';
  let nextPhase;
  let nextCycle = state.cycleCount;
  let nextDuration;

  if (isFocus) {
    const isFourthCycle = state.cycleCount % (settings.longBreakInterval || 4) === 0;
    if (isFourthCycle) {
      nextPhase = 'longBreak';
      nextDuration = (settings.longBreakMinutes || 15) * 60;
    } else {
      nextPhase = 'shortBreak';
      nextDuration = (settings.shortBreakMinutes || 5) * 60;
    }
  } else {
    // Coming from break -> next focus cycle
    nextPhase = 'focus';
    nextCycle = state.cycleCount + 1;
    nextDuration = (settings.focusMinutes || 25) * 60;
  }

  return {
    ...state,
    phase: nextPhase,
    status: 'idle',
    cycleCount: nextCycle,
    durationSeconds: nextDuration,
    remainingSeconds: nextDuration,
    startedAt: null,
    lastTickAt: null,
    accumulatedSeconds: 0,
    pausedRemaining: null,
  };
}

/**
 * Resets the session back to idle
 */
export function resetPomodoroSession(state, settings = DEFAULT_TIMER_SETTINGS) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(POMODORO_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  const duration = (state.phase === 'focus'
    ? settings.focusMinutes || 25
    : state.phase === 'shortBreak'
      ? settings.shortBreakMinutes || 5
      : settings.longBreakMinutes || 15) * 60;

  return {
    ...state,
    status: 'idle',
    durationSeconds: duration,
    remainingSeconds: duration,
    startedAt: null,
    lastTickAt: null,
    accumulatedSeconds: 0,
    pausedRemaining: null,
  };
}

/**
 * Persists session state to localStorage
 */
export function persistSession(state) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota or disabled
  }
}

/**
 * Recovers persisted session across page reloads using Date.now() delta
 */
export function loadPersistedSession(_settings = DEFAULT_TIMER_SETTINGS) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || typeof session !== 'object') return null;

    // If session was running when the page reloaded, re-compute remaining time
    if (session.status === 'running' && session.startedAt) {
      const now = Date.now();
      const remaining = calculateRemainingTime(session.startedAt, session.durationSeconds, now);
      if (remaining <= 0) {
        return {
          ...session,
          remainingSeconds: 0,
          accumulatedSeconds: session.durationSeconds,
          status: 'completed',
          lastTickAt: now,
        };
      }
      return {
        ...session,
        remainingSeconds: remaining,
        accumulatedSeconds: session.durationSeconds - remaining,
        lastTickAt: now,
      };
    }

    return session;
  } catch {
    return null;
  }
}
