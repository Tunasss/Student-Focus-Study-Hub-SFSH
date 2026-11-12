import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';
import { RadiantLotusLogo, RadiantShield } from '../components/focus/RadiantLotusLogo';
import { RealWorldClock } from '../components/focus/RealWorldClock';
import { LofiRadioModal } from '../components/focus/LofiRadioModal';
import { AmbientMixerModal } from '../components/focus/AmbientMixerModal';
import { AudioMixerModal } from '../components/focus/AudioMixerModal';
import { GenreSwitchToast } from '../components/focus/GenreSwitchToast';
import { TimerSettingsModal } from '../components/focus/TimerSettingsModal';
import { FocusSubjectPicker } from '../components/focus/FocusSubjectPicker';
import { TopicCompletionModal } from '../components/focus/TopicCompletionModal';
import {
  DEFAULT_TIMER_SETTINGS,
  POMODORO_SETTINGS_KEY,
  formatTime,
  getInitialPomodoroState,
  loadPersistedSession,
  pausePomodoroSession,
  persistSession,
  resetPomodoroSession,
  resumePomodoroSession,
  skipToNextPhase,
  startPomodoroSession,
  tickPomodoroSession,
} from '../utils/pomodoro';
import { audioMixer } from '../utils/audioMixer';
import { sessionsApi, syllabusApi } from '../lib/api';
import { formatFocusDuration, toIsoDateTimeWithOffset } from '../utils/analytics';

function countTodayFocusStats(sessions = []) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  let minutes = 0;
  let count = 0;
  for (const s of sessions) {
    if (s?.status !== 'COMPLETED' || !s?.startedAt) continue;
    const d = new Date(s.startedAt);
    if (`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey) {
      minutes += Number(s.minutes) || 0;
      count += 1;
    }
  }
  return { minutes, count };
}

const FOCUS_COPY = {
  en: {
    back: 'Back to Overview',
    studioTag: 'FOCUS STUDIO',
    settingsBtn: 'Timer Settings',
    soundscapesBtn: 'Soundscapes',
    radioBtn: 'Lo-Fi Radio',
    titleFocus: 'Deep Focus',
    titleShortBreak: 'Short Break',
    titleLongBreak: 'Long Break',
    practiceHeader: 'Study Sprints',
    sprintSubtitle: '4-cycle Pomodoro progression',
    statusIdle: 'Idle',
    statusRunning: 'In Session',
    statusPaused: 'Paused',
    statusCompleted: 'Sprint Done',
    start: 'Start Focus',
    pause: 'Pause Timer',
    resume: 'Resume Sprint',
    reset: 'Reset Timer',
    skip: 'Skip to Next Phase',
    cycleLabel: 'Cycle',
    viewOverview: 'View Overview Dashboard →',
    viewTimetable: 'View Timetable Schedule →',
    todayLogged: (dur, count) => `Logged today: ${dur} (${count})`,
    sessionSaved: (mins) => `Focus sprint logged (+${mins}m)`,
    topicMarkedDone: (name) => `Marked "${name}" as DONE! 🎉`,
    sprints: [
      { id: 1, title: 'Sprint 01 · Cognitive Flow', duration: '25 min focus' },
      { id: 2, title: 'Sprint 02 · Deep Problem Solving', duration: '25 min focus' },
      { id: 3, title: 'Sprint 03 · Knowledge Consolidation', duration: '25 min focus' },
      { id: 4, title: 'Sprint 04 · Final Push & Review', duration: '25 min + 15m Recharge' },
    ],
  },
  vi: {
    back: 'Về Tổng quan',
    studioTag: 'FOCUS STUDIO',
    settingsBtn: 'Cài đặt thời gian',
    soundscapesBtn: 'Âm thanh nền',
    radioBtn: 'Đài Lo-Fi',
    titleFocus: 'Tập trung sâu',
    titleShortBreak: 'Nghỉ giải lao ngắn',
    titleLongBreak: 'Nghỉ giải lao dài',
    practiceHeader: 'Lộ trình phiên học',
    sprintSubtitle: 'Chu kỳ 4 phiên Pomodoro',
    statusIdle: 'Sẵn sàng',
    statusRunning: 'Đang tập trung',
    statusPaused: 'Tạm dừng',
    statusCompleted: 'Hoàn thành phiên',
    start: 'Bắt đầu học',
    pause: 'Tạm dừng',
    resume: 'Tiếp tục',
    reset: 'Đặt lại thời gian',
    skip: 'Chuyển sang giai đoạn tiếp',
    cycleLabel: 'Phiên',
    viewOverview: 'Xem Bảng Tổng Quan →',
    viewTimetable: 'Xem Thời Khóa Biểu →',
    todayLogged: (dur, count) => `Hôm nay: ${dur} (${count} phiên)`,
    sessionSaved: (mins) => `Đã lưu phiên tập trung (+${mins} phút)`,
    topicMarkedDone: (name) => `Đã đánh dấu "${name}" hoàn thành! 🎉`,
    sprints: [
      { id: 1, title: 'Phiên 01 · Khởi động luồng tập trung', duration: '25 phút học sâu' },
      { id: 2, title: 'Phiên 02 · Giải quyết bài toán khó', duration: '25 phút học sâu' },
      { id: 3, title: 'Phiên 03 · Tổng hợp kiến thức', duration: '25 phút học sâu' },
      { id: 4, title: 'Phiên 04 · Về đích & Nghỉ dài', duration: '25 phút + 15p Nghỉ sạc lại' },
    ],
  },
};

function loadInitialSettings() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(POMODORO_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_TIMER_SETTINGS, ...JSON.parse(saved) };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_TIMER_SETTINGS;
}

export function DeepFocusPage() {
  const { lang } = useLanguage();
  const t = FOCUS_COPY[lang] || FOCUS_COPY.en;
  const navigate = useNavigate();

  const containerRef = useRef(null);

  const [settings, setSettings] = useState(loadInitialSettings);
  const [session, setSession] = useState(() => loadPersistedSession(settings) || getInitialPomodoroState(settings));

  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [isAmbientOpen, setIsAmbientOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [topicPrompt, setTopicPrompt] = useState(null); // { topicId, topicTitle, courseCode }
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && !!document.fullscreenElement
  );
  const [activeSoundCount, setActiveSoundCount] = useState(0);
  const [mixerState, setMixerState] = useState(() => audioMixer.getState());
  const [genreSwitchNotification, setGenreSwitchNotification] = useState(null);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const volumeCloseTimerRef = useRef(null);
  const [todayFocusStats, setTodayFocusStats] = useState({ minutes: 0, count: 0 });
  const [sessionLogNotice, setSessionLogNotice] = useState('');
  const lastLoggedSessionRef = useRef(
    session.phase === 'focus' && session.status === 'completed' && session.startedAt
      ? `${session.startedAt}-COMPLETED`
      : null
  );

  function handleVolumeMouseEnter() {
    if (volumeCloseTimerRef.current) {
      clearTimeout(volumeCloseTimerRef.current);
      volumeCloseTimerRef.current = null;
    }
    setIsVolumeHovered(true);
  }

  function handleVolumeMouseLeave() {
    volumeCloseTimerRef.current = setTimeout(() => {
      setIsVolumeHovered(false);
    }, 250);
  }

  // Sync fullscreen state
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(typeof document !== 'undefined' && !!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { });
    } else {
      document.exitFullscreen?.().catch(() => { });
    }
  }

  // Sync active audio tracks indicator & subscribe to events (Pure reactive, zero polling intervals)
  useEffect(() => {
    function updateMixer() {
      const state = audioMixer.getState();
      setMixerState(state);
      const count = Object.values(state.tracks).filter((tr) => tr.isPlaying).length;
      setActiveSoundCount(count);
    }
    updateMixer();

    const unsubGenre = audioMixer.onGenreSwitch((payload) => {
      setGenreSwitchNotification(payload);
      updateMixer();
    });

    const unsubTrack = audioMixer.onTrackChange(() => {
      updateMixer();
    });

    return () => {
      unsubGenre?.();
      unsubTrack?.();
    };
  }, []);

  // Pomodoro interval ticker
  useEffect(() => {
    if (session.status !== 'running') return undefined;

    const interval = window.setInterval(() => {
      setSession((prev) => {
        const next = tickPomodoroSession(prev);
        persistSession(next);

        if (next.status === 'completed' && prev.status !== 'completed') {
          if (settings.soundNotification) {
            audioMixer.playCompletionChime();
          }
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(
                next.phase === 'focus' ? 'Focus Sprint Completed! 🎉' : 'Break Finished! ⚡',
                {
                  body:
                    next.phase === 'focus'
                      ? 'Great work! Take a refreshing break.'
                      : 'Ready to dive back into deep focus?',
                }
              );
            } catch {
              // ignore
            }
          }
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session.status, settings.soundNotification]);

  // Dynamic document title
  useEffect(() => {
    const originalTitle = document.title;
    if (session.status === 'running') {
      document.title = `(${formatTime(session.remainingSeconds)}) 🌿 Deep Focus · Luma`;
    } else if (session.status === 'paused') {
      document.title = `(Paused) 🌿 Deep Focus · Luma`;
    } else {
      document.title = '🌿 Deep Focus · Luma';
    }
    return () => {
      document.title = originalTitle;
    };
  }, [session.status, session.remainingSeconds]);

  // Entrance animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.center-radiant-stage',
        { scale: 0.94, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.55, clearProps: 'opacity,visibility,transform' }
      )
        .fromTo(
          '.left-widget-card',
          { x: -20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.3'
        )
        .fromTo(
          '.right-session-card',
          { x: 20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.06, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Load today's logged focus stats from API (WBS 3.4)
  useEffect(() => {
    let cancelled = false;
    sessionsApi
      .listSessions({ status: 'COMPLETED', limit: 50 })
      .then((list) => {
        if (!cancelled && Array.isArray(list)) {
          setTodayFocusStats(countTodayFocusStats(list));
        }
      })
      .catch(() => {
        // Ignore gracefully when offline or mocked
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Automatically log completed focus sprints to POST /api/sessions (WBS 3.4)
  useEffect(() => {
    if (session.phase !== 'focus' || session.status !== 'completed' || !session.startedAt) {
      return;
    }
    const key = `${session.startedAt}-COMPLETED`;
    if (lastLoggedSessionRef.current === key) return;
    lastLoggedSessionRef.current = key;

    const minutes = Math.min(240, Math.max(1, Math.round((session.durationSeconds || 1500) / 60)));
    sessionsApi
      .logSession({
        startedAt: toIsoDateTimeWithOffset(session.startedAt),
        minutes,
        status: 'COMPLETED',
        courseId: session.activeCourseId || null,
        topicId: session.activeTopicId || null,
      })
      .then(() => {
        setTodayFocusStats((prev) => ({
          minutes: prev.minutes + minutes,
          count: prev.count + 1,
        }));
        setSessionLogNotice(t.sessionSaved(minutes));

        // WBS 3.4 / Section 6.5: Prompt user if activeTopicId is set
        if (session.activeTopicId) {
          syllabusApi
            .getCourseTopics(session.activeCourseId)
            .then((topics) => {
              const active = Array.isArray(topics)
                ? topics.find((tp) => tp.id === session.activeTopicId)
                : null;
              if (active && active.status !== 'DONE') {
                setTopicPrompt({
                  topicId: active.id,
                  topicTitle: active.title,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Timer UI remains responsive even if API logging fails
      });
  }, [session.phase, session.status, session.startedAt, session.durationSeconds, session.activeCourseId, session.activeTopicId, t]);

  function logAbandonedFocusIfElapsed(current) {
    if (
      current.phase !== 'focus' ||
      (current.status !== 'running' && current.status !== 'paused') ||
      !current.startedAt
    ) {
      return;
    }
    const elapsedSeconds = Math.max(0, (current.durationSeconds || 0) - (current.remainingSeconds || 0));
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 1) return;

    const key = `${current.startedAt}-ABANDONED`;
    if (lastLoggedSessionRef.current === key) return;
    lastLoggedSessionRef.current = key;

    sessionsApi
      .logSession({
        startedAt: toIsoDateTimeWithOffset(current.startedAt),
        minutes: Math.min(240, elapsedMinutes),
        status: 'ABANDONED',
        courseId: current.activeCourseId || null,
        topicId: current.activeTopicId || null,
      })
      .catch(() => { });
  }

  function handlePlayPause() {
    if (session.status === 'running') {
      setSession((s) => {
        const next = pausePomodoroSession(s);
        persistSession(next);
        return next;
      });
      audioMixer.pauseMusic();
    } else if (session.status === 'paused') {
      setSession((s) => {
        const next = resumePomodoroSession(s);
        persistSession(next);
        return next;
      });
      audioMixer.playMusic();
    } else if (session.status === 'completed') {
      setSession((s) => {
        const next = startPomodoroSession(skipToNextPhase(s, settings));
        persistSession(next);
        return next;
      });
      audioMixer.playMusic();
    } else {
      setSession((s) => {
        const next = startPomodoroSession(s);
        persistSession(next);
        return next;
      });
      audioMixer.playMusic();
    }
  }

  function handleReset() {
    logAbandonedFocusIfElapsed(session);
    setSession((s) => {
      const next = resetPomodoroSession(s, settings);
      persistSession(next);
      return next;
    });
  }

  function handleSkip() {
    logAbandonedFocusIfElapsed(session);
    setSession((s) => {
      const next = skipToNextPhase(s, settings);
      persistSession(next);
      return next;
    });
  }

  function handleSaveSettings(newSettings) {
    setSettings(newSettings);
    if (session.status === 'idle') {
      const duration = (session.phase === 'focus'
        ? newSettings.focusMinutes
        : session.phase === 'shortBreak'
          ? newSettings.shortBreakMinutes
          : newSettings.longBreakMinutes) * 60;
      setSession((s) => {
        const next = { ...s, durationSeconds: duration, remainingSeconds: duration };
        persistSession(next);
        return next;
      });
    }
  }

  async function handleConfirmTopicDone() {
    if (!topicPrompt?.topicId) return;
    try {
      await syllabusApi.updateTopicStatus(topicPrompt.topicId, 'DONE');
      setSessionLogNotice(t.topicMarkedDone(topicPrompt.topicTitle));
      setTopicPrompt(null);
    } catch {
      setTopicPrompt(null);
    }
  }

  const progressPercent =
    session.durationSeconds > 0
      ? Math.min(
        100,
        Math.max(0, ((session.durationSeconds - session.remainingSeconds) / session.durationSeconds) * 100)
      )
      : 0;

  // Normalized cycle indicator within 4-interval loop (1..4)
  const currentIntervalIndex = ((session.cycleCount - 1) % (settings.longBreakInterval || 4)) + 1;

  let phaseBadge = `${t.cycleLabel} ${currentIntervalIndex}/${settings.longBreakInterval || 4} · ${settings.focusMinutes}M`;
  let phaseTitle = t.titleFocus;
  if (session.phase === 'shortBreak') {
    phaseBadge = `SHORT BREAK · ${settings.shortBreakMinutes}M`;
    phaseTitle = t.titleShortBreak;
  } else if (session.phase === 'longBreak') {
    phaseBadge = `LONG BREAK · ${settings.longBreakMinutes}M`;
    phaseTitle = t.titleLongBreak;
  }

  const isMusicPlaying = mixerState.isMusicPlaying;
  const isLotusBreathing = isMusicPlaying || session.status === 'running';

  return (
    <div
      ref={containerRef}
      className="relative h-screen min-h-screen w-full animate-chromatic-ambient text-text px-4 sm:px-8 pt-3 pb-2 flex flex-col justify-between overflow-hidden font-sans"
    >
      {/* Top Bar with Center-Aligned Gradient Title & Fullscreen Toggle */}
      <div className="relative flex items-center justify-between z-20 gap-3 shrink-0 w-full">
        {/* Left Side: Back to Overview + Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-text hover:border-primary/50 transition-colors shadow-xs cursor-pointer backdrop-blur-md"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-2 text-xs">
              ‹
            </span>
            <span>{t.back}</span>
          </button>

          {/* Fullscreen Toggle Button (Per User Request) */}
          <button
            type="button"
            data-testid="toggle-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? (lang === 'vi' ? 'Thoát toàn màn hình' : 'Exit Fullscreen') : (lang === 'vi' ? 'Toàn màn hình' : 'Fullscreen')}
            aria-label={isFullscreen ? (lang === 'vi' ? 'Thoát toàn màn hình' : 'Exit Fullscreen') : (lang === 'vi' ? 'Toàn màn hình' : 'Fullscreen')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors shadow-xs cursor-pointer backdrop-blur-md ${isFullscreen
                ? 'border-primary/60 bg-primary/20 text-primary'
                : 'border-border bg-surface/80 text-muted hover:text-text hover:bg-surface-2'
              }`}
          >
            <span className="text-sm leading-none">{isFullscreen ? '⤢' : '⛶'}</span>
            <span className="hidden sm:inline">
              {isFullscreen ? (lang === 'vi' ? 'Thu nhỏ' : 'Exit') : (lang === 'vi' ? 'Toàn màn hình' : 'Fullscreen')}
            </span>
          </button>
        </div>

        {/* Dead Center Title: Absolutely centered regardless of left/right widths */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none select-none text-center">
          <span className="text-xl sm:text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-[#1a2802] via-primary to-[#608b15] dark:from-white dark:via-primary dark:to-[#d5f458] bg-clip-text text-transparent drop-shadow-sm font-sans whitespace-nowrap">
            FOCUS STUDIO
          </span>
        </div>

        {/* Right Side: Overview & Timetable quick links replacing Settings (Per User Request) */}
        <div className="flex items-center gap-2 ml-auto z-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-bold text-muted hover:text-primary hover:border-primary/50 hover:bg-surface-2 transition-all cursor-pointer backdrop-blur-md shadow-xs"
          >
            <span>{t.viewOverview}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/timetable')}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-bold text-muted hover:text-primary hover:border-primary/50 hover:bg-surface-2 transition-all cursor-pointer backdrop-blur-md shadow-xs"
          >
            <span>{t.viewTimetable}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Academic Widgets | Center Lotus Stage | Right Study Sprints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-0 py-2 z-10">
        {/* Left Academic Widgets: Subject Picker + Live Real-World Clock (Per Hình 2) */}
        <div className="lg:col-span-3 flex flex-col justify-center gap-4 order-3 lg:order-1">
          <FocusSubjectPicker
            activeCourseId={session.activeCourseId}
            activeTopicId={session.activeTopicId}
            onSelectCourse={(cid) =>
              setSession((s) => {
                const next = { ...s, activeCourseId: cid };
                persistSession(next);
                return next;
              })
            }
            onSelectTopic={(tid) =>
              setSession((s) => {
                const next = { ...s, activeTopicId: tid };
                persistSession(next);
                return next;
              })
            }
          />

          {/* Real World Live Clock Widget (Replaces static Flow Rate card per Hình 2) */}
          <div className="left-widget-card">
            <RealWorldClock />
          </div>
        </div>

        {/* Center Stage: Radiant Lotus Emblem + Audio Deck + Pomodoro Scrubber */}
        <div className="center-radiant-stage lg:col-span-6 flex flex-col items-center justify-between h-full py-1 order-1 lg:order-2">
          {/* Accessible Semantic Title */}
          <h1 className="sr-only">{phaseTitle}</h1>

          {/* Phase Badge: Shifted UP to sit directly below FOCUS STUDIO header */}
          <div className="mt-1 mb-2 flex flex-wrap items-center justify-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-mono font-extrabold tracking-wider uppercase backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${session.status === 'running' ? 'bg-primary animate-ping' : 'bg-primary'
                  }`}
              />
              <span>{phaseBadge}</span>
            </div>
            {(todayFocusStats.count > 0 || sessionLogNotice) && (
              <span
                data-testid="today-focus-pill"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/80 bg-surface/80 text-[11px] font-mono font-semibold text-muted"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>
                  {sessionLogNotice ||
                    t.todayLogged(formatFocusDuration(todayFocusStats.minutes, lang), todayFocusStats.count)}
                </span>
              </span>
            )}
          </div>

          {/* Radiant Lotus Core Emblem Centered in Viewport */}
          <div className="flex-1 flex items-center justify-center w-full min-h-0 my-auto py-2 overflow-visible">
            <div className="relative flex h-60 sm:h-72 md:h-80 w-60 sm:w-72 md:w-80 items-center justify-center overflow-visible">
              <RadiantLotusLogo
                className="w-56 sm:w-68 md:w-72 h-56 sm:h-68 md:h-72 overflow-visible"
                glow={true}
                isPlaying={isLotusBreathing}
                isCenter={true}
              />
            </div>
          </div>

          {/* Bottom Section: Scrubber & Controls pulled down towards bottom edge */}
          <div className="w-full flex flex-col items-center mt-auto pb-1 shrink-0">
            {/* Pomodoro Timeline Scrubber with Large, Prominent, Clear Digits */}
            <div className="w-full max-w-md space-y-2">
              <div className="relative h-3 w-full rounded-full bg-surface-2 border border-border/80 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-baseline px-1 font-mono">
                <span
                  data-testid="timer-display"
                  className="text-text dark:text-white font-mono font-black text-lg sm:text-xl tracking-wider tabular-nums drop-shadow-xs"
                >
                  {formatTime(session.remainingSeconds)}
                </span>
                <span
                  data-testid="timer-duration"
                  className="text-primary dark:text-[#dbef90] font-mono font-bold text-sm sm:text-base tracking-wide tabular-nums"
                >
                  {formatTime(session.durationSeconds)}
                </span>
              </div>
            </div>

            {/* Media Player Controls (Exact Requested Order: Soundscape, Radio, Reset, Play, Forward, Volume, Setting) */}
            <div className="w-full max-w-md flex items-center justify-between sm:justify-center sm:gap-3.5 mt-5 px-1 shrink-0">
              {/* 1. Soundscapes Button */}
              <button
                type="button"
                data-testid="open-mixer-btn"
                onClick={() => setIsAmbientOpen(true)}
                title={t.soundscapesBtn}
                aria-label={t.soundscapesBtn}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black ${activeSoundCount > 0
                    ? 'border-primary bg-primary/20 text-primary shadow-primary/25 scale-105'
                    : 'bg-surface border-border text-muted hover:text-text hover:bg-surface-2 hover:border-primary/50 dark:bg-[#141d06]/90 dark:border-border dark:text-zinc-300 dark:hover:text-white'
                  }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18C8.5 7.5 4 9 4 14a8 8 0 0016 0c0-5-4.5-6.5-8-11z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c-2.5 0-4.5 1-4.5 2.5" />
                </svg>
              </button>

              {/* 2. Lo-Fi Radio Button */}
              <button
                type="button"
                data-testid="open-radio-btn"
                onClick={() => setIsRadioOpen(true)}
                title={t.radioBtn}
                aria-label={t.radioBtn}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black ${isMusicPlaying
                    ? 'border-primary bg-primary/20 text-primary shadow-primary/25 scale-105'
                    : 'bg-surface border-border text-muted hover:text-text hover:bg-surface-2 hover:border-primary/50 dark:bg-[#141d06]/90 dark:border-border dark:text-zinc-300 dark:hover:text-white'
                  }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2v-7a2 2 0 012-2zm4-4l4 4m6 5a2 2 0 11-4 0 2 2 0 014 0z" />
                  <circle cx="16" cy="14" r="1.5" fill="currentColor" />
                  <path strokeLinecap="round" d="M7 13h3m-3 2.5h3" />
                </svg>
              </button>

              {/* 3. Reset Pomodoro Button */}
              <button
                type="button"
                data-testid="reset-timer-btn"
                title={t.reset}
                aria-label={t.reset}
                onClick={handleReset}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 hover:border-primary/50 dark:bg-[#141d06]/90 dark:border-border dark:text-zinc-300 dark:hover:text-white transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              >
                <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              {/* 4. Center Play/Pause Button */}
              <button
                type="button"
                data-testid="play-pause-btn"
                onClick={handlePlayPause}
                aria-label={session.status === 'running' ? t.pause : t.start}
                className="flex h-14 w-14 sm:h-15 sm:w-15 shrink-0 items-center justify-center rounded-full bg-[#243100] text-white shadow-xl hover:bg-[#386304] dark:bg-white dark:text-black dark:shadow-2xl dark:luma-radiant-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              >
                {session.status === 'running' ? (
                  <svg className="h-6.5 w-6.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="h-6.5 w-6.5 fill-current ml-0.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* 5. Skip to Next Phase Button (Forward) */}
              <button
                type="button"
                data-testid="skip-phase-btn"
                title={t.skip}
                aria-label={t.skip}
                onClick={handleSkip}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 hover:border-primary/50 dark:bg-[#141d06]/90 dark:border-border dark:text-zinc-300 dark:hover:text-white transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              >
                <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>

              {/* 6. Quick Master Volume Button with Auto-Hover Popover Slider */}
              <div
                className="relative h-11 w-11 shrink-0 flex items-center justify-center"
                onMouseEnter={handleVolumeMouseEnter}
                onMouseLeave={handleVolumeMouseLeave}
              >
                {/* Popover Slider on Hover */}
                {isVolumeHovered && (
                  <div
                    className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface border border-border shadow-2xl dark:bg-[#141d06] dark:border-primary/40 min-w-[54px] animate-in fade-in slide-in-from-bottom-2 duration-150"
                    onMouseEnter={handleVolumeMouseEnter}
                    onMouseLeave={handleVolumeMouseLeave}
                  >
                    <span className="text-[10px] font-mono font-black text-primary tracking-wide">
                      {mixerState.isMuted ? 'MUTE' : `${Math.round(mixerState.masterVolume * 100)}%`}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      aria-label="Master Volume Slider"
                      aria-valuenow={Math.round((mixerState.isMuted ? 0 : mixerState.masterVolume) * 100)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      value={mixerState.isMuted ? 0 : mixerState.masterVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        audioMixer.setMasterVolume(val);
                        setMixerState(audioMixer.getState());
                      }}
                      style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                      className="h-24 w-2 accent-primary cursor-pointer"
                    />
                  </div>
                )}

                <button
                  type="button"
                  data-testid="quick-volume-btn"
                  onClick={() => {
                    audioMixer.toggleMasterMute();
                    setMixerState(audioMixer.getState());
                  }}
                  title={mixerState.isMuted ? 'Unmute' : 'Master Volume (Hover to adjust)'}
                  aria-label={mixerState.isMuted ? 'Unmute' : 'Master Volume'}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black ${mixerState.isMuted
                      ? 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                      : isVolumeHovered
                        ? 'border-primary bg-primary/20 text-primary shadow-primary/25 scale-105'
                        : 'bg-surface border-border text-muted hover:text-text hover:bg-surface-2 hover:border-primary/50 dark:bg-[#141d06]/90 dark:border-border dark:text-zinc-300 dark:hover:text-white'
                    }`}
                >
                  {mixerState.isMuted ? (
                    <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* 7. Settings Button (Moved to controls row per user request) */}
              <button
                type="button"
                data-testid="open-settings-btn"
                onClick={() => setIsSettingsOpen(true)}
                title={t.settingsBtn}
                aria-label={t.settingsBtn}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 hover:border-primary/50 dark:bg-[#141d06]/90 dark:border-border dark:text-zinc-300 dark:hover:text-white transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
              >
                <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Study Sprints Progression List */}
        <div className="lg:col-span-3 flex flex-col justify-center order-2 lg:order-3">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-text">{t.practiceHeader}</h2>
            <p className="text-xs text-muted">{t.sprintSubtitle}</p>
          </div>

          <div className="relative flex flex-col gap-3">
            {/* Vertical dotted guide line */}
            <div className="absolute left-[34px] top-6 bottom-6 w-px border-l border-dashed border-border pointer-events-none" />

            {t.sprints.map((sprint) => {
              const isCurrent = currentIntervalIndex === sprint.id;
              const isCompleted = currentIntervalIndex > sprint.id;

              return (
                <div
                  key={sprint.id}
                  className={`right-session-card rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all duration-200 backdrop-blur-md ${isCurrent
                      ? 'border-primary/60 bg-gradient-to-r from-accent-deep/90 to-[#1b2500] text-white shadow-lg'
                      : 'glass-card text-muted hover:text-text hover:border-primary/40'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isCurrent
                          ? 'border-primary bg-primary/20 text-primary'
                          : isCompleted
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-surface-2 text-muted'
                        }`}
                    >
                      {isCompleted ? (
                        <span className="text-xs font-bold text-primary">✓</span>
                      ) : (
                        <RadiantShield className="w-5 h-5" glow={isCurrent} />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${isCurrent ? 'text-white' : 'text-text'
                          }`}
                      >
                        {sprint.title}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isCurrent ? 'text-white/80' : 'text-muted'}`}>
                        {sprint.duration}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-primary' : 'text-muted'
                      }`}
                  >
                    {isCurrent ? 'ACTIVE' : isCompleted ? 'DONE' : `0${sprint.id}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info - Flushes to absolute bottom edge (Per User Request) */}
      <div className="flex items-center justify-center text-xs text-muted pt-2.5 pb-0 border-t border-border/60 z-10 w-full mt-auto mb-0 shrink-0">
        <span>SFSH Focus Studio</span>
      </div>

      {/* Modals & Popups */}
      <LofiRadioModal isOpen={isRadioOpen} onClose={() => setIsRadioOpen(false)} />
      <AmbientMixerModal isOpen={isAmbientOpen} onClose={() => setIsAmbientOpen(false)} />
      <AudioMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
      <TimerSettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />
      <TopicCompletionModal
        isOpen={!!topicPrompt}
        topicTitle={topicPrompt?.topicTitle}
        courseCode={topicPrompt?.courseCode}
        onConfirmDone={handleConfirmTopicDone}
        onKeepDoing={() => setTopicPrompt(null)}
      />

      {/* Auto-Genre Advance Toast Notification */}
      <GenreSwitchToast
        notification={genreSwitchNotification}
        onDismiss={() => setGenreSwitchNotification(null)}
        onOpenRadio={() => {
          setGenreSwitchNotification(null);
          setIsRadioOpen(true);
        }}
      />
    </div>
  );
}
