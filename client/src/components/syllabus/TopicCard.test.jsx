import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { TopicCard } from './TopicCard';
import { LanguageProvider } from '../../i18n/languageContext';

describe('TopicCard', () => {
  const mockTopic = {
    id: 10,
    courseId: 1,
    sortOrder: 1,
    title: 'Chapter 1: Relational Algebra & Calculus',
    description: 'Basic operators: selection, projection, joins, and division.',
    status: 'TODO',
  };

  test('renders topic chapter number, title, description, and status chips', () => {
    render(
      <LanguageProvider>
        <TopicCard topic={mockTopic} index={0} onStatusChange={vi.fn()} />
      </LanguageProvider>
    );

    expect(screen.getByText(/Chapter 01/i)).toBeInTheDocument();
    expect(screen.getByText('Chapter 1: Relational Algebra & Calculus')).toBeInTheDocument();
    expect(screen.getByText(/Basic operators/i)).toBeInTheDocument();
  });

  test('clicking DOING triggers onStatusChange with (10, "DOING")', () => {
    const handleStatusChange = vi.fn();
    render(
      <LanguageProvider>
        <TopicCard topic={mockTopic} index={0} onStatusChange={handleStatusChange} />
      </LanguageProvider>
    );

    const doingBtn = screen.getByRole('radio', { name: /In Progress|Đang học/i });
    fireEvent.click(doingBtn);

    expect(handleStatusChange).toHaveBeenCalledWith(10, 'DOING');
  });

  test('clicking DONE triggers onStatusChange with (10, "DONE")', () => {
    const handleStatusChange = vi.fn();
    render(
      <LanguageProvider>
        <TopicCard topic={mockTopic} index={0} onStatusChange={handleStatusChange} />
      </LanguageProvider>
    );

    const doneBtn = screen.getByRole('radio', { name: /Completed|Hoàn thành/i });
    fireEvent.click(doneBtn);

    expect(handleStatusChange).toHaveBeenCalledWith(10, 'DONE');
  });
});
