# Focus Studio Sub-Chapter Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable sub-chapter selection and tracking (e.g., 1.1, 1.2, 2.1) in Focus Studio (DeepFocusPage) by inserting a dedicated Sub-Chapter Objective card between the Focus Subject card and the Live Clock, and rendering hierarchical chapter trees.

**Architecture:** Utilize existing `buildTopicTree` in `client/src/utils/topicTree.js` to parse flat API topics into chapters with nested subtopics. Add `activeSubTopicId` to Focus Studio session state, render a new `FocusSubChapterCard` widget between `FocusSubjectPicker` and `RealWorldClock`, and ensure Pomodoro logs and completion modals track the specific sub-chapter.

**Tech Stack:** React 19, Vite, Tailwind CSS, Lucide-react / SVG icons, Vitest, Testing Library, Node.js test runner.

---

## Global Constraints

- Multi-tenant data isolation (Rule 06): Scoped through `byUser` and `byCourseOwner`.
- Bilingual support: All user-facing UI labels, toasts, and buttons must provide English and Vietnamese text via `useLanguage()`.
- Responsive layout: Must fit cleanly on mobile and desktop without layout breaks or horizontal overflow.
- Non-destructive: Existing single-chapter workflows (courses without sub-chapters) must continue working seamlessly.

## Review Focus

1. Course with NO sub-chapters: The sub-chapter card gracefully displays single chapter focus without crashing or showing broken selectors.
2. Changing Course or Chapter: Automatically resets or updates the active sub-chapter to the first incomplete sub-chapter of the new chapter.
3. Marking Sub-chapter Done: Triggers `syllabusApi.updateTopicStatus(subtopicId, 'DONE')`, updates local state optimistically, and auto-advances to the next incomplete subtopic.
4. All Sub-chapters Completed: Displays a celebratory status and provides an option to mark the parent chapter completed.
5. Pomodoro Session Logging: Passes `activeSubTopicId` (falling back to `activeTopicId`) as `topicId` to `POST /api/sessions`.

---

### Task 1: Hierarchical Chapter & Sub-Chapter Navigation in FocusSubjectPicker

**Files:**
- Modify: `client/src/components/focus/FocusSubjectPicker.jsx`
- Test: `client/src/pages/DeepFocusPage.test.jsx`

- [ ] Import `buildTopicTree` from `../../utils/topicTree`.
- [ ] Group `topics` into hierarchical chapters with subtopics using `useMemo(() => buildTopicTree(topics), [topics])`.
- [ ] In the Curriculum Chapters popover section, render each chapter and, if it has subtopics, render them indented (`↳ 1.1 ...`) with their completion status chips.
- [ ] Support clicking either a parent chapter or a child subtopic to select it, updating both chapter and sub-chapter.
- [ ] Run client test suite to ensure no regressions.

---

### Task 2: Create FocusSubChapterCard Component

**Files:**
- Create: `client/src/components/focus/FocusSubChapterCard.jsx`
- Test: `client/src/components/focus/FocusSubChapterCard.test.jsx`

- [ ] Create `FocusSubChapterCard.jsx` taking props:
  - `activeChapter`: current active chapter object with `title`, `status`, `subtopics`
  - `activeSubTopicId`: current selected subtopic ID
  - `onSelectSubTopic`: callback when user selects a subtopic
  - `onCompleteSubTopic`: callback when user clicks "Mark Done ✓"
  - `isTaskTarget`: boolean, whether the user is currently targeting an assignment/task
- [ ] Render card header with `SUB-CHAPTER OBJECTIVE` badge and progress counter (`X/Y Completed`).
- [ ] Render active sub-chapter title and description.
- [ ] Add interactive selector (dropdown / list) to switch between sub-chapters.
- [ ] Add "Mark Done ✓" button with status indicator (TODO / DOING / DONE).
- [ ] Render fallback state when chapter has no subtopics or when focusing on a task.
- [ ] Write unit tests in `FocusSubChapterCard.test.jsx` verifying render, switching sub-chapters, and clicking mark done.
- [ ] Run vitest on the new test file to verify passing.

---

### Task 3: Integrate Sub-Chapter Selection into DeepFocusPage

**Files:**
- Modify: `client/src/pages/DeepFocusPage.jsx`
- Test: `client/src/pages/DeepFocusPage.test.jsx`

- [ ] In `DeepFocusPage.jsx`, add `session.activeSubTopicId` to session state and `persistSession`.
- [ ] Insert `<FocusSubChapterCard ... />` in the left widget column directly between `FocusSubjectPicker` and `<div className="left-widget-card"><RealWorldClock /></div>`.
- [ ] Pass the active chapter and its subtopics to `FocusSubChapterCard`.
- [ ] When auto-logging sessions (`sessionsApi.logSession`), pass `topicId: session.activeSubTopicId || session.activeTopicId || null`.
- [ ] In `TopicCompletionModal` prompt, if `activeSubTopicId` is active, prompt with the sub-chapter title.
- [ ] Run full client test suite to ensure all 146+ tests pass.

---

### Task 4: Verification & Git Commit

**Files:**
- Entire repository

- [ ] Run full backend test suite (`cd api && npm test`) - 435 tests.
- [ ] Run full frontend test suite (`cd client && npm test`) - all tests pass.
- [ ] Review diff with `git status` and `git diff`.
- [ ] Commit changes on git.
