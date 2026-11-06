import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChapterCard } from './ChapterCard';
import { LanguageProvider } from '../../i18n/languageContext';

const mockChapter = {
  id: 1,
  courseId: 1,
  sortOrder: 1,
  title: 'Chương 1: Tổng quan hệ thống phần cứng',
  description: 'Kiến trúc máy tính cơ bản',
  sourceFile: 'Chuong_1_Phan_cung.pdf',
  status: 'DOING',
  subtopics: [
    { id: 101, parentId: 1, sortOrder: 1, title: 'Mô hình Von Neumann', description: 'CPU, ALU, Memory', status: 'DONE' },
    { id: 102, parentId: 1, sortOrder: 2, title: 'Đại số Boolean', description: 'Cổng Logic', status: 'TODO' },
  ],
};

function renderCard(props = {}) {
  return render(
    <LanguageProvider>
      <ChapterCard chapter={mockChapter} index={0} onStatusChange={vi.fn()} {...props} />
    </LanguageProvider>
  );
}

describe('ChapterCard', () => {
  test('renders chapter header, sourceFile badge, and 50% subtopic progress', () => {
    renderCard();

    expect(screen.getByText('Chương 1: Tổng quan hệ thống phần cứng')).toBeInTheDocument();
    expect(screen.getByText(/Chuong_1_Phan_cung\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getAllByText(/1\/2/).length).toBeGreaterThanOrEqual(1);
  });

  test('renders subtopic items with status and descriptions', () => {
    renderCard();

    expect(screen.getByText('Mô hình Von Neumann')).toBeInTheDocument();
    expect(screen.getByText('Đại số Boolean')).toBeInTheDocument();
    expect(screen.getByText('CPU, ALU, Memory')).toBeInTheDocument();
  });

  test('clicking subtopic status chip invokes onStatusChange with subtopic id and status', () => {
    const onStatusChange = vi.fn();
    renderCard({ onStatusChange });

    // Click DONE for subtopic 102 (Đại số Boolean)
    const radioGroups = screen.getAllByRole('radiogroup');
    // Group 2 is for subtopic 102
    const todoChip = screen.getByRole('radio', { name: /Chưa học|To Do/i, checked: true });
    expect(todoChip).toBeInTheDocument();

    const doneButtons = screen.getAllByRole('radio', { name: /Hoàn thành|Completed/i });
    // Click DONE on the second subtopic
    fireEvent.click(doneButtons[1]);

    expect(onStatusChange).toHaveBeenCalledWith(102, 'DONE');
  });

  test('expand/collapse button toggles subtopics visibility', () => {
    renderCard();

    expect(screen.getByText('Mô hình Von Neumann')).toBeVisible();

    const toggleBtn = screen.getByRole('button', { name: /Toggle chapter|Thu gọn|Mở rộng/i });
    fireEvent.click(toggleBtn);

    expect(screen.queryByText('Mô hình Von Neumann')).toBeNull();

    fireEvent.click(toggleBtn);
    expect(screen.getByText('Mô hình Von Neumann')).toBeVisible();
  });

  test('zero-division guard: chapter with 0 subtopics does not display NaN', () => {
    const emptyChapter = {
      id: 2,
      sortOrder: 2,
      title: 'Chương 2: Đang cập nhật',
      status: 'TODO',
      subtopics: [],
    };

    render(
      <LanguageProvider>
        <ChapterCard chapter={emptyChapter} index={1} onStatusChange={vi.fn()} />
      </LanguageProvider>
    );

    expect(screen.getByText('Chương 2: Đang cập nhật')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.getByRole('radio', { name: /To Do|Chưa học/i })).toHaveAttribute('aria-checked', 'true');
  });
});
