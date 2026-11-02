import { useLanguage } from '../i18n/languageContext';
import { useTheme } from './themeContext';

const THEME_LABELS = {
  en: {
    group: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  vi: {
    group: 'Giao diện',
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống',
  },
};

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const { lang } = useLanguage();
  const t = THEME_LABELS[lang] || THEME_LABELS.en;

  const options = [
    { value: 'light', label: t.light, icon: '☀' },
    { value: 'dark', label: t.dark, icon: '☾' },
    { value: 'system', label: t.system, icon: '◐' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t.group}
      className="inline-flex rounded-xl border border-border bg-surface-2 p-0.5 shadow-2xs"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={preference === o.value}
          title={o.label}
          onClick={() => setPreference(o.value)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
            preference === o.value
              ? 'bg-surface text-text shadow-xs border border-border/40'
              : 'text-muted hover:text-text'
          }`}
        >
          <span aria-hidden="true">{o.icon}</span>
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
