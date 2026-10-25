import { useTheme } from './themeContext';

const OPTIONS = [
  { value: 'light', label: 'Sáng', icon: '☀' },
  { value: 'dark', label: 'Tối', icon: '☾' },
  { value: 'system', label: 'Hệ thống', icon: '◐' },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div role="radiogroup" aria-label="Giao diện" className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={preference === o.value}
          title={o.label}
          onClick={() => setPreference(o.value)}
          className={`rounded-md px-2.5 py-1 text-sm transition-colors ${
            preference === o.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
          }`}
        >
          <span aria-hidden="true">{o.icon}</span>
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
