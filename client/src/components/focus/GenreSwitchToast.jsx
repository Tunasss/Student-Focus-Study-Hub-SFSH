import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';

export function GenreSwitchToast({ notification, onDismiss, onOpenRadio }) {
  const { lang } = useLanguage();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification) return undefined;

    const duration = 6000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss?.();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isVi = lang === 'vi';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 right-4 sm:right-8 z-50 max-w-md w-[calc(100vw-32px)] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/50 bg-surface/95 dark:bg-[#161f03]/95 backdrop-blur-xl p-4 shadow-2xl text-text dark:text-white">
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/25 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Animated music icon badge */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 shadow-sm text-lg">
            <span className="animate-bounce">🎵</span>
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-full border border-primary/30">
                {isVi ? 'Tự động nối bài' : 'Queue Auto-Advance'}
              </span>
              <span className="text-[11px] text-muted">
                {isVi ? '10/10 bài hoàn tất' : '10/10 tracks completed'}
              </span>
            </div>

            <p className="mt-1 text-sm font-bold text-text dark:text-white leading-tight">
              {isVi ? 'Chuyển sang thể loại mới' : 'Switched to Next Lo-Fi Genre'}
            </p>

            <p className="mt-0.5 text-xs text-text/80 dark:text-white/80 line-clamp-1">
              <span className="text-muted line-through mr-1">{notification.previousGenreName}</span>
              <span className="text-primary font-semibold">➔ {notification.nextGenreName}</span>
            </p>

            {notification.trackTitle && (
              <p className="mt-1 text-[11px] font-mono text-primary/90 truncate flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                {notification.trackTitle}
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              {onOpenRadio && (
                <button
                  type="button"
                  onClick={onOpenRadio}
                  className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-black hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  {isVi ? 'Xem danh sách phát' : 'Open Radio Queue'}
                </button>
              )}
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted hover:text-white hover:bg-surface-2 transition-colors cursor-pointer"
              >
                {isVi ? 'Bỏ qua' : 'Dismiss'}
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label={isVi ? 'Đóng thông báo' : 'Close notification'}
            className="text-muted hover:text-white transition-colors p-1 rounded-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Bottom progress bar countdown */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-primary transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
