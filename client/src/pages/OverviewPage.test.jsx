import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/languageContext';
import { analyticsApi, sessionsApi } from '../lib/api';
import { OverviewPage } from './OverviewPage';

vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    analyticsApi: {
      getOverview: vi.fn(),
      getDailyActivity: vi.fn(),
    },
    sessionsApi: {
      listSessions: vi.fn(),
    },
  };
});

const mockOverview = {
  range: '7d',
  tz: 'Asia/Ho_Chi_Minh',
  totalFocusMinutes: 145,
  completedTasksCount: 4,
  overdueTasksCount: 1,
  currentStreakDays: 3,
  courseBreakdown: [
    {
      courseId: 10,
      courseCode: 'MSIS207.R11.CTTT',
      courseName: 'Web Application Development',
      focusMinutes: 100,
      completedItems: 6,
      totalItems: 10,
      progressPct: 60,
    },
  ],
};

const mockDaily = {
  range: '7d',
  tz: 'Asia/Ho_Chi_Minh',
  days: [
    { date: '2026-11-10', focusMinutes: 25, tasksCompleted: 1 },
    { date: '2026-11-11', focusMinutes: 50, tasksCompleted: 2 },
    { date: '2026-11-12', focusMinutes: 70, tasksCompleted: 1 },
  ],
};

const mockSessions = [
  {
    id: 1,
    startedAt: '2026-11-12T07:30:00.000Z',
    minutes: 25,
    status: 'COMPLETED',
    courseId: 10,
    topicId: null,
    taskId: null,
  },
];

function renderOverview() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <OverviewPage />
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('OverviewPage (WBS 3.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    analyticsApi.getOverview.mockResolvedValue(mockOverview);
    analyticsApi.getDailyActivity.mockResolvedValue(mockDaily);
    sessionsApi.listSessions.mockResolvedValue(mockSessions);
  });

  test('renders live KPI metrics, daily activity chart, sessions log, and course breakdown', async () => {
    renderOverview();

    expect(await screen.findByTestId('kpi-focus-time')).toHaveTextContent('2h 25m');
    expect(screen.getByTestId('kpi-streak')).toHaveTextContent('3 days');
    expect(screen.getByTestId('kpi-completed-tasks')).toHaveTextContent('4');
    expect(screen.getByTestId('kpi-overdue-tasks')).toHaveTextContent('1');

    expect(screen.getByText('Web Application Development')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('6/10 items done')).toBeInTheDocument();
    expect(screen.getByText('25m')).toBeInTheDocument();
    expect(screen.getByTestId('daily-active-summary')).toHaveTextContent('70 focus min · 1 tasks done');
  });

  test('switches analytics range and refetches overview and daily activity', async () => {
    renderOverview();
    await screen.findByText('2h 25m');

    fireEvent.click(screen.getByRole('button', { name: '30 Days' }));

    await waitFor(() => {
      expect(analyticsApi.getOverview).toHaveBeenCalledWith(expect.objectContaining({ range: '30d' }));
      expect(analyticsApi.getDailyActivity).toHaveBeenCalledWith(expect.objectContaining({ range: '30d' }));
    });
  });

  test('renders zeroed empty states gracefully when user has no sessions or courses', async () => {
    analyticsApi.getOverview.mockResolvedValueOnce({
      totalFocusMinutes: 0,
      completedTasksCount: 0,
      overdueTasksCount: 0,
      currentStreakDays: 0,
      courseBreakdown: [],
    });
    analyticsApi.getDailyActivity.mockResolvedValueOnce({ days: [] });
    sessionsApi.listSessions.mockResolvedValueOnce([]);

    renderOverview();

    expect(await screen.findByTestId('kpi-focus-time')).toHaveTextContent('0m');
    expect(screen.getByText('No logged focus sessions yet.')).toBeInTheDocument();
    expect(screen.getByText('No Enrolled Courses Yet')).toBeInTheDocument();
  });
});

