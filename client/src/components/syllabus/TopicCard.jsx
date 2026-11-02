import { useLanguage } from '../../i18n/languageContext';

export function TopicCard({ topic, index = 0, onStatusChange, isUpdating = false }) {
  const { lang } = useLanguage();

  const chapterNum = String(topic?.sortOrder || index + 1).padStart(2, '0');

  const t = {
    en: {
      chapter: `Chapter ${chapterNum}`,
      todo: 'To Do',
      doing: 'In Progress',
      done: 'Completed',
      updating: 'Updating…',
    },
    vi: {
      chapter: `Chương ${chapterNum}`,
      todo: 'Chưa học',
      doing: 'Đang học',
      done: 'Hoàn thành',
      updating: 'Đang lưu…',
    },
  }[lang] || {
    chapter: `Chapter ${chapterNum}`,
    todo: 'To Do',
    doing: 'In Progress',
    done: 'Completed',
    updating: 'Updating…',
  };

  const currentStatus = topic?.status || 'TODO';

  const statusOptions = [
    {
      key: 'TODO',
      label: t.todo,
      activeClass: 'border-border/80 bg-surface/90 text-muted shadow-xs',
      dotClass: 'bg-muted/60',
    },
    {
      key: 'DOING',
      label: t.doing,
      activeClass: 'border-amber-400/50 bg-amber-400/15 text-amber-400 shadow-xs ring-1 ring-amber-400/30',
      dotClass: 'bg-amber-400',
    },
    {
      key: 'DONE',
      label: t.done,
      activeClass: 'border-primary/60 bg-primary/20 text-primary shadow-xs ring-1 ring-primary/40',
      dotClass: 'bg-primary',
    },
  ];

  return (
    <div
      className={`topic-card glass-card rounded-2xl p-5 sm:p-6 border transition-all duration-200 relative overflow-hidden ${
        currentStatus === 'DONE'
          ? 'border-primary/30 bg-primary/5'
          : currentStatus === 'DOING'
            ? 'border-amber-400/20 bg-amber-400/5'
            : 'border-border/60'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: Chapter & Content */}
        <div className="space-y-1.5 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border/80 bg-surface px-2 py-0.5 text-[11px] font-mono font-bold text-muted">
              {t.chapter}
            </span>
            {isUpdating && <span className="text-[11px] text-primary animate-pulse">{t.updating}</span>}
          </div>

          <h3
            className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
              currentStatus === 'DONE' ? 'text-text/90 line-through decoration-primary/50' : 'text-text'
            }`}
          >
            {topic?.title}
          </h3>

          {topic?.description && (
            <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">{topic.description}</p>
          )}
        </div>

        {/* Right: 3-State Toggle Chips */}
        <div
          role="radiogroup"
          aria-label={`Status for ${topic?.title}`}
          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 p-1 self-start shrink-0"
        >
          {statusOptions.map((opt) => {
            const isSelected = currentStatus === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isUpdating}
                onClick={() => onStatusChange?.(topic.id, opt.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border disabled:opacity-50 ${
                  isSelected ? opt.activeClass : 'border-transparent text-muted/80 hover:text-text hover:bg-surface'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? opt.dotClass : 'bg-muted/40'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
