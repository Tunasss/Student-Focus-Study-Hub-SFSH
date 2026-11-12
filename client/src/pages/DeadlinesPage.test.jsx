import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/languageContext';
import { scheduleApi, syllabusApi, tasksApi } from '../lib/api';
import { DeadlinesPage } from './DeadlinesPage';

vi.mock('../lib/api', () => ({
  scheduleApi: {
    getCourses: vi.fn(),
  },
  syllabusApi: {
    getCourseTopics: vi.fn(),
  },
  tasksApi: {
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const mockCourses = [
  { id: 1, code: 'MSIS207.R11', name: 'Web Application Development' },
  { id: 2, code: 'CS202.R11', name: 'Algorithms' },
];

const mockTasks = [
  {
    id: 10,
    title: 'Lab 2 · Express Routing',
    dueAt: '2026-11-10T10:00:00.000Z',
    status: 'OVERDUE',
    daysLeft: -2,
    urgencyBadge: 'OVERDUE',
    courseId: 1,
    topicId: null,
    course: mockCourses[0],
    topic: null,
  },
  {
    id: 11,
    title: 'Quiz 3 · Dynamic Programming',
    dueAt: '2026-11-14T10:00:00.000Z',
    status: 'TODO',
    daysLeft: 2,
    urgencyBadge: 'URGENT',
    courseId: 2,
    topicId: null,
    course: mockCourses[1],
    topic: null,
  },
  {
    id: 12,
    title: 'Setup Vite Workspace',
    dueAt: '2026-11-05T10:00:00.000Z',
    status: 'DONE',
    daysLeft: -7,
    urgencyBadge: null,
    courseId: 1,
    topicId: null,
    course: mockCourses[0],
    topic: null,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <DeadlinesPage />
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('DeadlinesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    scheduleApi.getCourses.mockResolvedValue({ courses: mockCourses });
    syllabusApi.getCourseTopics.mockResolvedValue([]);
    tasksApi.listTasks.mockResolvedValue(mockTasks);
  });

  test('renders summary radar cards and tasks list, and filters by urgency card', async () => {
    renderPage();

    expect(await screen.findByText('Lab 2 · Express Routing')).toBeInTheDocument();
    expect(screen.getByText('Quiz 3 · Dynamic Programming')).toBeInTheDocument();
    expect(screen.getByText('Setup Vite Workspace')).toBeInTheDocument();

    // Click Urgent radar card -> only URGENT task remains visible
    fireEvent.click(screen.getByTestId('radar-card-URGENT'));
    expect(screen.getByText('Quiz 3 · Dynamic Programming')).toBeInTheDocument();
    expect(screen.queryByText('Lab 2 · Express Routing')).not.toBeInTheDocument();
    expect(screen.queryByText('Setup Vite Workspace')).not.toBeInTheDocument();

    // Click Urgent radar card again to clear urgency filter
    fireEvent.click(screen.getByTestId('radar-card-URGENT'));
    expect(screen.getByText('Lab 2 · Express Routing')).toBeInTheDocument();
  });

  test('optimistically toggles status and rolls back on API failure', async () => {
    tasksApi.updateTask.mockRejectedValueOnce(new Error('Network down'));
    renderPage();

    const card = await screen.findByTestId('task-card-11');
    const doneRadio = within(card).getByRole('radio', { name: 'Completed' });
    fireEvent.click(doneRadio);

    // Rolled back after rejection + toast displayed
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
    expect(within(screen.getByTestId('task-card-11')).getByRole('radio', { name: 'To Do' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  test('creates a new task via TaskFormModal', async () => {
    const newTask = {
      id: 99,
      title: 'Final Report',
      dueAt: '2026-11-25T12:00:00.000Z',
      status: 'TODO',
      daysLeft: 13,
      urgencyBadge: 'LATER',
      courseId: 1,
      topicId: null,
      course: mockCourses[0],
      topic: null,
    };
    tasksApi.createTask.mockResolvedValueOnce(newTask);

    renderPage();
    await screen.findByText('Lab 2 · Express Routing');

    fireEvent.click(screen.getByRole('button', { name: '+ New Task' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/Task \/ Assignment Title/i), {
      target: { value: 'Final Report' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Deadline' }));

    expect(await screen.findByText('Final Report')).toBeInTheDocument();
    expect(tasksApi.createTask).toHaveBeenCalledTimes(1);
  });

  test('deletes a task after confirmation dialog', async () => {
    tasksApi.deleteTask.mockResolvedValueOnce({ id: 10 });
    renderPage();

    const card = await screen.findByTestId('task-card-10');
    fireEvent.click(within(card).getByRole('button', { name: 'Delete task' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete Task' }));

    await waitFor(() => {
      expect(tasksApi.deleteTask).toHaveBeenCalledWith(10);
    });
    expect(screen.queryByText('Lab 2 · Express Routing')).not.toBeInTheDocument();
  });
});

