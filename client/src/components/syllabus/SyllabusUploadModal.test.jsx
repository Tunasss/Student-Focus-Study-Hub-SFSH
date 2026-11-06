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
      name: /Extract Topics|Phân tích chương mục/i,
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
      name: /Extract Topics|Phân tích chương mục/i,
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
        name: /Extract Topics|Phân tích chương mục/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Chapter A')).toBeInTheDocument();
    });

    // Delete first item
    const deleteBtns = screen.getAllByRole('button', { name: /Remove chapter|✕/i });
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

  test('supports selecting multiple files and removing an individual file chip', () => {
    renderModal();
    const fileInput = document.querySelector('input[type="file"]');
    const file1 = new File(['file 1'], 'lecture1.pdf', { type: 'application/pdf' });
    const file2 = new File(['file 2'], 'lecture2.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    expect(screen.getByText('lecture1.pdf')).toBeInTheDocument();
    expect(screen.getByText('lecture2.pdf')).toBeInTheDocument();

    const removeFile1Btn = screen.getByRole('button', { name: /Remove lecture1\.pdf|Xóa lecture1\.pdf/i });
    fireEvent.click(removeFile1Btn);

    expect(screen.queryByText('lecture1.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('lecture2.pdf')).toBeInTheDocument();
  });

  test('renders hierarchical knowledge tree preview and supports adding subtopics and toggling append/replace', async () => {
    const mockTree = {
      chapters: [
        {
          title: 'Chapter 1: Intro',
          description: 'Basic concepts',
          sourceFile: 'lecture1.pdf',
          subtopics: [{ title: '1.1 Getting Started', description: 'Setup' }],
        },
      ],
    };
    vi.spyOn(syllabusApi, 'extractSyllabus').mockResolvedValue(mockTree);

    const onImportSuccess = vi.fn();
    renderModal({ onImportSuccess });

    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['dummy'], 'lecture1.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    fireEvent.click(
      screen.getByRole('button', {
        name: /Extract Topics|Phân tích chương mục/i,
      })
    );

    await waitFor(
      () => {
        expect(screen.getByDisplayValue('Chapter 1: Intro')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1.1 Getting Started')).toBeInTheDocument();
        expect(screen.getByText(/lecture1\.pdf/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Add a subtopic
    const addSubtopicBtn = screen.getByRole('button', { name: /\+ Add Subtopic|\+ Thêm mục con/i });
    fireEvent.click(addSubtopicBtn);

    expect(screen.getAllByDisplayValue(/Subtopic|Mục con/i).length).toBeGreaterThan(0);

    // Toggle mode to replace
    const replaceRadio = screen.getByLabelText(/Replace entire syllabus|Thay thế toàn bộ/i);
    fireEvent.click(replaceRadio);

    // Confirm import
    const confirmBtn = screen.getByRole('button', {
      name: /Import 1 Topic to Syllabus|Thêm 1 chương vào Giáo trình/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onImportSuccess).toHaveBeenCalledTimes(1);
      const passed = onImportSuccess.mock.calls[0][0];
      expect(passed.mode).toBe('replace');
      expect(passed[0].subtopics.length).toBe(2);
    });
  });
});
