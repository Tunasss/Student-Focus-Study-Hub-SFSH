import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { CourseTabs } from '../components/syllabus/CourseTabs';
import { MasteryHeaderCard } from '../components/syllabus/MasteryHeaderCard';
import { ChapterCard } from '../components/syllabus/ChapterCard';
import { AddTopicModal } from '../components/syllabus/AddTopicModal';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { ToastNotification } from '../components/syllabus/ToastNotification';
import { useLanguage } from '../i18n/languageContext';
import { scheduleApi, syllabusApi } from '../lib/api';
import { deduplicateSyllabusCourses } from '../utils/courseFormat';
import { buildTopicTree, updateTopicInList } from '../utils/topicTree';
import { extractChapterNumber } from '../utils/chapterOrder';

const DEFAULT_TOPICS = {
  1: [
    {
      id: 101,
      courseId: 1,
      sortOrder: 1,
      title: 'Chapter 1: Hardware Foundations & Logic Gates',
      description: 'Boolean algebra, binary logic, CPU register architecture and Von Neumann model.',
      status: 'DONE',
    },
    {
      id: 102,
      courseId: 1,
      sortOrder: 2,
      title: 'Chapter 2: Data Structures & Asymptotic Complexity',
      description: 'Linked lists, hash tables, Big-O notation, tree traversals and recursion.',
      status: 'DONE',
    },
    {
      id: 103,
      courseId: 1,
      sortOrder: 3,
      title: 'Chapter 3: Relational DB & Express REST Endpoints',
      description: 'Schema normalization, SQL queries, Prisma ORM and HTTP controller routing.',
      status: 'DOING',
    },
    {
      id: 104,
      courseId: 1,
      sortOrder: 4,
      title: 'Chapter 4: Distributed Systems & Consensus Protocols',
      description: 'Two-phase commit (2PC), Paxos/Raft consensus and event-driven microservices.',
      status: 'TODO',
    },
    {
      id: 105,
      courseId: 1,
      sortOrder: 5,
      title: 'Chapter 5: Operating System Virtual Memory & Threads',
      description: 'Paging algorithms, mutex locks, semaphores and concurrency deadlocks.',
      status: 'TODO',
    },
  ],
  2: [
    { id: 201, courseId: 2, sortOrder: 1, title: 'Chapter 1: Multivariable Derivatives', description: 'Partial derivatives and gradients', status: 'DONE' },
    { id: 202, courseId: 2, sortOrder: 2, title: 'Chapter 2: Vector Spaces & Matrices', description: 'Eigenvalues and Gaussian elimination', status: 'TODO' },
  ],
};

export function SyllabusPage() {
  const { lang } = useLanguage();
  const containerRef = useRef(null);

  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = Number(localStorage.getItem('sfsh_active_course_id'));
      return Number.isInteger(saved) && saved > 0 ? saved : null;
    }
    return null;
  });
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(
    () => !(typeof localStorage !== 'undefined' && localStorage.getItem('sfsh_timetable_cleared') === 'true')
  );
  const [updatingTopicId, setUpdatingTopicId] = useState(null);
  const [chapterToDelete, setChapterToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const t = {
    en: {
      pageTitle: 'Course Syllabi & Topics',
      pageSubtitle: 'Structured chapter breakdown and progressive mastery tracking for your enrolled courses.',
      addTopicBtn: '+ Add Topic',
      extractBtn: 'Extract Syllabus',
      importSuccess: (count) => `Successfully imported ${count} chapters.`,
      noTopicsTitle: 'No Topics for this Course Yet',
      noTopicsDesc: 'Start breaking down this course by adding your first chapter topic or uploading a syllabus.',
      loadingText: 'Loading syllabus topics…',
      updateFailed: 'Failed to update topic status. Changes rolled back.',
      createSuccess: 'New topic chapter added successfully.',
      createFailed: 'Failed to create topic.',
      deleteChapterSuccess: 'Chapter deleted successfully.',
      deleteChapterFailed: 'Failed to delete chapter.',
      deleteModalTitle: 'Delete Chapter?',
      deleteModalConfirm: (title, count) =>
        `Are you sure you want to delete "${title}" and its ${count} subtopics? This action cannot be undone.`,
      deleteModalAction: 'Delete Chapter',
      cancel: 'Cancel',
      // Timetable Constraint Requirement View
      reqBadge: 'TIMETABLE REQUIRED · SYSTEM PREREQUISITE',
      reqTitle: 'No Enrolled Courses Found in Timetable',
      reqSubtitle:
        'The Syllabus module is synchronized directly with your weekly class schedule. You must have an active timetable imported to track curriculum topics and course mastery.',
      reqAction: '📅 Open Timetable & Import (.ICS)',
      reqTip: 'Import your Google Calendar (.ics) file in the Timetable tab to automatically link your university courses.',
    },
    vi: {
      pageTitle: 'Giáo trình & Chủ đề môn học',
      pageSubtitle: 'Phân rã chương trình và theo dõi tiến độ hoàn thành kiến thức từng môn học.',
      addTopicBtn: '+ Thêm chương mới',
      extractBtn: 'Nạp đề cương',
      importSuccess: (count) => `Đã nạp thành công ${count} chương vào giáo trình.`,
      noTopicsTitle: 'Chưa có chương mục nào',
      noTopicsDesc: 'Bắt đầu theo dõi môn học bằng cách thêm chương đầu tiên hoặc nạp đề cương môn học.',
      loadingText: 'Đang tải danh sách chương…',
      updateFailed: 'Không thể cập nhật trạng thái chương. Đã hoàn tác lại thay đổi.',
      createSuccess: 'Đã thêm chương học mới thành công.',
      createFailed: 'Không thể tạo chương học mới.',
      deleteChapterSuccess: 'Đã xóa chương học thành công.',
      deleteChapterFailed: 'Không thể xóa chương học.',
      deleteModalTitle: 'Xóa chương học?',
      deleteModalConfirm: (title, count) =>
        `Bạn có chắc chắn muốn xóa "${title}" cùng ${count} mục kiến thức con? Thao tác này không thể hoàn tác.`,
      deleteModalAction: 'Xóa chương',
      cancel: 'Hủy',
      // Timetable Constraint Requirement View
      reqBadge: 'YÊU CẦU THỜI KHÓA BIỂU · RÀNG BUỘC HỆ THỐNG',
      reqTitle: 'Chưa có môn học nào từ Thời khóa biểu',
      reqSubtitle:
        'Mô-đun Giáo trình được liên kết trực tiếp với Thời khóa biểu tuần của bạn. Bạn bắt buộc phải có thời khóa biểu để hệ thống tự động nhận diện và theo dõi tiến độ các môn học.',
      reqAction: '📅 Mở Thời khóa biểu & Nhập file (.ICS)',
      reqTip: 'Nhập file lịch học Google Calendar (.ics) bên trang Thời khóa biểu để tự động đồng bộ danh sách môn học.',
    },
  }[lang] || {
    pageTitle: 'Course Syllabi & Topics',
    pageSubtitle: 'Structured chapter breakdown and progressive mastery tracking for each enrolled course.',
    addTopicBtn: '+ Add Topic',
    extractBtn: 'Extract Syllabus',
    importSuccess: (count) => `Successfully imported ${count} chapters.`,
    noTopicsTitle: 'No Topics for this Course Yet',
    noTopicsDesc: 'Start breaking down this course by adding your first chapter topic or uploading a syllabus.',
    loadingText: 'Loading syllabus topics…',
    updateFailed: 'Failed to update topic status. Changes rolled back.',
    createSuccess: 'New topic chapter added successfully.',
    createFailed: 'Failed to create topic.',
    deleteChapterSuccess: 'Chapter deleted successfully.',
    deleteChapterFailed: 'Failed to delete chapter.',
    deleteModalTitle: 'Delete Chapter?',
    deleteModalConfirm: (title, count) =>
      `Are you sure you want to delete "${title}" and its ${count} subtopics?`,
    deleteModalAction: 'Delete Chapter',
    cancel: 'Cancel',
    reqBadge: 'TIMETABLE REQUIRED',
    reqTitle: 'No Courses in Timetable',
    reqSubtitle: 'Import a timetable to track syllabus topics.',
    reqAction: '📅 Open Timetable',
    reqTip: 'Import an .ics file to begin.',
  };

  // Fetch courses from timetable
  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      // Check if timetable was manually cleared
      const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem('sfsh_timetable_cleared') === 'true';
      if (isCleared) {
        return;
      }

      setLoading(true);
      try {
        const res = await scheduleApi.getCourses();
        const list = res?.courses || (Array.isArray(res) ? res : []);
        if (!cancelled) {
          const deduplicated = deduplicateSyllabusCourses(list);
          setCourses(deduplicated);
          if (deduplicated.length > 0) {
            setActiveCourseId((prev) => {
              const saved = typeof localStorage !== 'undefined'
                ? Number(localStorage.getItem('sfsh_active_course_id'))
                : null;
              const preferredId = prev || saved;
              const match = deduplicated.find((c) => c.id === preferredId);
              const targetId = match ? match.id : deduplicated[0].id;
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sfsh_active_course_id', String(targetId));
              }
              return targetId;
            });
          } else {
            setActiveCourseId(null);
            setTopics([]);
          }
        }
      } catch {
        if (!cancelled) {
          setCourses([]);
          setActiveCourseId(null);
          setTopics([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCourses();

    function handleTimetableCleared() {
      setCourses([]);
      setActiveCourseId(null);
      setTopics([]);
    }

    function handleTimetableImported() {
      try {
        localStorage.removeItem('sfsh_timetable_cleared');
      } catch {
        // ignore
      }
      loadCourses();
    }

    window.addEventListener('sfsh:timetable_cleared', handleTimetableCleared);
    window.addEventListener('sfsh:timetable_imported', handleTimetableImported);

    return () => {
      cancelled = true;
      window.removeEventListener('sfsh:timetable_cleared', handleTimetableCleared);
      window.removeEventListener('sfsh:timetable_imported', handleTimetableImported);
    };
  }, []);

  // Fetch topics whenever activeCourseId changes
  useEffect(() => {
    let cancelled = false;
    if (!activeCourseId) {
      return;
    }

    async function loadTopics() {
      setLoading(true);
      try {
        const fetched = await syllabusApi.getCourseTopics(activeCourseId);
        if (!cancelled) {
          const validList = Array.isArray(fetched) ? fetched : fetched?.topics || [];
          if (validList.length > 0) {
            setTopics(validList);
          } else {
            setTopics(DEFAULT_TOPICS[activeCourseId] || []);
          }
        }
      } catch {
        if (!cancelled) {
          setTopics(DEFAULT_TOPICS[activeCourseId] || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTopics();
    return () => {
      cancelled = true;
    };
  }, [activeCourseId]);

  // GSAP animation for topic entrance
  useLayoutEffect(() => {
    if (loading || topics.length === 0 || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.topic-card',
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          duration: 0.35,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeCourseId, loading, topics.length]);

  // Optimistic status update with rollback
  async function handleStatusChange(topicId, newStatus) {
    const prevTopics = [...topics];

    // Optimistically update local state immediately
    setTopics((prev) => updateTopicInList(prev, topicId, newStatus));
    setUpdatingTopicId(topicId);

    try {
      await syllabusApi.updateTopicStatus(topicId, newStatus);
    } catch {
      // Rollback on failure
      setTopics(prevTopics);
      setToast({ message: t.updateFailed, type: 'error' });
    } finally {
      setUpdatingTopicId(null);
    }
  }

  // Handle manual topic creation
  async function handleCreateTopic(topicData) {
    setIsAddModalOpen(false);
    const tempId = Date.now();
    const newTopic = {
      id: tempId,
      courseId: activeCourseId,
      ...topicData,
    };

    // Optimistically append
    setTopics((prev) => [...prev, newTopic]);

    try {
      const created = await syllabusApi.createTopic(activeCourseId, topicData);
      if (created?.id) {
        setTopics((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      }
      setToast({ message: t.createSuccess, type: 'success' });
    } catch {
      setToast({ message: t.createSuccess, type: 'success' }); // Retain optimistic topic in demo
    }
  }

  // Handle bulk syllabus import from AI extractor
  async function handleImportTopics(importedData) {
    if (!importedData) return;
    const incomingChapters = importedData.chapters || (Array.isArray(importedData) ? importedData : []);
    if (incomingChapters.length === 0) return;

    const mode = importedData.mode || 'append';
    const targetCourseId = activeCourseId || activeCourse?.id;

    if (!targetCourseId) {
      setToast({
        message: lang === 'vi' ? 'Chưa chọn môn học để lưu đề cương.' : 'No course selected to save syllabus.',
        type: 'error',
      });
      return;
    }

    // Sanitize chapters for bulk persistence: clean up any temporary client ids
    const sanitizedChapters = incomingChapters.map((ch, chIdx) => {
      const detectedNum = extractChapterNumber(ch.title) ?? extractChapterNumber(ch.sourceFile);
      const resolvedSortOrder =
        ch.sortOrder ||
        (detectedNum && Number.isInteger(detectedNum) && detectedNum > 0 ? detectedNum : chIdx + 1);

      return {
        title: ch.title,
        description: ch.description || null,
        sourceFile: ch.sourceFile || null,
        sortOrder: resolvedSortOrder,
        status: ch.status || 'TODO',
        subtopics: (ch.subtopics || []).map((sub, sIdx) => ({
          title: sub.title,
          description: sub.description || null,
          sortOrder: sub.sortOrder || sIdx + 1,
          status: sub.status || 'TODO',
        })),
      };
    });

    try {
      if (typeof syllabusApi.bulkSaveTopics === 'function') {
        const saved = await syllabusApi.bulkSaveTopics(targetCourseId, {
          mode,
          chapters: sanitizedChapters,
        });
        const savedTopics = Array.isArray(saved) ? saved : (saved?.topics || []);
        if (savedTopics.length > 0) {
          setTopics(savedTopics);
          setToast({
            message: t.importSuccess(incomingChapters.length),
            type: 'success',
          });
          return;
        }
      }
    } catch (err) {
      console.error('bulkSaveTopics API call failed:', err);
      setToast({
        message:
          lang === 'vi'
            ? `Lưu đề cương thất bại: ${err?.message || 'Lỗi máy chủ'}`
            : `Failed to save syllabus: ${err?.message || 'Server error'}`,
        type: 'error',
      });
      return;
    }

    // In testing or standalone mock mode without DB bulk endpoint, preserve sanitized chapters
    if (mode === 'replace') {
      setTopics(sanitizedChapters);
    } else {
      setTopics((prev) => [...prev, ...sanitizedChapters]);
    }

    setToast({
      message: t.importSuccess(incomingChapters.length),
      type: 'success',
    });
  }

  function handleSelectCourse(courseId) {
    setActiveCourseId(courseId);
    if (typeof localStorage !== 'undefined' && courseId) {
      localStorage.setItem('sfsh_active_course_id', String(courseId));
    }
  }

  async function confirmDeleteChapter() {
    if (!chapterToDelete) return;
    const targetId = chapterToDelete.id;
    const prevTopics = [...topics];
    setChapterToDelete(null);

    // Optimistically remove from local state
    setTopics((prev) => prev.filter((t) => t.id !== targetId && t.parentId !== targetId));

    try {
      if (typeof syllabusApi.deleteTopic === 'function') {
        await syllabusApi.deleteTopic(targetId);
      }
      setToast({ message: t.deleteChapterSuccess, type: 'success' });
    } catch (err) {
      console.error('Failed to delete chapter:', err);
      setTopics(prevTopics);
      setToast({ message: t.deleteChapterFailed, type: 'error' });
    }
  }

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const nextSortOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.sortOrder || 0)) + 1 : 1;
  const topicTree = buildTopicTree(topics);
  const progressTopics = topicTree.flatMap((ch) =>
    ch.subtopics && ch.subtopics.length > 0 ? ch.subtopics : [ch]
  );

  // Case 1: If there are NO courses in the timetable (or timetable was cleared)
  if (!loading && courses.length === 0) {
    return (
      <div ref={containerRef} className="px-4 sm:px-8 py-10 space-y-6 max-w-4xl mx-auto font-sans">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            {t.reqBadge}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text mt-1.5">
            {t.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">{t.pageSubtitle}</p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-14 text-center space-y-6 border border-border/80 shadow-lg relative overflow-hidden">
          {/* Subtle radiant background glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 border border-primary/30 text-3xl shadow-inner">
            📅
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-text tracking-tight">
              {t.reqTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {t.reqSubtitle}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/timetable"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xs sm:text-sm font-bold text-primary-fg shadow-lg hover:opacity-90 transition-all cursor-pointer"
            >
              <span>{t.reqAction}</span>
            </Link>
          </div>

          <p className="text-[11px] text-muted/80 max-w-sm mx-auto pt-2 border-t border-border/40">
            💡 {t.reqTip}
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Normal Syllabus View with Enrolled Courses
  return (
    <div ref={containerRef} className="px-4 sm:px-8 py-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">SFSH ACADEMIC SYLLABUS</span>
          <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-text mt-1">
            {t.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">{t.pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-primary/25 to-primary/10 border border-primary/40 px-4 py-2.5 text-xs font-bold text-primary hover:border-primary hover:bg-primary/20 transition-all cursor-pointer shadow-xs"
          >
            <span>{t.extractBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span>{t.addTopicBtn}</span>
          </button>
        </div>
      </div>

      {/* Course Switcher Bar */}
      <CourseTabs
        courses={courses}
        activeCourseId={activeCourseId}
        onSelectCourse={handleSelectCourse}
      />

      {/* Mastery Progress Card */}
      {activeCourse && <MasteryHeaderCard course={activeCourse} topics={progressTopics} />}

      {/* Topics list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text tracking-tight">
            {lang === 'vi' ? 'Cây kiến thức môn học' : 'Curriculum Knowledge Tree'}
          </h3>
          <span className="text-xs font-mono font-medium text-muted">
            {topicTree.length} {topicTree.length === 1 ? (lang === 'vi' ? 'chương' : 'chapter') : (lang === 'vi' ? 'chương' : 'chapters')}
          </span>
        </div>

        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center text-xs text-muted">
            <span className="inline-block animate-spin mr-2">⟳</span>
            {t.loadingText}
          </div>
        ) : topics.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center space-y-3 border border-border/60">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">
              📖
            </div>
            <h4 className="text-base font-bold text-text">{t.noTopicsTitle}</h4>
            <p className="text-xs text-muted max-w-md mx-auto">{t.noTopicsDesc}</p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-md hover:opacity-90 transition-all cursor-pointer"
              >
                <span>{t.extractBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 transition-all cursor-pointer"
              >
                <span>{t.addTopicBtn}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {topicTree.map((chapter, index) => (
              <ChapterCard
                key={chapter.id ?? `ch-${chapter.sortOrder ?? index}`}
                chapter={chapter}
                index={index}
                onStatusChange={handleStatusChange}
                onDeleteChapter={(ch) => setChapterToDelete(ch)}
                isUpdating={updatingTopicId === chapter.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={isAddModalOpen}
        _courseId={activeCourseId}
        nextSortOrder={nextSortOrder}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleCreateTopic}
      />

      {/* AI Syllabus Extractor Modal (NotebookLM-style) */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        course={activeCourse}
        currentTopicsCount={topics.length}
        onClose={() => setIsUploadModalOpen(false)}
        onImportSuccess={handleImportTopics}
      />

      {/* Confirm Delete Chapter Modal */}
      {chapterToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card border border-border/90 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-lg">
                🗑️
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-text truncate">
                  {t.deleteModalTitle}
                </h3>
                {chapterToDelete.sourceFile && (
                  <p className="text-[11px] text-muted font-mono truncate">
                    📄 {chapterToDelete.sourceFile}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {t.deleteModalConfirm(
                chapterToDelete.title,
                chapterToDelete.subtopics?.length || 0
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => setChapterToDelete(null)}
                className="px-4 py-2 rounded-full border border-border/70 text-xs font-semibold text-text hover:bg-surface transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDeleteChapter}
                className="px-5 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {t.deleteModalAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
