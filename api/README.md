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

## Seed contents

- 1 demo student
- 4 courses with weekly schedules (as imported from ICS): CS101, MATH201, PHY110, ENG102
- CS101 syllabus with 5 chapters (2 DONE, 1 DOING, 2 TODO)
- 2 deadlines: one due in ~20h, one due in ~4 days
- 1 OVERDUE task (due 2 days ago)
- 10 Pomodoro sessions over the last 7 days (8 COMPLETED, 2 ABANDONED)
