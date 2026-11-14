import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { TaskCard } from '../components/deadlines/TaskCard';
import { TaskFormModal } from '../components/deadlines/TaskFormModal';
import { RecommendationBanner } from '../components/RecommendationBanner';
import { ToastNotification } from '../components/syllabus/ToastNotification';
import { CalendarIcon, CheckCircleIcon } from '../components/icons/AppIcons';
import { useLanguage } from '../i18n/languageContext';
import { scheduleApi, tasksApi } from '../lib/api';
import { deduplicateSyllabusCourses, formatCourseInfo } from '../utils/courseFormat';

function sortTasksPriority(list) {
  return [...list].sort((a, b) => {
    const aDone = a.status === 'DONE' ? 1 : 0;
    const bDone = b.status === 'DONE' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const dueDiff = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    if (!Number.isNaN(dueDiff) && dueDiff !== 0) return dueDiff;
    return (a.id || 0) - (b.id || 0);
  });
}

export function DeadlinesPage() {
  const { lang } = useLanguage();
  const isVi = lang === 'vi';
  const containerRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const t = isVi
    ? {
        eyebrow: 'RADAR HẠN NỘP BÀI',
        pageTitle: 'Quản lý Deadlines & Nhiệm vụ',
        pageSubtitle:
          'Theo dõi bài tập sắp đến hạn, gắn chủ đề đề cương và ưu tiên công việc theo mức độ khẩn cấp.',
        newTaskBtn: '+ Thêm Deadline',
        summaryOverdue: 'Quá hạn',
        summaryOverdueSub: 'Cần xử lý ngay',
        summaryUrgent: 'Khẩn cấp (< 3 ngày)',
        summaryUrgentSub: 'Ưu tiên cao nhất',
        summarySoon: 'Sắp tới (3–7 ngày)',
        summarySoonSub: 'Lên kế hoạch sớm',
        summaryDone: 'Đã hoàn thành',
        summaryDoneSub: 'Nhiệm vụ xong',
        allCourses: 'Tất cả môn học',
        tabAll: 'Tất cả',
        tabActive: 'Đang mở',
        tabDone: 'Hoàn thành',
        searchPlaceholder: 'Tìm theo tiêu đề, mã môn hoặc chủ đề…',
        clearFilters: 'Xóa bộ lọc',
        noCoursesTitle: 'Chưa có môn học trong Thời khóa biểu',
        noCoursesDesc:
          'Hãy nhập thời khóa biểu của bạn trước để hệ thống đồng bộ môn học và tạo deadline gắn liền với đề cương.',
        goTimetable: 'Đi tới Thời khóa biểu →',
        emptyTasksTitle: 'Chưa có deadline nào được tạo',
        emptyTasksDesc: 'Tạo nhiệm vụ đầu tiên để kích hoạt bảng xếp hạng mức độ khẩn cấp.',
        noMatchesTitle: 'Không tìm thấy deadline phù hợp',
        noMatchesDesc: 'Thử thay đổi bộ lọc trạng thái, môn học hoặc từ khóa tìm kiếm.',
        loadError: 'Không thể tải danh sách deadline. Vui lòng thử lại.',
        createSuccess: 'Đã tạo deadline mới.',
        updateSuccess: 'Đã cập nhật deadline.',
        deleteSuccess: 'Đã xóa deadline.',
        statusError: 'Không thể cập nhật trạng thái nhiệm vụ.',
        deleteError: 'Không thể xóa deadline. Vui lòng thử lại.',
        deleteModalTitle: 'Xóa deadline này?',
        deleteModalDesc: (title) => `Nhiệm vụ "${title}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`,
        cancel: 'Hủy bỏ',
        confirmDelete: 'Xác nhận xóa',
        deleting: 'Đang xóa…',
      }
    : {
        eyebrow: 'DEADLINE RADAR',
        pageTitle: 'Deadlines & Tasks',
        pageSubtitle:
          'Track upcoming assignments, link them to syllabus chapters, and stay ahead of critical milestones.',
        newTaskBtn: '+ New Task',
        summaryOverdue: 'Overdue',
        summaryOverdueSub: 'Needs attention now',
        summaryUrgent: 'Urgent (< 3d)',
        summaryUrgentSub: 'Top priority',
        summarySoon: 'Soon (3–7d)',
        summarySoonSub: 'Plan ahead',
        summaryDone: 'Completed',
        summaryDoneSub: 'Finished tasks',
        allCourses: 'All Courses',
        tabAll: 'All',
        tabActive: 'Active',
        tabDone: 'Completed',
        searchPlaceholder: 'Search by title, course, or topic…',
        clearFilters: 'Clear filters',
        noCoursesTitle: 'No Courses Imported Yet',
        noCoursesDesc:
          'Import your timetable first so your deadlines and assignments can link cleanly to your courses and syllabus topics.',
        goTimetable: 'Go to Timetable →',
        emptyTasksTitle: 'No Deadlines Scheduled Yet',
        emptyTasksDesc: 'Add your first assignment or exam milestone to start tracking urgency.',
        noMatchesTitle: 'No Matching Deadlines',
        noMatchesDesc: 'Try adjusting your urgency card, course filter, or search query.',
        loadError: 'Failed to load deadlines. Please refresh and try again.',
        createSuccess: 'Deadline created successfully.',
        updateSuccess: 'Deadline updated successfully.',
        deleteSuccess: 'Deadline removed.',
        statusError: 'Failed to update task status.',
        deleteError: 'Failed to delete deadline. Please try again.',
        deleteModalTitle: 'Delete this deadline?',
        deleteModalDesc: (title) => `Task "${title}" will be permanently removed.`,
        cancel: 'Cancel',
        confirmDelete: 'Delete Task',
        deleting: 'Deleting…',
      };

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setLoading(true);
      try {
        const [taskData, courseData] = await Promise.all([
          tasksApi.listTasks(),
          scheduleApi.getCourses(),
        ]);
        if (cancelled) return;
        const rawTasks = Array.isArray(taskData) ? taskData : taskData?.tasks || [];
        const rawCourses = Array.isArray(courseData) ? courseData : courseData?.courses || [];
        setTasks(sortTasksPriority(rawTasks));
        setCourses(deduplicateSyllabusCourses(rawCourses));
      } catch (err) {
        if (!cancelled) {
          setToast({
            message: err?.message || t.loadError,
            type: 'error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [t.loadError]);

  useLayoutEffect(() => {
    if (loading || hasAnimatedRef.current || !containerRef.current) return;
    hasAnimatedRef.current = true;
    const ctx = gsap.context(() => {
      gsap.from('.deadline-stagger', {
        y: 14,
        opacity: 0,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  // Ensure any task-linked course not present in deduplicated courses remains selectable
  const selectableCourses = useMemo(() => {
    const map = new Map(courses.map((c) => [c.id, c]));
    for (const task of tasks) {
      if (task.course && !map.has(task.course.id)) {
        map.set(task.course.id, task.course);
      }
    }
    return Array.from(map.values());
  }, [courses, tasks]);

  const counts = useMemo(() => {
    let overdue = 0;
    let urgent = 0;
    let soon = 0;
    let done = 0;
    for (const task of tasks) {
      if (task.status === 'DONE') {
        done += 1;
        continue;
      }
      if (task.urgencyBadge === 'OVERDUE' || task.status === 'OVERDUE') {
        overdue += 1;
      } else if (task.urgencyBadge === 'URGENT') {
        urgent += 1;
      } else if (task.urgencyBadge === 'SOON') {
        soon += 1;
      }
    }
    return { overdue, urgent, soon, done };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (urgencyFilter === 'DONE') {
        if (task.status !== 'DONE') return false;
      } else if (urgencyFilter !== 'ALL') {
        if (task.status === 'DONE') return false;
        const badge = task.urgencyBadge === 'OVERDUE' || task.status === 'OVERDUE' ? 'OVERDUE' : task.urgencyBadge;
        if (badge !== urgencyFilter) return false;
      }

      if (statusFilter === 'ACTIVE' && task.status === 'DONE') return false;
      if (statusFilter === 'DONE' && task.status !== 'DONE') return false;

      if (courseFilter !== 'ALL' && String(task.courseId) !== String(courseFilter)) {
        return false;
      }

      if (q) {
        const haystacks = [
          task.title,
          task.course?.code,
          task.course?.name,
          task.topic?.title,
        ]
          .filter(Boolean)
          .map((s) => s.toLowerCase());
        if (!haystacks.some((h) => h.includes(q))) return false;
      }

      return true;
    });
  }, [tasks, urgencyFilter, statusFilter, courseFilter, searchQuery]);

  const hasActiveFilters =
    urgencyFilter !== 'ALL' || statusFilter !== 'ALL' || courseFilter !== 'ALL' || searchQuery.trim() !== '';

  function handleToggleUrgencyCard(key) {
    setUrgencyFilter((prev) => (prev === key ? 'ALL' : key));
  }

  function handleResetFilters() {
    setUrgencyFilter('ALL');
    setStatusFilter('ALL');
    setCourseFilter('ALL');
    setSearchQuery('');
  }

  async function handleStatusChange(taskId, nextStatus) {
    const target = tasks.find((item) => item.id === taskId);
    if (!target || target.status === nextStatus) return;

    const snapshot = tasks;
    const optimistic = tasks.map((item) =>
      item.id === taskId
        ? {
            ...item,
            status: nextStatus,
            urgencyBadge: nextStatus === 'DONE' ? null : item.urgencyBadge,
          }
        : item
    );
    setTasks(sortTasksPriority(optimistic));
    setUpdatingTaskId(taskId);

    try {
      const updated = await tasksApi.updateTask(taskId, { status: nextStatus });
      setTasks((prev) => sortTasksPriority(prev.map((item) => (item.id === taskId ? updated : item))));
    } catch (err) {
      setTasks(snapshot);
      setToast({
        message: err?.message || t.statusError,
        type: 'error',
      });
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleSaveTask(payload) {
    if (editingTask?.id) {
      const updated = await tasksApi.updateTask(editingTask.id, payload);
      setTasks((prev) => sortTasksPriority(prev.map((item) => (item.id === updated.id ? updated : item))));
      setToast({ message: t.updateSuccess, type: 'success' });
    } else {
      const created = await tasksApi.createTask(payload);
      setTasks((prev) => sortTasksPriority([...prev, created]));
      setToast({ message: t.createSuccess, type: 'success' });
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await tasksApi.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((item) => item.id !== taskToDelete.id));
      setTaskToDelete(null);
      setToast({ message: t.deleteSuccess, type: 'success' });
    } catch (err) {
      setToast({
        message: err?.message || t.deleteError,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const summaryCards = [
    {
      key: 'OVERDUE',
      label: t.summaryOverdue,
      sub: t.summaryOverdueSub,
      value: counts.overdue,
      accent: 'text-rose-400',
      activeRing: 'border-rose-500/60 bg-rose-500/10 ring-1 ring-rose-500/30',
    },
    {
      key: 'URGENT',
      label: t.summaryUrgent,
      sub: t.summaryUrgentSub,
      value: counts.urgent,
      accent: 'text-orange-400',
      activeRing: 'border-orange-500/60 bg-orange-500/10 ring-1 ring-orange-500/30',
    },
    {
      key: 'SOON',
      label: t.summarySoon,
      sub: t.summarySoonSub,
      value: counts.soon,
      accent: 'text-amber-400',
      activeRing: 'border-amber-400/60 bg-amber-400/10 ring-1 ring-amber-400/30',
    },
    {
      key: 'DONE',
      label: t.summaryDone,
      sub: t.summaryDoneSub,
      value: counts.done,
      accent: 'text-primary',
      activeRing: 'border-primary/60 bg-primary/10 ring-1 ring-primary/30',
    },
  ];

  return (
    <div ref={containerRef} className="px-4 sm:px-8 py-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <header className="deadline-stagger flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {t.eyebrow}
          </span>
          <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-text mt-1">
            {t.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">{t.pageSubtitle}</p>
        </div>

        <button
          type="button"
          disabled={selectableCourses.length === 0}
          onClick={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto shrink-0"
        >
          <span>{t.newTaskBtn}</span>
        </button>
      </header>

      {/* Next Study Action Recommendation Banner (WBS 3.3) */}
      <div className="deadline-stagger">
        <RecommendationBanner refreshKey={`${tasks.length}-${counts.done}-${counts.overdue}`} />
      </div>

      {/* Urgency Radar Cards */}
      <section className="deadline-stagger grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {summaryCards.map((card) => {
          const isActive = urgencyFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleToggleUrgencyCard(card.key)}
              aria-pressed={isActive}
              data-testid={`radar-card-${card.key}`}
              className={`glass-card text-left rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer ${
                isActive ? card.activeRing : 'border-border/80 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted">{card.label}</span>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                )}
              </div>
              <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums ${card.accent}`}>
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-muted">{card.sub}</p>
            </button>
          );
        })}
      </section>

      {/* Filter & Search Bar */}
      <section className="deadline-stagger glass-card rounded-3xl p-4 border border-border/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status tabs */}
          <div className="inline-flex items-center rounded-full border border-border/70 bg-surface/80 p-1">
            {[
              { key: 'ALL', label: t.tabAll },
              { key: 'ACTIVE', label: t.tabActive },
              { key: 'DONE', label: t.tabDone },
            ].map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    active ? 'bg-primary text-primary-fg shadow-xs' : 'text-muted hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Course filter */}
          <select
            aria-label="Filter by course"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-text focus:border-primary focus:outline-none cursor-pointer max-w-[16rem]"
          >
            <option value="ALL">{t.allCourses}</option>
            {selectableCourses.map((course) => {
              const info = formatCourseInfo(course);
              return (
                <option key={course.id} value={String(course.id)}>
                  {info.code} — {info.name}
                </option>
              );
            })}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-full border border-border/70 px-3.5 py-2 text-xs font-semibold text-muted hover:text-text hover:bg-surface/60 transition-colors cursor-pointer"
            >
              {t.clearFilters}
            </button>
          )}
        </div>

        {/* Search box */}
        <div className="relative w-full lg:w-72">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full rounded-full border border-border bg-surface pl-4 pr-4 py-2 text-xs text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </section>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card rounded-3xl h-28 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : selectableCourses.length === 0 && tasks.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-border/80 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-text">{t.noCoursesTitle}</h2>
            <p className="text-sm text-muted max-w-md mx-auto">{t.noCoursesDesc}</p>
          </div>
          <Link
            to="/timetable"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-md hover:opacity-90 transition-opacity"
          >
            {t.goTimetable}
          </Link>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-border/80 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-text">{t.emptyTasksTitle}</h2>
            <p className="text-sm text-muted max-w-md mx-auto">{t.emptyTasksDesc}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t.newTaskBtn}
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-border/80 text-center space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-text">{t.noMatchesTitle}</h2>
            <p className="text-sm text-muted max-w-md mx-auto">{t.noMatchesDesc}</p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs font-semibold text-text hover:bg-surface transition-colors cursor-pointer"
          >
            {t.clearFilters}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isUpdating={updatingTaskId === task.id}
              onStatusChange={handleStatusChange}
              onEdit={(target) => {
                setEditingTask(target);
                setIsFormOpen(true);
              }}
              onDelete={(target) => setTaskToDelete(target)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskFormModal
        isOpen={isFormOpen}
        courses={selectableCourses}
        initialTask={editingTask}
        presetCourseId={courseFilter !== 'ALL' ? Number(courseFilter) : null}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => !isDeleting && setTaskToDelete(null)}
        >
          <div
            className="glass-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3 id="delete-task-title" className="text-lg font-bold text-text">
                {t.deleteModalTitle}
              </h3>
              <p className="text-sm text-muted">{t.deleteModalDesc(taskToDelete.title)}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTaskToDelete(null)}
                className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-text hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-full bg-rose-500 px-5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? t.deleting : t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

