import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../i18n/languageContext';
import { FocusSubChapterCard } from './FocusSubChapterCard';

const mockChapterWithSubs = {
  id: 10,
  title: 'Chapter 2: Analysis and interpretation of data',
  status: 'DOING',
  subtopics: [
    { id: 101, title: '2.1 Estimate the value of the population', status: 'DONE' },
    { id: 102, title: '2.2 Testing the population mean parameter', status: 'DONE' },
    { id: 103, title: '2.3 Chi-square test & Levene\'s test', description: 'Explore Chi-square test', status: 'DOING' },
    { id: 104, title: '2.4 Analysis of variance (ANOVA)', status: 'TODO' },
  ],
};

function renderComponent(props) {
  return render(
    <LanguageProvider>
      <FocusSubChapterCard {...props} />
    </LanguageProvider>
  );
}

describe('FocusSubChapterCard', () => {
  test('renders sub-chapter card with active subtopic and 2/4 progress without redundant mark done button', () => {
    renderComponent({
      activeChapter: mockChapterWithSubs,
      activeSubTopicId: 103,
    });

    expect(screen.getByText('SUB-CHAPTER OBJECTIVE')).toBeInTheDocument();
    expect(screen.getByTestId('subchapter-progress-pill')).toHaveTextContent('2/4 Done');
    expect(screen.getByTestId('active-subchapter-title')).toHaveTextContent(
      '2.3 Chi-square test & Levene\'s test'
    );
    expect(screen.getByText('Explore Chi-square test')).toBeInTheDocument();
    expect(screen.queryByTestId('mark-subchapter-done-btn')).not.toBeInTheDocument();
  });

  test('toggles dropdown and selects a different subtopic', () => {
    const onSelect = vi.fn();
    renderComponent({
      activeChapter: mockChapterWithSubs,
      activeSubTopicId: 103,
      onSelectSubTopic: onSelect,
    });

    const toggleBtn = screen.getByTestId('toggle-subchapter-dropdown');
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('subchapter-dropdown-menu')).toBeInTheDocument();
    const targetSubBtn = screen.getByText('2.4 Analysis of variance (ANOVA)');
    fireEvent.click(targetSubBtn);

    expect(onSelect).toHaveBeenCalledWith(104);
  });

  test('renders status strip correctly without mark done button', () => {
    renderComponent({
      activeChapter: mockChapterWithSubs,
      activeSubTopicId: 103,
    });

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.queryByTestId('mark-subchapter-done-btn')).not.toBeInTheDocument();
  });

  test('renders single chapter fallback when chapter has no subtopics', () => {
    const flatChapter = {
      id: 20,
      title: 'Chapter 1: Foundations',
      status: 'TODO',
      subtopics: [],
    };

    renderComponent({
      activeChapter: flatChapter,
    });

    expect(screen.getByText('Single Chapter (No sub-chapters)')).toBeInTheDocument();
    expect(
      screen.getByText(/This chapter does not contain separate sub-chapters/i)
    ).toBeInTheDocument();
  });

  test('renders task mode notice when isTaskTarget is true', () => {
    renderComponent({
      activeChapter: mockChapterWithSubs,
      isTaskTarget: true,
    });

    expect(screen.getByText('ASSIGNMENT MODE')).toBeInTheDocument();
    expect(
      screen.getByText(/Focusing on course deadline \/ assignment/i)
    ).toBeInTheDocument();
  });

  test('renders all completed celebratory state when all subtopics are DONE', () => {
    const allDoneChapter = {
      id: 30,
      title: 'Chapter 3: Done Chapter',
      subtopics: [
        { id: 301, title: '3.1 Topic A', status: 'DONE' },
        { id: 302, title: '3.2 Topic B', status: 'DONE' },
      ],
    };

    renderComponent({
      activeChapter: allDoneChapter,
      activeSubTopicId: 301,
    });

    expect(screen.getByText('🎉 All sub-chapters completed')).toBeInTheDocument();
  });
});
