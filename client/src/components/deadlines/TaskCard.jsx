import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/languageContext';
import { formatCourseInfo } from '../../utils/courseFormat';
import { formatDaysLeftLabel, formatDeadlineDate, getUrgencyConfig } from '../../utils/deadlines';

export function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isUpdating = false,
}) {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';

  const status = task?.status || 'TODO';
  const isDone = status === 'DONE';
  const urgency = getUrgencyConfig(task?.urgencyBadge, status, lang);
  const daysLeftText = formatDaysLeftLabel(task?.daysLeft, task?.urgencyBadge, status, lang);
  const formattedDue = formatDeadlineDate(task?.dueAt, lang);
  const courseInfo = task?.course ? formatCourseInfo(task.course) : null;

  const t = isVi
    ? {
        todo: 'Chưa làm',
        doing: 'Đang làm',
        done: 'Hoàn thành',
        updating: 'Đang lưu…',
        focus: 'Học ngay',
        edit: 'Chỉnh sửa nhiệm vụ',
        remove: 'Xóa nhiệm vụ',
        duePrefix: 'Hạn:',
      }
    : {
        todo: 'To Do',
        doing: 'In Progress',
        done: 'Completed',
        updating: 'Saving…',
        focus: 'Focus',
        edit: 'Edit task',
        remove: 'Delete task',
        duePrefix: 'Due:',
      };

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
      data-testid={`task-card-${task?.id}`}
      className={`task-card glass-card rounded-3xl p-4 sm:p-5 border transition-all duration-200 shadow-xs ${urgency.cardAccentClass}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Urgency metadata + Title + Course/Topic links */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Urgency Pill */}
            <span
              data-testid={`urgency-badge-${task?.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${urgency.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${urgency.dotClass}`} />
              <span>{urgency.label}</span>
            </span>

            {/* Days Left Indicator */}
            {daysLeftText && (
              <span className="text-[11px] font-mono font-semibold text-muted">
                {daysLeftText}
              </span>
            )}

            {/* Course Tag */}
            {courseInfo && (
              <span
                title={courseInfo.name}
                className="rounded-full border border-border/80 bg-surface/80 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-text/90 truncate max-w-[16rem]"
              >
                {courseInfo.code} · {courseInfo.name}
              </span>
            )}

            {/* Linked Syllabus Topic */}
            {task?.topic && (
              <Link
                to="/syllabus"
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors truncate max-w-xs"
              >
                <span>📖</span>
                <span className="truncate">{task.topic.title}</span>
              </Link>
            )}

            {isUpdating && (
              <span className="text-[11px] text-primary animate-pulse font-medium">{t.updating}</span>
            )}
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3
              className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                isDone ? 'text-text/60 line-through decoration-primary/60' : 'text-text'
              }`}
            >
              {task?.title}
            </h3>
          </div>

          {formattedDue && (
            <p className="text-xs font-mono text-muted">
              {t.duePrefix} <span className="text-text/80 font-semibold">{formattedDue}</span>
            </p>
          )}
        </div>

        {/* Right: 3-state status toggle + Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
          <div
            role="radiogroup"
            aria-label={`Status for ${task?.title}`}
            className="flex items-center gap-1 rounded-full border border-border/70 bg-surface/80 p-1"
          >
            {statusOptions.map((opt) => {
              const isSelected = status === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isUpdating}
                  onClick={() => onStatusChange?.(task.id, opt.key)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                    isSelected
                      ? opt.activeClass
                      : 'text-muted hover:text-text hover:bg-surface/60 border border-transparent'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${opt.dotClass}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {!isDone && (
            <Link
              to="/focus"
              className="rounded-xl border border-primary/40 bg-primary/15 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/25 transition-colors"
            >
              {t.focus} →
            </Link>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={t.edit}
              title={t.edit}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface border border-border/60 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label={t.remove}
              title={t.remove}
              className="p-2 rounded-xl text-muted/70 hover:text-rose-400 hover:bg-rose-500/10 border border-border/60 hover:border-rose-500/30 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
