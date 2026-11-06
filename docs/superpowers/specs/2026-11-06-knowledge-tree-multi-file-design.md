# Design Document: Multi-File Knowledge Tree Syllabus Extraction

- **Author**: Antigravity & Trần Anh Tuấn
- **Date**: 2026-11-06
- **Status**: Proposed (Awaiting Approval)
- **Target Branches**: `feat/2.2-syllabus-gemini` (Backend & AI) & `feat/2.3-topic-tree` / `main` (Frontend)

---

## 1. Intent & Problem Statement

### 1.1 The User Problem
In real university coursework, lecturers rarely provide a single monolithic syllabus file. Instead, lecture slides and course materials are distributed as **separate files per chapter** (e.g., `Chuong_1_Tong_quan.pdf`, `Chuong_2_Kien_truc.pdf`, `Slide_Lab_03.pdf`).

In the current implementation:
1. The upload endpoint and modal accept only **one file at a time** (`upload.single('file')`).
2. The AI prompt assumes any uploaded file represents the *entire course syllabus*. When fed a single chapter slide deck, Gemini hallucinates and forcibly subdivides that single chapter into 5 artificial "chapters", completely breaking the genuine course hierarchy.
3. The UI presents topics as a flat list, whereas academic curriculum requires a hierarchical **Knowledge Tree** (Level 1: Chapters/Modules ➔ Level 2: Subtopics/Competencies/Key Sections) where students can track completion on individual subtopics.

### 1.2 Target Solution
Allow students to **upload multiple lecture slide files simultaneously** (batch upload). Gemini AI analyzes the multi-file collection, recognizes each file/chapter's identity from file names and slide titles, and generates a structured **Knowledge Tree**. In the UI, each Chapter is presented as an expansive **Chapter Card** containing interactive subtopic items with individual `TODO` / `DOING` / `DONE` tracking and chapter-level progress aggregation.

---

## 2. Goals, Non-Goals & Anti-Goals

### 2.1 Goals
- **Multi-File Batch Upload**: Support uploading 1 to 20 PDF files simultaneously via drag-and-drop or file picker.
- **Intelligent Chapter Aggregation**: Gemini analyzes the combined text from all files, using file names and content headers to accurately establish Chapter numbers and titles without artificial sub-division.
- **Hierarchical Knowledge Tree Schema**: Structure data as Chapter (Level 1) with nested Subtopics (Level 2).
- **Subtopic Completion Tracking**: Students can tick `TODO` / `DOING` / `DONE` on individual subtopics. The parent Chapter card automatically computes and displays its completion percentage (e.g., *4/5 subtopics completed — 80%*).
- **Full Backward Compatibility**: Courses with flat topics (`parentId = null`) continue to work seamlessly across Timetable, Tasks, and Deep Focus Studio.

### 2.2 Non-Goals
- Automatic quiz or flashcard generation from slide text (reserved for future AI Study Assistant milestones).
- OCR processing of scanned image-only PDFs (system relies on digital PDF text layer via `pdf-parse`).

### 2.3 Anti-Goals
- Forcing students to upload all chapters in one single session (students must be able to upload Chapter 1–3 today, and append Chapter 4–6 later).
- Breaking existing foreign keys in `tasks` or `sessions` tables.

---

## 3. Approaches Considered & Selected Approach

### Approach A (Selected): Self-Referential Hierarchy in Database (`parentId` in `Topic`)
- **Structure**: Add `parentId Int?` to the Prisma `Topic` model with a self-relation (`parent Topic?` / `children Topic[]`).
  - Chapter: `Topic` with `parentId: null`.
  - Subtopic: `Topic` with `parentId: <chapterId>`.
- **Why Selected**:
  - Clean relational model in MySQL; each subtopic has a persistent, primary key `id`.
  - Tasks can link directly to specific subtopics (e.g., *"Finish Homework for 1.2 Boolean Algebra"*).
  - 100% backward compatible: flat topics simply have `parentId = null`.

### Approach B (Rejected): Grouping Flat Topics by String Prefix
- **Structure**: Keep flat table; store `chapterTitle` string or prefix like `[Chapter 1]` in topic titles.
- **Why Rejected**: Brittle, duplicates chapter metadata across rows, prevents atomic parent-child cascade deletions, and lacks semantic hierarchy.

### Approach C (Rejected): JSON Subtopics within `Topic.description`
- **Structure**: Store subtopics as JSON array inside the Chapter's `description`.
- **Why Rejected**: Violates first normal form (1NF); ticking a subtopic requires serializing and writing the entire chapter JSON back, and tasks cannot reference individual subtopics via relational foreign keys.

---

## 4. Technical Architecture & Data Contract

### 4.1 Database Schema Update (`api/prisma/schema.prisma`)
```prisma
model Topic {
  id          Int         @id @default(autoincrement())
  courseId    Int         @map("course_id")
  parentId    Int?        @map("parent_id")
  sortOrder   Int         @map("sort_order")
  title       String      @db.VarChar(255)
  description String?     @db.Text
  sourceFile  String?     @map("source_file") @db.VarChar(255)
  status      TopicStatus @default(TODO)

  course   Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  parent   Topic?         @relation("TopicHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children Topic[]        @relation("TopicHierarchy")
  tasks    Task[]
  sessions StudySession[]

  @@unique([courseId, parentId, sortOrder])
  @@index([courseId])
  @@index([parentId])
  @@map("topics")
}
```

### 4.2 Multi-File Upload & Extraction Pipeline
```
[User drags 1-15 chapter PDFs]
               ↓
[SyllabusUploadModal] validates sizes & formats (≤ 10MB per file, ≤ 50MB total)
               ↓
FormData: 'files' -> POST /api/syllabus/extract
               ↓
[Multer upload.array('files', 20)]
               ↓
[extractPdfText()] extracts text per file with metadata:
  [ { fileName: 'Chuong_1_Tong_quan.pdf', text: '...', pageCount: 18 },
    { fileName: 'Chuong_2_Kien_truc.pdf', text: '...', pageCount: 24 } ]
               ↓
[analyzeSyllabusMultiFile()] invokes Gemini 2.5 Flash with structured schema:
  - If multiple files uploaded: Maps each file to a Chapter, extracting 3-6 key subtopics per chapter.
  - If single syllabus uploaded: Analyzes chapters and sections hierarchically.
               ↓
Returns JSON:
{
  courseCode: "CS101",
  chapters: [
    {
      order: 1,
      title: "Chương 1: Tổng quan hệ thống phần cứng",
      description: "...",
      sourceFile: "Chuong_1_Tong_quan.pdf",
      subtopics: [
        { order: 1, title: "Mô hình Von Neumann", description: "..." },
        { order: 2, title: "Đại số Boolean và Cổng Logic", description: "..." }
      ]
    }
  ]
}
```

### 4.3 Bulk Persistence API (`POST /api/courses/:id/topics/bulk`)
- Accepts hierarchical payload with an optional `mode` flag (`'append'` | `'replace'`, default: `'append'`):
  ```json
  {
    "mode": "append",
    "chapters": [
      {
        "title": "Chương 1: Tổng quan...",
        "description": "...",
        "sourceFile": "Chuong_1_Tong_quan.pdf",
        "subtopics": [
          { "title": "1.1 Mô hình Von Neumann", "description": "..." },
          { "title": "1.2 Đại số Boolean", "description": "..." }
        ]
      }
    ]
  }
  ```
- **Append Mode (Default)**:
  - Appends newly extracted chapters after the highest existing `sortOrder`.
  - Preserves all existing chapters, subtopics, and linked tasks (`tasks.topic_id` foreign keys stay completely intact).
- **Replace Mode**:
  - Replaces the curriculum when the student explicitly requests a full reset in the UI.

### 4.4 Status, Progress & Query Contract
1. **API Query Contract (`GET /api/courses/:id/topics`)**:
   - Returns a flat array of topics with `parentId` and `sourceFile`:
     ```json
     {
       "topics": [
         { "id": 1, "parentId": null, "sortOrder": 1, "title": "Chương 1", "sourceFile": "c1.pdf", "status": "DOING" },
         { "id": 2, "parentId": 1, "sortOrder": 1, "title": "1.1 Von Neumann", "sourceFile": null, "status": "DONE" }
       ]
     }
     ```
   - Client helper `buildTopicTree(topics)` groups chapters with their children for rendering. This ensures 100% backward compatibility for downstream consumers (`FocusSubjectPicker`, Task modals).
2. **Subtopic Status**: Directly mutable (`TODO` ➔ `DOING` ➔ `DONE`) via `PATCH /api/topics/:id`.
3. **Chapter Status & Progress Calculation**:
   - **For Chapters with subtopics (`children.length > 0`)**:
     - `chapterProgress = Math.round((doneChildren / totalChildren) * 100)`.
     - Status is computed dynamically: `DONE` if all children done, `DOING` if > 0 children done, else `TODO`.
     - Marking a chapter `DONE` directly cascades to mark all child subtopics `DONE`.
   - **For Leaf Topics / Legacy flat courses (`children.length === 0`)**:
     - `chapterProgress = status === 'DONE' ? 100 : status === 'DOING' ? 50 : 0`.
     - Status directly reads the topic's own `status` column (preventing any `0 / 0 = NaN` division).

---

## 5. UI/UX Specifications (`client/src`)

### 5.1 Multi-File Selector (`SyllabusUploadModal.jsx`)
- Dropzone accepts multiple files (`<input type="file" multiple accept=".pdf" />`).
- Displays a chip list of selected files with file sizes, page counts, and an `✕` button to remove individual files before scanning.
- Dynamic scan indicator: *"Analyzing 4 lecture files with Gemini AI..."*.

### 5.2 Tree Reorganization Preview Step
- Visual tree view:
  ```
  📁 Chương 1: Kiến trúc máy tính (File: Chuong_1.pdf) [Edit] [Delete]
     ├── 📄 1.1 Đại số Boolean [Edit] [✕]
     ├── 📄 1.2 Mô hình Von Neumann [Edit] [✕]
     └── ➕ Add subtopic
  📁 Chương 2: Cấu trúc dữ liệu & Giải thuật (File: Chuong_2.pdf) [Edit] [Delete]
     ├── 📄 2.1 Danh sách liên kết [Edit] [✕]
     ├── 📄 2.2 Bảng băm [Edit] [✕]
     └── ➕ Add subtopic
  ```
- Students can edit titles, add missing subtopics, delete unwanted sections, or add new chapters before final save.

### 5.3 Knowledge Tree View on Syllabus Page (`SyllabusPage.jsx`)
- Replaces flat topic list with an accordion/expandable **Knowledge Tree**:
  - **Header**: Course Mastery Card with overall progress bar, count of mastered chapters, and total subtopics.
  - **Chapter Cards**: Large frosted glass cards (`glass-card`) showing Chapter title, source file badge, completion pill (e.g. `3/5 DONE · 60%`), and a progress bar.
  - **Expand/Collapse**: Click to expand and view nested subtopics.
  - **Subtopic Item**: Clean interactive row with 3-state toggle pill (`TODO`, `DOING`, `DONE`), short summary, and quick link to create a deadline task.

---

## 6. Verification & Test Plan

1. **Backend Integration Tests (`api/test/`)**:
   - `test/syllabus/extractPdf.test.js`: Verify multi-file buffer extraction concatenates text while preserving source file boundaries.
   - `test/syllabus/analyzeSyllabus.test.js`: Verify Gemini schema validation for hierarchical chapters and subtopics.
   - `test/topics/topicRepo.test.js`: Verify parent-child creation, cascade deletion, and topic retrieval.
   - `test/topics/topics.routes.test.js`: Verify `POST /api/courses/:id/topics/bulk` handles nested chapters and subtopics in one transaction.
2. **Frontend Component & Integration Tests (`client/src/`)**:
   - `SyllabusUploadModal.test.jsx`: Verify multi-file dropzone, file removal chips, and multi-file payload dispatch.
   - `SyllabusPage.test.jsx`: Verify Chapter card rendering, subtopic checklist toggle, and optimistic chapter progress update.
3. **Regression Tests**:
   - Verify `FocusSubjectPicker.jsx` displays chapters and subtopics properly without crashing.
   - Verify existing tasks and timetable synchronization remain functional.

