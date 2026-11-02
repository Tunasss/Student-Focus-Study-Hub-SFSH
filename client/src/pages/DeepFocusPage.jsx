import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../i18n/languageContext';
import { AudioMixerModal } from '../components/focus/AudioMixerModal';
import { TimerSettingsModal } from '../components/focus/TimerSettingsModal';
import { FocusSubjectPicker } from '../components/focus/FocusSubjectPicker';
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

const FOCUS_COPY = {
  en: {
    back: 'Back to Overview',
    studioTag: 'STUDENT FOCUS STUDIO',
    settingsBtn: 'Timer Settings',
    soundscapesBtn: 'Soundscapes',
    titleFocus: 'Deep Focus',
    titleShortBreak: 'Short Break',
    titleLongBreak: 'Long Break',
    subtitleFocus: 'Stay immersed in your cognitive flow and eliminate distractions.',
    subtitleShortBreak: 'Rest your eyes, hydrate, and stretch for a moment.',
    subtitleLongBreak: 'Step away from screen, take a short stroll or enjoy a snack.',
    practiceHeader: 'Study Sprints',
    sprintSubtitle: '4-cycle Pomodoro progression',
    metricLabel: 'Focus Flow Rate',
    metricValue: '92% Flow',
    metricStreak: '4x Sprint Streak',
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
    sprints: [
      { id: 1, title: 'Sprint 01 · Cognitive Flow', duration: '25 min focus' },
      { id: 2, title: 'Sprint 02 · Deep Problem Solving', duration: '25 min focus' },
      { id: 3, title: 'Sprint 03 · Knowledge Consolidation', duration: '25 min focus' },
      { id: 4, title: 'Sprint 04 · Final Push & Review', duration: '25 min + 15m Recharge' },
    ],
  },
  vi: {
    back: 'Về Tổng quan',
    studioTag: 'STUDIO TẬP TRUNG HỌC TẬP',
    settingsBtn: 'Cài đặt thời gian',
    soundscapesBtn: 'Âm thanh nền',
    titleFocus: 'Tập trung sâu',
    titleShortBreak: 'Nghỉ giải lao ngắn',
    titleLongBreak: 'Nghỉ giải lao dài',
    subtitleFocus: 'Duy trì trạng thái tập trung sâu và loại bỏ các yếu tố gây xao nhãng.',
    subtitleShortBreak: 'Thư giãn mắt, uống nước và vận động nhẹ nhàng.',
    subtitleLongBreak: 'Rời xa màn hình, đi dạo một chút hoặc thưởng thức đồ uống nhẹ.',
    practiceHeader: 'Lộ trình phiên học',
    sprintSubtitle: 'Chu kỳ 4 phiên Pomodoro',
    metricLabel: 'Tốc độ tập trung',
    metricValue: '92% Flow',
    metricStreak: 'Chuỗi 4 phiên liên tục',
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
    viewOverview: 'Xem Bảng Tổng quan →',
    viewTimetable: 'Xem Thời khóa biểu →',
    sprints: [
      { id: 1, title: 'Phiên 01 · Bắt nhịp tập trung', duration: '25 phút học sâu' },
      { id: 2, title: 'Phiên 02 · Giải quyết bài toán khó', duration: '25 phút học sâu' },
      { id: 3, title: 'Phiên 03 · Tổng hợp kiến thức', duration: '25 phút học sâu' },
      { id: 4, title: 'Phiên 04 · Về đích & Nghỉ dài', duration: '25 phút + 15p Nghỉ sạc lại' },
    ],
  },
};

// Glowing authentic Luma Lotus Emblem with GPU-accelerated breathing animation
export function RadiantShield({ className = '', glow = true, isPlaying = false, isCenter = false }) {
  const breatheClass = isPlaying ? 'animate-luma-breathe-active' : 'animate-luma-breathe';

  return (
    <div
      className={`relative flex items-center justify-center ${className} ${
        isCenter ? breatheClass : ''
      }`}
    >
      {glow && (
        <div
          className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isPlaying ? 'bg-primary/35 scale-150 animate-pulse' : 'bg-primary/20 scale-125'
          }`}
        />
      )}
      <svg
        className="w-full h-full text-primary relative z-10 transition-transform duration-300"
        viewBox="0 0 200 200"
        fill="currentColor"
        aria-hidden="true"
      >
        {isCenter && (
          <circle
            cx="100"
            cy="108"
            r="82"
            className="fill-surface/40 dark:fill-black/50 stroke-primary/30"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        )}
        {/* Central Crown Petal */}
        <path d="M100 32 C91 58 91 88 100 115 C109 88 109 58 100 32 Z" fill="currentColor" />

        {/* Inner Left Petal */}
        <path d="M88 54 C72 68 62 90 74 118 C88 110 98 92 94 72 Z" fill="currentColor" opacity="0.9" />

        {/* Inner Right Petal */}
        <path d="M112 54 C128 68 138 90 126 118 C112 110 102 92 106 72 Z" fill="currentColor" opacity="0.9" />

        {/* Outer Left Wing Petal */}
        <path d="M70 78 C52 95 45 118 60 140 C75 130 84 114 82 96 Z" fill="currentColor" opacity="0.75" />

        {/* Outer Right Wing Petal */}
        <path d="M130 78 C148 95 155 118 140 140 C125 130 116 114 118 96 Z" fill="currentColor" opacity="0.75" />

        {/* Base Cradle Petal */}
        <path d="M52 142 C74 168 126 168 148 142 C134 160 66 160 52 142 Z" fill="currentColor" opacity="0.85" />

        {/* Radiant Inner Focus Spark */}
        <polygon points="100,98 105,108 100,118 95,108" className="fill-bg dark:fill-primary-fg" />
        <circle cx="100" cy="108" r="3" className="fill-primary" />
      </svg>
    </div>
  );
}

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSoundCount, setActiveSoundCount] = useState(0);

  // Sync active audio tracks indicator
  useEffect(() => {
    function checkAudio() {
      const state = audioMixer.getState();
      const count = Object.values(state.tracks).filter((tr) => tr.isPlaying).length;
      setActiveSoundCount(count);
    }
    checkAudio();
    const timer = setInterval(checkAudio, 1000);
    return () => clearInterval(timer);
  }, [isMixerOpen]);

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

  // Entrance & breathing animation
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
          '-=0.35'
        )
        .fromTo(
          '.right-session-card',
          { x: 20, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, stagger: 0.05, duration: 0.45, clearProps: 'opacity,visibility,transform' },
          '-=0.35'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Controls
  function handlePlayPause() {
    if (session.status === 'running') {
      setSession((s) => {
        const next = pausePomodoroSession(s);
        persistSession(next);
        return next;
      });
    } else if (session.status === 'paused') {
      setSession((s) => {
        const next = resumePomodoroSession(s);
        persistSession(next);
        return next;
      });
    } else if (session.status === 'completed') {
      setSession((s) => {
        const next = startPomodoroSession(skipToNextPhase(s, settings));
        persistSession(next);
        return next;
      });
    } else {
      setSession((s) => {
        const next = startPomodoroSession(s);
        persistSession(next);
        return next;
      });
    }
  }

  function handleReset() {
    setSession((s) => {
      const next = resetPomodoroSession(s, settings);
      persistSession(next);
      return next;
    });
  }

  function handleSkip() {
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

  const progressPercent =
    session.durationSeconds > 0
      ? Math.min(
          100,
          Math.max(0, ((session.durationSeconds - session.remainingSeconds) / session.durationSeconds) * 100)
        )
      : 0;

  // Normalized cycle indicator within 4-interval loop (1..4)
  const currentIntervalIndex = ((session.cycleCount - 1) % (settings.longBreakInterval || 4)) + 1;

  let phaseTitle = t.titleFocus;
  let phaseSubtitle = t.subtitleFocus;
  let phaseBadge = `${t.cycleLabel} ${currentIntervalIndex}/${settings.longBreakInterval || 4} · ${settings.focusMinutes}M`;

  if (session.phase === 'shortBreak') {
    phaseTitle = t.titleShortBreak;
    phaseSubtitle = t.subtitleShortBreak;
    phaseBadge = `SHORT BREAK · ${settings.shortBreakMinutes}M`;
  } else if (session.phase === 'longBreak') {
    phaseTitle = t.titleLongBreak;
    phaseSubtitle = t.subtitleLongBreak;
    phaseBadge = `LONG BREAK · ${settings.longBreakMinutes}M`;
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[calc(100vh-65px)] w-full bg-bg text-text px-4 sm:px-8 py-6 flex flex-col justify-between overflow-hidden font-sans"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between z-20 gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted hover:text-text hover:border-primary/50 transition-colors shadow-xs cursor-pointer"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs">
            ‹
          </span>
          <span>{t.back}</span>
        </button>

        <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary hidden sm:inline-block">
          {t.studioTag}
        </span>

        <div className="flex items-center gap-2">
          {/* Ambient Soundscapes Pill */}
          <button
            type="button"
            data-testid="open-mixer-btn"
            onClick={() => setIsMixerOpen(true)}
            aria-label={t.soundscapesBtn}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              activeSoundCount > 0
                ? 'border-primary/60 bg-primary/15 text-primary shadow-sm'
                : 'border-border bg-surface text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {activeSoundCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  activeSoundCount > 0 ? 'bg-primary' : 'bg-muted/40'
                }`}
              />
            </span>
            <span>{t.soundscapesBtn}</span>
            {activeSoundCount > 0 && (
              <span className="text-[10px] bg-primary/30 px-1.5 py-0.2 rounded-full font-mono">
                {activeSoundCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            type="button"
            data-testid="open-settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t.settingsBtn}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-text hover:bg-surface-2 transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Main Grid: Left Academic Widgets | Center Lotus Stage | Right Study Sprints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-4 z-10">
        {/* Left Academic Widgets: Subject Picker + Focus Flow */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3 lg:order-1">
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

          {/* Focus Flow Rate & Rhythm Card */}
          <div className="left-widget-card glass-card rounded-3xl p-5 flex items-center justify-between shadow-xl border border-border/70">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.metricLabel}</p>
              <p className="text-2xl font-black text-text tracking-tight">{t.metricValue}</p>
              <p className="text-[11px] font-semibold text-primary">{t.metricStreak}</p>

              {/* Focus Alpha Waves Audio Spectrum Visualization */}
              <div className="pt-2 flex items-center gap-1 text-primary">
                <svg
                  className="h-5 w-32 text-primary"
                  viewBox="0 0 120 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M0 12 L15 12 L22 4 L30 20 L38 8 L46 16 L54 12 L68 12 L75 6 L82 18 L90 12 L120 12" />
                </svg>
              </div>
            </div>

            {/* Smart Focus Sprint Badge */}
            <div className="h-14 w-14 rounded-2xl border border-primary/40 bg-surface-2 flex flex-col items-center justify-center shadow-md shrink-0">
              <span className={`text-base ${session.status === 'running' ? 'animate-pulse' : ''}`}>
                ⚡
              </span>
              <span className="text-[9px] font-extrabold text-primary mt-0.5">
                {settings.focusMinutes}m
              </span>
            </div>
          </div>
        </div>

        {/* Center Stage: Radiant Organic Green Shield & Media Player Controls */}
        <div className="center-radiant-stage lg:col-span-6 flex flex-col items-center justify-center text-center order-1 lg:order-2">
          {/* Phase Badge */}
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-mono font-extrabold tracking-wider uppercase">
            <span
              className={`h-2 w-2 rounded-full ${
                session.status === 'running' ? 'bg-primary animate-ping' : 'bg-primary'
              }`}
            />
            <span>{phaseBadge}</span>
          </div>

          {/* Radiant Lotus Core */}
          <div className="relative flex h-56 sm:h-64 w-56 sm:w-64 items-center justify-center">
            <RadiantShield
              className="radiant-lotus-aura w-48 sm:w-56 h-48 sm:h-56"
              glow={true}
              isPlaying={session.status === 'running'}
              isCenter={true}
            />
          </div>

          {/* Deep Focus Title */}
          <div className="mt-2 space-y-1">
            <h1 className="text-3xl sm:text-[44px] font-extrabold tracking-tight text-text leading-tight">
              {phaseTitle}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-muted max-w-md mx-auto">
              {phaseSubtitle}
            </p>
          </div>

          {/* Pomodoro Timeline Scrubber */}
          <div className="w-full max-w-sm mt-5 space-y-1.5">
            <div className="relative h-2.5 w-full rounded-full bg-surface-2 border border-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono font-bold text-muted px-0.5">
              <span data-testid="timer-display" className="text-text font-black text-sm">
                {formatTime(session.remainingSeconds)}
              </span>
              <span data-testid="timer-duration">{formatTime(session.durationSeconds)}</span>
            </div>
          </div>

          {/* Media Player Controls */}
          <div className="flex items-center gap-4 mt-5">
            {/* Ambient Sound Mode button */}
            <button
              type="button"
              data-testid="control-mixer-btn"
              onClick={() => setIsMixerOpen(true)}
              title={t.soundscapesBtn}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors shadow-xs cursor-pointer ${
                activeSoundCount > 0
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface border-border text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              data-testid="play-pause-btn"
              onClick={handlePlayPause}
              aria-label={session.status === 'running' ? t.pause : t.start}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-text text-bg dark:bg-white dark:text-black shadow-xl luma-radiant-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              {session.status === 'running' ? (
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip to Next Phase Button */}
            <button
              type="button"
              data-testid="skip-phase-btn"
              title={t.skip}
              onClick={handleSkip}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 transition-colors shadow-xs cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>

            {/* Reset Pomodoro Button */}
            <button
              type="button"
              data-testid="reset-timer-btn"
              title={t.reset}
              onClick={handleReset}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:bg-surface-2 transition-colors shadow-xs cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Side: Study Sprints Progression List */}
        <div className="lg:col-span-3 flex flex-col order-2 lg:order-3">
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
                  className={`right-session-card rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all duration-200 ${
                    isCurrent
                      ? 'border-primary/60 bg-gradient-to-r from-accent-deep/90 to-[#1b2500] text-white shadow-lg'
                      : 'glass-card text-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isCurrent
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
                        className={`text-xs font-bold leading-tight ${
                          isCurrent ? 'text-white' : 'text-text'
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
                    className={`text-[10px] font-mono font-bold ${
                      isCurrent ? 'text-primary' : 'text-muted'
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

      {/* Footer Info & Quick Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted pt-3 border-t border-border gap-2 z-10">
        <span>SFSH Focus Studio · Urbanist Typography & Solfeggio 528Hz</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-primary hover:underline font-bold cursor-pointer"
          >
            {t.viewOverview}
          </button>
          <button
            type="button"
            onClick={() => navigate('/timetable')}
            className="text-primary hover:underline font-bold cursor-pointer"
          >
            {t.viewTimetable}
          </button>
        </div>
      </div>

      {/* Modals */}
      <AudioMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
      <TimerSettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
