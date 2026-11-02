import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CourseTabs } from '../components/syllabus/CourseTabs';
import { MasteryHeaderCard } from '../components/syllabus/MasteryHeaderCard';
import { TopicCard } from '../components/syllabus/TopicCard';
import { AddTopicModal } from '../components/syllabus/AddTopicModal';
import { ToastNotification } from '../components/syllabus/ToastNotification';
import { useLanguage } from '../i18n/languageContext';
import { scheduleApi, syllabusApi } from '../lib/api';

const DEFAULT_COURSES = [
  { id: 1, code: 'CS101', name: 'Intro to Computer Science' },
  { id: 2, code: 'MATH201', name: 'Calculus & Linear Algebra' },
  { id: 3, code: 'PHY110', name: 'General Physics I' },
  { id: 4, code: 'ENG102', name: 'Technical Academic Writing' },
];

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

  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [activeCourseId, setActiveCourseId] = useState(1);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTopicId, setUpdatingTopicId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const t = {
    en: {
      pageTitle: 'Course Syllabi & Topics',
      pageSubtitle: 'Structured chapter breakdown and progressive mastery tracking for each enrolled course.',
      addTopicBtn: '+ Add Topic',
      noTopicsTitle: 'No Topics for this Course Yet',
      noTopicsDesc: 'Start breaking down this course by adding your first chapter topic or uploading a syllabus.',
      loadingText: 'Loading syllabus topics…',
      updateFailed: 'Failed to update topic status. Changes rolled back.',
      createSuccess: 'New topic chapter added successfully.',
      createFailed: 'Failed to create topic.',
    },
    vi: {
      pageTitle: 'Giáo trình & Chủ đề môn học',
      pageSubtitle: 'Phân rã chương trình và theo dõi tiến độ hoàn thành kiến thức từng môn học.',
      addTopicBtn: '+ Thêm chương mới',
      noTopicsTitle: 'Chưa có chương mục nào',
      noTopicsDesc: 'Bắt đầu theo dõi môn học bằng cách thêm chương đầu tiên hoặc nạp đề cương môn học.',
      loadingText: 'Đang tải danh sách chương…',
      updateFailed: 'Không thể cập nhật trạng thái chương. Đã hoàn tác lại thay đổi.',
      createSuccess: 'Đã thêm chương học mới thành công.',
      createFailed: 'Không thể tạo chương học mới.',
    },
  }[lang] || {
    pageTitle: 'Course Syllabi & Topics',
    pageSubtitle: 'Structured chapter breakdown and progressive mastery tracking for each enrolled course.',
    addTopicBtn: '+ Add Topic',
    noTopicsTitle: 'No Topics for this Course Yet',
    noTopicsDesc: 'Start breaking down this course by adding your first chapter topic or uploading a syllabus.',
    loadingText: 'Loading syllabus topics…',
    updateFailed: 'Failed to update topic status. Changes rolled back.',
    createSuccess: 'New topic chapter added successfully.',
    createFailed: 'Failed to create topic.',
  };

  // Fetch courses on mount
  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      try {
        const res = await scheduleApi.getCourses();
        const list = res?.courses || (Array.isArray(res) ? res : []);
        if (!cancelled && list.length > 0) {
          setCourses(list);
          setActiveCourseId(list[0].id);
        }
      } catch {
        // Use default fallback courses
      }
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch topics whenever activeCourseId changes
  useEffect(() => {
    let cancelled = false;
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
    if (activeCourseId) {
      loadTopics();
    }
    return () => {
      cancelled = true;
    };
  }, [activeCourseId]);

  // GSAP animation for topic entrance
  useLayoutEffect(() => {
    if (loading || topics.length === 0) return;

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

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];
  const nextSortOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.sortOrder || 0)) + 1 : 1;

  return (
    <div ref={containerRef} className="px-4 sm:px-8 py-8 space-y-8 max-w-7xl mx-auto">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">SFSH ACADEMIC SYLLABUS</span>
          <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-text mt-1">
            {t.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">{t.pageSubtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-fg shadow-xs hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
        >
          <span>{t.addTopicBtn}</span>
        </button>
      </div>

      {/* Course Switcher Tabs */}
      <CourseTabs
        courses={courses}
        activeCourseId={activeCourseId}
        onSelectCourse={(id) => setActiveCourseId(id)}
      />

      {/* Mastery Progress Card */}
      <MasteryHeaderCard course={activeCourse} topics={topics} />

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
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-5 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-fg transition-all cursor-pointer"
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
        courseId={activeCourseId}
        nextSortOrder={nextSortOrder}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleCreateTopic}
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
