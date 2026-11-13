# Luma — Student Focus & Study Hub 🌿
### *Academic Productivity & Schedule Engine*

[![Client Tests](https://img.shields.io/badge/Client_Tests-146%2F146_Passing-success?style=for-the-badge&logo=vitest&logoColor=white)](client)
[![API Tests](https://img.shields.io/badge/API_Tests-415%2F415_Passing-success?style=for-the-badge&logo=node.js&logoColor=white)](api)
[![Live App](https://img.shields.io/badge/Live_App-luma--sfsh.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://luma-sfsh.vercel.app)
[![OpenAPI](https://img.shields.io/badge/OpenAPI_3.0-Swagger_UI-85ea2d?style=for-the-badge&logo=swagger&logoColor=black)](https://sfsh-api.onrender.com/api-docs)

<p align="center">
  <img src="docs/screenshots/sfsh-banner.jpg" alt="Luma - Student Focus & Study Hub Banner" width="100%" />
</p>

> **Luma (Student Focus & Study Hub)** is a modern, high-performance academic productivity web application designed around university students' daily rhythms. It turns class schedules, course syllabi, and academic milestones into a unified study plan—reinforced by a Deep Focus Studio with ambient acoustic soundscapes, telemetry analytics, and explainable recommendations.

---

## 🌟 Key Capabilities

- **📅 Zero-Collision Timetable Engine:**
  - Import university schedules directly from Google Calendar `.ics` files.
  - Automatically resolves lecture times, laboratory blocks, and classroom locations (e.g., Room `E32`, `C206`, `B5.04`).
  - Supports schedule upserting, timetable replacement, and manual event clearing.
- **📖 Intelligent Syllabus & Topic Tree (AI Extractor):**
  - Interactive chapter tree breakdown with progressive mastery tracking (`TODO`, `DOING`, `DONE`).
  - NotebookLM-inspired AI syllabus extractor modal supporting `.pdf`, `.docx`, `.pptx`, and `.txt` uploads with preview & chapter reorganization.
  - Automatic normalization and deduplication of theory and practical classes (`.1`, `.2`, `.TH`).
- **🎯 Predictive Milestone & Deadline Radar:**
  - Priority queue flagging academic tasks as `OVERDUE`, `URGENT`, `SOON`, or `LATER` from the days left until their deadline.
  - Deterministic scoring algorithm factoring due dates, topic completion status, and active syllabus checkpoints.
- **🎧 Deep Focus Studio (Pomodoro & Sound Deck):**
  - Configurable focus and break timers (including custom minute durations) with session recovery across browser reloads.
  - **Proactive Milestone Completion:** Mark an active task or curriculum chapter as `DONE` directly on the card at any moment—automatically advancing the next milestone and resetting Study Sprints & timer back to Sprint 01 with a 528Hz harmonic chime.
  - **Mutually Exclusive Target Selection:** Cleanly switches focus between individual course assignments and curriculum chapters with zero UI collision.
  - Multi-layer ambient audio mixer (Rain, Forest, Waves, Campfire, Café) with Lofi music radio streams.
- **📊 Study Analytics & Dashboard:**
  - Focus minutes per day and per course, completed and overdue tasks, and a daily study streak.
  - Per-course progress from syllabus topics and tasks, plus search-as-you-type suggestions.
- **⚡ Bilingual Localization (EN / VI):**
  - 1-click language toggling between English (default) and Vietnamese across all navigation, modals, and widgets.
- **🌓 Adaptive Theme & GPU Optimization:**
  - Seamless Dark and Light theme switching with high-contrast translucent glassmorphic surfaces.
  - Viewport-gated GSAP animations that guarantee 60 FPS scrolling and preserve battery.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Client** | React 19, Vite, React Router 7, Tailwind CSS v4, GSAP 3 |
| **API Backend** | Node.js (v20+ LTS), Express 5, REST Architecture |
| **Database & ORM** | MySQL 8 (utf8mb4), Prisma ORM |
| **Authentication & Security** | JWT (24h token expiry), bcryptjs password hashing, Helmet, CORS |
| **Calendar & File Parser** | `node-ical` with recurrence expansion (`RRULE`, `EXDATE`, `INTERVAL`) |
| **AI Extraction Pipeline** | Google Gemini 2.5 Flash via `@google/genai` (structured JSON schema extraction) |
| **API Contract & Docs** | OpenAPI 3.0 specification served via interactive Swagger UI |
| **Deployment** | Docker (multi-stage build), Docker Compose, nginx (reverse proxy); Vercel / Render / Railway |
| **Testing Suite** | Vitest & React Testing Library (Client); Node test runner & Supertest (API) |

---

## 🚀 Getting Started & Setup Guide

You can run Luma either via **Docker Compose (Recommended - Fullstack in 1 Command)** or via **Manual Local Development** (Node.js + Vite).

---

### Option 1: Quick Start with Docker (Recommended)

Run the full stack (MySQL 8 + Express API + Client Nginx) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/Tunasss/Student-Focus-Study-Hub-SFSH.git
cd Student-Focus-Study-Hub-SFSH

# 2. Setup environment configuration
cp .env.docker.example .env

# 3. Build and launch all containers
docker compose up -d --build

# 4. Seed demo courses, timetable, deadlines & syllabus
docker compose --profile seed run --rm seed
```

#### Access Points:
- **Web Application:** [http://localhost:8080](http://localhost:8080)
- **API Swagger Documentation:** [http://localhost:8080/api-docs](http://localhost:8080/api-docs) (or [http://localhost:4000/api-docs](http://localhost:4000/api-docs))
- **Database (MySQL 8):** `localhost:3306` (`user: sfsh`, `password: sfsh_password`, `database: sfsh`)

---

### Option 2: Manual Local Development

#### Prerequisites
- **Node.js** (v20 LTS or higher) & **npm**
- **MySQL 8** (running locally on port 3306 or via `docker compose up -d mysql`)
- **Git**

---

#### Step 1: Backend API Setup (`api/`)

```bash
cd api
npm install

# Configure environment
cp .env.example .env
```

Ensure your `api/.env` contains your MySQL connection and JWT secret:
```env
DATABASE_URL="mysql://sfsh:sfsh_password@localhost:3306/sfsh?charset=utf8mb4"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=4000
CORS_ORIGINS="http://localhost:5173,http://localhost:8080"
SEED_USER_EMAIL="student@sfsh.dev"
SEED_USER_PASSWORD="Password123!"
```

Push schema migrations and seed demo data:
```bash
npm run db:deploy
npm run db:seed
```

Start the API development server:
```bash
npm run dev
```
- API Endpoint: `http://localhost:4000`
- Swagger UI Docs: `http://localhost:4000/api-docs`

---

#### Step 2: Frontend Client Setup (`client/`)

Open a new terminal window:
```bash
cd client
npm install

# Configure environment
cp .env.example .env
```

Default `VITE_API_URL` in `client/.env`:
```env
VITE_API_URL="http://localhost:4000"
```

Start the Vite development server:
```bash
npm run dev
```
- Client App: `http://localhost:5173`

---

## 🔑 Demo Credentials

After running the seed script, sign in immediately with the pre-configured demo student:
- **Email:** `student@sfsh.dev`
- **Password:** `Password123!`

*(You can also register a fresh account anytime via `/register`.)*

---

## 🧪 Verification & Test Suites

Both modules include comprehensive, automated test suites that run in CI on every push and pull request:

### Running Client Tests (146 tests across 25 suites)
```bash
cd client
npm run lint
npm test
```

### Running API Tests (415 tests across 98 suites)
```bash
cd api
npm run lint
npm test
```

### Building for Production
```bash
# Build Client (Vite)
cd client
npm run build

# Build Docker containers
docker compose build
```

### Running CI locally
Install [act](https://github.com/nektos/act) (`winget install nektos.act` or `brew install act`) with Docker running, then from the repo root:
```bash
act pull_request -j api       # or -j client, -j docker; no -j runs every job
```
See [CONTRIBUTING.md](CONTRIBUTING.md#running-ci-locally-with-act) for every job and troubleshooting.

---

## 📖 API Documentation (Swagger UI)

The API specification is strictly defined following OpenAPI 3.0 standards:
- **Interactive Swagger Documentation:** [https://sfsh-api.onrender.com/api-docs](https://sfsh-api.onrender.com/api-docs) (or local: `http://localhost:8080/api-docs` / `http://localhost:4000/api-docs`)
- **Raw OpenAPI YAML Specification:** [api/openapi.yaml](api/openapi.yaml)

Key endpoint groups include:
- `POST /api/auth/register` & `POST /api/auth/login`: User registration and JWT authentication.
- `GET /api/auth/me`: Authenticated user profile retrieval.
- `POST /api/schedule/import`: Multipart `.ics` calendar import with conflict resolution.
- `GET /api/schedule`: Weekly schedule retrieval with timezone conversion (`Asia/Ho_Chi_Minh`).
- `GET /api/courses`: User courses and schedule slots listing.
- `POST /api/syllabus/extract`: Syllabus PDF upload (up to 20 files, each ≤ 5 MB and ≤ 200 pages), text-layer extraction with a `PDF_NO_TEXT_LAYER` fallback for scanned files, then Gemini structured output (JSON schema + zod) returning the course code and ordered topics.
- `GET/POST /api/courses/:id/topics`, `POST /api/courses/:id/topics/bulk`, `PATCH/DELETE /api/topics/:id`: Syllabus topic persistence. The reviewed Gemini preview is saved in bulk (`order` → `sort_order`), and each topic's learning status (`TODO`/`DOING`/`DONE`), title and description can be edited.
- `GET/POST /api/tasks`, `PUT/PATCH/DELETE /api/tasks/:id`: Task (deadline) CRUD, scoped to the JWT user, validated with zod. Each task carries `daysLeft` and an `urgencyBadge` (`OVERDUE` / `URGENT` / `SOON` / `LATER`).
- `GET /api/recommendation/next-action`: Explainable "what next" recommendation scoring open tasks and upcoming classes.
- `GET/POST /api/sessions`: Focus (Pomodoro) session logging: start time, minutes, `COMPLETED`/`ABANDONED`, optionally linked to a course, topic or task.
- `GET /api/analytics/overview?range=7d|30d|all`: Dashboard summary: focus minutes, tasks completed, overdue tasks, current study streak, and per-course breakdown.
- `GET /api/analytics/daily-activity?range=7d|30d`: Zero-filled daily series (`focusMinutes`, `tasksCompleted`) for activity charts.
- `GET /api/search/suggest?q=`: Search-as-you-type suggestions across courses, tasks and topics.

---

## 👥 Development Team

| Member | Primary Responsibility |
|---|---|
| **Trần Anh Tuấn** | Frontend & UX: React client, Luma Green design system, Timetable, Syllabus, Focus Room, Task UI, GSAP animations, client deployment |
| **Lê Lữ Hương Giang** | Backend & Data: Express API, MySQL & Prisma schema, `.ics` calendar parsing, Gemini AI extraction pipeline, OpenAPI/Swagger specification, API deployment |

---

## 📄 License
This project is developed for academic purposes as part of the Web Application Development course. All rights reserved © 2026.
