import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { DEFAULT_TIMER_SETTINGS, POMODORO_SETTINGS_KEY } from '../../utils/pomodoro';

export function TimerSettingsModal({ isOpen, settings, onSave, onClose }) {
  const { lang } = useLanguage();
  const [localSettings, setLocalSettings] = useState(settings || DEFAULT_TIMER_SETTINGS);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = {
    en: {
      badge: 'POMODORO CADENCE · CUSTOMIZATION',
      title: 'Timer & Notification Settings',
      subtitle: 'Tune sprint durations and notification preferences to match your focus rhythm.',
      focusDuration: 'Focus Sprint Duration',
      shortBreak: 'Short Break Duration',
      longBreak: 'Long Break Duration',
      interval: 'Long Break Interval',
      intervalDesc: 'Take a long break after every 4 focus sprints',
      soundChime: 'Play Harmonic Chime on Finish',
      browserNotif: 'Browser Push Notifications',
      enableNotif: 'Enable Notifications',
      notifEnabled: 'Notifications Active ✓',
      notifDenied: 'Blocked in browser settings',
      minutes: 'min',
      cancel: 'Cancel',
      save: 'Save Preferences',
    },
    vi: {
      badge: 'CHU KỲ POMODORO · TÙY CHỈNH THỜI GIAN',
      title: 'Cài đặt thời gian & Thông báo',
      subtitle: 'Thiết lập độ dài phiên học và cách nhận thông báo phù hợp với nhịp độ sinh học của bạn.',
      focusDuration: 'Thời gian tập trung (Focus)',
      shortBreak: 'Nghỉ giải lao ngắn',
      longBreak: 'Nghỉ giải lao dài',
      interval: 'Chu kỳ nghỉ dài',
      intervalDesc: 'Tự động kích hoạt nghỉ dài sau mỗi 4 phiên học liên tiếp',
      soundChime: 'Phát chuông âm thanh 528Hz khi hết giờ',
      browserNotif: 'Thông báo đẩy trình duyệt',
      enableNotif: 'Cấp quyền thông báo',
      notifEnabled: 'Đã kích hoạt thông báo ✓',
      notifDenied: 'Bị chặn bởi cài đặt trình duyệt',
      minutes: 'phút',
      cancel: 'Hủy bỏ',
      save: 'Lưu cài đặt',
    },
  }[lang] || {};

  async function requestNotificationPermission() {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch {
        // ignore
      }
    }
  }

  function handleSave() {
    try {
      localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(localSettings));
    } catch {
      // ignore
    }
    onSave?.(localSettings);
    onClose?.();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="timer-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200 font-sans"
    >
      <div
        className="glass-card border border-border/90 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4 bg-surface/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono font-bold tracking-wide">
              {t.badge}
            </div>
            <h2 id="timer-settings-title" className="text-xl font-black text-text tracking-tight mt-1">
              {t.title}
            </h2>
            <p className="text-xs text-muted mt-0.5">{t.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-96 overflow-y-auto">
          {/* Focus Duration Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text flex items-center justify-between">
              <span>{t.focusDuration}</span>
              <span className="text-primary font-mono">{localSettings.focusMinutes} {t.minutes}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLocalSettings((prev) => ({ ...prev, focusMinutes: mins }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    localSettings.focusMinutes === mins
                      ? 'border-primary bg-primary/20 text-primary shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-text'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Short Break Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text flex items-center justify-between">
              <span>{t.shortBreak}</span>
              <span className="text-primary font-mono">{localSettings.shortBreakMinutes} {t.minutes}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLocalSettings((prev) => ({ ...prev, shortBreakMinutes: mins }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    localSettings.shortBreakMinutes === mins
                      ? 'border-primary bg-primary/20 text-primary shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-text'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Long Break Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text flex items-center justify-between">
              <span>{t.longBreak}</span>
              <span className="text-primary font-mono">{localSettings.longBreakMinutes} {t.minutes}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLocalSettings((prev) => ({ ...prev, longBreakMinutes: mins }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    localSettings.longBreakMinutes === mins
                      ? 'border-primary bg-primary/20 text-primary shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-text'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Sound & Notification Toggles */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-surface/50 border border-border cursor-pointer">
              <span className="text-xs font-semibold text-text">{t.soundChime}</span>
              <input
                type="checkbox"
                checked={localSettings.soundNotification}
                onChange={(e) => setLocalSettings((prev) => ({ ...prev, soundNotification: e.target.checked }))}
                className="h-4 w-4 accent-primary rounded cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface/50 border border-border">
              <div className="text-xs font-semibold text-text">{t.browserNotif}</div>
              {notificationPermission === 'granted' ? (
                <span className="text-[11px] font-bold text-emerald-400 font-mono">{t.notifEnabled}</span>
              ) : notificationPermission === 'denied' ? (
                <span className="text-[11px] text-rose-400 font-medium">{t.notifDenied}</span>
              ) : (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-3 py-1 rounded-xl bg-primary/20 text-primary border border-primary/40 text-[11px] font-bold hover:bg-primary hover:text-primary-fg transition-all cursor-pointer"
                >
                  {t.enableNotif}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/60 bg-surface/50 flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-text transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-full bg-primary text-primary-fg font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
