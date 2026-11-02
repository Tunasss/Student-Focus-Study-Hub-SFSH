import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { MasteryHeaderCard } from './MasteryHeaderCard';
import { LanguageProvider } from '../../i18n/languageContext';

describe('MasteryHeaderCard', () => {
  const mockCourse = {
    id: 1,
    code: 'CS101',
    name: 'Introduction to Computer Science',
  };

  const mockTopics = [
    { id: 1, title: 'Chapter 1', status: 'DONE' },
    { id: 2, title: 'Chapter 2', status: 'DONE' },
    { id: 3, title: 'Chapter 3', status: 'DOING' },
    { id: 4, title: 'Chapter 4', status: 'TODO' },
    { id: 5, title: 'Chapter 5', status: 'TODO' },
  ];

  test('renders course code, course name, and 40% mastery for 2/5 done', () => {
    render(
      <LanguageProvider>
        <MasteryHeaderCard course={mockCourse} topics={mockTopics} />
      </LanguageProvider>
    );

    expect(screen.getByText('CS101')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText(/2 Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/1 In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Remaining/i)).toBeInTheDocument();
  });

  test('handles 0 topics without dividing by zero', () => {
    render(
      <LanguageProvider>
        <MasteryHeaderCard course={mockCourse} topics={[]} />
      </LanguageProvider>
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

