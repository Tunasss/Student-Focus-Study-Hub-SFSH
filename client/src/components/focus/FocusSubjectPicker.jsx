import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { scheduleApi, syllabusApi, tasksApi } from '../../lib/api';
import { deduplicateSyllabusCourses, formatCourseInfo } from '../../utils/courseFormat';
import { formatDaysLeftLabel, getUrgencyConfig } from '../../utils/deadlines';
import { buildTopicTree } from '../../utils/topicTree';

export function FocusSubjectPicker({
  activeCourseId,
  activeTopicId,
  activeTaskId,
  activeSubTopicId,
  onSelectCourse,
  onSelectTopic,
  onSelectTask,
  onCompleteAction,
  onTopicsLoaded,
}) {
  const { lang } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [completingAction, setCompletingAction] = useState(false);
  const containerRef = useRef(null);

  const t = {
    en: {
      targetSubject: 'FOCUS OBJECTIVE',
      switchTarget: 'Change Target',
      noCourse: 'General Study Session',
      noTopic: 'Whole Course Review',
      selectSubjectTitle: 'Select Focus Subject & Chapter',
      coursesHeader: 'Enrolled Courses',
      deadlinesHeader: 'Upcoming Deadlines & Tasks',
      topicsHeader: 'Curriculum Chapters',
      noTopicsAvailable: 'No chapters added yet for this course.',
      noDeadlinesAvailable: 'No upcoming deadlines for this course.',
      pendingLabel: 'pending',
      doneChip: 'DONE',
      statusTodo: 'To Do',
      statusDoing: 'In Progress',
      statusDone: 'Completed',
      markDoneBtn: 'Mark Done ✓',
      markTaskDone: 'Mark this task as DONE & advance',
      markTopicDone: 'Mark this chapter as DONE & advance',
      allCompleted: 'Objectives up to date',
    },
    vi: {
      targetSubject: 'MỤC TIÊU HỌC TẬP',
      switchTarget: 'Đổi mục tiêu',
      noCourse: 'Phiên tự học chung',
      noTopic: 'Ôn tập toàn bộ môn học',
      selectSubjectTitle: 'Chọn Môn học & Mục tiêu',
      coursesHeader: 'Môn học trong thời khóa biểu',
      deadlinesHeader: 'Bài tập & Hạn chót sắp tới',
      topicsHeader: 'Chương mục giáo trình',
      noTopicsAvailable: 'Chưa có chương nào trong môn học này.',
      noDeadlinesAvailable: 'Không có bài tập nào sắp đến hạn.',
      pendingLabel: 'chưa nộp',
      doneChip: 'HOÀN THÀNH',
      statusTodo: 'Cần làm',
      statusDoing: 'Đang làm',
      statusDone: 'Hoàn thành',
      markDoneBtn: 'Hoàn thành ✓',
      markTaskDone: 'Đánh dấu bài tập này là HOÀN THÀNH và chuyển tiếp',
      markTopicDone: 'Đánh dấu chương này là HOÀN THÀNH và chuyển tiếp',
      allCompleted: 'Đã hoàn thành mọi mục tiêu',
    },
  }[lang] || {};

  // Fetch courses from timetable
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await scheduleApi.getCourses();
        const list = res?.courses || (Array.isArray(res) ? res : []);
        if (!cancelled) {
          const deduplicated = deduplicateSyllabusCourses(list);
          setCourses(deduplicated);
          if (deduplicated.length > 0 && !activeCourseId) {
            onSelectCourse?.(deduplicated[0].id);
          }
        }
      } catch {
        // Fallback default
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeCourseId, onSelectCourse]);

  // Fetch topics for active course
  useEffect(() => {
    let cancelled = false;
    if (!activeCourseId) {
      return undefined;
    }
    async function loadTopics() {
      try {
        const fetched = await syllabusApi.getCourseTopics(activeCourseId);
        if (!cancelled) {
          const list = Array.isArray(fetched) ? fetched : fetched?.topics || [];
          setTopics(list);
          onTopicsLoaded?.(list);
          if (list.length > 0 && !activeTopicId && !activeTaskId) {
            const tree = buildTopicTree(list);
            const firstChapter = tree[0];
            const firstSub = firstChapter?.subtopics?.find((s) => s.status !== 'DONE') || firstChapter?.subtopics?.[0] || null;
            onSelectTopic?.(firstChapter?.id, firstSub?.id || null);
          }
        }
      } catch {
        if (!cancelled) {
          setTopics([]);
          onTopicsLoaded?.([]);
        }
      }
    }
    loadTopics();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourseId]);

  // Fetch tasks / deadlines for active course
  useEffect(() => {
    let cancelled = false;
    if (!activeCourseId) {
      return undefined;
    }
    async function loadTasks() {
      try {
        const fetched = await tasksApi.listTasks({ courseId: activeCourseId });
        if (!cancelled) {
          const list = Array.isArray(fetched) ? fetched : fetched?.tasks || [];
          const sorted = [...list].sort((a, b) => {
            const aDone = a.status === 'DONE' ? 1 : 0;
            const bDone = b.status === 'DONE' ? 1 : 0;
            if (aDone !== bDone) return aDone - bDone;
            const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
            const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
            return dueA - dueB;
          });
          setTasks(sorted);
        }
      } catch {
        if (!cancelled) setTasks([]);
      }
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [activeCourseId]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentCourse = courses.find((c) => String(c.id) === String(activeCourseId)) || courses[0];
  const currentTopics = activeCourseId ? topics : [];
  const courseInfo = currentCourse ? formatCourseInfo(currentCourse) : null;
  const chapterTree = useMemo(() => buildTopicTree(currentTopics), [currentTopics]);

  // Determine active target: EITHER a Task OR a Chapter (mutually exclusive)
  let targetType = null;
  let currentTask = null;
  let currentTopic = null;

  if (activeTaskId) {
    currentTask = tasks.find((t) => String(t.id) === String(activeTaskId)) || null;
    if (currentTask) {
      targetType = 'task';
    }
  }

  if (!targetType && activeTopicId) {
    currentTopic = chapterTree.find((ch) => String(ch.id) === String(activeTopicId))
      || chapterTree.find((ch) => ch.subtopics?.some((s) => String(s.id) === String(activeTopicId)))
      || currentTopics.find((tp) => String(tp.id) === String(activeTopicId))
      || null;
    if (currentTopic) {
      targetType = 'topic';
    }
  }

  // Fallback if neither explicitly chosen: default to first active chapter if syllabus exists,
  // otherwise default to first pending task.
  if (!targetType) {
    const firstActiveTopic = chapterTree.find((ch) => ch.status === 'DOING')
      || chapterTree.find((ch) => ch.status !== 'DONE')
      || chapterTree[0]
      || null;

    if (firstActiveTopic) {
      targetType = 'topic';
      currentTopic = firstActiveTopic;
    } else {
      const firstActiveTask = tasks.find((t) => t.status !== 'DONE') || null;
      if (firstActiveTask) {
        targetType = 'task';
        currentTask = firstActiveTask;
      }
    }
  }

  // Determine active subtopic within the current chapter if hierarchical
  const hasSubtopics = Array.isArray(currentTopic?.subtopics) && currentTopic.subtopics.length > 0;
  const currentSubTopic = hasSubtopics
    ? (currentTopic.subtopics.find((s) => String(s.id) === String(activeSubTopicId))
      || currentTopic.subtopics.find((s) => s.status !== 'DONE')
      || currentTopic.subtopics[0])
    : null;

  const isCurrentTopicDone = currentTopic
    ? (hasSubtopics
        ? currentTopic.subtopics.every((s) => s.status === 'DONE')
        : currentTopic.status === 'DONE')
    : false;

  const currentUrgency = currentTask
    ? getUrgencyConfig(currentTask.urgencyBadge, currentTask.status, lang)
    : null;
  const currentDaysLeftLabel = currentTask
    ? formatDaysLeftLabel(currentTask.daysLeft, currentTask.urgencyBadge, currentTask.status, lang)
    : null;

  async function handleCompleteTask(taskToComplete) {
    if (!taskToComplete || completingAction) return;
    setCompletingAction(true);
    try {
      await tasksApi.updateTask(taskToComplete.id, { status: 'DONE' });
      const updatedList = tasks.map((tk) =>
        String(tk.id) === String(taskToComplete.id) ? { ...tk, status: 'DONE' } : tk
      );
      setTasks(updatedList);
      const nextTask = updatedList.find((tk) => String(tk.id) !== String(taskToComplete.id) && tk.status !== 'DONE') || null;
      if (nextTask) {
        onSelectTask?.(nextTask.id);
        onSelectTopic?.(null);
      } else {
        onSelectTask?.(null);
        const pendingTopic = topics.find((tp) => tp.status !== 'DONE');
        if (pendingTopic) {
          onSelectTopic?.(pendingTopic.id);
        } else {
          onSelectTopic?.(null);
        }
      }
      onCompleteAction?.({ type: 'task', item: taskToComplete, nextItem: nextTask });
    } catch {
      // ignore
    } finally {
      setCompletingAction(false);
    }
  }

  async function handleCompleteTopic() {
    if (!currentTopic || completingAction) return;
    setCompletingAction(true);
    try {
      const isHierarchical = Array.isArray(currentTopic.subtopics) && currentTopic.subtopics.length > 0;
      const targetSub = isHierarchical
        ? (currentTopic.subtopics.find((s) => String(s.id) === String(activeSubTopicId))
          || currentTopic.subtopics.find((s) => s.status !== 'DONE')
          || currentTopic.subtopics[0])
        : null;

      if (isHierarchical && targetSub) {
        // Mark the active SUB-CHAPTER as completed!
        await syllabusApi.updateTopicStatus(targetSub.id, 'DONE');
        const updatedList = topics.map((tp) =>
          String(tp.id) === String(targetSub.id) ? { ...tp, status: 'DONE' } : tp
        );
        setTopics(updatedList);
        onTopicsLoaded?.(updatedList);

        const updatedTree = buildTopicTree(updatedList);
        const updatedCh = updatedTree.find((ch) => String(ch.id) === String(currentTopic.id));
        const subList = updatedCh?.subtopics || [];
        const remainingSubs = subList.filter((s) => String(s.id) !== String(targetSub.id) && s.status !== 'DONE');

        if (remainingSubs.length > 0) {
          const nextSub = remainingSubs[0];
          onSelectTopic?.(currentTopic.id, nextSub.id);
          onCompleteAction?.({ type: 'subtopic', item: targetSub, nextItem: nextSub });
        } else {
          // All subtopics in this chapter are finished! Mark the parent chapter as DONE
          try {
            await syllabusApi.updateTopicStatus(currentTopic.id, 'DONE');
          } catch {
            // Ignore if already updated
          }
          const fullyUpdatedList = updatedList.map((tp) =>
            String(tp.id) === String(currentTopic.id) ? { ...tp, status: 'DONE' } : tp
          );
          setTopics(fullyUpdatedList);
          onTopicsLoaded?.(fullyUpdatedList);

          const fullyUpdatedTree = buildTopicTree(fullyUpdatedList);
          const nextCh = fullyUpdatedTree.find((ch) => String(ch.id) !== String(currentTopic.id) && ch.status !== 'DONE') || null;
          if (nextCh) {
            const nextSub = nextCh.subtopics?.find((s) => s.status !== 'DONE') || nextCh.subtopics?.[0] || null;
            onSelectTopic?.(nextCh.id, nextSub?.id || null);
            onCompleteAction?.({ type: 'subtopic', item: targetSub, nextItem: nextCh });
          } else {
            onSelectTopic?.(null, null);
            onCompleteAction?.({ type: 'subtopic', item: targetSub, nextItem: null });
          }
        }
      } else {
        // Flat chapter without subtopics
        await syllabusApi.updateTopicStatus(currentTopic.id, 'DONE');
        const updatedList = topics.map((tp) =>
          String(tp.id) === String(currentTopic.id) ? { ...tp, status: 'DONE' } : tp
        );
        setTopics(updatedList);
        onTopicsLoaded?.(updatedList);
        const updatedTree = buildTopicTree(updatedList);
        const nextTopic = updatedTree.find((tp) => String(tp.id) !== String(currentTopic.id) && tp.status !== 'DONE') || null;
        if (nextTopic) {
          const nextSub = nextTopic.subtopics?.find((s) => s.status !== 'DONE') || nextTopic.subtopics?.[0] || null;
          onSelectTopic?.(nextTopic.id, nextSub?.id || null);
          onSelectTask?.(null);
        } else {
          onSelectTopic?.(null, null);
        }
        onCompleteAction?.({ type: 'topic', item: currentTopic, nextItem: nextTopic });
      }
    } catch {
      // ignore
    } finally {
      setCompletingAction(false);
    }
  }

  return (
    <div className="relative z-40" ref={containerRef}>
      <div className="left-widget-card glass-card rounded-3xl p-5 relative shadow-xl border border-border/70 hover:border-border transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="rounded bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-primary uppercase">
            {t.targetSubject}
          </span>
          <button
            type="button"
            data-testid="switch-focus-target-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{t.switchTarget}</span>
            <span>{isOpen ? '▲' : '▼'}</span>
          </button>
        </div>

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
          className="space-y-1.5 min-w-0 cursor-pointer group"
          title={t.switchTarget}
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-surface border border-border text-[11px] font-mono font-bold text-primary shrink-0 group-hover:border-primary/50 transition-colors">
              {courseInfo ? courseInfo.code : 'LUMA'}
            </span>
            <h3 className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors">
              {courseInfo ? courseInfo.name : t.noCourse}
            </h3>
          </div>

          {/* Single Focus Target: EITHER a Task OR a Chapter (Mutually Exclusive) */}
          {targetType === 'task' && currentTask ? (
            <div className="pt-1 flex items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs shrink-0">⏳</span>
                <span className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                  {currentTask.title}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${currentUrgency?.badgeClass || 'border-border text-muted'}`}
              >
                {currentDaysLeftLabel}
              </span>
            </div>
          ) : targetType === 'topic' && currentTopic ? (
            <p className="text-xs font-medium text-muted truncate group-hover:text-text transition-colors">
              {currentTopic.title}
            </p>
          ) : (
            <p className="text-xs text-muted truncate group-hover:text-text transition-colors">
              {t.noTopic}
            </p>
          )}
        </div>

        {/* Proactive Action & Status Strip */}
        {targetType === 'task' && currentTask && currentTask.status !== 'DONE' ? (
          <div className="pt-2.5 mt-2 border-t border-border/60 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-mono font-bold text-muted truncate">
                {currentTask.status === 'DOING' ? t.statusDoing : t.statusTodo}
              </span>
            </div>
            <button
              type="button"
              disabled={completingAction}
              data-testid="mark-task-done-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCompleteTask(currentTask);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-black font-extrabold text-[11px] hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              title={t.markTaskDone}
            >
              <span>✓</span>
              <span>{completingAction ? '...' : t.markDoneBtn}</span>
            </button>
          </div>
        ) : targetType === 'topic' && currentTopic && !isCurrentTopicDone ? (
          <div className="pt-2.5 mt-2 border-t border-border/60 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-[11px] font-mono font-bold text-muted truncate">
                {(currentSubTopic || currentTopic).status === 'DOING' ? t.statusDoing : t.statusTodo}
              </span>
            </div>
            <button
              type="button"
              disabled={completingAction}
              data-testid="mark-topic-done-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCompleteTopic();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary text-black font-extrabold text-[11px] hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              title={currentSubTopic ? `${t.markDoneBtn}: ${currentSubTopic.title}` : t.markTopicDone}
            >
              <span>✓</span>
              <span>{completingAction ? '...' : t.markDoneBtn}</span>
            </button>
          </div>
        ) : (
          <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-emerald-400 font-mono font-bold">
            <span>🎉 {t.allCompleted}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">DONE</span>
          </div>
        )}
      </div>

      {/* Popover Dropdown positioned outside the card so it is never clipped */}
      {isOpen && (
        <div
          data-testid="focus-subject-popover"
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-surface/95 dark:bg-[#141d06]/95 backdrop-blur-md p-4 shadow-2xl z-50 animate-in fade-in duration-150 space-y-4 max-h-96 overflow-y-auto"
        >
          {/* 1. Enrolled Courses */}
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              {t.coursesHeader}
            </p>
            <div className="space-y-1">
              {courses.map((course) => {
                const info = formatCourseInfo(course);
                const isSelected = String(course.id) === String(activeCourseId);
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      onSelectCourse?.(course.id);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                        : 'hover:bg-surface-2 text-text'
                    }`}
                  >
                    <span className="truncate">{info.code} — {info.name}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Upcoming Deadlines & Tasks for this course */}
          {tasks.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  {t.deadlinesHeader}
                </p>
                <span className="text-[10px] font-mono text-muted">
                  {tasks.filter((tk) => tk.status !== 'DONE').length} {t.pendingLabel}
                </span>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isSelected = targetType === 'task' && String(task.id) === String(currentTask?.id);
                  const urg = getUrgencyConfig(task.urgencyBadge, task.status, lang);
                  const label = formatDaysLeftLabel(task.daysLeft, task.urgencyBadge, task.status, lang);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        onSelectTask?.(task.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left rounded-xl px-3 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer gap-2 ${
                        isSelected
                          ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                          : 'hover:bg-surface-2 text-text'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${urg.dotClass}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${urg.badgeClass}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Curriculum Chapters (Chapters only) */}
          {chapterTree.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                {t.topicsHeader}
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {chapterTree.map((ch) => {
                  const isChapterSelected = targetType === 'topic' && String(ch.id) === String(currentTopic?.id);
                  const subCount = ch.subtopics?.length || 0;
                  const doneSubCount = ch.subtopics?.filter((s) => s.status === 'DONE').length || 0;
                  const isAllDone = subCount > 0 ? doneSubCount === subCount : ch.status === 'DONE';
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        const firstIncompleteSub = ch.subtopics?.find((s) => s.status !== 'DONE') || ch.subtopics?.[0] || null;
                        onSelectTopic?.(ch.id, firstIncompleteSub?.id || null);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left rounded-xl px-3 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer font-semibold ${
                        isChapterSelected
                          ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                          : 'hover:bg-surface-2 text-text'
                      }`}
                    >
                      <span className="truncate">{ch.title}</span>
                      {isAllDone ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                          {t.doneChip}
                        </span>
                      ) : subCount > 0 ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted shrink-0">
                          {doneSubCount}/{subCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

