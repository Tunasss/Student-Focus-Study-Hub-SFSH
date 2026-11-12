import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '../i18n/languageContext';
import { recommendationApi } from '../lib/api';
import { POMODORO_STORAGE_KEY } from '../utils/pomodoro';
import { RecommendationBanner } from './RecommendationBanner';

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    recommendationApi: {
      getNextAction: vi.fn(),
    },
  };
});

const mockTaskRecommendation = {
  kind: 'TASK',
  task: {
    id: 5,
    courseId: 10,
    topicId: 103,
    title: 'CS101 Lab 3: Functions exercises',
    dueAt: '2026-11-13T10:00:00.000Z',
    status: 'DOING',
    daysLeft: 1,
    urgencyBadge: 'URGENT',
  },
  topic: {
    id: 103,
    title: 'Chapter 3: Functions',
    status: 'DOING',
  },
  topicAutoLinked: false,
  course: {
    id: 10,
    code: 'CS101',
    name: 'Introduction to Computer Science',
  },
  score: 11.667,
  scoreBreakdown: {
    baseUrgencyScore: 6.667,
    topicDoingBonus: 5,
    overdueBonus: 0,
  },
  nextClass: null,
  openTaskCount: 3,
  reason: 'Top of 3 open task(s): due in 1 day(s) (+6.667), on "Chapter 3: Functions", in progress (+5) = 11.667.',
};

const mockTopicRecommendation = {
  kind: 'TOPIC',
  task: null,
  topic: {
    id: 201,
    title: 'Chapter 2: Integration by Parts',
    status: 'DOING',
  },
  topicAutoLinked: false,
  course: {
    id: 20,
    code: 'MATH201',
    name: 'Calculus II',
  },
  score: null,
  scoreBreakdown: null,
  nextClass: {
    start: '2026-11-14 07:30',
    location: 'Room E32',
  },
  openTaskCount: 0,
  reason: 'No open task. "Chapter 2: Integration by Parts" is the topic in progress of Calculus II.',
};

const mockEmptyRecommendation = {
  kind: 'EMPTY',
  task: null,
  topic: null,
  topicAutoLinked: false,
  course: null,
  score: null,
  scoreBreakdown: null,
  nextClass: null,
  openTaskCount: 0,
  reason: 'Nothing to do yet: add a course, import your timetable or save syllabus topics, then add tasks.',
};

function renderBanner() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<RecommendationBanner />} />
          <Route path="/focus" element={<div data-testid="focus-route-destination">Focus Room</div>} />
          <Route path="/syllabus" element={<div data-testid="syllabus-route-destination">Syllabus</div>} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('RecommendationBanner (WBS 3.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders TASK recommendation with scoreBreakdown and toggles detailed formula panel', async () => {
    recommendationApi.getNextAction.mockResolvedValueOnce(mockTaskRecommendation);

    renderBanner();

    expect(await screen.findByTestId('recommendation-title')).toHaveTextContent(
      'CS101 Lab 3: Functions exercises'
    );
    expect(screen.getByTestId('recommendation-topic-title')).toHaveTextContent('Chapter 3: Functions');
    expect(screen.getByTestId('recommendation-score-value')).toHaveTextContent('11.667');
    expect(screen.getByTestId('recommendation-score-pills')).toHaveTextContent('+6.667');
    expect(screen.getByTestId('recommendation-score-pills')).toHaveTextContent('+5');

    // Expand score breakdown drawer
    fireEvent.click(screen.getByTestId('toggle-score-breakdown-btn'));
    expect(screen.getByTestId('recommendation-breakdown-panel')).toHaveTextContent(
      'Top of 3 open task(s): due in 1 day(s) (+6.667)'
    );
  });

  test('persists recommended courseId and topicId into Pomodoro session and navigates to /focus', async () => {
    recommendationApi.getNextAction.mockResolvedValueOnce(mockTaskRecommendation);

    renderBanner();
    await screen.findByTestId('recommendation-title');

    fireEvent.click(screen.getByTestId('recommendation-start-focus-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('focus-route-destination')).toBeInTheDocument();
    });

    const saved = JSON.parse(localStorage.getItem(POMODORO_STORAGE_KEY));
    expect(saved.activeCourseId).toBe(10);
    expect(saved.activeTopicId).toBe(103);
    expect(localStorage.getItem('sfsh_active_course_id')).toBe('10');
  });

  test('renders TOPIC fallback recommendation when no open tasks exist', async () => {
    recommendationApi.getNextAction.mockResolvedValueOnce(mockTopicRecommendation);

    renderBanner();

    expect(await screen.findByTestId('recommendation-title')).toHaveTextContent(
      'Chapter 2: Integration by Parts'
    );
    expect(screen.getByText(/Room E32/)).toBeInTheDocument();
  });

  test('renders EMPTY state when user has no tasks or topics', async () => {
    recommendationApi.getNextAction.mockResolvedValueOnce(mockEmptyRecommendation);

    renderBanner();

    expect(await screen.findByText('Ready to Rank Your Study Plan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Import Timetable/i })).toBeInTheDocument();
  });
});

