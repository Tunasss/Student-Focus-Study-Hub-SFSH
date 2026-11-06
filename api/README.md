# SFSH API — Database (WBS 1.1)

MySQL 8 (utf8mb4) + Prisma ORM.

## Setup

```bash
cd api
npm install
cp .env.example .env          # edit DATABASE_URL if needed
npm run db:up                 # start MySQL 8 via Docker (or use your own MySQL 8)
npm run db:deploy             # apply migrations
npm run db:seed               # create demo data
```

During development, after changing `prisma/schema.prisma`, run `npm run db:migrate` to create a new migration.
`npm run db:reset` drops the database, re-applies all migrations and re-runs the seed.

Demo account: `student@sfsh.dev` / `Password123!` (override with `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`).

## API docs (WBS 1.4)

The OpenAPI 3.1 spec is `openapi.yaml`, and it documents every endpoint. With the API running:

- Swagger UI: `http://localhost:4000/api-docs` (public). Log in with `POST /api/auth/login`, copy `data.token`, then click **Authorize**.
- Raw spec: `http://localhost:4000/api-docs/openapi.yaml`

Every response uses the Rule 02 envelope (`src/envelope.js`):

```json
{ "success": true,  "data": { },  "error": null, "timestamp": "2026-10-25T00:00:00.000Z" }
{ "success": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "..." }, "timestamp": "..." }
```

Send success bodies with `res.json(ok(payload))`, and throw `ApiError` for errors. `test/openapi.test.js` fails in two cases: when a route is added without being documented in `openapi.yaml`, or when a response doesn't match its documented schema.

## Tables

| Table | Key columns |
|---|---|
| `users` | id, email (unique), password_hash, created_at |
| `courses` | id, user_id, code (nullable), name |
| `schedules` | id, course_id, day_of_week (1=Mon…7=Sun), start_time, end_time, location, tz, recurrence_until |
| `topics` | id, course_id, sort_order, title, description, status (TODO/DOING/DONE) |
| `tasks` | id, user_id, course_id, topic_id (nullable), title, due_at, status (TODO/DOING/DONE/OVERDUE), created_at |
| `sessions` | id, user_id, course_id?, topic_id?, task_id?, started_at, minutes, status (COMPLETED/ABANDONED) |

Indexes: `user_id` on courses/tasks/sessions, `(user_id, due_at)` and `due_at` on tasks, `topic_id` on tasks/sessions, `(user_id, started_at)` on sessions, unique `(course_id, sort_order)` on topics.
`sort_order` is used instead of the MySQL reserved word `ORDER`.

## Rule 06 — always scope by user_id

Build `where` clauses with `src/db/scope.js`:

```js
const { prisma } = require('./src/db/client');
const { byUser, byCourseOwner } = require('./src/db/scope');

prisma.task.findMany({ where: byUser(userId, { status: 'TODO' }) });       // courses, tasks, sessions
prisma.topic.findMany({ where: byCourseOwner(userId, { courseId }) });     // schedules, topics
```

Both throw if `userId` is missing or invalid.

## Tasks data layer (WBS 2.4a.1)

`src/tasks/taskRepo.js` is the only place that reads or writes the `tasks` table. Every query goes through `byUser(req.userId, …)`,
so a task, course or topic that belongs to another user is answered with `404 NOT_FOUND` (never 403, so ids are not enumerable).
`course_id` must be one of the caller's courses and `topic_id` (optional) must be a topic of that course.
The list uses the `(user_id, due_at)` index; `due_at` alone is indexed for deadline scans. Both exist since the WBS 1.1 migration.

## Tasks API (WBS 2.4a.2)

All routes need `Authorization: Bearer <jwt>`. JSON fields are camelCase (`dueAt`, `courseId`, `topicId`);
the query filters follow the PRD (`course_id`, `status`; `courseId` is accepted as an alias).

| Method | Route | Body | Result |
|---|---|---|---|
| `GET` | `/api/tasks?course_id=&status=` | — | `{ tasks: [Task] }`, soonest `dueAt` first |
| `POST` | `/api/tasks` | `{ title, dueAt, courseId, topicId?, status? }` | `201 { task }` |
| `PUT` | `/api/tasks/:id` | full body as for `POST` (omitted `topicId` → `null`, `status` → `TODO`) | `{ task }` |
| `PATCH` | `/api/tasks/:id` | any subset, e.g. `{ "status": "DONE" }` | `{ task }` |
| `DELETE` | `/api/tasks/:id` | — | `{ id }` |

Validation uses zod (`src/tasks/schemas.js`, `src/validation.js`): a missing or malformed field answers
`400 VALIDATION_ERROR` with a message naming the field (`dueAt: must be an ISO-8601 date-time with timezone, …`).
Unknown body keys (for example `due_at`) are rejected. `dueAt` must carry an offset or `Z`, e.g. `2026-11-20T23:59:00+07:00`.

### Urgency badge and `daysLeft` (WBS 2.4a.3)

Every task in a response carries two computed fields (`src/tasks/urgency.js`, applied in `src/tasks/serialize.js`).
They are derived from the server clock at request time and never stored:

```
daysLeft = ceil((dueAt - now) / 24h)        // 0 = due within the day, negative = overdue
```

| `urgencyBadge` | Rule |
|---|---|
| `OVERDUE` | `dueAt < now` and `status != DONE` |
| `URGENT` | `daysLeft < 3` |
| `SOON` | `3 <= daysLeft <= 7` |
| `LATER` | `daysLeft > 7` |
| `null` | `status == DONE` (a finished task has no urgency) |

The PRD names these `days_left` / `urgency_badge`; the JSON uses the API's camelCase spelling.

### Tests (WBS 2.4a.4)

`npm test` runs the Node test runner (`node --test`, the project's runner since WBS 1.2; the PRD says Jest, but no Jest is installed and
CI runs `npm test`). Tasks-related suites live in `test/tasks/`:

| File | Covers |
|---|---|
| `urgency.test.js` | `daysLeft` and `urgencyBadge` at the 0, 2, 3, 7 and 8 day marks, rounding at the boundaries, overdue and `DONE` tasks, with a fixed clock |
| `validation.test.js` | zod schemas for body, query and path params; `VALIDATION_ERROR` / `INVALID_JSON` envelopes over HTTP |
| `taskRepo.test.js` | Rule 06 scoping: cross-user access is `404`, course and topic ownership checks |
| `tasks.routes.test.js` | the five endpoints end to end against the in-memory Prisma stand-in (`test/helpers.js`) |

## Syllabus PDF extraction (WBS 2.2.1)

`POST /api/syllabus/extract` (multipart field `file`) reads the text layer of a syllabus PDF with `pdf-parse`
(`src/syllabus/extractPdf.js`) and returns `{ fileName, pageCount, charCount, text, pages: [{ page, text }] }`.

| Check | Limit | Error |
|---|---|---|
| extension, `%PDF-` header, field name | `.pdf` in field `file` | `400 INVALID_PDF_FORMAT` |
| size (multer + explicit check) | ≤ 5 MB | `400 INVALID_PDF_FORMAT` |
| pages (checked before extracting text) | ≤ 200 | `400 PDF_TOO_MANY_PAGES` |
| corrupt or password-protected file | — | `400 INVALID_PDF_FORMAT` |
| text layer (scanned PDF fallback) | ≥ 200 non-whitespace characters | `422 PDF_NO_TEXT_LAYER`, message points to the manual entry form |

Uploads for `.ics` and `.pdf` share `src/middleware/upload.js`. Test PDFs are generated by `test/fixtures/makePdf.js`,
so no binary fixtures are committed.

### Gemini structured output (WBS 2.2.2)

After extraction, `src/syllabus/analyzeSyllabus.js` sends the text to Gemini (`@google/genai`, model `GEMINI_MODEL`,
default `gemini-2.5-flash`) with `responseMimeType: "application/json"` and the fixed `responseSchema` from
`src/syllabus/geminiSchema.js` (`course_code`, `topics[{ order, title, description }]`, PRD sample with upper-case `Type`s).
The reply is parsed and validated with zod (`syllabusOutputSchema`), then topics are sorted by `order`, de-duplicated by
title and renumbered from 1. The response adds `courseCode` and `topics` to the extraction payload.

The client is injected into `createApp({ prisma, gemini })`; tests use `createFakeGemini()` from `test/helpers.js`
and never call the network. Set `GEMINI_API_KEY` in `.env` (see `.env.example`) to use the real model.

### Resilience, mock mode and LLM errors (WBS 2.2.3)

| Situation | Behaviour |
|---|---|
| `LLM_MOCK=true` | Gemini is never called: `src/llm/mockGemini.js` answers with a fixed 5-chapter sample (`source: "mock"`). Works without an API key; for UI work and offline tests |
| reply is not JSON or fails the zod schema | retried **once** (the retry prompt quotes the problem), then `502 LLM_SCHEMA_INVALID` |
| Gemini HTTP 429 (quota), connection lost, key rejected | `503 LLM_UNAVAILABLE` at once, **no retry**: the web UI should open the manual entry form |
| `GEMINI_API_KEY` not set and `LLM_MOCK` not set | `503 LLM_NOT_CONFIGURED` (the server still boots and logs a warning) |
| valid reply with no topics | `422 SYLLABUS_NO_TOPICS`, message points to the manual entry form |

Every failure is a Rule 02 error envelope; the process never crashes on an AI problem (unexpected exceptions still go
through `errorHandler` as `500 INTERNAL_ERROR`). Successful responses carry `source: "gemini" | "mock"`.



- 1 demo student
- 4 courses with weekly schedules (as imported from ICS): CS101, MATH201, PHY110, ENG102
- CS101 syllabus with 5 chapters (2 DONE, 1 DOING, 2 TODO)
- 2 deadlines: one due in ~20h, one due in ~4 days
- 1 OVERDUE task (due 2 days ago)
- 10 Pomodoro sessions over the last 7 days (8 COMPLETED, 2 ABANDONED)

## Topics API (WBS 2.2.4)

The Gemini preview from `POST /api/syllabus/extract` is never stored automatically. The user reviews and edits it on
the web, then the client saves the confirmed list. Data access is `src/topics/topicRepo.js` (scoped through the
course with `byCourseOwner`, so another user's course or topic is `404 NOT_FOUND`); validation is `src/topics/schemas.js`.

| Method | Route | Body | Result |
|---|---|---|---|
| `GET` | `/api/courses/:id/topics` | — | `{ topics: [Topic] }` in `sortOrder` |
| `POST` | `/api/courses/:id/topics` | `{ title, description?, status?, sortOrder? }` | `201 { topic }`; `409 SORT_ORDER_TAKEN` if the position is used |
| `POST` | `/api/courses/:id/topics/bulk` | `{ topics: [{ order \| sortOrder, title, description?, status? }] }` | `201 { topics, replaced }` |
| `PATCH` | `/api/topics/:id` | any of `{ title, description, status }` | `{ topic }` |
| `DELETE` | `/api/topics/:id` | — | `{ id }` |

`order` in the Gemini JSON (or `sortOrder` from the client) is stored in the `sort_order` column (`order` is a reserved
word in SQL). Bulk save runs in one transaction: items are sorted by their position and renumbered 1..n, the course's
previous topics are replaced, and the learning status of a topic with the same title (case-insensitive) is carried over.
Tasks / sessions that referenced a removed topic keep `topic_id = null` (`ON DELETE SET NULL`). Topic status is
`TODO | DOING | DONE` (no `OVERDUE`; deadlines live on tasks).
