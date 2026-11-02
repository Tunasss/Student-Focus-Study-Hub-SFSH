import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';

export function AddTopicModal({ isOpen, _courseId, nextSortOrder = 1, onClose, onCreated }) {
  const { lang } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [error, setError] = useState('');

  const t = {
    en: {
      modalTitle: 'Add Syllabus Topic',
      modalSubtitle: `Chapter ${String(nextSortOrder).padStart(2, '0')} for current course`,
      titleLabel: 'Chapter Title',
      titlePlaceholder: 'e.g., Chapter 4: Database Indexing & B-Trees',
      descLabel: 'Topic Description (Optional)',
      descPlaceholder: 'Key learning checkpoints, algorithms or readings…',
      statusLabel: 'Initial Status',
      todo: 'To Do',
      doing: 'In Progress',
      done: 'Completed',
      cancel: 'Cancel',
      submit: 'Add Topic',
      titleRequired: 'Title is required',
    },
    vi: {
      modalTitle: 'Thêm chương môn học',
      modalSubtitle: `Chương ${String(nextSortOrder).padStart(2, '0')} cho môn học hiện tại`,
      titleLabel: 'Tên chương / Chủ đề',
      titlePlaceholder: 'Ví dụ: Chương 4: Đánh chỉ mục Database & Cây B-Tree',
      descLabel: 'Mô tả chi tiết (Tùy chọn)',
      descPlaceholder: 'Nội dung cốt lõi, tài liệu đọc hoặc bài tập…',
      statusLabel: 'Trạng thái ban đầu',
      todo: 'Chưa học',
      doing: 'Đang học',
      done: 'Hoàn thành',
      cancel: 'Hủy bỏ',
      submit: 'Thêm chương',
      titleRequired: 'Vui lòng nhập tên chương',
    },
  }[lang] || {
    modalTitle: 'Add Syllabus Topic',
    modalSubtitle: `Chapter ${String(nextSortOrder).padStart(2, '0')}`,
    titleLabel: 'Chapter Title',
    titlePlaceholder: 'e.g., Chapter 4: Indexing',
    descLabel: 'Topic Description (Optional)',
    descPlaceholder: 'Key checkpoints…',
    statusLabel: 'Initial Status',
    todo: 'To Do',
    doing: 'In Progress',
    done: 'Completed',
    cancel: 'Cancel',
    submit: 'Add Topic',
    titleRequired: 'Title is required',
  };

  const handleCloseModal = useCallback(() => {
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setError('');
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        handleCloseModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseModal]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t.titleRequired);
      return;
    }

    onCreated?.({
      title: trimmedTitle,
      description: description.trim() || null,
      sortOrder: nextSortOrder,
      status,
    });
    handleCloseModal();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-topic-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-border shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 id="add-topic-title" className="text-xl font-extrabold text-text tracking-tight">
              {t.modalTitle}
            </h3>
            <p className="text-xs text-muted mt-0.5">{t.modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="Close"
            className="rounded-full p-2 text-muted hover:text-text hover:bg-surface/60 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="topic-title" className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.titleLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              id="topic-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder={t.titlePlaceholder}
              autoFocus
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="topic-desc" className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.descLabel}
            </label>
            <textarea
              id="topic-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descPlaceholder}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">{t.statusLabel}</label>
            <div className="flex items-center gap-2">
              {[
                { key: 'TODO', label: t.todo },
                { key: 'DOING', label: t.doing },
                { key: 'DONE', label: t.done },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-all cursor-pointer ${
                    status === s.key
                      ? 'border-primary/60 bg-primary/20 text-primary shadow-xs'
                      : 'border-border/60 bg-surface text-muted hover:text-text'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-muted hover:text-text hover:bg-surface/80 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
