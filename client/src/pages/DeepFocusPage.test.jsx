import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/languageContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { DeepFocusPage } from './DeepFocusPage';
import {
  POMODORO_STORAGE_KEY,
} from '../utils/pomodoro';

// Mock GSAP to prevent JSDOM autoAlpha: 0 freezing
vi.mock('gsap', () => ({
  default: {
    context: (cb) => {
      cb();
      return { revert: vi.fn() };
    },
    timeline: () => ({
      fromTo: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
    }),
    to: vi.fn(),
  },
}));

// Mock Web Audio API
class MockAudioNode {
  connect() {}
  disconnect() {}
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

class MockOscillatorNode extends MockAudioNode {
  type = 'sine';
  frequency = {
    value: 432,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  currentTime = 0;
  destination = new MockAudioNode();
  createGain() {
    return new MockGainNode();
  }
  createOscillator() {
    return new MockOscillatorNode();
  }
  createBufferSource() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      loop: false,
      buffer: null,
    };
  }
  createBiquadFilter() {
    return {
      connect: vi.fn(),
      type: 'lowpass',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
    };
  }
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(100),
    };
  }
  close() {
    return Promise.resolve();
  }
}

async function renderDeepFocus() {
  let view;
  await act(async () => {
    view = render(
      <LanguageProvider>
        <ThemeProvider>
          <MemoryRouter>
            <DeepFocusPage />
          </MemoryRouter>
        </ThemeProvider>
      </LanguageProvider>
    );
  });
  return view;
}

describe('DeepFocusPage Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { courses: [], topics: [] } }),
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('renders initial Deep Focus layout with 25:00 countdown and 4 study sprints', async () => {
    await renderDeepFocus();

    expect(screen.getByRole('heading', { level: 1, name: /Deep Focus|Tập trung sâu/i })).toBeInTheDocument();
    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');
    expect(screen.getByText(/Study Sprints|Lộ trình phiên học/i)).toBeInTheDocument();
    expect(screen.getByText(/Sprint 01|Phiên 01/i)).toBeInTheDocument();
    expect(screen.getByText(/Sprint 04|Phiên 04/i)).toBeInTheDocument();
    expect(screen.getByTestId('play-pause-btn')).toBeInTheDocument();
    expect(screen.getByTestId('skip-phase-btn')).toBeInTheDocument();
    expect(screen.getByTestId('reset-timer-btn')).toBeInTheDocument();
  });

  test('starts and pauses pomodoro timer when clicking play/pause button', async () => {
    vi.useFakeTimers();
    await renderDeepFocus();

    const playBtn = screen.getByTestId('play-pause-btn');

    // Click to start
    fireEvent.click(playBtn);
    expect(document.title).toContain('Deep Focus');

    // Advance 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Expect time to decrement
    expect(screen.getByTestId('timer-display')).toHaveTextContent('24:57');

    // Click to pause
    fireEvent.click(playBtn);
    expect(document.title).toContain('Paused');

    // Advance another 2 seconds - timer should remain paused at 24:57
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('24:57');

    vi.useRealTimers();
  });

  test('skips from focus sprint to short break', async () => {
    await renderDeepFocus();

    const skipBtn = screen.getByTestId('skip-phase-btn');
    fireEvent.click(skipBtn);

    // Should transition to Short Break (05:00)
    expect(screen.getByRole('heading', { level: 1, name: /Short Break|Nghỉ giải lao ngắn/i })).toBeInTheDocument();
    expect(screen.getByTestId('timer-display')).toHaveTextContent('05:00');
  });

  test('resets session back to initial duration on reset button click', async () => {
    vi.useFakeTimers();
    await renderDeepFocus();

    const playBtn = screen.getByTestId('play-pause-btn');
    fireEvent.click(playBtn);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('24:55');

    const resetBtn = screen.getByTestId('reset-timer-btn');
    fireEvent.click(resetBtn);

    expect(screen.getByTestId('timer-display')).toHaveTextContent('25:00');

    vi.useRealTimers();
  });

  test('opens and interacts with AudioMixerModal', async () => {
    await renderDeepFocus();

    const soundBtn = screen.getByTestId('open-mixer-btn');
    fireEvent.click(soundBtn);

    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Lo-Fi Radio & Ambient Mixer|Đài Lo-Fi & Bộ trộn âm thanh môi trường/i)).toBeInTheDocument();
    expect(screen.getByText(/432Hz Binaural Beats|Sóng não 432Hz/i)).toBeInTheDocument();

    // Close modal via close button
    const closeBtn = screen.getByLabelText(/Close modal|Đóng/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens and saves settings via TimerSettingsModal', async () => {
    await renderDeepFocus();

    const settingsBtn = screen.getByTestId('open-settings-btn');
    fireEvent.click(settingsBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Timer & Notification Settings|Cài đặt thời gian & Thông báo/i)).toBeInTheDocument();

    // Select 45m focus duration
    const btn45m = screen.getByRole('button', { name: '45m' });
    fireEvent.click(btn45m);

    // Save preferences
    const saveBtn = screen.getByRole('button', { name: /Save Preferences|Lưu cài đặt/i });
    fireEvent.click(saveBtn);

    // Timer display should update to 45:00
    await waitFor(() => {
      expect(screen.getByTestId('timer-display')).toHaveTextContent('45:00');
    });
  });

  test('recovers running session from localStorage across reloads', async () => {
    // Simulate active session started 60 seconds ago
    const startedAt = Date.now() - 60000;
    const persisted = {
      phase: 'focus',
      status: 'running',
      durationSeconds: 1500,
      remainingSeconds: 1440,
      startedAt,
      lastTickAt: Date.now(),
      accumulatedSeconds: 60,
      cycleCount: 1,
      activeCourseId: null,
      activeTopicId: null,
    };
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(persisted));

    await renderDeepFocus();

    // Remaining seconds: 1500 - 60 = 1440 = 24:00
    expect(screen.getByTestId('timer-display')).toHaveTextContent('24:00');
  });

  test('interacts with Quick Master Volume button and hover slider', async () => {
    await renderDeepFocus();

    const volumeBtn = screen.getByTestId('quick-volume-btn');
    expect(volumeBtn).toBeInTheDocument();

    // Hover reveals slider popover
    fireEvent.mouseEnter(volumeBtn.parentElement);
    expect(screen.getByLabelText(/Master Volume Slider/i)).toBeInTheDocument();

    // Change slider value
    const slider = screen.getByLabelText(/Master Volume Slider/i);
    fireEvent.change(slider, { target: { value: '0.45' } });
    expect(screen.getByText('45%')).toBeInTheDocument();

    // Clicking volume button toggles mute
    fireEvent.click(volumeBtn);
    expect(screen.getByText('MUTE')).toBeInTheDocument();
  });
});
