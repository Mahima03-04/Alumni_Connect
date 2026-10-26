# AlumniConnect — ZIP Contents

This file describes what is inside **`AlumniConnect_FullStack_Project.zip`**.

The archive expands to a single top-level folder named **`AlumniConnect/`** so
that everything stays tidy when extracted.

```
AlumniConnect/
├── backend/                  # Express + MongoDB REST API
├── frontend/                 # React + Vite single page application
├── docs/                     # Reports, design, schema, API, tests, guides
├── README.md                 # Project overview + setup instructions
├── ZIP_CONTENTS.md           # This file
├── .env.example              # Combined environment template
└── .gitignore
```

---

## Included

### Root

| Path | Description |
|------|-------------|
| `README.md` | Overview, features, tech stack, setup, scripts, testing, troubleshooting. |
| `ZIP_CONTENTS.md` | Manifest of the archive. |
| `.env.example` | Combined backend + frontend environment template. |
| `.gitignore` | Ignores dependencies, secrets, build output, logs, uploads. |

### `backend/`

| Path | Description |
|------|-------------|
| `package.json`, `package-lock.json` | Dependencies and scripts. |
| `.env.example` | Backend environment template. |
| `src/config/` | `env.js` (configuration), `db.js` (Mongo connection). |
| `src/models/` | 11 Mongoose schemas. |
| `src/routes/` | `/api/v1` route table + per-resource routers. |
| `src/controllers/` | Business logic for every resource. |
| `src/middleware/` | `auth`, `csrf`, `upload`, `rateLimit`, `errorHandler`. |
| `src/services/` | `notificationService`, `activityService`. |
| `src/utils/` | `ApiError`, `apiResponse`, `asyncHandler`, `tokens`, pagination, profile completion. |
| `src/validators/` | express-validator rule sets. |
| `src/app.js`, `src/server.js` | Express app + bootstrap/shutdown. |
| `scripts/seed.js` | Idempotent demo data seeder. |
| `tests/` | Jest + Supertest suites (7 files, 90 tests) + `setup.js`. |
| `uploads/.gitkeep` | Keeps the uploads folder present. |

### `frontend/`

| Path | Description |
|------|-------------|
| `package.json`, `package-lock.json` | Dependencies and scripts. |
| `.env.example` | Frontend environment template. |
| `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js` | Build & styling config. |
| `src/api/` | axios client + endpoint wrappers. |
| `src/components/` | Reusable UI building blocks. |
| `src/context/` | Auth + Toast providers. |
| `src/hooks/` | `useFetch`, `useAuth`, `useDebounce`, etc. |
| `src/layouts/` | Public, Auth, Dashboard shells. |
| `src/pages/` | public / student / alumni / admin / shared pages. |
| `src/routes/` | `AppRoutes`, `ProtectedRoute`, `RoleRoute`. |
| `src/utils/` | Constants and formatting helpers. |
| `src/main.jsx`, `src/App.jsx`, `src/index.css` | App entry & global styles. |
| `public/`, `src/assets/` | Static assets (logo, favicon). |
| `tests/` | Vitest + Testing Library specs and setup. |

### `docs/`

| Path | Description |
|------|-------------|
| `docs/PROJECT_REPORT.md` | Formal project report (abstract → conclusion, references). |
| `docs/SYSTEM_DESIGN.md` | Architecture, modules, flows, security, decisions. |
| `docs/DATABASE_SCHEMA.md` | Every collection, field, index, relationship. |
| `docs/API_DOCUMENTATION.md` | Complete REST API reference + examples. |
| `docs/TESTING.md` | Test strategy, inventory and manual checklist. |
| `docs/USER_GUIDE.md` | Step-by-step guide for each role. |
| `docs/VIVA_QUESTIONS.md` | 75+ viva questions with answers. |

---

## Excluded (intentionally)

| Path | Reason |
|------|--------|
| `backend/node_modules/`, `frontend/node_modules/` | Recreated with `npm install`; keeps the archive small. |
| `backend/.env`, `frontend/.env` | Machine-specific and may contain secrets. Use the `.env.example` templates. |
| `frontend/dist/` | Recreated with `npm run build`. |
| `backend/uploads/**` (except `.gitkeep`) | Runtime user uploads. |
| `*.log`, `coverage/`, `.cache/`, OS/editor files | Transient artefacts. |

---

## How to use the archive

```bash
# 1. Extract AlumniConnect_FullStack_Project.zip → AlumniConnect/

# 2. Backend
cd AlumniConnect/backend
npm install
copy .env.example .env        # macOS/Linux: cp .env.example .env
npm run seed
npm run dev                   # http://localhost:5000

# 3. Frontend (new terminal)
cd AlumniConnect/frontend
npm install
copy .env.example .env        # macOS/Linux: cp .env.example .env
npm run dev                   # http://localhost:5173
```

Then sign in with a demo account (see `README.md`).

---

## Verify after extraction

```bash
cd AlumniConnect/backend && npm test     # 90 tests
cd AlumniConnect/frontend && npm test    # 23 tests
```

Both suites should pass (backend requires MongoDB to be running).
