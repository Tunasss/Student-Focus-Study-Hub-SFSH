import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/languageContext';
import { searchApi } from '../lib/api';
import { GlobalSearch } from './GlobalSearch';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/api', () => ({
  searchApi: {
    suggest: vi.fn(),
  },
}));

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('queries searchApi.suggest on typing and navigates on click', async () => {
    searchApi.suggest.mockResolvedValueOnce([
      {
        type: 'TASK',
        id: 12,
        label: 'Lab 4 · REST API',
        courseId: 5,
        courseCode: 'MSIS207',
        courseName: 'Web App Dev',
        status: 'TODO',
      },
      {
        type: 'TOPIC',
        id: 8,
        label: 'Chapter 3: SQL Joins',
        courseId: 6,
        courseCode: 'CS5433',
        courseName: 'Distributed DB',
        status: 'DOING',
      },
    ]);

    render(
      <MemoryRouter>
        <LanguageProvider>
          <GlobalSearch />
        </LanguageProvider>
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox', { name: 'Quick search' });
    fireEvent.change(input, { target: { value: 'Lab' } });

    await waitFor(() => {
      expect(searchApi.suggest).toHaveBeenCalledWith({ q: 'Lab', limit: 8 });
    });

    const itemBtn = await screen.findByText('Lab 4 · REST API');
    await act(async () => {
      fireEvent.click(itemBtn);
    });

    expect(localStorage.getItem('sfsh_active_course_id')).toBe('5');
    expect(mockNavigate).toHaveBeenCalledWith('/deadlines');
  });
});

