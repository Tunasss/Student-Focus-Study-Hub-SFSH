import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LanguageProvider } from '../../i18n/languageContext';
import { TopicCompletionModal } from './TopicCompletionModal';

describe('TopicCompletionModal (WBS 3.4)', () => {
  const onConfirmDone = vi.fn();
  const onKeepDoing = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <LanguageProvider>
        <TopicCompletionModal
          isOpen={false}
          topicTitle="Functions"
          courseCode="CS101"
          onConfirmDone={onConfirmDone}
          onKeepDoing={onKeepDoing}
        />
      </LanguageProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders modal prompt and triggers onConfirmDone when clicking Confirm', async () => {
    render(
      <LanguageProvider>
        <TopicCompletionModal
          isOpen={true}
          topicTitle="Functions & Recursion"
          courseCode="CS101"
          onConfirmDone={onConfirmDone}
          onKeepDoing={onKeepDoing}
        />
      </LanguageProvider>
    );

    expect(screen.getByRole('heading', { name: /Focus Sprint Completed!|Hoàn thành phiên/i })).toBeInTheDocument();
    expect(screen.getByText(/Functions & Recursion/)).toBeInTheDocument();
    expect(screen.getByText('CS101')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-topic-done-btn'));
    await waitFor(() => {
      expect(onConfirmDone).toHaveBeenCalledTimes(1);
    });
  });

  test('calls onKeepDoing when user declines', () => {
    render(
      <LanguageProvider>
        <TopicCompletionModal
          isOpen={true}
          topicTitle="Functions"
          onConfirmDone={onConfirmDone}
          onKeepDoing={onKeepDoing}
        />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Keep as In Progress|Tiếp tục học/i }));
    expect(onKeepDoing).toHaveBeenCalledTimes(1);
  });
});
