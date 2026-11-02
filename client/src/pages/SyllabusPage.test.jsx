import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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
    scheduleApi.getCourses.mockResolvedValue({ courses: mockCourses });
    syllabusApi.getCourseTopics.mockResolvedValue(mockTopicsCourse1);
    syllabusApi.updateTopicStatus.mockResolvedValue({ id: 103, status: 'DONE' });
  });

  test('renders course tabs, mastery card, and topic cards for selected course', async () => {
    render(
      <LanguageProvider>
        <SyllabusPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Intro to Computer Science' })).toBeInTheDocument();
      expect(screen.getByText('Algorithm Analysis')).toBeInTheDocument();
      expect(screen.getByText('Binary Search Trees')).toBeInTheDocument();
      expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    });

    // 1 done out of 3 = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  test('optimistically updates topic status and recalculates mastery percentage on chip click', async () => {
    render(
      <LanguageProvider>
        <SyllabusPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    });

    // Find the radios for Dynamic Programming
    const radios = screen.getAllByRole('radio', { name: /Completed|Hoàn thành/i });
    // Dynamic programming is 3rd topic
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
      <LanguageProvider>
        <SyllabusPage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    });

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
});
