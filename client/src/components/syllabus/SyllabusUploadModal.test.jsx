import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SyllabusUploadModal } from './SyllabusUploadModal';
import { LanguageProvider } from '../../i18n/languageContext';
import { syllabusApi } from '../../lib/api';

const mockCourse = {
  id: 1,
  name: 'Hệ thống Cơ sở dữ liệu (MSIS207)',
};

function renderModal(props = {}) {
  return render(
    <LanguageProvider>
      <SyllabusUploadModal
        isOpen={true}
        course={mockCourse}
        currentTopicsCount={2}
        minScanDelayMs={10}
        onClose={vi.fn()}
        onImportSuccess={vi.fn()}
        {...props}
      />
    </LanguageProvider>
  );
}

describe('SyllabusUploadModal', () => {
  test('returns null when isOpen is false', () => {
    const { container } = render(
      <LanguageProvider>
        <SyllabusUploadModal isOpen={false} course={mockCourse} />
      </LanguageProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders upload dropzone with course code target', () => {
    renderModal();
    expect(screen.getByText(/MSIS207/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Course Syllabus Document|Tải lên đề cương môn học/i)).toBeInTheDocument();
  });

  test('handles file selection and enables extraction button', () => {
    renderModal();
    const extractBtn = screen.getByRole('button', {
      name: /Extract Topics with Gemini AI|Phân tích chương mục bằng Gemini AI/i,
    });
    expect(extractBtn).toBeDisabled();

    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['dummy syllabus'], 'syllabus_csdl.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    expect(screen.getByText('syllabus_csdl.pdf')).toBeInTheDocument();
    expect(extractBtn).not.toBeDisabled();
  });

  test('runs scanning and transitions to preview with extracted topics', async () => {
    const mockTopics = [
      { title: 'Chapter 1: CSDL Intro', description: 'Basics of DB', sortOrder: 1, status: 'TODO' },
      { title: 'Chapter 2: ER Modeling', description: 'Entities and Relations', sortOrder: 2, status: 'TODO' },
    ];
    vi.spyOn(syllabusApi, 'extractSyllabus').mockResolvedValue(mockTopics);

    const onImportSuccess = vi.fn();
    renderModal({ onImportSuccess });

    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['dummy syllabus'], 'csdl.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    const extractBtn = screen.getByRole('button', {
      name: /Extract Topics with Gemini AI|Phân tích chương mục bằng Gemini AI/i,
    });
    fireEvent.click(extractBtn);

    // Verify preview step displays extracted items
    await waitFor(
      () => {
        expect(screen.getByDisplayValue('Chapter 1: CSDL Intro')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Chapter 2: ER Modeling')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Test editing topic
    const firstInput = screen.getByDisplayValue('Chapter 1: CSDL Intro');
    fireEvent.change(firstInput, { target: { value: 'Chapter 1: Relational Architecture' } });
    expect(screen.getByDisplayValue('Chapter 1: Relational Architecture')).toBeInTheDocument();

    // Confirm import
    const confirmBtn = screen.getByRole('button', {
      name: /Import 2 Topics to Syllabus|Thêm 2 chương vào Giáo trình/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onImportSuccess).toHaveBeenCalledTimes(1);
      const passedTopics = onImportSuccess.mock.calls[0][0];
      expect(passedTopics).toHaveLength(2);
      expect(passedTopics[0].title).toBe('Chapter 1: Relational Architecture');
    });
  });

  test('allows deleting and manually adding chapters in preview', async () => {
    const mockTopics = [
      { title: 'Chapter A', description: 'Desc A', sortOrder: 1, status: 'TODO' },
      { title: 'Chapter B', description: 'Desc B', sortOrder: 2, status: 'TODO' },
    ];
    vi.spyOn(syllabusApi, 'extractSyllabus').mockResolvedValue(mockTopics);

    renderModal();

    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['dummy syllabus'], 'csdl.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    fireEvent.click(
      screen.getByRole('button', {
        name: /Extract Topics with Gemini AI|Phân tích chương mục bằng Gemini AI/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Chapter A')).toBeInTheDocument();
    });

    // Delete first item
    const deleteBtns = screen.getAllByRole('button', { name: '✕' });
    fireEvent.click(deleteBtns[0]);
    expect(screen.queryByDisplayValue('Chapter A')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Chapter B')).toBeInTheDocument();

    // Add manual chapter
    const addBtn = screen.getByRole('button', {
      name: /\+ Add Chapter Manually|\+ Thêm chương thủ công/i,
    });
    fireEvent.click(addBtn);
    expect(screen.getAllByDisplayValue(/Chapter 2:|Chương 2:/i).length).toBeGreaterThan(0);
  });
});
