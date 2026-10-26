# AlumniConnect — Viva Questions & Answers

A study companion for the project viva / technical interview. **60+ questions**
grouped by theme, each with a concise, confident answer. Answers reference this
project's actual code wherever possible.

---

## A. Project overview

**1. What is AlumniConnect?**
A full-stack web platform where students, alumni and administrators interact
through an alumni directory, job board, mentorship programme and event calendar,
with approval workflows and reporting for administrators.

**2. What problem does it solve?**
It replaces fragmented, unverifiable alumni engagement (spreadsheets, chat
groups) with a structured, verified, searchable platform that tracks
applications, mentorship and event registrations.

**3. What are the three user roles and what can each do?**
- **Student:** browse alumni, apply to jobs, request mentorship, register for events.
- **Alumni:** post jobs (after approval), review applicants, mentor students.
- **Admin:** approve alumni and jobs, manage users, events, announcements,
  reports and the activity log.

**4. What is the difference between a student and an alumni account internally?**
Both are `User` documents with a `role`. Alumni additionally have an
`approvalStatus` (`pending` → `approved`/`rejected`) and an `AlumniProfile`;
students have a `StudentProfile`.

**5. Why is there an approval step for alumni?**
To keep the directory trustworthy — only verified former students should be able
to act as alumni (post jobs, mentor).

**4b. How many roles and collections?**
3 roles, 11 MongoDB collections.

---

## B. Architecture & design

**5. Describe the architecture.**
A three-tier application: a React SPA (presentation), a stateless Express REST
API (application) and MongoDB (data). The SPA talks JSON to `/api/v1`; identity
travels in an httpOnly JWT cookie.

**6. Why is the API stateless?**
The JWT carries identity, so the server keeps no session in memory. Any instance
can serve any request, which makes horizontal scaling straightforward.

**7. What is the request lifecycle?**
helmet → CORS → JSON parsing → cookie-parser → mongo-sanitize → morgan →
static `/uploads` → `/health` → rate limiter → CSRF → `/api/v1` routes →
controllers → (models/services) → response; unmatched paths hit `notFound` and
all errors funnel through the centralised `errorHandler`.

**8. Why separate controllers from routes?**
Routes declare *what* (path, guards, validation); controllers contain *how*
(business logic). This keeps each file small and testable.

**9. What are services used for?**
Cross-cutting side effects: `notificationService` and `activityService`. They
are best-effort — a failed notification never breaks a request.

**10. How is the frontend structured?**
By concern: `api`, `components`, `context`, `hooks`, `layouts`, `pages`
(public/student/alumni/admin/shared), `routes`, `utils`.

**11. What layout shells exist?**
`PublicLayout` (marketing), `AuthLayout` (login/register/reset),
`DashboardLayout` (authenticated, role-aware sidebar + topbar).

**12. How do you add a new feature end-to-end?**
Model → validator → controller → route → endpoint wrapper in
`api/endpoints.js` → page/component → add to `AppRoutes` → add to
`NAV_BY_ROLE` if it needs a menu entry → add tests.

---

## B2. Frontend

**13. Why React?**
Component reuse, a declarative UI model, hooks for stateful logic, and a large
ecosystem (React Router, Testing Library).

**14. Why Vite over Create React App?**
Vite starts near-instantly, uses native ES modules in dev and Rollup for fast
production builds, and has first-class React support.

**15. How does data fetching work?**
A single axios instance (`api/client.js`) with `withCredentials`, a request
interceptor that adds the CSRF header, and a response interceptor that provides
`error.friendlyMessage` and retries once on an expired CSRF token. `useFetch`
wraps fetchers and returns `{ data, loading, error, refetch, setData }`.

**16. Why not put the token in localStorage?**
localStorage is readable by any script, so an XSS bug becomes full account
takeover. We use an httpOnly cookie instead.

**17. How is authorisation handled on the client?**
`ProtectedRoute` blocks anonymous users; `RoleRoute` restricts a subtree to
roles. These only improve UX — the API independently enforces everything.

**18. How do role-based menus work?**
`NAV_BY_ROLE` in `utils/constants.js` maps each role to its sidebar items; the
`Sidebar` renders the list for the current `role` from `AuthContext`.

**19. How are forms validated?**
React Hook Form on the client for immediate feedback, and express-validator on
the server as the source of truth (never trust the client).

**20. How do you keep lists responsive to search?**
A `useDebounce` hook delays the value passed to the API so typing does not fire a
request per keystroke.

**21. What are the loading/empty/error patterns?**
Shared `LoadingState`, `EmptyState`, `ErrorState` components so every list has
consistent feedback.

**22. How is the auth session restored on refresh?**
`AuthContext` calls `GET /auth/me` on mount; if the httpOnly cookie is valid the
session is restored, otherwise the user is treated as anonymous.

---

## C. Database

**23. Why MongoDB over a relational database?**
Profiles vary in shape (student vs alumni vs work-experience arrays) and the
data is document-oriented; MongoDB maps naturally to JSON and Mongoose provides
schema validation and indexes.

**24. How many collections are there?**
Eleven: `users`, `alumniprofiles`, `studentprofiles`, `jobs`,
`jobapplications`, `mentorshiprequests`, `events`, `eventregistrations`,
`announcements`, `notifications`, `activitylogs`.

**25. Why store profiles in separate collections instead of inside `users`?**
It keeps the frequently-read `users` document small (fast auth) and lets student
and alumni profiles have different fields without a bloated shared schema.

**26. How is a duplicate job application prevented?**
A **unique compound index** on `(job, student)` in `jobapplications`. The
database enforces it; the API maps the duplicate-key error to HTTP 409.

**27. How is a duplicate active mentorship request prevented?**
A **partial unique index** on `(student, alumni)` limited to `status ∈
{pending, accepted}`. A student can re-request only after the previous request
ends.

**28. What is a partial index and why use it here?**
An index that only includes documents matching a filter expression. It lets us
enforce uniqueness only for *active* requests while allowing historical
(completed/cancelled) records.

**29. How is one registration per event per user guaranteed?**
A unique compound index on `(event, user)` in `eventregistrations`; cancelling
changes `registrationStatus` rather than deleting the row (history preserved).

**30. Why store `applicantName` and `attendeeName` snapshots?**
So a later profile edit does not rewrite historical records — applications and
registrations reflect the data at the time of the action.

**31. What indexes exist and why?**
Unique indexes (`email`, `(job, student)`, `(event, user)`, `user` on profiles)
for integrity; compound indexes (`{role, accountStatus}`, `{approvalStatus,
jobStatus}`, `{status, startDate}`, `{user, read, createdAt}`) for the common
filters; text indexes on profiles/jobs/announcements for search.

**32. What are Mongoose virtuals used for here?**
Computed, non-persisted values: `isApprovedAlumni`, `isAcceptingApplications`
(jobs), `isRegistrationOpen` (events). Some are exposed via `toJSON`.

**33. How is the `id` returned consistently?**
`User`, `Job` and `Event` have a `toJSON` transform (or virtuals) that expose a
string `id` alongside `_id`. Other collections only expose `_id`, so the client
uses `x.id || x._id`.

---

## D. Authentication & security

**34. How are passwords stored?**
Hashed with **bcryptjs** using 10 salt rounds; `passwordHash` is `select: false`
and stripped from JSON, so it is never returned.

**35. How does JWT authentication work here?**
On login the server signs a JWT `{ sub, role }` and sets it in an **httpOnly**
cookie. `protect` middleware verifies the cookie (or a `Bearer` header) on each
request and loads the user.

**36. What is JWT, and what are its parts?**
A JSON Web Token has three base64url parts: header (algorithm/type), payload
(claims such as `sub`, `role`, `exp`), and signature. The signature ensures the
payload was not tampered with.

**37. Why httpOnly cookies rather than the Authorization header?**
httpOnly cookies are immune to JavaScript access (XSS cannot steal them) and are
sent automatically. We keep Bearer support for API tools/tests.

**38. What is CSRF and how do you prevent it?**
Cross-Site Request Forgery tricks a logged-in browser into sending a request.
We use **double-submit cookies**: a readable `ac_csrf` cookie must match the
`x-csrf-token` header on every mutating request; `SameSite=Lax` adds defence in
depth.

**39. What does `SameSite=Lax` do?**
It prevents the cookie from being sent on cross-site POST requests, mitigating
CSRF while still allowing normal top-level navigation.

**40. How is role-based access enforced?**
`authorize('admin')` etc. per route plus ownership checks in controllers. The
client guard is convenience only.

**41. What is `requireApprovedAlumni`?**
A middleware that allows only alumni whose `approvalStatus === 'approved'` to
perform restricted actions such as posting jobs; others get 403.

**42. What is rate limiting and why?**
It caps requests per window (global default 300/15 min; auth routes 20/15 min) to
slow brute-force and abuse. It is disabled in tests.

**43. What is Helmet for?**
It sets security-related HTTP headers (e.g. `X-Content-Type-Options`,
frameguard) to reduce common web risks.

**44. How do you prevent NoSQL injection?**
`express-mongo-sanitize` strips `$` and `.` operators from user input, and
express-validator enforces types/enums/ranges.

**45. How are uploads secured?**
MIME allow-list (images for photos, PDF/DOC for resumes), a size cap
(`MAX_UPLOAD_MB`), randomised safe filenames, storage outside routes, and
`X-Content-Type-Options: nosniff` when served.

**46. How are errors handled without leaking internals?**
A centralised handler maps known errors to statuses and hides stack traces in
production. `env.js` also refuses to boot in production with a placeholder JWT
secret.

---

## E. Roles, workflows and business rules

**47. Describe the alumni approval workflow.**
Register → `approvalStatus: pending` → admin reviews in Alumni Approvals →
`approved` (can post jobs) or `rejected` (reason required) → the user is
notified at each decision.

**48. Describe the job approval workflow.**
Approved alumni create a job → `approvalStatus: pending` (invisible to students)
→ admin approves (visible) or rejects (reason). Alumni can then open/close or
delete their own posts.

**49. What can a pending alumnus do?**
Sign in and edit their profile, browse the directory and events — but not post
jobs or respond to mentorship until approved.

**50. How does a student apply to a job?**
`POST /jobs/:id/apply` as multipart with a resume; the controller verifies the
job is approved and open, then creates a `JobApplication`. Duplicate attempts
return 409.

**51. How do alumni review applicants?**
Via `/jobs/:id/applications` or `/applications/received`; they can set
`under_review`, `shortlisted`, `accepted` or `rejected` with an optional note,
and the student is notified.

**52. What are the mentorship statuses?**
`pending → accepted | rejected`, then `completed` or `cancelled`. Accepting can
include meeting details (mode, time, link/location, notes).

**53. How do events work?**
Admins create events with a status (`draft`, `published`, `cancelled`,
`completed`). Only published events are public; students/alumni can register
until the deadline/end date and within capacity.

**54. How are announcements targeted?**
Each announcement has an `audience` (`all`, `students`, `alumni`, `admins`) and a
`priority`; only published ones are shown, filtered by the viewer's role.

**55. How does the notification system work?**
Actions (approvals, application status changes, mentorship responses, event
registration) call `notificationService` to create per-user notifications. The UI
polls the unread count and shows a badge.

**56. How is the activity log used?**
`activityService` appends who-did-what records (`action`, `entity`,
`description`) that administrators can review as an audit trail.

**57. What reports are available?**
Summary counts plus breakdowns (users by role, applications by status, jobs by
approval, mentorship status, registrations by event), each exportable as CSV.

---

## F. API design

**58. Why version the API (`/api/v1`)?**
So breaking changes can ship as `/api/v2` without breaking existing clients.

**59. Describe the response envelope.**
Success: `{ success: true, message, data, meta? }`. Error:
`{ success: false, message, errors?, code? }`. `meta` carries pagination.

**60. What HTTP methods/status codes are used?**
GET (read), POST (create/actions), PUT (full update), PATCH (partial/status),
DELETE (remove). 200/201 success, 400/422 validation, 401 unauthenticated, 403
forbidden, 404 missing, 409 conflict, 429 rate limited, 500 server error.

**61. How is pagination implemented?**
A `getPagination` helper reads `page`/`limit` from the query, applies `skip`/
`limit` and `sort`, and returns `meta: { page, limit, total, totalPages }`.

**62. How is validation structured?**
Reusable express-validator rule arrays per resource, run through a `validate`
middleware that returns 422 with field-level errors.

**63. What is `asyncHandler` for?**
It wraps async controllers so rejected promises are passed to Express's error
handler instead of crashing or hanging.

---

## G. Testing

**64. What testing tools are used?**
Jest + Supertest for the API (real test database), Vitest + Testing Library with
jsdom for the frontend.

**65. How many tests are there and what do they cover?**
90 backend tests across 7 suites (auth, profiles, jobs, mentorship, events,
admin, platform) and 23 frontend tests (formatting, constants, key components,
the debounce hook).

**66. How are tests isolated?**
`tests/setup.js` connects to `MONGODB_URI_TEST`, ensures indexes, and deletes all
documents after each test. Tests run with `--runInBand`.

**67. Why hit a real database instead of mocking Mongoose?**
It verifies indexes, unique constraints and queries end-to-end, which is exactly
where subtle bugs hide.

**68. Give examples of edge cases tested.**
Duplicate application → 409; pending alumnus posting → 403; unauthenticated
admin route → 401; missing CSRF → 403; duplicate active mentorship; event
capacity/deadline rules; password never returned.

---

## H. Scenario / design questions

**69. How would you add real email for password reset?**
Replace the console placeholder in `authController` with a mailer (Nodemailer/SES),
keep the hashed `passwordResetToken` + `passwordResetExpires` fields (already
present), and send a link containing the token.

**70. How would you move uploads to the cloud?**
Swap multer disk storage for an S3/Cloudinary storage engine and store the
returned URL in `profilePhoto`/`resume` (already a string path).

**71. How would you add real-time notifications?**
Add Socket.IO (or SSE) on the server, authenticate the socket with the same JWT,
and emit events when `notificationService.createNotification` runs.

**72. How would you scale this?**
The API is stateless, so run multiple instances behind a load balancer, use a
managed MongoDB replica set/Atlas, add Redis for hot reads, and move uploads to
object storage.

**73. What happens if two students apply at the same instant?**
The unique `(job, student)` index rejects the second insert with a duplicate key
error, mapped to 409 — no race condition.

**74. How would you support multiple institutions?**
Add an `institution` field (or an `Institution` model) and scope queries and
uniqueness by it; make it part of the JWT/session context.

**75. What would you improve if you had more time?**
Real email, object storage, real-time notifications, Atlas Search, cursor
pagination, and a CI pipeline.

---

## I. Quick-fire definitions

| Term | Definition |
|------|------------|
| REST | Architectural style using HTTP resources and methods. |
| JWT | Signed token carrying claims (`sub`, `role`, `exp`). |
| httpOnly | Cookie flag making it unreadable by JavaScript. |
| CSRF | Cross-Site Request Forgery. |
| bcrypt | Adaptive password-hashing function with a salt. |
| Mongoose | ODM mapping MongoDB documents to schemas/models. |
| Index | Data structure speeding up queries / enforcing uniqueness. |
| Partial index | Index over documents matching a filter. |
| Virtual | Computed Mongoose property not stored in MongoDB. |
| Middleware | Function with `(req, res, next)` in the Express pipeline. |
| Sanitisation | Removing dangerous characters/operators from input. |
| RBAC | Role-Based Access Control. |
| SPA | Single Page Application. |
| HMR | Hot Module Replacement (Vite dev feature). |
| Envelope | Standard success/error response wrapper. |

---

## J. Common follow-ups and traps

**Q: Why not store the JWT in localStorage?**
XSS can read localStorage. httpOnly cookies are not readable by scripts; the
CSRF risk is handled separately.

**Q: Is CSRF possible with an httpOnly cookie?**
Yes, cookies are sent automatically, so we add the double-submit CSRF token and
`SameSite=Lax`.

**Q: Can the client be trusted for role checks?**
No. Client guards are UX only; the server re-checks role, ownership and approval
on every request.

**Q: Why is `passwordHash` `select: false`?**
So it is never accidentally serialised; login explicitly re-selects it.

**Q: Why does the frontend sometimes use `x.id || x._id`?**
Some models expose a string `id` via `toJSON`; others only have `_id`. The
fallback keeps the client resilient.

**Q: What if MongoDB is down?**
`connectDatabase` prints actionable instructions and `server.js` exits with a
non-zero code instead of serving a broken API.
