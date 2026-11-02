# Student Focus & Study Hub (SFSH) 🌿
### *Luma Academic Productivity & Schedule Engine*

[![Client Tests](https://img.shields.io/badge/Client_Tests-31%2F31_Passing-success?style=for-the-badge&logo=vitest&logoColor=white)](client)
[![API Tests](https://img.shields.io/badge/API_Tests-75%2F75_Passing-success?style=for-the-badge&logo=node.js&logoColor=white)](api)
[![Design System](https://img.shields.io/badge/Design_System-Urbanist_%26_Green_%23DBEF90-10b981?style=for-the-badge)](docs/screenshots/design-system.png)
[![OpenAPI](https://img.shields.io/badge/OpenAPI_3.0-Swagger_UI-85ea2d?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:4000/api-docs)

> **SFSH (Student Focus & Study Hub)** is a modern, high-performance academic productivity web application designed around students' daily rhythms. It turns class schedules, course syllabi, and academic milestones into a unified study plan—reinforced by a Pomodoro Focus Studio with ambient soundscapes and telemetry analytics.

---

## 📸 Visual Showcase & Interface Demo

### 1. Overview Dashboard
Real-time academic telemetry, 7-day study pace chart, priority deadlines queue, and quick actions.
![Overview Dashboard](docs/screenshots/overview-dashboard.png)

### 2. Class Schedule & Rooms (Weekly Timetable)
Monday-to-Sunday interactive calendar, course code tags, GMT+7 grid, room locations, and 1-click `.ics` calendar sync.
![Weekly Timetable](docs/screenshots/weekly-timetable.png)

### 3. Deep Focus Studio (Pomodoro & Ambient Soundscapes)
High-intensity 25-minute focus sprints, reload-persistent state, radiant glow, and dynamic acoustic equalizers.
![Deep Focus Studio](docs/screenshots/focus-studio.jpg)

### 4. Core Engine Features
Zero-Collision Timetable Engine, Dynamic Equalizer & Pomodoro, and Predictive Milestone Radar.
![Core Features](docs/screenshots/feature-cards.jpg)

### 5. Design System & Typography
Crafted with the **Urbanist** typography font family and high-contrast, nature-inspired green accents (`#243100` deep olive and `#DBEF90` radiant lime).
![Design System](docs/screenshots/design-system.png)

---

## 🌟 Key Capabilities

- **📅 Zero-Collision Timetable Engine:**
  - Import university schedules directly from Google Calendar `.ics` files.
  - Automatically resolves lecture times, laboratory blocks, and classroom locations (e.g., Room `E32`, `C206`, `B5.04`).
  - Supports schedule upserting, timetable replacement, and manual event clearing.
- **🎯 Predictive Milestone & Deadline Radar:**
  - Real-time priority queue flagging tasks as `CRITICAL`, `WARNING`, `SOON`, or `LATER`.
  - Explanatory scoring algorithm based on due dates, topic completion status, and active syllabus checkpoints.
- **🎧 Deep Focus Studio (Pomodoro):**
  - Configurable focus and break timers with active session recovery across browser reloads.
  - 432Hz binaural resonance and ambient acoustic audio equalizer.
- **⚡ Bilingual Localization (EN / VI):**
  - Complete 1-click language toggling between English (default) and Vietnamese across all navigation, modals, and widgets.
- **🌓 Adaptive Theme & GPU Optimization:**
  - Seamless Dark and Light theme switching with high-contrast translucent surfaces.
  - Viewport-gated GSAP animations that automatically pause off-screen to preserve GPU resources and guarantee 60 FPS scrolling.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Client** | React 19, Vite, React Router 7, Zustand, Tailwind CSS v4, GSAP 3 |
| **API Backend** | Node.js (LTS), Express 5, REST Architecture |
| **Database & ORM** | MySQL 8 (utf8mb4), Prisma ORM |
| **Authentication & Security** | JWT (24h token expiry), bcryptjs password hashing, Helmet, CORS |
| **Calendar Parser** | `node-ical` with recurrence expansion (`RRULE`, `EXDATE`, `INTERVAL`) |
| **API Contract & Docs** | OpenAPI 3.0 specification served via interactive Swagger UI |
| **Testing Suite** | Vitest & React Testing Library (Client); Node test runner & Supertest (API) |

---

## 🚀 Getting Started & Setup Guide

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v20 LTS or higher) and **npm**
- **MySQL 8** (running locally or via Docker)
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Tunasss/Student-Focus-Study-Hub-SFSH.git
cd Student-Focus-Study-Hub-SFSH
```

---

### Step 2: Backend API Setup (`api/`)

1. **Navigate to the API folder and install dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure your `.env` contains:
   ```env
   DATABASE_URL="mysql://sfsh:sfsh_password@localhost:3306/sfsh?charset=utf8mb4"
   JWT_SECRET="your-secure-jwt-secret-key"
   PORT=4000
   CORS_ORIGINS="http://localhost:5173"
   SEED_USER_EMAIL="student@sfsh.dev"
   SEED_USER_PASSWORD="Password123!"
   ```

3. **Start MySQL (Docker Optional):**
   If using Docker, start the MySQL container:
   ```bash
   npm run db:up
   ```

4. **Deploy Database Schema and Seed Demo Data:**
   ```bash
   npm run db:deploy
   npm run db:seed
   ```

5. **Start the API Server:**
   ```bash
   npm run dev
   ```
   The API will start at: `http://localhost:4000`  
   Swagger UI API Documentation: `http://localhost:4000/api-docs`

---

### Step 3: Frontend Client Setup (`client/`)

1. **Open a new terminal, navigate to the client folder and install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Ensure your `.env` contains:
   ```env
   VITE_API_URL="http://localhost:4000"
   ```

3. **Start the Frontend Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:5173`

---

## 🔑 Demo Credentials

After running `npm run db:seed`, you can immediately sign in with the pre-seeded account:
- **Email:** `student@sfsh.dev`
- **Password:** `Password123!`

*(You can also use `admin@example.com` / `Password123!` or create a new account via the `/register` page.)*

---

## 🧪 Verification & Test Suites

Both the API and Client include comprehensive automated test suites:

### Running API Tests
```bash
cd api
npm run lint
npm test
```
*Result: 75/75 tests passing (Authentication, Calendar Ingestion, Recurrence Expansion, Scope Security, OpenAPI validation).*

### Running Client Tests
```bash
cd client
npm run lint
npm test
```
*Result: 31/31 tests passing (Theme toggling, Timetable rendering & replacement, Bilingual EN/VI navigation, Authentication flows).*

### Production Build
```bash
cd client
npm run build
```

---

## 📖 API Documentation (Swagger UI)

The API specification is strictly defined following OpenAPI 3.0 standards:
- **Interactive Swagger Documentation:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **Raw OpenAPI YAML Specification:** [api/openapi.yaml](api/openapi.yaml)

Key endpoint groups include:
- `POST /api/auth/register` & `POST /api/auth/login`: User registration and JWT authentication.
- `GET /api/auth/me`: Authenticated user profile retrieval.
- `POST /api/schedule/import`: Multipart `.ics` calendar import with conflict resolution.
- `GET /api/schedule`: Weekly schedule retrieval with timezone conversion (`Asia/Ho_Chi_Minh`).
- `GET /api/courses`: User courses and schedule slots listing.

---

## 👥 Development Team

| Member | Primary Responsibility |
|---|---|
| **Trần Anh Tuấn** | Frontend & UX: React client, Luma Green design system, Timetable, Focus Room, UI/UX reskin, GSAP animations, client deployment |
| **Lê Lữ Hương Giang** | Backend & Data: Express API, MySQL & Prisma schema, `.ics` calendar parsing, OpenAPI/Swagger specification, API deployment |

---

## 📄 License
This project is developed for academic purposes at the University as part of the Web Application Development course. All rights reserved © 2026.
