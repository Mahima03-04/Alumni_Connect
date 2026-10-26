# AlumniConnect — Testing

AlumniConnect ships with an automated test suite covering both tiers.

| Suite | Framework | Tests | Command | Result |
|-------|-----------|-------|---------|--------|
| Backend API | Jest + Supertest | **90** | `cd backend && npm test` | ✅ |
| Frontend | Vitest + Testing Library | **23** | `cd frontend && npm test` | ✅ |
| **Total** | | **113** | | ✅ |

---

## 1. Prerequisites

- MongoDB running (local or Atlas).
- The backend test database (`MONGODB_URI_TEST`, default
  `mongodb://127.0.0.1:27017/alumniconnect_test`) must be reachable.
- Dependencies installed (`npm install` in `backend/` and `frontend/`).

---

## 2. Running the tests

### Backend

```bash
cd backend
npm test            # single run (jest --runInBand)
npm run test:watch  # watch mode
```

Configuration lives in `backend/package.json` (`jest` block) and
`backend/tests/setup.js`:

- `tests/setup.js` connects to the test database in `beforeAll`, calls
  `model.init()` so unique indexes exist, and **deletes all documents after each
  test** (`afterEach`) so tests are isolated and order-independent.
- Rate limiting is disabled automatically when `NODE_ENV=test`.
- `testTimeout` is 30 s to allow for index creation on first run.

### Frontend

```bash
cd frontend
npm test            # vitest run
npm run test:watch  # watch mode
```

Configuration lives in `frontend/vite.config.js` (`test` block) and
`frontend/tests/setup.js`:

- `environment: 'jsdom'`, `globals: true`.
- `tests/setup.js` registers `@testing-library/jest-dom` matchers, runs
  `cleanup()` after each test, and stubs `window.matchMedia`.

---

## 3. Backend test inventory (90 tests)

| File | Tests | Focus |
|------|-------|-------|
| `tests/auth.test.js` | 17 | Registration, password hashing, login, session (`/me`, logout), CSRF protection. |
| `tests/profiles.test.js` | 7 | Profile updates, role restrictions, directory listing/filtering, metadata. |
| `tests/jobs.test.js` | 19 | Job creation permissions (approval gate), visibility, ownership, applying, duplicate prevention, application review. |
| `tests/mentorship.test.js` | 11 | Mentor listing, request creation/validation, responding, status rules, duplicate active request prevention. |
| `tests/events.test.js` | 12 | Event CRUD (admin), public listing visibility, registration/cancellation and capacity/deadline rules. |
| `tests/admin.test.js` | 17 | Access control (admin only), dashboard, alumni approval, job approval, user management, reports + CSV export. |
| `tests/platform.test.js` | 7 | Public endpoints (stats, preview, testimonials), health, 404 handling, envelope consistency. |

Representative behaviours verified:

- **Passwords** are hashed with bcrypt and never returned by the API.
- **Auth** rejects bad credentials, suspended/inactive accounts and rejected alumni.
- **CSRF**: mutating requests without a matching header return `403 CSRF_INVALID`.
- **Approval gate** — a *pending* alumnus gets `403` when posting a job; an
  approved alumnus succeeds.
- **Job visibility** — students/alumni only see `approved` jobs; owners see all
  of their own posts (including pending/closed).
| Duplicate application → `409` (unique `(job, student)` index).
| Duplicate active mentorship request per alumnus is blocked.
| Event registration respects `published` status, deadlines and capacity.
| Admin routes return `403` for non-admins and `401` when anonymous.
| CSV export returns `text/csv` with a `Content-Disposition` filename.

### Helper utilities

`tests/setup.js` plus small helpers keep tests readable: create users of a given
role, run the seeder-style fixtures, log in and capture the auth cookie, and
send CSRF-aware requests.

---

## 4. Frontend test inventory (23 tests)

| File | Tests | Focus |
|------|-------|-------|
| `tests/format.test.js` | 10 | Initials, title case, truncation, date/relative-time/countdown formatting, file sizes, query strings. |
| `tests/constants.test.js` | 4 | Navigation menus per role, role home routes, labels, status badge styles. |
| `tests/StatusBadge.test.jsx` | 7 | `StatusBadge`, `EmptyState`, `StatCard` rendering (labels, hints, trends, empty DOM). |
| `tests/useDebounce.test.jsx` | 2 | Initial value and delayed update behaviour of the `useDebounce` hook. |

---

## 5. Manual / exploratory testing checklist

Because automated tests cannot cover every UI interaction, the following manual
checks are recommended before submission:

**Public**

- [ ] Landing page shows live counts and featured alumni.
- [ ] `/events` lists published events; drafts are hidden.
- [ ] `/events/:id` shows details; registration prompts login.

**Student**

- [ ] Register and log in; land on the student dashboard.
- [ ] Update profile; upload a photo and a resume.
- [ ] Filter the alumni directory (department, year, skill).
- [ ] Apply to a job with a resume; see it in "My Applications".
- [ ] Withdraw an application.
- [ ] Send a mentorship request; see pending status.
- [ ] Register for and cancel an event registration.
- [ ] Notification unread badge updates after actions.

**Alumni**

- [ ] Complete the profile; profile completion percentage updates.
- [ ] Create a job → it is `pending` and not visible to students yet.
- [ ] As admin, approve the job → it becomes visible.
- [ ] View applicants for a job; change an applicant's status.
- [ ] Accept a mentorship request and add meeting details.

**Admin**

- [ ] Dashboard charts render with seeded data.
- [ ] Approve/reject a pending alumnus (rejection requires a reason).
- [ ] Approve/reject a job (rejection requires a reason).
- [ ] Suspend/activate a user; suspended users cannot log in.
- [ ] Create/publish/update an event.
- [ ] Publish an announcement targeted at students.
- [ ] Export each CSV report type.
- [ ] Activity log shows the actions performed.

**Cross-cutting**

- [ ] Pending alumnus cannot post a job (both UI message and API 403).
- [ ] Role guard redirects (`/admin/...` as a student → `/unauthorized`).
- [ ] Responsive layout on a narrow viewport.
- [ ] CSRF: with cookies cleared, a POST recovers automatically.

---

## 6. Test data & isolation

- The backend suite never touches the development database; it uses
  `MONGODB_URI_TEST`.
- Collections are cleared after each test, so suites can run in any order within
  `--runInBand`.
- Frontend tests render components in isolation with no network calls (pure
  functions and hooks are tested directly).

---

## 7. Continuous integration (suggested)

```yaml
# .github/workflows/ci.yml (example)
jobs:
  backend:
    services:
      mongo: { image: mongo:6, ports: ['27017:27017'] }
    steps:
      - run: npm ci --prefix backend
      - run: npm test --prefix backend
  frontend:
    steps:
      - run: npm ci --prefix frontend
      - run: npm test --prefix frontend
      - run: npm run build --prefix frontend
```

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend tests hang / time out | MongoDB is not running or `MONGODB_URI_TEST` is wrong. |
| `E11000 duplicate key` in tests | Indexes were not created — ensure `model.init()` ran (it does in `tests/setup.js`). |
| Frontend tests fail to find jsdom APIs | Keep `environment: 'jsdom'` in `vite.config.js`. |
| `toBeInTheDocument is not a function` | `tests/setup.js` must import `@testing-library/jest-dom/vitest`. |
| Port already in use when running the API | Stop the other process or change `PORT`. |
