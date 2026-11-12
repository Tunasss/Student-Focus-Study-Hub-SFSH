import { useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';

export function TopicCompletionModal({
  isOpen,
  topicTitle,
  courseCode,
  onConfirmDone,
  onKeepDoing,
}) {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const t = isVi
    ? {
        title: 'Hoàn thành phiên tập trung! 🎉',
        subtitle: 'Bạn đã đạt mốc thời gian học sâu cho chủ đề này.',
        prompt: (name) => `Bạn có muốn đánh dấu chủ đề "${name}" là HOÀN THÀNH (DONE) không?`,
        confirmBtn: 'Đánh dấu DONE ✓',
        confirming: 'Đang lưu…',
        keepDoingBtn: 'Tiếp tục học (Giữ DOING)',
        tag: 'GỢI Ý ĐỀ CƯƠNG · WBS 3.4',
      }
    : {
        title: 'Focus Sprint Completed! 🎉',
        subtitle: "You've logged deep focus time for this study topic.",
        prompt: (name) => `Would you like to mark "${name}" as DONE in your curriculum?`,
        confirmBtn: 'Mark as DONE ✓',
        confirming: 'Saving…',
        keepDoingBtn: 'Keep as In Progress',
        tag: 'SYLLABUS SUGGESTION · WBS 3.4',
      };

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirmDone?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-completion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="glass-card rounded-3xl p-6 sm:p-7 max-w-md w-full border border-primary/40 bg-surface/95 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary uppercase">
            {t.tag}
          </span>
          {courseCode && (
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 border border-border text-muted">
              {courseCode}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h2 id="topic-completion-title" className="text-lg sm:text-xl font-extrabold text-text">
            {t.title}
          </h2>
          <p className="text-xs text-muted">{t.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface-2/40 p-4">
          <p className="text-xs sm:text-sm font-semibold text-text leading-relaxed">
            {t.prompt(topicTitle || (isVi ? 'Chủ đề hiện tại' : 'Current topic'))}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/50">
          <button
            type="button"
            disabled={submitting}
            onClick={onKeepDoing}
            className="w-full sm:w-auto rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            {t.keepDoingBtn}
          </button>
          <button
            type="button"
            data-testid="confirm-topic-done-btn"
            disabled={submitting}
            onClick={handleConfirm}
            className="w-full sm:w-auto rounded-full bg-primary px-5 py-2 text-xs font-extrabold text-primary-fg shadow-md hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {submitting ? t.confirming : t.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
