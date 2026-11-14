import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';

export function FocusSubChapterCard({
  activeChapter,
  activeSubTopicId,
  onSelectSubTopic,
  onCompleteSubTopic,
  isTaskTarget = false,
}) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const containerRef = useRef(null);

  const t = {
    en: {
      subChapterHeader: 'SUB-CHAPTER OBJECTIVE',
      switchSubChapter: 'Select Sub-chapter',
      noSubChapters: 'Single Chapter (No sub-chapters)',
      noSubChaptersDesc: 'This chapter does not contain separate sub-chapters. Focus target is the entire chapter.',
      allSubChaptersDone: 'All sub-chapters completed',
      markDoneBtn: 'Mark Done ✓',
      markSubDoneTitle: 'Mark this sub-chapter as DONE & advance',
      statusTodo: 'To Do',
      statusDoing: 'In Progress',
      statusDone: 'Completed',
      doneChip: 'DONE',
      taskModeTag: 'ASSIGNMENT MODE',
      taskModeNotice: 'Focusing on course deadline / assignment.',
      progressLabel: (done, total) => `${done}/${total} Done`,
      selectPrompt: 'Choose a sub-chapter to focus on:',
    },
    vi: {
      subChapterHeader: 'MỤC TIÊU TIỂU MỤC',
      switchSubChapter: 'Chọn tiểu mục',
      noSubChapters: 'Chương học đơn (không có tiểu mục con)',
      noSubChaptersDesc: 'Chương này không có tiểu mục con. Mục tiêu học tập là toàn bộ chương.',
      allSubChaptersDone: 'Đã hoàn thành toàn bộ tiểu mục',
      markDoneBtn: 'Hoàn thành ✓',
      markSubDoneTitle: 'Đánh dấu tiểu mục này là HOÀN THÀNH và chuyển tiếp',
      statusTodo: 'Cần làm',
      statusDoing: 'Đang làm',
      statusDone: 'Hoàn thành',
      doneChip: 'HOÀN THÀNH',
      taskModeTag: 'CHẾ ĐỘ BÀI TẬP',
      taskModeNotice: 'Đang tập trung giải quyết bài tập / hạn chót.',
      progressLabel: (done, total) => `${done}/${total} Hoàn thành`,
      selectPrompt: 'Chọn tiểu mục bạn muốn tập trung:',
    },
  }[lang] || {};

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const subtopics = activeChapter?.subtopics || [];
  const hasSubtopics = subtopics.length > 0;
  const doneCount = subtopics.filter((s) => s.status === 'DONE').length;
  const totalCount = subtopics.length;
  const allCompleted = hasSubtopics && doneCount === totalCount;

  // Active subtopic
  const currentSubTopic = hasSubtopics
    ? subtopics.find((s) => String(s.id) === String(activeSubTopicId))
      || subtopics.find((s) => s.status !== 'DONE')
      || subtopics[0]
    : null;

  async function handleMarkDone() {
    if (!currentSubTopic || isCompleting) return;
    setIsCompleting(true);
    try {
      await onCompleteSubTopic?.(currentSubTopic);
    } finally {
      setIsCompleting(false);
    }
  }

  // 1. Task Mode (User selected a specific task instead of a chapter)
  if (isTaskTarget) {
    return (
      <div className="left-widget-card glass-card rounded-3xl p-4 sm:p-5 relative shadow-xl border border-border/70">
        <div className="flex items-center justify-between mb-2">
          <span className="rounded bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 uppercase">
            {t.taskModeTag}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {t.taskModeNotice}
        </p>
      </div>
    );
  }

  // 2. Flat Chapter Mode (Course/Chapter has no sub-chapters)
  if (!hasSubtopics) {
    return (
      <div className="left-widget-card glass-card rounded-3xl p-4 sm:p-5 relative shadow-xl border border-border/70 hover:border-border transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="rounded bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary uppercase">
            {t.subChapterHeader}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted">
            1/1
          </span>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-text truncate">
            {t.noSubChapters}
          </h4>
          <p className="text-[11px] text-muted leading-tight">
            {t.noSubChaptersDesc}
          </p>
        </div>
      </div>
    );
  }

  // 3. Hierarchical Sub-Chapter Mode
  return (
    <div className="relative z-35" ref={containerRef} data-testid="focus-subchapter-card">
      <div className="left-widget-card glass-card rounded-3xl p-4 sm:p-5 relative shadow-xl border border-border/70 hover:border-border transition-all">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="rounded bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary uppercase">
            {t.subChapterHeader}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              data-testid="subchapter-progress-pill"
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                allCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-surface-2 border-border text-primary'
              }`}
            >
              {t.progressLabel(doneCount, totalCount)}
            </span>
            <button
              type="button"
              data-testid="toggle-subchapter-dropdown"
              onClick={() => setIsOpen(!isOpen)}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5 ml-1"
              title={t.switchSubChapter}
            >
              <span>{isOpen ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        {/* Active Sub-Chapter Display & Trigger */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className="space-y-1 cursor-pointer group"
          title={t.switchSubChapter}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-primary text-xs font-mono font-black shrink-0">↳</span>
            <h4
              data-testid="active-subchapter-title"
              className="text-xs sm:text-sm font-bold text-text truncate group-hover:text-primary transition-colors"
            >
              {currentSubTopic?.title}
            </h4>
          </div>
          {currentSubTopic?.description && (
            <p className="text-[11px] text-muted truncate pl-3">
              {currentSubTopic.description}
            </p>
          )}
        </div>

        {/* Status Strip (Mark Done button removed per user request) */}
        <div className="pt-2 mt-2 border-t border-border/60 flex items-center justify-between gap-2 z-10">
          {allCompleted ? (
            <div className="flex items-center justify-between w-full text-[11px] text-emerald-400 font-mono font-bold">
              <span>🎉 {t.allSubChaptersDone}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                {t.doneChip}
              </span>
            </div>
          ) : currentSubTopic?.status === 'DONE' ? (
            <div className="flex items-center justify-between w-full text-[11px] text-emerald-400 font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{t.statusDone}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                {t.doneChip}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    currentSubTopic?.status === 'DOING'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-primary animate-pulse'
                  }`}
                />
                <span className="text-[11px] font-mono font-bold text-muted truncate">
                  {currentSubTopic?.status === 'DOING' ? t.statusDoing : t.statusTodo}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popover Dropdown of Sub-chapters */}
      {isOpen && (
        <div
          data-testid="subchapter-dropdown-menu"
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-surface/95 dark:bg-[#141d06]/95 backdrop-blur-md p-3 shadow-2xl z-50 animate-in fade-in duration-150 space-y-1.5 max-h-56 overflow-y-auto"
        >
          <p className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider px-1 mb-1">
            {t.selectPrompt}
          </p>
          {subtopics.map((sub) => {
            const isSelected = String(sub.id) === String(currentSubTopic?.id);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  onSelectSubTopic?.(sub.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                    : 'hover:bg-surface-2 text-text'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className="text-[10px] font-mono text-muted shrink-0">↳</span>
                  <span className="truncate">{sub.title}</span>
                </div>
                {sub.status === 'DONE' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                    {t.doneChip}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
