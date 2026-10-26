# AlumniConnect — System Design

This document explains **how** AlumniConnect is built: the architecture, the
module breakdown, the request lifecycle, the security model and the key design
decisions. For the field-level data model see
[`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md); for endpoints see
[`API_DOCUMENTATION.md`](API_DOCUMENTATION.md).

---

## 1. High-level architecture

AlumniConnect is a classic **three-tier** application:

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Browser (SPA)                               │
│  React 18 + Vite + Tailwind + React Router 6                          │
│  axios (withCredentials) ── sends httpOnly cookie + x-csrf-token      │
└───────────────┬───────────────────────────────────────────────────────┘
                │  HTTPS/JSON  (dev: Vite proxy /api -> :5000)
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Express REST API (/api/v1)                       │
│  helmet · cors → json -> cookieParser -> mongoSanitize                 │
│  rate limit -> CSRF ──> routes → validators → controllers → services  │
│  centralised error handler                                             │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ Mongoose ODM
                                ▼
                    ┌───────────────────────┐
                    │      MongoDB          │
                    │  11 collections       │
                    └───────────────────────┘
```

The frontend is a **single page application**. The backend is a **stateless
REST API** that holds no session state — identity travels in a signed JWT inside
an httpOnly cookie, which makes horizontal scaling straightforward.

---

## 2. Backend architecture

```
backend/src/
├── app.js            # Creates the Express app (middleware + routes), no listen()
├── server.js         # Boots the app, connects to Mongo, graceful shutdown
├── config/
│   ├── env.js        # Central, validated configuration object
│   └── db.js         # Mongoose connection + friendly errors
├── middleware/
│   ├── auth.js       # protect, optionalAuth, authorize, requireApprovedAlumni, requireOwnerOrAdmin
│   ├── csrf.js       # Double-submit CSRF issue + verify
│   ├── upload.js     # multer photo/resume storages + MIME filters
│   ├── rateLimit.js  # global + auth limiters (no-op in tests)
│   └── errorHandler.js # notFound + centralised error mapping
├── models/           # 11 Mongoose schemas
├── controllers/      # One module per resource; thin, HTTP-aware
├── services/         # notificationService, activityService (side effects)
├── routes/           # /api/v1 route table + per-resource routers
├── utils/            # ApiError, apiResponse, asyncHandler, tokens, profileCompletion
└── validators/       # express-validator rule sets per resource
```

### Layering rule

```
Route  →  (auth guard → rate limit) → validator → controller → model/service
                                                     │
                                              sendSuccess / next(ApiError)
```

- **Routes** declare the URL, the guards and the validator chain only.
- **Controllers** own the business decisions (who can see what, ownership,
  state transitions) and talk to the models.
- **Services** handle side effects (notifications, activity logs) and are
  deliberately fail-safe: a failed notification never fails the request.
- **Middlewares** are small, single-purpose functions.

Every controller handler is wrapped in `asyncHandler` so a rejected promise
flows into the centralised error handler instead of hanging the request.

### Middleware order (from `app.js`)

1. `helmet` — security headers (CSP off so the SPA can load cross-origin images).
2. `cors` — allow-list with `credentials: true`.
3. `express.json` / `urlencoded` — body parsing (1 MB limit).
4. `cookie-parser`.
5. `express-mongo-sanitize` — strips `$`/`.` operators from input.
6. `morgan` — request logging (skipped in tests).
7. `/uploads` — static files with `nosniff`.
8. `GET /health`.
9. `/api` → global rate limiter.
10. CSRF issue + verify.
11. `/api/v1` → routers.
12. `notFound`, then `errorHandler`.

Order matters: rate limiting precedes CSRF so abusive traffic is dropped
cheaply, and CSRF precedes routing so no mutating handler runs without a token.

---

## 3. Frontend architecture

```
frontend/src/
├── main.jsx          # React root + providers + BrowserRouter
├── App.jsx           # Shell: AuthProvider + ToastProvider + AppRoutes
├── api/
│   ├── client.js     # axios instance, CSRF interceptor, friendly errors
│   └── endpoints.js  # Typed endpoint wrappers (authApi, jobApi, ...)
├── context/
│   ├── AuthContext.jsx  # user/session lifecycle
│   └── ToastContext.jsx # global toast notifications
├── hooks/            # useFetch, useAuth, useDebounce, useDocumentTitle, ...
├── components/       # 30+ presentational + container building blocks
├── layouts/          # PublicLayout, AuthLayout, DashboardLayout
├── routes/           # AppRoutes + ProtectedRoute + RoleRoute
├── pages/            # public | student | alumni | admin | shared
└── utils/            # constants (NAV_BY_ROLE, STATUS_STYLES) + format helpers
```

### Data-fetching model

- A single axios instance (`api/client.js`) centralises:
  - `baseURL` from `VITE_API_BASE_URL`,
  - `withCredentials: true`,
  - automatic CSRF header injection on non-safe methods,
  - **refresh-and-retry** when the CSRF token expires (`403 CSRF_INVALID`),
  - a friendly `error.friendlyMessage` for every failure.
- `useFetch(fetcher, deps, { immediate })` returns
  `{ data, loading, error, refetch, setData }` and unwraps `res.data.data`
  (and `res.data.meta`). Pages therefore never touch axios directly.
- Endpoint wrappers in `api/endpoints.js` keep URL strings out of components.

### Auth lifecycle (`AuthContext`)

1. On mount, call `GET /auth/me`. While pending, `loading` is `true`.
2. Success → set `user` + `profile`, `isAuthenticated = true`, derive `role`.
3. `login()` / `register()` POST credentials, then populate the session.
4. `logout()` calls the API and clears local state.
5. `refresh()` re-fetches `/auth/me` (used after profile updates).

> Approval-aware UI: `isApprovedAlumni` is exposed so pages can explain to a
> pending alumnus why posting is unavailable. The **server** is still the
> authority.

### Client-side guards

`ProtectedRoute` blocks anonymous users and remembers the intended location;
`RoleRoute` restricts a subtree to a set of roles and redirects to
`/unauthorized`. These only improve UX — the API re-checks everything.

---

## 4. Core request flows

### 4.1 Login

```
Browser            API                       MongoDB
  │  POST /auth/login │                          │
  ├──────────────────>│ validate body            │
  │                   ├─ find user by email ────>│
  │                   │<── user (with hash) ─────┤
  │                   ├─ bcrypt.compare          │
  │                   ├─ sign JWT {sub, role}    │
  │                   ├─ set httpOnly ac_token   │
  │<── 200 + cookies ─┤                          │
  │  GET /auth/me     │                          │
  ├──────────────────>│ verify cookie → user     │
  │<── {user,profile}─┤                          │
```

### 4.2 Job application (student)

```
POST /jobs/:id/apply (multipart: resume + coverLetter)
  protect → authorize('student') → multer(uploadResume) → validate
    controller:
      - load job, assert approvalStatus === 'approved' and open
      - create JobApplication { job, student, resume, applicantName, coverLetter }
        (unique index prevents duplicates -> 409)
      - notificationService: notify the alumni owner
      - activityService: log 'application.create'
    201 { data: application }
```

### 4.3 Alumni approval (admin)

```
PATCH /admin/alumni/:id/approval { approvalStatus, reason? }
  protect → authorize('admin') → validate
    controller:
      - set approvalStatus; on approve stamp approvedAt/approvedBy
      - on reject store approvalReason (required)
      - notify the alumnus
      - log 'admin.alumni_approve' / 'admin.alumni_reject'
    200 { data: user }
```

### 4.4 Posting a job (approved alumni only)

```
POST /jobs
  protect → requireApprovedAlumni → validate
    requireApprovedAlumni:
      role must be 'alumni' AND approvalStatus === 'approved'
      otherwise 403 with a clear message
```

---

## 5. Security design

| Concern | Mitigation |
|---------|-----------|
| Password storage | bcryptjs (10 rounds), `passwordHash` is `select: false` and stripped in `toJSON`. |
| Session theft (XSS) | JWT stored in an **httpOnly** cookie — JavaScript cannot read it. |
| CSRF | Double-submit cookie: readable `ac_csrf` cookie + `x-csrf-token` header must match on every mutating request. `SameSite=Lax` adds defence in depth. |
| Enumeration / brute force | Stricter `authLimiter` on `/auth/*` + account status checks. |
| Broken access control | `authorize(role)` per route + ownership checks in controllers + `requireApprovedAlumni`. |
| NoSQL injection | `express-mongo-sanitize` strips `$` / `.` from user input. |
| Input tampering | express-validator on every write endpoint (types, ranges, enums, lengths). |
| Malicious uploads | MIME allow-list, size limit, randomised filenames, `nosniff` header. |
| Information leakage | Centralised error handler; stack traces hidden in production; 404 for unknown routes. |
| Clickjacking / sniffing | Helmet defaults (frame options, `X-Content-Type-Options`, etc.). |
| Weak secrets | `env.js` refuses to boot in production with the placeholder JWT secret. |

**Why cookies over localStorage?** localStorage is readable by any script, so a
single XSS becomes full account takeover. An httpOnly cookie is not readable by
JavaScript. The trade-off — CSRF — is handled with the double-submit token.

---

## 6. Data design decisions

| Decision | Rationale |
|----------|-----------|
| Profiles in separate collections | A student and an alumnus have different fields; keeps `users` small and fast. |
| Snapshot fields (`applicantName`, `attendeeName`) | A later profile edit must not rewrite historical records. |
| `approvalStatus` on `User` and `Job` | Two independent review workflows (accounts vs content). |
| Partial unique index on mentorship | Allows re-requesting after a request ends, while blocking duplicate active requests. |
| Unique `(job, student)` index | The database, not just the code, guarantees single application. |
| `EventRegistration` upsert + status | Cancel = status change, so history is preserved. |
| Text + compound indexes | Fast search + filtered lists on the expected query patterns. |
| Denormalised `organizerName` / `actorName` | Avoid extra joins for display lists. |

---

## 7. Error handling strategy

1. Controllers throw `ApiError` (or create with helpers: `badRequest`, `notFound`, ...).
2. `asyncHandler` forwards async rejections to Express.
3. `errorHandler` maps known error shapes:
   - `CastError` → 400,
   - Mongoose `ValidationError` → 422 with field errors,
   - duplicate key (11000) → 409,
   - multer errors → 400,
   - everything else → 500 (message genericised in production).
4. A single JSON envelope: `{ success, message, errors?, code? }`.

---

## 8. Testing architecture

- **Backend:** Jest + Supertest. `tests/setup.js` connects to the test database,
  ensures indexes exist, and wipes collections after each test. Rate limiting is
  disabled and CSRF can be toggled in tests. Helpers create users, log in, and
  return an authenticated agent.
- **Frontend:** Vitest + Testing Library + jsdom. `tests/setup.js` adds
  jest-dom matchers, cleans up the DOM, and stubs `matchMedia`.

See [`TESTING.md`](TESTING.md) for the full inventory.

---

## 9. Deployment notes

- **Backend:** any Node host (Render, Railway, Fly, a VM). Set
  `NODE_ENV=production`, a strong `JWT_SECRET`, `COOKIE_SECURE=true`,
  `CLIENT_URL` to the deployed frontend, and a managed MongoDB (Atlas).
- **Frontend:** `npm run build` produces a static `dist/` served by any CDN or
  static host. Point `VITE_API_BASE_URL` at the deployed API.
- **Uploads:** use object storage (S3 and friends) in production; the local
  `uploads/` folder is not durable across container restarts.
- **CORS:** add the production frontend origin to the allow-list in `app.js`
  (driven by `CLIENT_URL`).

---

## 10. Scalability & future work

| Area | Next step |
|------|-----------|
| Uploads | Swap multer disk storage for S3 / Cloudinary. |
| Email | Replace the dev forgot-password placeholder with a real mailer (Nodemailer/SES). |
| Real-time | Add WebSocket notifications for instant in-app alerts. |
| Search | Move from regex/text search to Atlas Search or Elastic. |
| Caching | Redis for directory/report hot paths. |
| Pagination | Cursor pagination for very large collections. |
| Observability | Structured logging + health/readiness probes + APM. |
