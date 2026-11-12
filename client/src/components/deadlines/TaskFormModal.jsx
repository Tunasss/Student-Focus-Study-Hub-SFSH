import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { syllabusApi } from '../../lib/api';
import { formatCourseInfo } from '../../utils/courseFormat';
import { defaultDeadlineInputValue, toIsoWithTimezoneOffset, toLocalDateTimeInputValue } from '../../utils/deadlines';
import { buildTopicTree } from '../../utils/topicTree';

export function TaskFormModal({
  isOpen,
  courses = [],
  initialTask = null,
  presetCourseId = null,
  presetTopicId = null,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  const modalKey = `${initialTask?.id || 'new'}-${presetCourseId || ''}-${presetTopicId || ''}`;
  return (
    <TaskFormModalContent
      key={modalKey}
      courses={courses}
      initialTask={initialTask}
      presetCourseId={presetCourseId}
      presetTopicId={presetTopicId}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function TaskFormModalContent({
  courses,
  initialTask,
  presetCourseId,
  presetTopicId,
  onClose,
  onSubmit,
}) {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
  const isEditMode = Boolean(initialTask?.id);

  const [title, setTitle] = useState(() => initialTask?.title || '');
  const [courseId, setCourseId] = useState(() => {
    const id = initialTask ? initialTask.courseId || courses[0]?.id : presetCourseId || courses[0]?.id;
    return id ? String(id) : '';
  });
  const [topicId, setTopicId] = useState(() => {
    const id = initialTask ? initialTask.topicId : presetTopicId;
    return id ? String(id) : '';
  });
  const [dueAtLocal, setDueAtLocal] = useState(() =>
    initialTask
      ? toLocalDateTimeInputValue(initialTask.dueAt) || defaultDeadlineInputValue()
      : defaultDeadlineInputValue()
  );
  const [status, setStatus] = useState(() => initialTask?.status || 'TODO');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(Boolean(courseId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = isVi
    ? {
        createTitle: 'Thêm Deadline / Nhiệm vụ',
        editTitle: 'Chỉnh sửa Deadline',
        subtitle: 'Liên kết hạn nộp bài với môn học và chủ đề đề cương để xếp hạng ưu tiên.',
        titleLabel: 'Tiêu đề bài tập / Deadline',
        titlePlaceholder: 'Ví dụ: Lab 4 · REST API với Express & Prisma',
        courseLabel: 'Môn học',
        topicLabel: 'Chủ đề đề cương (Tùy chọn)',
        noTopic: '— Không gắn chủ đề cụ thể —',
        loadingTopics: 'Đang tải danh sách chủ đề…',
        dueLabel: 'Hạn chót (Ngày & Giờ)',
        statusLabel: 'Trạng thái',
        todo: 'Chưa làm',
        doing: 'Đang làm',
        done: 'Hoàn thành',
        cancel: 'Hủy bỏ',
        saveCreate: 'Tạo Deadline',
        saveEdit: 'Lưu thay đổi',
        saving: 'Đang lưu…',
        titleRequired: 'Vui lòng nhập tiêu đề nhiệm vụ.',
        courseRequired: 'Vui lòng chọn môn học.',
        dueRequired: 'Vui lòng chọn thời gian hạn chót hợp lệ.',
        submitFailed: 'Không thể lưu nhiệm vụ. Vui lòng thử lại.',
      }
    : {
        createTitle: 'New Deadline / Task',
        editTitle: 'Edit Deadline',
        subtitle: 'Link deadlines to a course and syllabus topic for accurate urgency tracking.',
        titleLabel: 'Task / Assignment Title',
        titlePlaceholder: 'e.g., Lab 4 · Express REST API & Swagger',
        courseLabel: 'Course',
        topicLabel: 'Syllabus Topic (Optional)',
        noTopic: '— No specific topic linked —',
        loadingTopics: 'Loading course topics…',
        dueLabel: 'Due Date & Time',
        statusLabel: 'Status',
        todo: 'To Do',
        doing: 'In Progress',
        done: 'Completed',
        cancel: 'Cancel',
        saveCreate: 'Create Deadline',
        saveEdit: 'Save Changes',
        saving: 'Saving…',
        titleRequired: 'Task title is required.',
        courseRequired: 'Please select a course.',
        dueRequired: 'Please enter a valid due date and time.',
        submitFailed: 'Failed to save task. Please try again.',
      };

  // Load topics for the selected course
  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;
    syllabusApi
      .getCourseTopics(Number(courseId))
      .then((fetched) => {
        if (cancelled) return;
        const list = Array.isArray(fetched) ? fetched : fetched?.topics || [];
        setTopics(list);
      })
      .catch(() => {
        if (!cancelled) setTopics([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleCloseModal = useCallback(() => {
    if (submitting) return;
    setError('');
    onClose?.();
  }, [submitting, onClose]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseModal]);

  const topicTree = buildTopicTree(courseId ? topics : []);
  const flatTopicOptions = [];
  for (const ch of topicTree) {
    flatTopicOptions.push({ id: ch.id, label: ch.title, isSub: false });
    if (Array.isArray(ch.subtopics)) {
      for (const sub of ch.subtopics) {
        flatTopicOptions.push({ id: sub.id, label: `  ↳ ${sub.title}`, isSub: true });
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t.titleRequired);
      return;
    }

    const numericCourseId = Number(courseId);
    if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
      setError(t.courseRequired);
      return;
    }

    const dueAtIso = toIsoWithTimezoneOffset(dueAtLocal);
    if (!dueAtIso) {
      setError(t.dueRequired);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit?.({
        title: trimmedTitle,
        courseId: numericCourseId,
        topicId: topicId ? Number(topicId) : null,
        dueAt: dueAtIso,
        status: status === 'OVERDUE' ? 'TODO' : status,
      });
      onClose?.();
    } catch (err) {
      setError(err?.message || t.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-modal-title"
      onClick={handleCloseModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-border shadow-2xl relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="task-form-modal-title" className="text-xl font-extrabold text-text tracking-tight">
              {isEditMode ? t.editTitle : t.createTitle}
            </h3>
            <p className="text-xs text-muted mt-0.5">{t.subtitle}</p>
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
          {/* Task Title */}
          <div className="space-y-1.5">
            <label htmlFor="deadline-title" className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.titleLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              id="deadline-title"
              type="text"
              maxLength={255}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder={t.titlePlaceholder}
              autoFocus
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          {/* Course Select */}
          <div className="space-y-1.5">
            <label htmlFor="deadline-course" className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.courseLabel} <span className="text-rose-400">*</span>
            </label>
            <select
              id="deadline-course"
              value={courseId}
              onChange={(e) => {
                const nextId = e.target.value;
                setCourseId(nextId);
                setTopicId('');
                setTopics([]);
                setLoadingTopics(Boolean(nextId));
                if (error) setError('');
              }}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
            >
              {courses.map((c) => {
                const info = formatCourseInfo(c);
                return (
                  <option key={c.id} value={String(c.id)}>
                    {info.code} — {info.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Topic Select */}
          <div className="space-y-1.5">
            <label htmlFor="deadline-topic" className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.topicLabel}
            </label>
            <select
              id="deadline-topic"
              value={topicId}
              disabled={loadingTopics}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer disabled:opacity-60"
            >
              <option value="">{loadingTopics ? t.loadingTopics : t.noTopic}</option>
              {flatTopicOptions.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date & Time */}
          <div className="space-y-1.5">
            <label htmlFor="deadline-due" className="text-xs font-bold uppercase tracking-wider text-muted">
              {t.dueLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              id="deadline-due"
              type="datetime-local"
              value={dueAtLocal}
              onChange={(e) => {
                setDueAtLocal(e.target.value);
                if (error) setError('');
              }}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          {/* Status Radio */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold uppercase tracking-wider text-muted">{t.statusLabel}</span>
            <div className="flex items-center gap-2">
              {[
                { key: 'TODO', label: t.todo },
                { key: 'DOING', label: t.doing },
                { key: 'DONE', label: t.done },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatus(opt.key)}
                  className={`flex-1 rounded-2xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    status === opt.key || (status === 'OVERDUE' && opt.key === 'TODO')
                      ? 'border-primary bg-primary/20 text-primary shadow-xs'
                      : 'border-border bg-surface text-muted hover:text-text'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-400 font-semibold">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={submitting}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-text hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-fg shadow-md hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
            >
              {submitting ? t.saving : isEditMode ? t.saveEdit : t.saveCreate}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

