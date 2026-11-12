import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/languageContext';
import { scheduleApi, syllabusApi } from '../../lib/api';
import { deduplicateSyllabusCourses, formatCourseInfo } from '../../utils/courseFormat';

export function FocusSubjectPicker({
  activeCourseId,
  activeTopicId,
  onSelectCourse,
  onSelectTopic,
}) {
  const { lang } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const t = {
    en: {
      targetSubject: 'FOCUS OBJECTIVE',
      switchTarget: 'Change Target',
      noCourse: 'General Study Session',
      noTopic: 'Whole Course Review',
      selectSubjectTitle: 'Select Focus Subject & Chapter',
      coursesHeader: 'Enrolled Courses',
      topicsHeader: 'Curriculum Chapters',
      noTopicsAvailable: 'No chapters added yet for this course.',
      doneChip: 'DONE',
    },
    vi: {
      targetSubject: 'MỤC TIÊU HỌC TẬP',
      switchTarget: 'Đổi môn học',
      noCourse: 'Phiên tự học chung',
      noTopic: 'Ôn tập toàn bộ môn học',
      selectSubjectTitle: 'Chọn Môn học & Chương mục',
      coursesHeader: 'Môn học trong thời khóa biểu',
      topicsHeader: 'Chương mục giáo trình',
      noTopicsAvailable: 'Chưa có chương nào trong môn học này.',
      doneChip: 'HOÀN THÀNH',
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
          if (list.length > 0 && !activeTopicId) {
            onSelectTopic?.(list[0].id);
          }
        }
      } catch {
        if (!cancelled) setTopics([]);
      }
    }
    loadTopics();
    return () => {
      cancelled = true;
    };
  }, [activeCourseId, activeTopicId, onSelectTopic]);

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

  const currentCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const currentTopics = activeCourseId ? topics : [];
  const currentTopic = currentTopics.find((tp) => tp.id === activeTopicId) || currentTopics[0];
  const courseInfo = currentCourse ? formatCourseInfo(currentCourse) : null;

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
          className="space-y-1 min-w-0 cursor-pointer group"
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
          <p className="text-xs text-muted truncate mt-1 group-hover:text-text transition-colors">
            {currentTopic ? currentTopic.title : t.noTopic}
          </p>
        </div>
      </div>

      {/* Popover Dropdown positioned outside the card so it is never clipped */}
      {isOpen && (
        <div
          data-testid="focus-subject-popover"
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-surface/95 dark:bg-[#141d06]/95 backdrop-blur-md p-4 shadow-2xl z-50 animate-in fade-in duration-150 space-y-4 max-h-80 overflow-y-auto"
        >
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              {t.coursesHeader}
            </p>
            <div className="space-y-1">
              {courses.map((course) => {
                const info = formatCourseInfo(course);
                const isSelected = course.id === activeCourseId;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      onSelectCourse?.(course.id);
                      onSelectTopic?.(null);
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

          {currentTopics.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                {t.topicsHeader}
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {currentTopics.map((tp) => {
                  const isSelected = tp.id === activeTopicId;
                  const isChild = tp.parentId != null;
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => {
                        onSelectTopic?.(tp.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left rounded-xl px-3 py-1.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isChild ? 'pl-6 text-[11px]' : 'font-semibold'
                      } ${
                        isSelected
                          ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                          : 'hover:bg-surface-2 text-text'
                      }`}
                    >
                      <span className="truncate">{isChild ? `↳ ${tp.title}` : tp.title}</span>
                      {tp.status === 'DONE' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                          {t.doneChip}
                        </span>
                      )}
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

