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

`docker-compose.yml` in this folder starts **only MySQL** for local development. To run the whole stack
(MySQL + API + client) use the root `docker-compose.yml`; see [../DEPLOY.md](../DEPLOY.md).

## Docker image

`Dockerfile` builds a production image (Node 22 slim, Prisma client generated at build time, runs as `node`):

```bash
docker build -t sfsh-api .
docker run -p 4000:4000 -e DATABASE_URL="mysql://..." -e JWT_SECRET="..." sfsh-api
```

On start it runs `prisma migrate deploy`, then `node src/server.js`; set `RUN_MIGRATIONS=false` to skip migrations.
`HEALTHCHECK` polls `GET /api/health`. Seed demo data with `docker run --rm -e DATABASE_URL=... sfsh-api node prisma/seed.js`.

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
| `topics` | id, course_id, parent_id (nullable, chapter → subtopic), sort_order, title, description, source_file (nullable), status (TODO/DOING/DONE) |
| `tasks` | id, user_id, course_id, topic_id (nullable), title, due_at, status (TODO/DOING/DONE/OVERDUE), created_at, completed_at (nullable, WBS 3.4) |
| `sessions` | id, user_id, course_id?, topic_id?, task_id?, started_at, minutes, status (COMPLETED/ABANDONED) |

Indexes: `user_id` on courses/tasks/sessions, `(user_id, due_at)` and `due_at` on tasks, `topic_id` on tasks/sessions, `(user_id, started_at)` on sessions, `(user_id, completed_at)` on tasks, unique `(course_id, parent_id, sort_order)` and `parent_id` on topics.
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

## Recommendation (WBS 3.1)

### Score (WBS 3.1.1)

`src/recommend/score.js` is the pure math engine behind task recommendations; `src/recommend/recommendRepo.js`
(`scoreUserTasks(prisma, userId, { now })`) loads the caller's open tasks under Rule 06 scoping and ranks them with it.

```
days_left = ceil((due_at - now) / 24h)                 // src/tasks/urgency.js
eff_days  = max(days_left, 0)

score = 10 / (eff_days + 0.5)                          // base_urgency_score: 20 overdue or due now, 6.67 within 24h, 4 in 2 days
      + (topic.status == 'DOING' ? 5 : 2)              // topic_doing_bonus: 0 when the course has no topic to link
      + (is_overdue ? 3 : 0)                           // overdue_bonus: due_at < now and status != DONE
```

| Rule | Behaviour |
|---|---|
| `DONE` tasks | skipped entirely (`rankTasks` drops them, `scoreUserTasks` never loads them) |
| `topic_id` is `null` | scored against the course's first topic that is not `DONE` in syllabus order (chapters and their subtopics, by `sort_order`; lowest id on a tie). The link is computed for the score only and is **not** written to `tasks.topic_id`; the result flags it with `topicAutoLinked: true` |
| course without an open topic | topic term is `0` |

Each ranked entry is `{ task, topic, topicAutoLinked, score, daysLeft, effDays, isOverdue, breakdown: { baseUrgencyScore, topicDoingBonus, overdueBonus } }`;
`score` and `baseUrgencyScore` are rounded to 3 decimals.

### Tie-break and empty state (WBS 3.1.2)

Ranking is score descending, then the sooner `dueAt`, then the older `createdAt` (then the lower id, for rows created in the
same millisecond). When the user has **no open task**, `src/recommend/fallback.js` suggests a topic instead:

1. courses are ordered by their next class on the timetable (`expandSchedules` over the next 28 days, soonest first);
   courses with no upcoming class come after those with one, so a student without an `.ics` import still gets a topic;
2. the first course that has one gives its `DOING` topic, else its first `TODO` topic (syllabus order);
3. no course with an open topic → empty state.

### `GET /api/recommendation/next-action?tz=` (WBS 3.1.3)

Answers `{ kind, task, topic, topicAutoLinked, course, score, scoreBreakdown, nextClass, openTaskCount, reason }`;
the keys are always present and `null` when they do not apply, so the client only switches on `kind`:

| `kind` | When | Filled |
|---|---|---|
| `TASK` | at least one open task | `task` (same JSON as `/api/tasks`), `topic` `{ id, title, status }` (own or auto-linked), `course`, `score`, `scoreBreakdown` `{ baseUrgencyScore, topicDoingBonus, overdueBonus }`, `openTaskCount` |
| `TOPIC` | no open task, some open topic | `topic`, `course`, `nextClass` (a `ClassOccurrence` in `tz`, or `null` without a timetable) |
| `EMPTY` | nothing to suggest | only `reason` |

`reason` is a one-sentence explanation for the demo, e.g.
`Top of 4 open task(s): overdue by 1 day(s) (+20), on "Chương 2: SQL Basics", in progress (+5), overdue bonus (+3) = 28.`
The PRD names the fields `due_at` and `score_breakdown { base_urgency_score, topic_doing_bonus, overdue_bonus }`; the JSON uses
the API's camelCase spelling. `tz` must be an IANA timezone (`400 VALIDATION_ERROR` otherwise) and only affects the local
`nextClass.start` / `nextClass.end` strings.

### Tests (WBS 3.1.4)

`npm test` (Node test runner, see WBS 2.4a.4). Suites live in `test/recommend/`, all with a fixed clock:

| File | Covers |
|---|---|
| `mandatory.test.js` | the five mandatory cases, run through the whole algorithm (`scoreUserTasks` → `nextAction`): **1** deadline in 2 days on a DOING topic (4 + 5 = 9), **2** overdue task (20 + 3, outranks everything), **3** `topic_id = null` (auto-link to the first open topic for +2 / +5, 0 without topics, link not persisted), **4** equal scores (sooner `dueAt`, then older `createdAt`), **5** no open task (DOING / first TODO topic of the course with the nearest class, else empty state) |
| `score.test.js` | every term of the formula, syllabus-order auto-link, ranking and tie-break on pure data |
| `recommendRepo.test.js` | Rule 06 scoping, DONE tasks skipped, link not written back |
| `fallback.test.js` | next class per course, DOING-then-TODO choice, courses without a timetable, empty state |
| `nextAction.routes.test.js` | `GET /api/recommendation/next-action` for all three kinds, `tz`, 400 / 401, Rule 06 |

## Study analytics, session logging and search suggestions (WBS 3.4)

### Data (migration `20261112000000_task_completed_at`)

`tasks.completed_at` records when a task was finished. The server sets it when a task moves to `DONE` (create or
update), keeps it while the task stays `DONE` and clears it when the task is reopened; clients cannot send it.
Tasks finished before this migration keep `completed_at = NULL`, so they only count in `range=all`.
The JSON `Task` has a matching `completedAt`.

### Session logging

| Method | Path | Notes |
|---|---|---|
| POST | `/api/sessions` | `{ startedAt, minutes (1–240), status = COMPLETED \| ABANDONED, courseId?, topicId?, taskId? }` → 201 `{ session }` |
| GET | `/api/sessions?from=&to=&course_id=&status=&limit=50` | newest first, `limit` ≤ 200 |

A task fills in its course and topic, a topic fills in its course. Another user's course / topic / task is
`404 NOT_FOUND`; links that disagree are `400 VALIDATION_ERROR`; `startedAt` may be at most 5 minutes in the future.
Code: `src/sessions/`, `src/routes/sessions.js`.

### Metrics engine (WBS 3.4.1, 4.1.1) and endpoints (WBS 3.4.2, 4.1.2)

`src/analytics/metrics.js` holds the pure math, `src/analytics/analyticsRepo.js` runs the queries (all through
`byUser()` / `byCourseOwner()`, Rule 06), `src/routes/analytics.js` validates the query with zod.
Per-course focus minutes and topic / task counts are aggregated by MySQL (`groupBy` on `course_id[, status]`),
and the overview's task totals use `COUNT`. The daily series and the streak still load session / task timestamps,
because a calendar day depends on the client's `tz` (SQL `DATE(started_at)` would bucket by UTC day).

- **Focus time**: sum of `COMPLETED` sessions in the range; sessions without a course count in the total only.
- **Progress**: `progressPct = floor(completedItems * 100 / totalItems)` over a course's topics + tasks
  (`DONE` = completed), `0` when the course has none. Integer maths, so 57 / 100 is 57, not 56.
  `taskProgressPct = floor(completedTasks * 100 / totalTasks)` is the same over tasks only (WBS 4.1.1).
- **Streak**: consecutive local days with a `COMPLETED` session back from today. Still alive if the last
  study day was yesterday; a missed day resets it (0, or 1 if the student studied today).
- **Days** are calendar days in `tz` (IANA, default `UTC`): `7d` = today and the 6 days before. All timestamps are
  stored and returned in UTC; the client displays them in local time and should send its browser zone as `tz` so
  the daily buckets, "today" and the streak follow the user's local days.

| Endpoint | `data` |
|---|---|
| `GET /api/analytics/overview?range=7d\|30d\|all&tz=` | `{ range, tz, from, to, totalFocusMinutes, completedTasksCount, overdueTasksCount, currentStreakDays, courseBreakdown: [{ courseId, courseCode, courseName, focusMinutes, completedItems, totalItems, progressPct, completedTasks, totalTasks, taskProgressPct }] }` |
| `GET /api/analytics/chart-activity?days=7\|30&tz=` | `[{ date, focusMinutes, tasksCompleted }]` (the array is `data`), zero-filled, oldest first, today last |
| `GET /api/analytics/daily-activity?range=7d\|30d&tz=` | `{ range, tz, days: [{ date, focusMinutes, tasksCompleted }] }`, the same series with its range |

`overdueTasksCount` is "right now" (open tasks that are `OVERDUE` or past `dueAt`), whatever the range;
`progressPct` is all-time. A user without data gets zeros and an empty `courseBreakdown`, never 404. Field names
are camelCase like the rest of the API (PRD: `total_focus_minutes`, `course_breakdown[].progress_pct`, …).

### Search suggestions

`GET /api/search/suggest?q=dat&limit=8` (limit ≤ 20) → `{ query, suggestions: [{ type: COURSE|TASK|TOPIC, id,
label, courseId, courseCode, courseName, status, dueAt }] }`. MySQL filters with `contains` (the `utf8mb4_unicode_ci`
collation ignores case and accents); results are ranked exact → prefix → word prefix → substring, then shorter labels,
then courses, tasks, topics. Code: `src/search/suggest.js`.

### Tests (WBS 3.4.3, 4.1.3)

| File | Covers |
|---|---|
| `test/analytics/chart-activity.test.js` | zero-fill on a fixed clock (month boundary, 30 days without gaps, local vs UTC day), `days` / `tz` validation (400), empty state, tenant isolation, 401 |
| `test/analytics/mandatory.test.js` | the four PRD cases over HTTP: empty-state user, multi-course aggregation (exact `progressPct`, ranges, abandoned / free-focus sessions), streak continuity & reset, tenant isolation |
| `test/analytics/metrics.test.js` | progress formula (every ratio up to 200 items, 10,000 tasks over 40 courses), GROUP BY helpers, streak edge cases (month / leap year), timezone day boundaries, zero-filled series |
| `test/analytics/analytics.routes.test.js` | defaults, 400 `VALIDATION_ERROR` for bad `range` / `tz`, completed and overdue task counts, daily series |
| `test/sessions/sessions.routes.test.js` | logging, link resolution, 404 for other users' rows, validation, listing filters |
| `test/search/suggest.test.js` | ranking, diacritics, course codes, Rule 06, validation |
| `test/tasks/completedAt.test.js` | `completed_at` follows the status |

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
