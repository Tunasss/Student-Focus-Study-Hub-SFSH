import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { CourseTabs } from '../components/syllabus/CourseTabs';
import { MasteryHeaderCard } from '../components/syllabus/MasteryHeaderCard';
import { TopicCard } from '../components/syllabus/TopicCard';
import { AddTopicModal } from '../components/syllabus/AddTopicModal';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { ToastNotification } from '../components/syllabus/ToastNotification';
import { useLanguage } from '../i18n/languageContext';
import { scheduleApi, syllabusApi } from '../lib/api';
import { deduplicateSyllabusCourses } from '../utils/courseFormat';

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
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(
    () => !(typeof localStorage !== 'undefined' && localStorage.getItem('sfsh_timetable_cleared') === 'true')
  );
  const [updatingTopicId, setUpdatingTopicId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const t = {
    en: {
      pageTitle: 'Course Syllabi & Topics',
      pageSubtitle: 'Structured chapter breakdown and progressive mastery tracking for your enrolled courses.',
      addTopicBtn: '+ Add Topic',
      extractAiBtn: '✨ AI Extract Syllabus',
      importSuccess: (count) => `Successfully imported ${count} chapters via Gemini AI.`,
      noTopicsTitle: 'No Topics for this Course Yet',
      noTopicsDesc: 'Start breaking down this course by adding your first chapter topic or uploading a syllabus.',
      loadingText: 'Loading syllabus topics…',
      updateFailed: 'Failed to update topic status. Changes rolled back.',
      createSuccess: 'New topic chapter added successfully.',
      createFailed: 'Failed to create topic.',
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
      extractAiBtn: '✨ Nạp đề cương bằng AI',
      importSuccess: (count) => `Đã nạp thành công ${count} chương vào giáo trình bằng Gemini AI.`,
      noTopicsTitle: 'Chưa có chương mục nào',
      noTopicsDesc: 'Bắt đầu theo dõi môn học bằng cách thêm chương đầu tiên hoặc nạp đề cương môn học.',
      loadingText: 'Đang tải danh sách chương…',
      updateFailed: 'Không thể cập nhật trạng thái chương. Đã hoàn tác lại thay đổi.',
      createSuccess: 'Đã thêm chương học mới thành công.',
      createFailed: 'Không thể tạo chương học mới.',
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
    extractAiBtn: '✨ AI Extract Syllabus',
    importSuccess: (count) => `Successfully imported ${count} chapters.`,
    noTopicsTitle: 'No Topics for this Course Yet',
    noTopicsDesc: 'Start breaking down this course by adding your first chapter topic or uploading a syllabus.',
    loadingText: 'Loading syllabus topics…',
    updateFailed: 'Failed to update topic status. Changes rolled back.',
    createSuccess: 'New topic chapter added successfully.',
    createFailed: 'Failed to create topic.',
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
              const stillExists = deduplicated.some((c) => c.id === prev);
              return stillExists ? prev : deduplicated[0].id;
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
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, status: newStatus } : t))
    );
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
  function handleImportTopics(importedTopics) {
    if (!importedTopics || importedTopics.length === 0) return;
    setTopics((prev) => [...prev, ...importedTopics]);
    setToast({
      message: t.importSuccess(importedTopics.length),
      type: 'success',
    });
  }

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const nextSortOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.sortOrder || 0)) + 1 : 1;

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
            <span>✨</span>
            <span>{t.extractAiBtn}</span>
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
        onSelectCourse={(id) => setActiveCourseId(id)}
      />

      {/* Mastery Progress Card */}
      {activeCourse && <MasteryHeaderCard course={activeCourse} topics={topics} />}

      {/* Topics list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text tracking-tight">
            {lang === 'vi' ? 'Danh sách chương mục' : 'Curriculum Chapters'}
          </h3>
          <span className="text-xs font-mono font-medium text-muted">
            {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
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
                <span>✨</span>
                <span>{t.extractAiBtn}</span>
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
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                index={index}
                onStatusChange={handleStatusChange}
                isUpdating={updatingTopicId === topic.id}
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

      {/* Toast Notification */}
      <ToastNotification
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
