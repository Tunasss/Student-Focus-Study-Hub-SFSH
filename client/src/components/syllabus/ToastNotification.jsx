import { useEffect } from 'react';

export function ToastNotification({ message, type = 'error', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        backgroundColor: isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
        borderColor: isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)',
      }}
    >
      <span className="text-base">{isError ? '⚠️' : '✅'}</span>
      <p className={`text-xs sm:text-sm font-semibold ${isError ? 'text-rose-400' : 'text-emerald-400'}`}>
        {message}
      </p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="ml-2 rounded-lg p-1 text-muted hover:text-text hover:bg-surface/50 transition-colors cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}
