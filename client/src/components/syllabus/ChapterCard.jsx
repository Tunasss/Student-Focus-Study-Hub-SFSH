import { useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { extractChapterNumber } from '../../utils/chapterOrder';

export function ChapterCard({
  chapter,
  index = 0,
  onStatusChange,
  onCreateTask,
  onDeleteChapter,
  isUpdating = false,
}) {
  const { lang } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  const detectedNum = extractChapterNumber(chapter?.title) ?? extractChapterNumber(chapter?.sourceFile);
  const num = detectedNum && Number.isInteger(detectedNum) && detectedNum > 0
    ? detectedNum
    : (chapter?.sortOrder || index + 1);
  const chapterNum = String(num).padStart(2, '0');
  const subtopics = chapter?.subtopics || [];
  const hasSubtopics = subtopics.length > 0;

  // Progress metrics with zero-division safeguard
  const doneCount = hasSubtopics
    ? subtopics.filter((s) => s.status === 'DONE').length
    : chapter?.status === 'DONE'
      ? 1
      : 0;

  const totalCount = hasSubtopics ? subtopics.length : 1;
  const progressPercent = hasSubtopics
    ? Math.round((doneCount / subtopics.length) * 100)
    : chapter?.status === 'DONE'
      ? 100
      : 0;

  const t = {
    en: {
      chapter: `Chapter ${chapterNum}`,
      subtopicsCount: (done, total) => `${done}/${total} Completed`,
      todo: 'To Do',
      doing: 'In Progress',
      done: 'Completed',
      markAllDone: 'Mark all Completed',
      updating: 'Saving…',
      addTask: '+ Task',
      toggleChapter: 'Toggle chapter',
      deleteChapter: 'Delete chapter',
    },
    vi: {
      chapter: `Chương ${chapterNum}`,
      subtopicsCount: (done, total) => `${done}/${total} Hoàn thành`,
      todo: 'Chưa học',
      doing: 'Đang học',
      done: 'Hoàn thành',
      markAllDone: 'Đánh dấu tất cả hoàn thành',
      updating: 'Đang lưu…',
      addTask: '+ Nhiệm vụ',
      toggleChapter: 'Thu gọn / Mở rộng chương',
      deleteChapter: 'Xóa chương học',
    },
  }[lang] || {
    chapter: `Chapter ${chapterNum}`,
    subtopicsCount: (done, total) => `${done}/${total} Completed`,
    todo: 'To Do',
    doing: 'In Progress',
    done: 'Completed',
    markAllDone: 'Mark all Completed',
    updating: 'Saving…',
    addTask: '+ Task',
    toggleChapter: 'Toggle chapter',
    deleteChapter: 'Delete chapter',
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

  async function handleMarkAllDone() {
    const pending = subtopics.filter((sub) => sub.status !== 'DONE' && sub.id);
    for (const sub of pending) {
      await onStatusChange?.(sub.id, 'DONE');
    }
  }

  return (
    <div
      className={`chapter-card topic-card glass-card rounded-3xl p-5 sm:p-6 border transition-all duration-300 relative overflow-hidden shadow-xs ${
        progressPercent === 100
          ? 'border-primary/40 bg-primary/[0.04]'
          : doneCount > 0
            ? 'border-border/90 bg-surface/40'
            : 'border-border/60 bg-surface/20'
      }`}
    >
      {/* Chapter Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: Chapter identity & titles */}
        <div className="space-y-2 flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/40 bg-primary/20 px-3 py-0.5 text-xs font-mono font-bold text-primary tracking-wide">
              {t.chapter}
            </span>

            {chapter?.sourceFile && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface/80 px-2.5 py-0.5 text-[11px] font-mono text-muted truncate max-w-xs">
                📄 {chapter.sourceFile}
              </span>
            )}

            {isUpdating && <span className="text-[11px] text-primary animate-pulse">{t.updating}</span>}
          </div>

          <h3
            className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
              progressPercent === 100 ? 'text-text/90' : 'text-text'
            }`}
          >
            {chapter?.title}
          </h3>

          {chapter?.description && (
            <p className="text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">{chapter.description}</p>
          )}
        </div>

        {/* Right: Progress bar, Actions & Accordion Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start sm:self-center">
          {hasSubtopics ? (
            <div className="flex items-center gap-3 bg-surface/90 border border-border/80 px-3.5 py-2 rounded-2xl shadow-xs">
              <div className="flex flex-col gap-1 w-28 sm:w-36">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {progressPercent === 100 && (
                      <span className="text-primary text-xs font-bold">✓</span>
                    )}
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-primary tracking-tight">
                      {progressPercent}%
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-muted/90 font-semibold">
                    {t.subtopicsCount(doneCount, totalCount)}
                  </span>
                </div>
                <div className="w-full h-2 bg-background/90 rounded-full overflow-hidden border border-border/50 flex items-center p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${
                      progressPercent === 100
                        ? 'bg-primary shadow-[0_0_8px_rgba(219,239,144,0.6)]'
                        : 'bg-primary/90'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Legacy single-topic status chips when no subtopics */
            <div
              role="radiogroup"
              aria-label={`Status for ${chapter?.title}`}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 p-1"
            >
              {statusOptions.map((opt) => {
                const isSelected = (chapter?.status || 'TODO') === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onStatusChange?.(chapter?.id, opt.key)}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? opt.activeClass
                        : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${opt.dotClass}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Delete Chapter Button */}
          {onDeleteChapter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChapter(chapter);
              }}
              aria-label={t.deleteChapter}
              title={t.deleteChapter}
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

          {/* Expand/Collapse Chevron Button */}
          {hasSubtopics && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={t.toggleChapter}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface border border-border/60 transition-colors cursor-pointer"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Subtopics Checklist Body */}
      {isExpanded && hasSubtopics && (
        <div className="mt-5 pt-4 border-t border-border/40 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between text-xs text-muted mb-2 px-1">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
              {t.subtopicsCount(doneCount, totalCount)}
            </span>
            {doneCount < subtopics.length && (
              <button
                type="button"
                onClick={handleMarkAllDone}
                className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
              >
                {t.markAllDone}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {subtopics.map((sub, sIdx) => {
              const isDone = sub.status === 'DONE';
              const isDoing = sub.status === 'DOING';
              return (
                <div
                  key={sub.id || sIdx}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? 'border-primary/25 bg-primary/[0.03]'
                      : isDoing
                        ? 'border-amber-400/25 bg-amber-400/[0.03]'
                        : 'border-border/60 bg-surface/50 hover:bg-surface/80'
                  }`}
                >
                  {/* Subtopic description & title */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                      <h4
                        className={`text-xs sm:text-sm font-semibold tracking-tight transition-colors ${
                          isDone ? 'text-text/70 line-through decoration-primary/60' : 'text-text'
                        }`}
                      >
                        {sub.title}
                      </h4>
                    </div>
                    {sub.description && (
                      <p className="text-[11px] text-muted pl-4 mt-0.5 line-clamp-1">{sub.description}</p>
                    )}
                  </div>

                  {/* Right: Subtopic 3-state radio toggle + action */}
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pl-4 sm:pl-0">
                    <div
                      role="radiogroup"
                      aria-label={`Status for ${sub.title}`}
                      className="flex items-center gap-1 rounded-full border border-border/60 bg-surface/80 p-0.5"
                    >
                      {statusOptions.map((opt) => {
                        const isSelected = (sub.status || 'TODO') === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => onStatusChange?.(sub.id, opt.key)}
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                              isSelected
                                ? opt.activeClass
                                : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${opt.dotClass}`} />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {onCreateTask && (
                      <button
                        type="button"
                        onClick={() => onCreateTask(sub)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-muted hover:text-primary hover:bg-primary/10 border border-border/60 transition-colors cursor-pointer"
                        title={t.addTask}
                      >
                        {t.addTask}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
