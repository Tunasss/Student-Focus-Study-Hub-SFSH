import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SyllabusPage } from './SyllabusPage';
import { LanguageProvider } from '../i18n/languageContext';
import { scheduleApi, syllabusApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  scheduleApi: {
    getCourses: vi.fn(),
  },
  syllabusApi: {
    getCourseTopics: vi.fn(),
    updateTopicStatus: vi.fn(),
    createTopic: vi.fn(),
    extractSyllabus: vi.fn(),
    bulkSaveTopics: vi.fn(),
  },
}));

describe('SyllabusPage Integration', () => {
  const mockCourses = [
    { id: 1, code: 'CS101', name: 'Intro to Computer Science' },
    { id: 2, code: 'MATH201', name: 'Calculus II' },
  ];

  const mockTopicsCourse1 = [
    { id: 101, courseId: 1, sortOrder: 1, title: 'Algorithm Analysis', description: 'Big-O notation', status: 'DONE' },
    { id: 102, courseId: 1, sortOrder: 2, title: 'Binary Search Trees', description: 'Self-balancing trees', status: 'DOING' },
    { id: 103, courseId: 1, sortOrder: 3, title: 'Dynamic Programming', description: 'Memoization and tabulation', status: 'TODO' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    scheduleApi.getCourses.mockResolvedValue({ courses: mockCourses });
    syllabusApi.getCourseTopics.mockResolvedValue(mockTopicsCourse1);
    syllabusApi.updateTopicStatus.mockResolvedValue({ id: 103, status: 'DONE' });
  });

  test('renders course tabs, mastery card, and topic cards for selected course', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: 'Intro to Computer Science' }).length).toBeGreaterThan(0);
      expect(screen.getByText('Algorithm Analysis')).toBeInTheDocument();
      expect(screen.getByText('Binary Search Trees')).toBeInTheDocument();
      expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    }, { timeout: 4000 });

    // 1 done out of 3 = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  test('optimistically updates topic status and recalculates mastery percentage on chip click', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    }, { timeout: 4000 });

    const radios = screen.getAllByRole('radio', { name: /Completed|Hoàn thành/i });
    const dpDoneRadio = radios[2];

    fireEvent.click(dpDoneRadio);

    // 2 done out of 3 = 67%
    await waitFor(() => {
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    expect(syllabusApi.updateTopicStatus).toHaveBeenCalledWith(103, 'DONE');
  });

  test('rolls back topic status and displays error toast if API call fails', async () => {
    syllabusApi.updateTopicStatus.mockRejectedValueOnce(new Error('Network disconnected'));

    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    }, { timeout: 4000 });

    const radios = screen.getAllByRole('radio', { name: /Completed|Hoàn thành/i });
    const dpDoneRadio = radios[2];

    fireEvent.click(dpDoneRadio);

    // Expect error toast to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to update topic|Không thể cập nhật/i)).toBeInTheDocument();
    });

    // Expect mastery percentage to roll back to 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  test('enforces timetable requirement: shows empty constraint view with link to /timetable when no courses exist', async () => {
    scheduleApi.getCourses.mockResolvedValue({ courses: [] });

    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Enrolled Courses Found in Timetable|Chưa có môn học nào từ Thời khóa biểu/i)).toBeInTheDocument();
    });

    const timetableLink = screen.getByRole('link', { name: /Open Timetable|Mở Thời khóa biểu/i });
    expect(timetableLink).toBeInTheDocument();
    expect(timetableLink).toHaveAttribute('href', '/timetable');

    // Should NOT render any topics
    expect(screen.queryByText('Algorithm Analysis')).not.toBeInTheDocument();
  });

  test('opens AI Syllabus Extractor modal and imports topics into course syllabus', async () => {
    const mockExtracted = [
      { id: 'ext-1', title: 'Chapter 4: Advanced Graphs', description: 'Dijkstra and A*', sortOrder: 4, status: 'TODO' },
    ];
    syllabusApi.extractSyllabus.mockResolvedValue(mockExtracted);

    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Algorithm Analysis')).toBeInTheDocument();
    });

    const aiBtn = screen.getByRole('button', { name: /AI Extract Syllabus|Nạp đề cương bằng AI/i });
    fireEvent.click(aiBtn);

    // Modal should now be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Upload Course Syllabus Document|Tải lên đề cương môn học/i)).toBeInTheDocument();

    // Select file and click extract
    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['mock content'], 'syllabus_cs.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    const startExtractBtn = screen.getByRole('button', {
      name: /Extract Topics with Gemini AI|Phân tích chương mục bằng Gemini AI/i,
    });
    fireEvent.click(startExtractBtn);

    // Wait for preview step
    await waitFor(
      () => {
        expect(screen.getByDisplayValue('Chapter 4: Advanced Graphs')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Click confirm import
    const confirmBtn = screen.getByRole('button', {
      name: /Import 1 Topic to Syllabus|Thêm 1 chương vào Giáo trình/i,
    });
    fireEvent.click(confirmBtn);

    // Modal closes and new topic is visible in page list
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Chapter 4: Advanced Graphs')).toBeInTheDocument();
    });
  });

  test('filters out .1 lab duplicates and displays only the theory class in course selector', async () => {
    scheduleApi.getCourses.mockResolvedValue({
      courses: [
        { id: 10, code: 'MSIS4263.R11.CTTT', name: 'Các ứng dụng thông minh trong Kinh doanh' },
        { id: 11, code: 'MSIS4263.R11.CTTT.1', name: 'Các ứng dụng thông minh trong Kinh doanh (Thực hành)' },
      ],
    });
    syllabusApi.getCourseTopics.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('MSIS4263.R11.CTTT').length).toBeGreaterThan(0);
    });

    // The .1 practice code should NOT be in the document
    expect(screen.queryByText('MSIS4263.R11.CTTT.1')).not.toBeInTheDocument();

    // Enrolled count should show 1 course, not 2
    expect(screen.getByText(/1 Enrolled Course|1 Môn học/i)).toBeInTheDocument();
  });

  test('renders hierarchical knowledge tree with chapters, sourceFile badges, and subtopics', async () => {
    const mockHierarchicalTopics = [
      { id: 1, courseId: 1, parentId: null, sortOrder: 1, title: 'Chapter 1: Architecture', sourceFile: 'deck1.pdf', status: 'TODO' },
      { id: 2, courseId: 1, parentId: 1, sortOrder: 1, title: '1.1 Logic Gates', description: 'AND/OR gates', status: 'DONE' },
      { id: 3, courseId: 1, parentId: 1, sortOrder: 2, title: '1.2 ALU Design', description: 'Arithmetic unit', status: 'TODO' },
      { id: 4, courseId: 1, parentId: null, sortOrder: 2, title: 'Chapter 2: Memory Systems', sourceFile: 'deck2.pdf', status: 'TODO' },
      { id: 5, courseId: 1, parentId: 4, sortOrder: 1, title: '2.1 Cache Hierarchy', description: 'L1/L2 caches', status: 'TODO' },
    ];
    syllabusApi.getCourseTopics.mockResolvedValue(mockHierarchicalTopics);

    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chapter 1: Architecture')).toBeInTheDocument();
      expect(screen.getByText(/deck1\.pdf/)).toBeInTheDocument();
      expect(screen.getByText('1.1 Logic Gates')).toBeInTheDocument();
      expect(screen.getByText('1.2 ALU Design')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2: Memory Systems')).toBeInTheDocument();
      expect(screen.getByText(/deck2\.pdf/)).toBeInTheDocument();
      expect(screen.getByText('2.1 Cache Hierarchy')).toBeInTheDocument();
    }, { timeout: 4000 });

    // 1 subtopic done out of 3 total subtopics = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  test('optimistically updates subtopic status and recalculates chapter progress in knowledge tree', async () => {
    const mockHierarchicalTopics = [
      { id: 1, courseId: 1, parentId: null, sortOrder: 1, title: 'Chapter 1: Architecture', sourceFile: 'deck1.pdf', status: 'TODO' },
      { id: 2, courseId: 1, parentId: 1, sortOrder: 1, title: '1.1 Logic Gates', description: 'AND/OR gates', status: 'DONE' },
      { id: 3, courseId: 1, parentId: 1, sortOrder: 2, title: '1.2 ALU Design', description: 'Arithmetic unit', status: 'TODO' },
    ];
    syllabusApi.getCourseTopics.mockResolvedValue(mockHierarchicalTopics);
    syllabusApi.updateTopicStatus.mockResolvedValue({ id: 3, status: 'DONE' });

    render(
      <MemoryRouter>
        <LanguageProvider>
          <SyllabusPage />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1.2 ALU Design')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Subtopic 1.2 is currently TODO. Find its DONE radio
    const subtopicRadios = screen.getAllByRole('radio', { name: /Completed|Hoàn thành/i });
    // Subtopic 1.1 has done radio (index 0), subtopic 1.2 has done radio (index 1)
    const aluDoneRadio = subtopicRadios[1];
    fireEvent.click(aluDoneRadio);

    // Both subtopics are now done -> ChapterCard and MasteryHeaderCard both show 100%
    await waitFor(() => {
      expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(2);
    });

    expect(syllabusApi.updateTopicStatus).toHaveBeenCalledWith(3, 'DONE');
  });
});
