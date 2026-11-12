import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LanguageProvider } from '../../i18n/languageContext';
import { syllabusApi } from '../../lib/api';
import { TaskFormModal } from './TaskFormModal';

vi.mock('../../lib/api', () => ({
  syllabusApi: {
    getCourseTopics: vi.fn(),
  },
}));

const sampleCourses = [
  { id: 1, code: 'CS101', name: 'Intro to CS' },
  { id: 2, code: 'SE202', name: 'Software Engineering' },
];

const sampleTopics = [
  { id: 11, sortOrder: 1, parentId: null, title: 'Chapter 1: Foundations', status: 'DONE' },
  { id: 12, sortOrder: 2, parentId: 11, title: '1.1 Asymptotic Notation', status: 'DOING' },
];

describe('TaskFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syllabusApi.getCourseTopics.mockResolvedValue(sampleTopics);
  });

  test('validates empty title before submitting', async () => {
    const onSubmit = vi.fn();
    render(
      <LanguageProvider>
        <TaskFormModal isOpen courses={sampleCourses} onClose={vi.fn()} onSubmit={onSubmit} />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create Deadline' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Task title is required.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('loads syllabus topics and submits ISO datetime with timezone offset', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const onClose = vi.fn();

    render(
      <LanguageProvider>
        <TaskFormModal
          isOpen
          courses={sampleCourses}
          presetCourseId={2}
          presetTopicId={12}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(syllabusApi.getCourseTopics).toHaveBeenCalledWith(2);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Syllabus Topic/i).value).toBe('12');
    });

    fireEvent.change(screen.getByLabelText(/Task \/ Assignment Title/i), {
      target: { value: 'Quiz 1 · Big-O' },
    });
    fireEvent.change(screen.getByLabelText(/Due Date & Time/i), {
      target: { value: '2026-11-20T23:59' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'In Progress' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Deadline' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Quiz 1 · Big-O');
    expect(payload.courseId).toBe(2);
    expect(payload.topicId).toBe(12);
    expect(payload.status).toBe('DOING');
    expect(payload.dueAt).toMatch(/^2026-11-20T23:59:00(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/);
    expect(onClose).toHaveBeenCalled();
  });

  test('prefills existing task fields in edit mode', async () => {
    const initialTask = {
      id: 99,
      title: 'Existing Assignment',
      courseId: 1,
      topicId: null,
      dueAt: '2026-11-25T10:30:00.000Z',
      status: 'OVERDUE',
    };

    render(
      <LanguageProvider>
        <TaskFormModal isOpen courses={sampleCourses} initialTask={initialTask} onClose={vi.fn()} onSubmit={vi.fn()} />
      </LanguageProvider>
    );

    expect(screen.getByRole('heading', { name: 'Edit Deadline' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Assignment')).toBeInTheDocument();
    await waitFor(() => {
      expect(syllabusApi.getCourseTopics).toHaveBeenCalledWith(1);
    });
  });
});

