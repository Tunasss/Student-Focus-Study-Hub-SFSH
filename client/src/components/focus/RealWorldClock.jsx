import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';

export function RealWorldClock({ className = '' }) {
  const { lang } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const t = {
    en: {
      badge: 'LIVE WALL CLOCK',
      tz: 'Asia/Ho_Chi_Minh · GMT+7',
      focusRhythm: 'Real-time Study Cadence',
    },
    vi: {
      badge: 'ĐỒNG HỒ THỜI GIAN THỰC',
      tz: 'Việt Nam (GMT+7)',
      focusRhythm: 'Nhịp độ học thực tế',
    },
  }[lang] || {};

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const dateStr = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`left-widget-card glass-card rounded-3xl p-5 flex items-center justify-between shadow-xl border border-border/70 hover:border-primary/40 transition-all ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-muted truncate">
            {t.badge}
          </p>
        </div>

        {/* Digital Clock Display */}
        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-text">
            {hours}:{minutes}
          </span>
          <span className="text-sm font-bold font-mono text-primary animate-pulse">:</span>
          <span className="text-sm font-bold font-mono text-muted">{seconds}</span>
        </div>

        <p className="text-[11px] font-medium text-muted capitalize truncate">{dateStr}</p>
      </div>

      {/* Timezone & Clock icon badge */}
      <div className="h-14 w-14 rounded-2xl border border-primary/30 bg-surface-2 flex flex-col items-center justify-center shadow-md shrink-0 text-center px-1">
        <span className="text-base">🕒</span>
        <span className="text-[9px] font-mono font-bold text-primary mt-0.5 leading-none">
          GMT+7
        </span>
      </div>
    </div>
  );
}
