import { useLanguage } from '../../i18n/languageContext';

export function CourseTabs({ courses = [], activeCourseId, onSelectCourse }) {
  const { lang } = useLanguage();

  const label = lang === 'vi' ? 'Chọn môn học' : 'Select Course';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between sm:hidden">
        <label htmlFor="course-select" className="text-xs font-semibold text-muted uppercase">
          {label}
        </label>
        <span className="text-xs text-primary font-mono">{courses.length} courses</span>
      </div>

      {/* Mobile Dropdown */}
      <div className="block sm:hidden">
        <select
          id="course-select"
          aria-label={label}
          value={activeCourseId || ''}
          onChange={(e) => onSelectCourse(Number(e.target.value))}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text shadow-sm focus:border-primary focus:outline-none"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code ? `${c.code} — ` : ''}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop / Tablet Horizontal Scrollable Pills */}
      <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {courses.map((c) => {
          const isActive = c.id === activeCourseId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCourse(c.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'border-primary/60 bg-primary/20 text-primary shadow-xs ring-1 ring-primary/40'
                  : 'border-border/60 bg-surface/80 text-muted hover:text-text hover:border-border hover:bg-surface'
              }`}
            >
              {c.code && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-mono ${
                    isActive ? 'bg-primary/20 text-primary' : 'bg-border/50 text-muted'
                  }`}
                >
                  {c.code}
                </span>
              )}
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

