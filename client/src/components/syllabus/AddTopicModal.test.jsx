import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AddTopicModal } from './AddTopicModal';
import { LanguageProvider } from '../../i18n/languageContext';

describe('AddTopicModal', () => {
  test('does not render when isOpen is false', () => {
    render(
      <LanguageProvider>
        <AddTopicModal isOpen={false} courseId={1} nextSortOrder={1} onClose={vi.fn()} onCreated={vi.fn()} />
      </LanguageProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders form fields when isOpen is true', () => {
    render(
      <LanguageProvider>
        <AddTopicModal isOpen={true} courseId={1} nextSortOrder={5} onClose={vi.fn()} onCreated={vi.fn()} />
      </LanguageProvider>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title|Tên chương/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description|Mô tả/i)).toBeInTheDocument();
  });

  test('submitting with valid title calls onCreated and resets form', () => {
    const handleCreated = vi.fn();
    const handleClose = vi.fn();

    render(
      <LanguageProvider>
        <AddTopicModal isOpen={true} courseId={1} nextSortOrder={5} onClose={handleClose} onCreated={handleCreated} />
      </LanguageProvider>
    );

    const titleInput = screen.getByLabelText(/Title|Tên chương/i);
    const descInput = screen.getByLabelText(/Description|Mô tả/i);

    fireEvent.change(titleInput, { target: { value: 'Chapter 5: Normalization & BCNF' } });
    fireEvent.change(descInput, { target: { value: 'Functional dependencies, 1NF to BCNF' } });

    const submitBtn = screen.getByRole('button', { name: /Add Topic|Thêm chương/i });
    fireEvent.click(submitBtn);

    expect(handleCreated).toHaveBeenCalledWith({
      title: 'Chapter 5: Normalization & BCNF',
      description: 'Functional dependencies, 1NF to BCNF',
      sortOrder: 5,
      status: 'TODO',
    });
  });

  test('submitting with blank title shows validation message', () => {
    const handleCreated = vi.fn();

    render(
      <LanguageProvider>
        <AddTopicModal isOpen={true} courseId={1} nextSortOrder={5} onClose={vi.fn()} onCreated={handleCreated} />
      </LanguageProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Add Topic|Thêm chương/i });
    fireEvent.click(submitBtn);

    expect(handleCreated).not.toHaveBeenCalled();
    expect(screen.getByText(/Title is required|Vui lòng nhập tên chương/i)).toBeInTheDocument();
  });
});

