# AlumniConnect

> A full-stack alumni engagement platform where **students**, **alumni** and
> **administrators** connect through a shared alumni directory, job board,
> mentorship programme and event calendar.

AlumniConnect is a complete MERN (MongoDB, Express, React, Node.js) application
built as a final-year / capstone style project. It ships with a production-style
REST API, a role-aware React single page application, an automated test suite and
a demo data seeder so the whole platform can be explored in a few minutes.

---

## Table of contents

- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Demo accounts](#demo-credentials)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [API at a glance](#api-overview)
- [Security model](#security-model)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

---

## Features

### Public (no account required)
- Marketing landing page with live platform statistics, featured alumni and
  testimonials.
- Browse published events and event details.
- Read published announcements.
- Sign up, sign in and password recovery screens.

### Student

- Personalised dashboard (application pipeline, mentorship activity, upcoming events).
- Editable student profile with **profile photo** and **resume (PDF)** upload.
- Search the **alumni directory** and open detailed alumni profiles.
- Browse the **job board**, view job details and **apply with a resume + cover letter**.
- Track every application and **withdraw** pending ones.
- Find mentors, send **mentorship requests**, and track their status.
- Browse and **register for events**.

### Alumni

- Dashboard with job posting performance, applications received and mentorship load.
- Editable alumni profile (education, work experience, skills, mentorship areas).
- Browse the alumni directory.
- **Post job opportunities** (subject to administrator approval) and manage them.
- Review **applicants per job** and update application status
  (`under review`, `shortlisted`, `accepted`, `rejected`).
- Accept / reject / complete **mentorship requests** with meeting details.
- Browse and register for events.

### Administrator

- Platform-wide dashboard with charts (users, applications, mentorship, registrations).
- **Approve or reject alumni registrations** with a review reason.
- **Approve or reject job postings** with a rejection reason.
- User management (search, filter, activate / deactivate / suspend accounts).
- Event management (create, update, publish, cancel).
- Mentorship monitoring across the platform.
- Publish **announcements** targeted at a specific audience.
- **Reports** with CSV export (users, alumni, jobs, applications, mentorship, events).
- Auditable **activity log** of important actions.

### Cross-cutting

- Role-aware navigation and route guards on the client.
- **Server-side authorisation on every request** (roles, ownership, approval).
- In-app notifications with an unread badge.
- Toast feedback, loading / empty / error states everywhere.
- Responsive, accessible Tailwind UI.

---

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18, Vite 5, React Router 6, Tailwind CSS 3, Recharts, React Hook Form, lucide-react, Axios |
| Backend    | Node.js 18+, Express 4, Mongoose 8 |
| Database   | MongoDB 6+ (local or Atlas) |
| Auth       | JWT in an **httpOnly cookie** + double-submit **CSRF** token, bcryptjs password hashing |
| Validation | express-validator on the server, React Hook Form on the client |
| Security   | Helmet, CORS allow-list, express-rate-limit, express-mongo-sanitize |
| Uploads    | multer (profile photos + PDF resumes), served from `/uploads` |
| Testing    | Jest + Supertest (backend), Vitest + Testing Library (frontend) |

---

## Repository structure

```
AlumniConnect/
├── backend/                  # Express + MongoDB REST API
│   ├── scripts/seed.js       # Idempotent demo data seeder
│   ├── src/
│   │   ├── config/           # env + database connection
│   │   ├── controllers/      # request handlers
│   │   ├── middleware/       # auth, csrf, upload, rate limit, errors
│   │   ├── models/           # 11 Mongoose schemas
│   │   ├── routes/           # /api/v1 route table
│   │   ├── services/         # notifications + activity logging
│   │   ├── utils/            # ApiError, responses, tokens, formatting
│   │   ├── validators/       # express-validator rule sets
│   │   ├── app.js            # Express app (no listen)
│   │   └── server.js         # bootstrap + graceful shutdown
│   ├── tests/                # Jest + Supertest suites
│   ├── uploads/              # user uploads (photos, resumes)
│   └── .env.example
├── frontend/                 # React + Vite single page application
│   ├── src/
│   │   ├── api/              # axios client + endpoint wrappers
│   │   ├── components/       # reusable UI building blocks
│   │   ├── context/          # Auth + Toast providers
│   │   ├── hooks/            # useFetch, useAuth, useDebounce, ...
│   │   ├── layouts/          # Public, Auth and Dashboard shells
│   │   ├── pages/            # public / student / alumni / admin / shared
│   │   ├── routes/           # AppRoutes + route guards
│   │   └── utils/            # constants + formatting helpers
│   ├── tests/                # Vitest + Testing Library specs
│   └── .env.example
├── docs/                     # project report, design, API, tests, guides
├── README.md
├── ZIP_CONTENTS.md
└── .env.example              # combined environment template
```

---

## Prerequisites

- **Node.js 18+** and npm
- **MongoDB 6+** running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB
  Atlas connection string
- Git (optional)

---

## Quick start

### 1. Clone / unzip the project

```bash
cd AlumniConnect
```

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env       # macOS/Linux: cp .env.example .env
```

Edit `backend/.env` if your MongoDB URI or JWT secret differ, then:

```bash
npm run seed        # load the demo data (idempotent)
npm run dev         # start the API on http://localhost:5000
```

Verify the API is up: <http://localhost:5000/health>.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
copy .env.example .env       # macOS/Linux: cp .env.example .env
npm run dev         # start the SPA on http://localhost:5173
```

Open <http://localhost:5173> and sign in with one of the demo accounts below.

> The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`,
> so the browser talks to a single origin and the httpOnly auth cookie works
> without any cross-site configuration.

---

## Demo credentials

The seeder (`npm run seed`) creates the following accounts:

| Role            | Email                                       | Password         |
|-----------------|---------------------------------------------|------------------|
| Administrator   | `admin@alumniconnect.example.com`           | `AdminDemo@123`  |
| Alumni (approved) | `alumni@alumniconnect.example.com`        | `AlumniDemo@123` |
| Student         | `student@alumniconnect.example.com`         | `StudentDemo@123`|
| Alumni (pending) | `pending.alumni@alumniconnect.example.com` | `PendingDemo@123` |

> Other seeded users share the password **`DemoUser@123`**.
> These credentials are for local development only — never ship them to production.

The seeder creates **1 admin, 3 approved alumni, 1 pending alumni, 5 students,
6 jobs, 8 applications, 5 mentorship requests, 4 events, 3 announcements,
8 notifications and 5 activity entries**.

---

## Environment variables

A combined template lives in the project root (`.env.example`). Each app reads
its own file: `backend/.env` and `frontend/.env`.

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Environment mode (`development` / `test` / `production`). |
| `PORT` | `5000` | API port. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/alumniconnect` | Main database. |
| `MONGODB_URI_TEST` | `mongodb://127.0.0.1:27017/alumniconnect_test` | Test database. |
| `JWT_SECRET` | dev placeholder | **Set a strong value** (see below). |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime. |
| `JWT_COOKIE_NAME` | `ac_token` | httpOnly auth cookie name. |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin. |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS in production. |
| `CSRF_ENABLED` | `true` | Enable double-submit CSRF checks. |
| `UPLOAD_DIR` | `uploads` | Upload folder (relative to `backend/`). |
| `MAX_UPLOAD_MB` | `5` | Max upload size per file. |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | Rate-limit window. |
| `RATE_LIMIT_MAX` | `300` | Requests per window (global). |
| `AUTH_RATE_LIMIT_MAX` | `20` | Requests per window on auth routes. |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `/api/v1` | API base URL (uses the Vite proxy by default). |

---

## Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the API with nodemon (hot reload). |
| `npm start` | Start the API without watch mode. |
| `npm run seed` | Insert / refresh demo data (idempotent). |
| `npm run seed:reset` | Wipe the development database, then seed. |
| `npm test` | Run the Jest + Supertest suite. |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Preview the production build. |
| `npm test` | Run the Vitest suite. |

---

## Testing

AlumniConnect ships with an extensive automated test suite.

```bash
# Backend – 90 tests across 7 suites (needs a running MongoDB)
cd backend && npm test

# Frontend – 23 tests across 4 suites
cd frontend && npm test
```

The backend suite runs against `MONGODB_URI_TEST` and clears the database between
tests, so it never touches your development data. See
[`docs/TESTING.md`](docs/TESTING.md) for the full test inventory and strategy.

---

## API overview

All endpoints are versioned under **`/api/v1`** and return a consistent envelope:

```json
{ "success": true, "message": "OK", "data": { }, "meta": { } }
```

| Resource | Base path | Highlights |
|----------|-----------|------------|
| Auth | `/api/v1/auth` | register, login, logout, me, forgot / reset password, csrf |
| Profiles | `/api/v1/profiles` | directory list, metadata, my profile, photo / resume upload |
| Jobs | `/api/v1/jobs` | list, create (alumni), apply (student), manage, applicants |
| Applications | `/api/v1/applications` | my applications, received, update status, withdraw |
| Mentorship | `/api/v1/mentorship` | mentors, requests, respond, delete |
| Events | `/api/v1/events` | list / detail (public), register, admin CRUD |
| Announcements | `/api/v1/announcements` | list / detail (public), admin CRUD |
| Notifications | `/api/v1/notifications` | list, unread count, mark read, delete |
| Dashboard | `/api/v1/dashboard` | student + alumni dashboards |
| Admin | `/api/v1/admin` | approvals, users, jobs, mentorship, reports, activity |
| Public | `/api/v1/public` | stats, alumni preview, testimonials |

Full request / response documentation: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

---

## Security

- **Password hashing** with bcryptjs (10 salt rounds); hashes are `select: false`.
- **Authentication** via a signed JWT stored in an **httpOnly, SameSite** cookie
  (never in `localStorage`). A `Bearer` header is also accepted for tooling.
- **CSRF** double-submit cookie protection on every state-changing request, with
  automatic token refresh-and-retry on the client.
- **Authorisation** enforced server-side: `protect`, `authorize(role)` and
  `requireApprovedAlumni` guards; ownership is re-checked in controllers.
- **Validation** on every write endpoint using express-validator.
- **Hardening**: Helmet security headers, CORS allow-list with credentials,
  rate limiting (global + stricter on auth), Mongo operator sanitisation, and a
  centralised error handler that never leaks stack traces in production.
- **Uploads** restricted by MIME type and size, stored outside the code paths,
  and served with `X-Content-Type-Options: nosniff`.

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) | Formal project report (abstract → conclusion). |
| [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) | Architecture, modules, data flow, security design. |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Every collection, field, index and relationship. |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | Complete REST API reference. |
| [`docs/TESTING.md`](docs/TESTING.md) | Test strategy, inventory and how to run everything. |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Step-by-step guide for each role. |
| [`docs/VIVA_QUESTIONS.md`](docs/VIVA_QUESTIONS.md) | 60+ viva / interview questions with answers. |
| [`ZIP_CONTENTS.md`](ZIP_CONTENTS.md) | What is inside the deliverable archive. |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Unable to reach the server` in the UI | Start the backend (`npm run dev`) and confirm `/health` responds. |
| Login fails with 403 `CSRF_INVALID` | Clear cookies and reload; ensure `CSRF_ENABLED` matches on both restarts. |
| `MongooseServerSelectionError` | MongoDB is not running, or `MONGODB_URI` is wrong. |
| Uploads return 400 | Check file type (JPG/PNG/WEBP for photos, PDF for resumes) and size limit. |
| CORS error in the browser console | Add your frontend origin to `CLIENT_URL`. |
| Port already in use | Change `PORT` (backend) or `server.port` in `vite.config.js` (frontend). |

---

## License

Released for educational use. See the `LICENSE` note in the project root if present.
