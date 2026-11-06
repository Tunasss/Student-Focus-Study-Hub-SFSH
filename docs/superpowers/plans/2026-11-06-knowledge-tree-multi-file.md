# Multi-File Knowledge Tree Syllabus Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable students to upload multiple lecture slide PDFs simultaneously, which Gemini AI synthesizes into a structured Knowledge Tree (Chapters ➔ Subtopics), persisted in MySQL with self-referencing `parentId`, and presented on `SyllabusPage` as interactive Chapter Cards with subtopic progress tracking.

**Architecture:** Extend Prisma `Topic` with `parentId` and `sourceFile`. Implement multi-file multipart upload in `syllabus.js` using `multer.array('files', 20)`. Update `extractPdf.js` and `analyzeSyllabus.js` with hierarchical Gemini schemas returning chapters with nested subtopics. In the client, upgrade `SyllabusUploadModal` for multi-file selection and tree reorganization, and build `ChapterCard` on `SyllabusPage` to render the collapsible Knowledge Tree.

**Tech Stack:** Node.js (LTS), Express 5, Prisma ORM, MySQL 8, Multer, `pdf-parse`, `@google/genai` (Gemini 2.5 Flash), React 19, Tailwind CSS v4, GSAP 3, Vitest, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-06-knowledge-tree-multi-file-design.md`

## Global Constraints
- Target Branch: `feat/2.2-syllabus-gemini` (Backend & AI) & `main` (Frontend integration).
- All API responses must follow the Rule 02 standard JSON envelope `{ ok: true, data: ... }` / `{ ok: false, error: { code, message, details } }`.
- Every API endpoint query must be scoped by `userId` (Rule 06).
- Database changes must be non-destructive to existing `tasks.topic_id` foreign keys (use `append` mode by default).
- UI must follow Luma Green design system (`#243100`, `#DBEF90`, Urbanist typography), dark/light mode compatibility, and full EN/VI bilingual support.

## Review Focus
- **Empty file or 0-page PDF among uploaded batch**: Return structured error `EMPTY_PDF_FILE` indicating which file is empty without crashing the batch.
- **Exceeding file count or batch size limit**: Reject with `FILE_LIMIT_EXCEEDED` (> 20 files or > 50 MB total).
- **Single master syllabus vs multiple chapter slide decks**: AI prompt must correctly distinguish whether an uploaded file is a single chapter slide or an entire course syllabus.
- **Incremental upload mode**: `mode: 'append'` must keep existing topics with their status and linked tasks, inserting new chapters after `max(sortOrder)`.
- **Zero-division NaN in Chapter progress**: When a chapter has 0 subtopics, progress calculation must fallback cleanly to `100%` (if DONE) or `0%` (if TODO) without producing `NaN`.

---

### Task 1: Database Schema & Migration for Topic Hierarchy & Source File

**Files:**
- Modify: `api/prisma/schema.prisma:98-114`
- Test: `api/test/topics/topicRepo.test.js`

- [ ] **Step 1: Update Prisma schema**
  Add `parentId Int? @map("parent_id")` and `sourceFile String? @map("source_file") @db.VarChar(255)` to `model Topic` in `api/prisma/schema.prisma`. Define self-relation:
  ```prisma
  parent   Topic?  @relation("TopicHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children Topic[] @relation("TopicHierarchy")
  ```
  Update `@@unique([courseId, parentId, sortOrder])` or ensure unique indexing accommodates nullable `parentId`.
- [ ] **Step 2: Apply schema changes and generate client**
  Run: `npx prisma db push` and `npx prisma generate` in `api`.
- [ ] **Step 3: Run existing API tests to verify zero regression**
  Run: `npm test` in `api`.
- [ ] **Step 4: Commit schema changes**
  Commit: `feat(db): add parentId and sourceFile to Topic schema for knowledge tree hierarchy`

---

### Task 2: Backend Multi-File Upload & Text Extraction Pipeline

**Files:**
- Modify: `api/src/middleware/upload.js`
- Modify: `api/src/syllabus/extractPdf.js`
- Test: `api/test/syllabus/extractPdf.test.js`

- [ ] **Step 1: Write unit tests for multi-file extraction**
  In `api/test/syllabus/extractPdf.test.js`, add tests for `extractMultiplePdfs`:
  - Accepts an array of file objects `{ originalname, buffer }`.
  - Extracts text for each file and returns array of `{ fileName, text, pageCount, charCount }`.
  - Throws `INVALID_PDF_FORMAT` or skips invalid files with clear error reporting.
- [ ] **Step 2: Add `multiFileUpload` middleware**
  In `api/src/middleware/upload.js`, implement `multiFileUpload({ field: 'files', maxCount: 20, maxBytes, errorCode, label })` using `multer.array('files', 20)`.
- [ ] **Step 3: Implement `extractMultiplePdfs` in `extractPdf.js`**
  Iterate through files, call `extractPdfText` on each buffer, calculate combined character counts and page counts, and return per-file metadata.
- [ ] **Step 4: Run tests and ensure they pass**
  Run: `node --test test/syllabus/extractPdf.test.js` in `api`.
- [ ] **Step 5: Commit upload & extraction updates**
  Commit: `feat(syllabus): support multi-file batch upload and text extraction`

---

### Task 3: Hierarchical Knowledge Tree Gemini Schema, Prompt & Mock Engine

**Files:**
- Modify: `api/src/syllabus/geminiSchema.js`
- Modify: `api/src/syllabus/analyzeSyllabus.js`
- Modify: `api/src/llm/mockGemini.js`
- Test: `api/test/syllabus/analyzeSyllabus.test.js`

- [ ] **Step 1: Write failing tests for hierarchical analysis**
  In `api/test/syllabus/analyzeSyllabus.test.js`, add tests expecting Gemini output schema:
  - `{ courseCode, chapters: [ { order, title, description, sourceFile, subtopics: [ { order, title, description } ] } ] }`.
  - Mock Gemini returns 5 structured chapters with 3-4 subtopics each when `LLM_MOCK=true`.
- [ ] **Step 2: Update Gemini response schema and zod validation in `geminiSchema.js`**
  Define `responseSchema` with nested `chapters` array, each containing `order`, `title`, `description`, `source_file`, and a `subtopics` array. Update `syllabusOutputSchema` in zod with identical shape.
- [ ] **Step 3: Update prompt in `analyzeSyllabus.js`**
  Craft prompt instructions explaining that input may contain multiple slide decks. Direct Gemini to:
  1. Map each lecture deck/chapter slide to a top-level Chapter.
  2. Extract 3–6 key subtopics/sections per Chapter.
  3. Never artificially subdivide a single chapter slide deck into redundant top-level chapters.
- [ ] **Step 4: Update `mockGemini.js`**
  Return realistic 2-level Knowledge Tree fixtures matching the new schema.
- [ ] **Step 5: Run tests and ensure they pass**
  Run: `node --test test/syllabus/analyzeSyllabus.test.js` in `api`.
- [ ] **Step 6: Commit AI analysis updates**
  Commit: `feat(syllabus): implement hierarchical knowledge tree Gemini schema and prompt`

---

### Task 4: Extraction Route & Hierarchical Bulk Persistence API

**Files:**
- Modify: `api/src/routes/syllabus.js`
- Modify: `api/src/topics/schemas.js`
- Modify: `api/src/topics/topicRepo.js`
- Modify: `api/src/routes/courses.js`
- Modify: `api/src/routes/topics.js`
- Modify: `api/openapi.yaml`
- Test: `api/test/syllabus/extract.routes.test.js`, `api/test/topics/topicRepo.test.js`, `api/test/topics/topics.routes.test.js`

- [ ] **Step 1: Write tests for `POST /api/syllabus/extract` with multiple files**
  In `api/test/syllabus/extract.routes.test.js`, test uploading 3 PDF files simultaneously; verify response includes `chapters` with nested `subtopics`.
- [ ] **Step 2: Write tests for `POST /api/courses/:id/topics/bulk` with `mode: 'append'` and `mode: 'replace'`**
  In `api/test/topics/topics.routes.test.js`, test:
  - Saving hierarchical chapters + subtopics in one transaction.
  - Appending chapters to existing topics preserves existing topic IDs and linked tasks.
  - `GET /api/courses/:id/topics` returns `parentId` and `sourceFile`.
- [ ] **Step 3: Update `POST /api/syllabus/extract` route in `syllabus.js`**
  Use `multiFileUpload({ field: 'files' })` (with fallback to single `file` for backward compatibility).
- [ ] **Step 4: Implement hierarchical bulk persistence in `topicRepo.js`**
  In `replaceTopics` / `saveHierarchicalTopics`:
  - If `mode === 'append'`: Calculate `baseOrder = max(sortOrder)` of existing chapters.
  - If `mode === 'replace'`: Delete existing topics (with cascade).
  - Insert chapters with `parentId = null` and `sourceFile`.
  - Insert subtopics with `parentId = chapter.id`.
- [ ] **Step 5: Update `GET /api/courses/:id/topics` serialization**
  Expose `parentId` and `sourceFile` in topic JSON serialization.
- [ ] **Step 6: Update OpenAPI spec in `openapi.yaml`**
  Document `files` multipart upload, new response schema, and `mode` query/body parameter.
- [ ] **Step 7: Run all backend tests and verify pass**
  Run: `npm test` in `api`.
- [ ] **Step 8: Commit API route updates**
  Commit: `feat(api): support multi-file extraction and hierarchical topic persistence`

---

### Task 5: Frontend Multi-File Batch Uploader & Tree Preview Modal

**Files:**
- Modify: `client/src/lib/api.js`
- Modify: `client/src/components/syllabus/SyllabusUploadModal.jsx`
- Test: `client/src/components/syllabus/SyllabusUploadModal.test.jsx`

- [ ] **Step 1: Write frontend tests for multi-file upload & preview**
  In `client/src/components/syllabus/SyllabusUploadModal.test.jsx`:
  - Test selecting multiple PDF files.
  - Test removing an individual file chip from the selection list.
  - Test rendering hierarchical tree preview with chapters and nested subtopics.
  - Test adding a subtopic manually under a chapter.
  - Test saving with `mode: 'append'`.
- [ ] **Step 2: Update `extractSyllabus` in `client/src/lib/api.js`**
  Support passing an array of `files`: append each file to `FormData` under key `'files'`.
- [ ] **Step 3: Upgrade `SyllabusUploadModal.jsx`**
  - Change `file` state to `files` array.
  - `<input type="file" multiple accept=".pdf" />`.
  - Render selected file chips with file size and remove (`✕`) button.
  - Step 3 (Preview): Render two-tier Knowledge Tree with expandable chapters, subtopic items, add/remove subtopic buttons, and "Append to existing" vs "Replace syllabus" toggle.
- [ ] **Step 4: Run client tests and ensure they pass**
  Run: `npx vitest run src/components/syllabus/SyllabusUploadModal.test.jsx` in `client`.
- [ ] **Step 5: Commit modal updates**
  Commit: `feat(client): implement multi-file batch upload and knowledge tree preview modal`

---

### Task 6: Frontend Knowledge Tree Accordion & Interactive Subtopic Checklist

**Files:**
- Create: `client/src/components/syllabus/ChapterCard.jsx`
- Modify: `client/src/pages/SyllabusPage.jsx`
- Test: `client/src/components/syllabus/ChapterCard.test.jsx`, `client/src/pages/SyllabusPage.test.jsx`

- [ ] **Step 1: Write tests for `ChapterCard.jsx` and tree rendering**
  - Test Chapter card renders chapter title, `sourceFile` badge, and progress pill.
  - Test clicking expand/collapse toggles visibility of subtopics.
  - Test ticking a subtopic's status pill updates chapter progress immediately (optimistic UI).
- [ ] **Step 2: Implement `ChapterCard.jsx`**
  - Clean glassmorphic card (`glass-card`).
  - Header: Chapter number, title, `sourceFile` badge, progress bar, subtopic counter (`3/5 DONE`), expand/collapse chevron.
  - Body: List of subtopics with 3-state radio buttons (`TODO` / `DOING` / `DONE`), title, description, and link to create task.
  - Quick action: "Mark all subtopics DONE".
- [ ] **Step 3: Update `SyllabusPage.jsx`**
  - Implement helper `buildTopicTree(topics)`: partitions flat topics into chapters (`parentId == null`) and their child subtopics.
  - Render list of `ChapterCard` components with smooth GSAP entrance stagger.
  - Update mastery calculation: computes total subtopics across all chapters.
  - Handle optimistic status update for subtopics and rollback on API failure.
- [ ] **Step 4: Run tests and ensure they pass**
  Run: `npx vitest run src/pages/SyllabusPage.test.jsx` in `client`.
- [ ] **Step 5: Commit Knowledge Tree UI**
  Commit: `feat(syllabus): render hierarchical knowledge tree chapter cards with subtopic checklists`

---

### Task 7: Downstream Compatibility, Linting & Full Regression Verification

**Files:**
- Verify: `client/src/components/focus/FocusSubjectPicker.jsx`
- Verify: `client/src/pages/DeepFocusPage.jsx`
- Verify: `client/src/lib/api.test.js`

- [ ] **Step 1: Verify Focus Studio Subject Picker compatibility**
  Ensure `FocusSubjectPicker.jsx` displays chapters with indented subtopics cleanly without errors.
- [ ] **Step 2: Run all backend tests**
  Run: `npm test` in `api` (expect 100% pass across all test suites).
- [ ] **Step 3: Run all frontend tests**
  Run: `npm test -- --run` in `client` (expect 100% pass).
- [ ] **Step 4: Run linters**
  Run: `npm run lint` in `api` and `client` (0 errors, 0 warnings).
- [ ] **Step 5: Run production build**
  Run: `npm run build` in `client`.
- [ ] **Step 6: Final integration commit**
  Commit: `chore: complete multi-file knowledge tree integration and test verification`

