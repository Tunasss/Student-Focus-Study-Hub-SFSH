import { useLanguage } from '../../i18n/languageContext';

export function MasteryHeaderCard({ course, topics = [] }) {
  const { lang } = useLanguage();

  const total = topics.length;
  const doneCount = topics.filter((t) => t.status === 'DONE').length;
  const doingCount = topics.filter((t) => t.status === 'DOING').length;
  const todoCount = topics.filter((t) => t.status === 'TODO').length;

  const donePct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const doingPct = total > 0 ? Math.round((doingCount / total) * 100) : 0;

  const t = {
    en: {
      mastery: 'Syllabus Mastery',
      completed: 'Completed',
      inProgress: 'In Progress',
      remaining: 'Remaining',
      totalTopics: 'Total Topics',
      statusExcellent: 'On Track for Grade A',
      statusProgress: 'In Active Study Flow',
      statusStart: 'Beginning Syllabus',
    },
    vi: {
      mastery: 'Độ vững kiến thức',
      completed: 'Đã hoàn thành',
      inProgress: 'Đang học',
      remaining: 'Chưa học',
      totalTopics: 'Tổng số chương',
      statusExcellent: 'Tiến độ xuất sắc (Điểm A)',
      statusProgress: 'Đang theo sát lộ trình',
      statusStart: 'Mới bắt đầu môn học',
    },
  }[lang] || {
    mastery: 'Syllabus Mastery',
    completed: 'Completed',
    inProgress: 'In Progress',
    remaining: 'Remaining',
    totalTopics: 'Total Topics',
    statusExcellent: 'On Track for Grade A',
    statusProgress: 'In Active Study Flow',
    statusStart: 'Beginning Syllabus',
  };

  const statusLabel =
    donePct >= 80 ? t.statusExcellent : donePct >= 30 || doingCount > 0 ? t.statusProgress : t.statusStart;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-border/80 shadow-sm relative overflow-hidden">
      {/* Background radial accent glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-md border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-xs font-mono font-bold text-primary tracking-wide">
              {course?.code || 'COURSE'}
            </span>
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">{t.mastery}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight mt-1.5">
            {course?.name || 'Academic Syllabus'}
          </h2>
          <p className="text-xs font-medium text-primary mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {statusLabel}
          </p>
        </div>

        <div className="flex items-baseline gap-2 sm:text-right">
          <span className="text-4xl sm:text-5xl font-black text-text tracking-tight">{donePct}%</span>
          <span className="text-xs font-semibold text-muted uppercase">Mastery</span>
        </div>
      </div>

      {/* Dual-color Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-border/40 overflow-hidden flex p-0.5 border border-border/40">
          <div
            className="h-full rounded-l-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${donePct}%` }}
            title={`Completed: ${donePct}%`}
          />
          <div
            className="h-full bg-amber-400/80 transition-all duration-500 ease-out"
            style={{ width: `${doingPct}%` }}
            title={`In Progress: ${doingPct}%`}
          />
        </div>
      </div>

      {/* Stats breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="rounded-2xl border border-border/60 bg-surface/50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>{t.completed}</span>
          </div>
          <p className="text-lg font-bold text-text mt-1">
            {doneCount} {t.completed}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>{t.inProgress}</span>
          </div>
          <p className="text-lg font-bold text-text mt-1">
            {doingCount} {t.inProgress}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-muted/60" />
            <span>{t.remaining}</span>
          </div>
          <p className="text-lg font-bold text-text mt-1">
            {todoCount} {t.remaining}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface/50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-primary/40" />
            <span>{t.totalTopics}</span>
          </div>
          <p className="text-lg font-bold text-text mt-1">
            {total} {total === 1 ? 'Chapter' : 'Chapters'}
          </p>
        </div>
      </div>
    </div>
  );
}
