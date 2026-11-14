import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { CalendarIcon } from '../icons/AppIcons';

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
    },
    vi: {
      badge: 'ĐỒNG HỒ THỰC TẾ',
    },
  }[lang] || { badge: 'LIVE WALL CLOCK' };

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const dateStr = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`left-widget-card glass-card rounded-3xl p-5 shadow-xl border border-border/70 hover:border-primary/40 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_#DBEF90]" />
        <p className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-primary">
          {t.badge}
        </p>
      </div>

      {/* Large, prominent, crystal-clear digital clock (High contrast in Light & Dark mode) */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-text dark:text-white drop-shadow-sm">
          {hours}:{minutes}
        </span>
        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-primary ml-1">
          :{seconds}
        </span>
      </div>

      {/* Localized Date */}
      <p className="text-xs sm:text-sm font-semibold text-muted capitalize mt-1.5 flex items-center gap-1.5">
        <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>{dateStr}</span>
      </p>
    </div>
  );
}
