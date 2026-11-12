import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../i18n/languageContext';
import { TaskCard } from './TaskCard';

function renderCard(props) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <TaskCard {...props} />
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('TaskCard', () => {
  const baseTask = {
    id: 42,
    title: 'Lab 3 · Express Auth & JWT',
    dueAt: '2026-11-14T17:00:00.000Z',
    status: 'TODO',
    daysLeft: 2,
    urgencyBadge: 'URGENT',
    courseId: 10,
    topicId: 55,
    course: { id: 10, code: 'MSIS207.R11', name: 'Web Application Development' },
    topic: { id: 55, title: '4.1 Authentication & Sessions' },
  };

  test('renders title, urgency badge, days left, course tag, and linked topic', () => {
    renderCard({ task: baseTask });

    expect(screen.getByText('Lab 3 · Express Auth & JWT')).toBeInTheDocument();
    expect(screen.getByTestId('urgency-badge-42')).toHaveTextContent('Urgent');
    expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
    expect(screen.getByText(/MSIS207\.R11/)).toBeInTheDocument();
    expect(screen.getByText('4.1 Authentication & Sessions')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Focus/i })).toHaveAttribute('href', '/focus');
  });

  test('calls onStatusChange with selected status', () => {
    const onStatusChange = vi.fn();
    renderCard({ task: baseTask, onStatusChange });

    fireEvent.click(screen.getByRole('radio', { name: 'In Progress' }));
    expect(onStatusChange).toHaveBeenCalledWith(42, 'DOING');

    fireEvent.click(screen.getByRole('radio', { name: 'Completed' }));
    expect(onStatusChange).toHaveBeenCalledWith(42, 'DONE');
  });

  test('applies completed styling and hides Focus CTA when status is DONE', () => {
    const doneTask = { ...baseTask, status: 'DONE', urgencyBadge: null };
    renderCard({ task: doneTask });

    expect(screen.getByTestId('urgency-badge-42')).toHaveTextContent('Completed');
    expect(screen.getByText('Lab 3 · Express Auth & JWT')).toHaveClass('line-through');
    expect(screen.queryByRole('link', { name: /Focus/i })).not.toBeInTheDocument();
  });

  test('calls onEdit and onDelete callbacks', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderCard({ task: baseTask, onEdit, onDelete });

    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }));
    expect(onEdit).toHaveBeenCalledWith(baseTask);

    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(onDelete).toHaveBeenCalledWith(baseTask);
  });
});

