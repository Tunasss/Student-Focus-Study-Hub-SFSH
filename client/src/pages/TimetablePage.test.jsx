import { describe, expect, test } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { fail, mockFetch, ok } from '../test/utils';
import { setToken } from '../lib/tokenStorage';
import { TimetablePage } from './TimetablePage';
import { ThemeProvider } from '../theme/ThemeProvider';

function renderTimetable() {
  setToken('valid.jwt.token');
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <TimetablePage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const SAMPLE_EVENTS = [
  {
    scheduleId: 1,
    courseId: 10,
    courseCode: 'CS101',
    courseName: 'Cấu trúc dữ liệu',
    location: 'Phòng A204',
    dayOfWeek: 1, // Monday
    start: '2026-10-26T08:00',
    end: '2026-10-26T10:30',
  },
  {
    scheduleId: 2,
    courseId: 20,
    courseCode: 'MATH201',
    courseName: 'Toán rời rạc',
    location: 'Hội trường B',
    dayOfWeek: 3, // Wednesday
    start: '2026-10-28T13:00',
    end: '2026-10-28T15:30',
  },
];

describe('TimetablePage', () => {
  test('renders timetable header, week range and 7 day column headers', async () => {
    mockFetch(() => [200, ok({ events: [] })]);
    renderTimetable();

    expect(await screen.findByRole('heading', { name: /Lịch học & Giảng đường/i })).toBeInTheDocument();
    expect(screen.getByText(/THỜI KHÓA BIỂU TUẦN/i)).toBeInTheDocument();
    expect(screen.getByText(/Asia\/Ho_Chi_Minh/i)).toBeInTheDocument();

    for (let day = 1; day <= 7; day++) {
      expect(screen.getByTestId(`day-header-${day}`)).toBeInTheDocument();
      expect(screen.getByTestId(`day-column-${day}`)).toBeInTheDocument();
    }
  });

  test('fetches and renders classes with course code, name, and time range', async () => {
    mockFetch((url) => {
      if (url.includes('/api/schedule')) {
        return [200, ok({ events: SAMPLE_EVENTS })];
      }
      return [404, {}];
    });

    renderTimetable();

    expect(await screen.findByText('Cấu trúc dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Phòng A204')).toBeInTheDocument();

    expect(screen.getByText('Toán rời rạc')).toBeInTheDocument();
    expect(screen.getByText('Hội trường B')).toBeInTheDocument();

    const csBadges = screen.getAllByText('CS101');
    expect(csBadges.length).toBeGreaterThanOrEqual(1);

    const mathBadges = screen.getAllByText('MATH201');
    expect(mathBadges.length).toBeGreaterThanOrEqual(1);
  });

  test('navigates between weeks using previous, next and today buttons', async () => {
    mockFetch(() => [200, ok({ events: [] })]);
    renderTimetable();

    await screen.findByRole('heading', { name: /Lịch học & Giảng đường/i });
    const initialRange = screen.getByTestId('week-range-label').textContent;

    // Click next week
    await userEvent.click(screen.getByTestId('next-week-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('week-range-label').textContent).not.toBe(initialRange);
    });
    const nextWeekRange = screen.getByTestId('week-range-label').textContent;

    // Click previous week
    await userEvent.click(screen.getByTestId('prev-week-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('week-range-label').textContent).toBe(initialRange);
    });

    // Move next and click Today to return to today
    await userEvent.click(screen.getByTestId('next-week-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('week-range-label').textContent).toBe(nextWeekRange);
    });

    await userEvent.click(screen.getByTestId('today-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('week-range-label').textContent).toBe(initialRange);
    });
  });

  test('renders empty state when no classes are scheduled for the week', async () => {
    mockFetch(() => [200, ok({ events: [] })]);
    renderTimetable();

    expect(await screen.findByTestId('timetable-empty')).toBeInTheDocument();
    expect(screen.getByText(/Chưa có lịch học tuần này/i)).toBeInTheDocument();
  });

  test('renders error banner with retry option when API fails', async () => {
    mockFetch(() => [500, fail('INTERNAL_ERROR', 'Lỗi kết nối máy chủ')]);
    renderTimetable();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Lỗi kết nối máy chủ/i);
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  test('opens ICS upload modal, validates format and handles successful import', async () => {
    const fetchMock = mockFetch((url, init) => {
      if (url.includes('/api/schedule/import') && init.method === 'POST') {
        return [201, ok({ schedulesImported: 4, coursesCreated: 2, coursesUpdated: 0 })];
      }
      return [200, ok({ events: [] })];
    });

    renderTimetable();
    await screen.findByRole('heading', { name: /Lịch học & Giảng đường/i });

    // Open Modal
    await userEvent.click(screen.getByTestId('import-ics-button'));
    expect(screen.getByRole('dialog', { name: /Nhập thời khóa biểu/i })).toBeInTheDocument();

    // Select an invalid non-.ics file
    const fileInput = screen.getByTestId('ics-file-input');
    const invalidFile = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('định dạng .ics');

    // Select a valid .ics file
    const validFile = new File(['BEGIN:VCALENDAR...'], 'timetable.ics', { type: 'text/calendar' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    expect(screen.getByText('timetable.ics')).toBeInTheDocument();

    // Submit
    await userEvent.click(screen.getByRole('button', { name: 'Đồng bộ thời khóa biểu' }));

    // Verify modal closes and success toast appears
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Đã nhập thành công 4 lịch học');
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/api/schedule/import'))).toBe(true);
  });

  test('handles overlapping classes on the same day by placing them side by side', async () => {
    const overlappingEvents = [
      {
        scheduleId: 101,
        courseId: 1,
        courseCode: 'CS101',
        courseName: 'Lớp Sáng 1',
        dayOfWeek: 2, // Tuesday
        start: '2026-10-27T08:00',
        end: '2026-10-27T10:00',
      },
      {
        scheduleId: 102,
        courseId: 2,
        courseCode: 'MATH201',
        courseName: 'Lớp Sáng 2 (Trùng giờ)',
        dayOfWeek: 2, // Tuesday
        start: '2026-10-27T09:00',
        end: '2026-10-27T11:00',
      },
    ];

    mockFetch(() => [200, ok({ events: overlappingEvents })]);
    renderTimetable();

    expect(await screen.findByText('Lớp Sáng 1')).toBeInTheDocument();
    expect(screen.getByText('Lớp Sáng 2 (Trùng giờ)')).toBeInTheDocument();

    const cards = screen.getAllByTestId('class-card');
    expect(cards).toHaveLength(2);

    // Each card in an overlap of 2 takes width ~50%
    expect(cards[0].style.width).toContain('50%');
    expect(cards[1].style.width).toContain('50%');
  });
});
