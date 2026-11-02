import { useLanguage } from './languageContext';

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label={lang === 'en' ? 'Language selector' : 'Chọn ngôn ngữ'}
      className="inline-flex items-center rounded-xl border border-border bg-surface-2 p-0.5 shadow-2xs"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
          lang === 'en'
            ? 'bg-primary text-primary-fg shadow-2xs'
            : 'text-muted hover:text-text'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('vi')}
        aria-pressed={lang === 'vi'}
        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
          lang === 'vi'
            ? 'bg-primary text-primary-fg shadow-2xs'
            : 'text-muted hover:text-text'
        }`}
      >
        VI
      </button>
    </div>
  );
}

