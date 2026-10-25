# Student Focus & Study Hub

A student productivity web application that turns class schedules, course syllabi, and deadlines into an explainable study plan—then helps students follow that plan with a Pomodoro Focus Room and study analytics.

> **Project status:** Initial project setup. The repository is being prepared as a monorepo; application features and local run scripts are not available yet.

## Project Overview

Students often manage their schedules, course materials, deadlines, and study sessions in separate tools. Student Focus & Study Hub (SFSH) brings these workflows together:

1. Import a weekly timetable from a Google Calendar `.ics` file.
2. Upload a course syllabus as a PDF and review suggested topics.
3. Organize topics and manage tasks with deadline urgency badges.
4. Get a deterministic, explainable recommendation for what to study next.
5. Focus in a Pomodoro room with ambient audio.
6. Review study time and task completion in an analytics dashboard.

## Planned Features

- **Authentication:** Register and sign in with JWT-based authentication.
- **Timetable:** Import calendar events and view a Monday–Sunday weekly schedule.
- **Syllabus and topics:** Extract proposed topics from a PDF with Gemini, review them, and track progress as `TODO`, `DOING`, or `DONE`. Manual entry is available as a fallback.
- **Tasks and deadlines:** Create, update, delete, and filter tasks. Show `OVERDUE`, `URGENT`, `SOON`, and `LATER` badges.
- **Study recommendation:** Rank eligible tasks using a deterministic score and return a score breakdown explaining the recommendation.
- **Pomodoro Focus Room:** Run configurable focus and break sessions, restore a session after reload, and optionally log completed or sufficiently long abandoned sessions.
- **Ambient audio:** Mix up to three local audio tracks with independent volume controls.
- **Analytics:** Summarize focus time by course and weekday, total focus hours, and task completion rate.
- **API documentation:** Publish an OpenAPI 3 specification through Swagger UI.

## Technology Stack

| Area | Technology |
|---|---|
| Client | React, Vite, React Router, Zustand, Tailwind CSS |
| API | Node.js, Express, REST |
| Database | MySQL 8, Prisma ORM |
| Validation and security | Zod, JWT, bcrypt, Helmet, CORS, rate limiting |
| Calendar import | `node-ical` |
| PDF text extraction | `pdf-parse` (text layer only; no OCR) |
| Syllabus suggestions | Google Gemini API, with mock and manual-input fallbacks |
| Charts | Recharts |
| Tests | Jest and Supertest (API); Vitest (client) |
| API specification | OpenAPI 3 and Swagger UI |
| Planned hosting | Vercel (client); Render or Railway (API); hosted MySQL |

The application is planned as a single repository with separate `api/` and `client/` applications.

## Repository Layout

The target layout is:

```text
.
├── api/                    # Express API, Prisma schema/migrations, tests and seed
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   ├── openapi.yaml
│   └── .env.example
├── client/                 # React application
│   ├── public/audio/       # Local ambient audio assets
│   └── src/
├── docs/                   # Project and submission documents
├── .github/workflows/      # CI workflows
├── .gitignore
└── README.md
```

Directories and scripts will be added as implementation begins.

## Getting Started

### Prerequisites

The planned local development environment requires:

- Node.js (LTS) and npm
- MySQL 8
- Git
- A Gemini API key only if testing live syllabus extraction; development should also support mock mode

### Setup

The application has not been scaffolded yet, so installation and run commands are not available at this stage. Once the `api/` and `client/` applications are in place, their setup instructions, environment variables, database migration commands, and development scripts will be documented here.

Do not commit real credentials or `.env` files. Use the committed `.env.example` files as templates when they are added.

## API

The API will use a consistent response envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2026-10-23T09:19:00Z"
}
```

Errors will include a stable error code and a readable message. The planned public API documentation will be available at `/api-docs` when the API is deployed.

Planned endpoint groups include:

- Authentication (`/api/auth`)
- Courses and schedules (`/api/courses`, `/api/schedule`)
- Syllabus extraction and topics (`/api/syllabus`, `/api/topics`)
- Tasks (`/api/tasks`)
- Next-study recommendation (`/api/recommendation/next-action`)
- Pomodoro session logging (`/api/pomodoro/log`)
- Analytics (`/api/analytics/summary`)

The API contract will be maintained in `api/openapi.yaml` as implementation progresses.

## Recommendation Rules

Recommendations are designed to be deterministic and explainable. Completed tasks are excluded. For an eligible task:

```text
eff_days = max(days_left, 0)
score = 10 / (eff_days + 0.5) + topic_bonus + overdue_bonus
```

- `topic_bonus` is `5` for a linked `DOING` topic, `2` for another linked topic, or `0` when no applicable topic exists.
- `overdue_bonus` is `3` for an overdue task; otherwise it is `0`.
- Ties are resolved by earlier due date, then earlier creation time.

The API will return a score breakdown so students can understand why an item was recommended. If there are no open tasks, the application will suggest an available topic from the course with the nearest class, or show an empty state.

## Data and Security Principles

- Every user-owned database query must be scoped to the authenticated `user_id`.
- A user must not be able to access another user's resources.
- Passwords are stored as bcrypt hashes; access tokens are planned to expire after 24 hours.
- Uploads are restricted by file type, size, and request rate.
- Gemini credentials and other secrets belong only in backend environment variables.
- Syllabus suggestions are validated and shown for user review before any topics are saved.
- PDF processing reads embedded text only; scanned documents use the manual-entry fallback.

## Development Plan

The project is planned in three stages:

1. **Foundation and timetable:** Monorepo setup, database, authentication, API documentation, calendar import, weekly schedule, and task API.
2. **Syllabus and recommendations:** PDF/Gemini workflow, topic management, task UI, recommendation engine, and ambient audio controls.
3. **Focus and delivery:** Pomodoro sessions, session logging, analytics, integration testing, demo seed, deployment, and presentation materials.

The application is considered ready for a feature when its acceptance criteria are met, relevant logic has tests, loading/empty/error states are handled, and the endpoint is documented.

## Git Workflow

- Keep `main` stable; do development on feature branches such as `feat/1.1-database-schema` or `feat/2.1-weekly-timetable`.
- Use small pull requests and have the other team member review before merging.
- Prefer Conventional Commit prefixes such as `feat:`, `fix:`, and `test:`.
- Coordinate changes to shared files, including the root README, CI configuration, and OpenAPI contract.

## Team

| Member | Primary responsibility |
|---|---|
| Trần Anh Tuấn | Frontend and UX: React client, design, timetable and task interfaces, Focus Room, analytics UI, and client deployment |
| Lê Lữ Hương Giang | Backend and data: MySQL/Prisma, Express API, imports, recommendation logic, API documentation, and API deployment |
| Both | API contract, integration, testing, demo preparation, and final submission |

## Project Repository

- GitHub: <https://github.com/Tunasss/Student-Focus-Study-Hub-SFSH>

Live application, API base URL, and Swagger documentation links will be added after deployment.
