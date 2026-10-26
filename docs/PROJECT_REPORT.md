# AlumniConnect — Project Report

A full-stack web platform for alumni–student engagement.

---

## Declaration

This report documents the design and implementation of **AlumniConnect**, a
full-stack web application developed as an academic project. All source code,
documentation and the automated test suite described here are included in this
repository.

---

## Table of contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Scope](#5-scope)
6. [Literature / existing systems review](#6-literature--existing-systems-review)
7. [Proposed system](#7-proposed-system)
8. [System architecture](#8-system-architecture)
9. [Technology stack and justification](#9-technology-stack-and-justification)
10. [Database design](#10-database-design)
11. [Module description](#11-module-description)
12. [Implementation](#12-implementation)
13. [Security](#13-security)
14. [Testing and results](#14-testing-and-results)
15. [Screens and user flow](#15-screens-and-user-flow)
16. [Advantages and limitations](#16-advantages-and-limitations)
17. [Future enhancements](#17-future-enhancements)
18. [Conclusion](#18-conclusion)
19. [References](#17-references)

---

## 1. Abstract

Alumni are one of the most valuable resources a college possesses, yet their
willingness to help — hiring juniors, mentoring, guest lectures, referrals — is
rarely captured in a structured, usable way. AlumniConnect is a role-based web
platform that turns scattered goodwill into a searchable network. Approved
alumni maintain rich professional profiles, publish job opportunities (reviewed
by administrators), and accept mentorship requests from students. Students
discover alumni, apply to opportunities with a resume, request mentorship and
register for events. Administrators moderate registrations and job posts,
publish announcements, monitor activity and export reports.

The system is implemented as a **three-tier architecture** — a React 18 + Vite
single page application, an Express 4 REST API under `/api/v1`, and MongoDB
modelled through Mongoose. Authentication uses signed JWTs in **httpOnly
cookies** complemented by **double-submit CSRF** protection; passwords are
hashed with bcryptjs. The API is hardened with Helmet, CORS allow-listing, rate
limiting and input sanitisation, and validates every write with
express-validator. The deliverable includes **90 backend tests** (Jest +
Supertest) and **23 frontend tests** (Vitest + Testing Library), a demo data
seeder, and a complete documentation set.

---

## 2. Introduction

Educational institutions accumulate a valuable network of former students who
work across industry, research and entrepreneurship. Yet engagement is usually
ad-hoc: a shared spreadsheet of contacts, a WhatsApp group, an occasional
reunion. Students struggle to find alumni willing to mentor them, alumni do not
know which students are looking for internships, and administrators have little
visibility into either side.

**AlumniConnect** turns that informal network into a structured, role-aware
platform. It pairs a public marketing surface with an authenticated workspace
tailored to three roles, and gives administrators the controls and reporting
needed to keep content trustworthy.

---

## 3. Problem statement

Existing engagement methods suffer from:

- **Fragmentation** — contacts live in spreadsheets, groups and inboxes.
- **No verification** — anyone can claim to be an alumnus or post a job.
- **Poor discoverability** — students cannot filter alumni by department,
  graduation year, company or skills.
- **No workflow** — applications, mentorship requests and event registrations
  are handled by email with no status tracking.
- **No oversight** — administrators cannot moderate opportunities or measure
  engagement.

---

## 4. Objectives

1. Provide a **verified alumni directory** with filtering and detailed profiles.
2. Enable approved alumni to **post job opportunities** and manage applicants.
3. Enable students to **apply to jobs**, **request mentorship** and **register
   for events** with full status tracking.
4. Give administrators **approval workflows, user management, announcements and
   reports**.
5. Enforce **security best practices** (hashing, httpOnly JWT cookies, CSRF,
   rate limiting, validation, sanitisation).
6. Provide an **in-app notification** system and an **audit trail**.
7. Deliver a **responsive, accessible** UI with clear states (loading, empty,
   error).
8. Ship a **reproducible** project: seeder, environment templates and tests.

---

## 5. Scope

**In scope**

- Three roles: student, alumni, administrator (with an approval sub-state for alumni).
- Authentication (register/login/logout/forgot-reset password placeholder).
- Profiles + photo/resume uploads.
- Alumni directory with search & filters.
- Job board + applications + applicant tracking.
- Mentorship requests + responses with meeting details.
- Events + registrations.
- Announcements + notifications.
- Admin dashboard, approvals, user management, reports (CSV), activity log.
- Automated tests and documentation.

**Out of scope (future work)**

- Real email/SMS delivery (a console-based placeholder is used).
- Payments, chat, video calling, native mobile apps, multi-tenant institutions.
- Cloud object storage (local disk storage is used for development).

---

## 6. Literature / existing systems review

| System | Strength | Limitation for our use-case |
|--------|----------|-----------------------------|
| LinkedIn | Huge network, rich profiles | Not institution-centric; no approval workflow; students cannot easily discover *their* alumni. |
| Ten Thousand Coffees | Mentorship matching | Commercial, no job applications for a specific campus. |
| WhatsApp / Google Groups | Zero friction | No structure, no verification, no tracking, no search. |
| College placement portals | Good for placements | Usually job-only; no mentorship, directory or engagement metrics. |
| Custom spreadsheets | Familiar | No access control, no workflows, error-prone. |

AlumniConnect combines institution-centric directory, dual approval workflows
(accounts and jobs) and mentorship + events + reporting in one platform.

---

## 7. Proposed system

AlumniConnect is a three-tier web application:

- **Presentation tier** — a React SPA with public, auth and dashboard shells.
- **Application tier** — a stateless Express REST API under `/api/v1`.
- **Data tier** — MongoDB accessed through Mongoose models.

Key design choices:

- **Role-based access control** enforced on the server (`authorize`) with an
  extra **approval gate** (`requireApprovedAlumni`) for alumni-only actions.
- **Two approval workflows** — alumni accounts and job postings are reviewed
  independently by administrators.
- **Stateless auth** via a signed JWT in an httpOnly cookie, making scaling trivial.
- **Consistent API contract** — every response uses one success/error envelope.

---

## 8. System architecture

```
┌──────────────────────────────────────────┐
│              Browser (React SPA)         │
│  PublicLayout / AuthLayout / Dashboard   │
│  AuthContext · ToastContext · useFetch   │
└───────────────┬──────────────────────────┘
                │ HTTPS (JSON) + httpOnly cookie + CSRF header
┌───────────────▼──────────────────────────┐
│           Express REST API (/api/v1)     │
│  helmet · cors · sanitize · rate limit   │
│  CSRF → routes → validators → controllers│
│  services (notifications, activity)      │
│  centralised error handler               │
└───────────────┬──────────────────────────┘
                │ Mongoose
┌───────────────▼──────────────────────────┐
│                 MongoDB                  │
│           11 collections                 │
└──────────────────────────────────────────┘
```

See [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md) for the detailed design.

---

## 9. Technology stack and justification

| Technology | Why it was chosen |
|------------|-------------------|
| **React 18** | Component model, huge ecosystem, hooks for stateful logic. |
| **Vite 5** | Fast dev server and production builds; first-class React support. |
| **React Router 6** | Declarative nested routes with layout routes and guards. |
| **Tailwind CSS 3** | Utility-first styling keeps markup and design consistent, no CSS drift. |
| **Recharts** | Declarative charts for the admin dashboard. |
| **React Hook Form** | Performant forms with minimal re-renders. |
| **Axios** | Interceptors (CSRF, friendly errors) and `withCredentials`. |
| **Node.js + Express** | Minimal, well understood HTTP layer; enormous middleware ecosystem. |
| **MongoDB + Mongoose** | Flexible documents fit varied profiles; schema validation + indexes. |
| **JWT + bcryptjs** | Stateless auth and industry-standard password hashing. |
| **express-validator** | Server-side validation rules co-located with routes. |
| **multer** | Multipart uploads (photos, resumes). |
| **Helmet + rate-limit + sanitize** | Baseline hardening with minimal code. |
| **Jest + Supertest** | Reliable API tests against a real test database. |
| **Vitest + Testing Library** | Fast, Vite-native component tests. |

---

## 10. Database design

Eleven collections model the domain:

`users`, `alumniprofiles`, `studentprofiles`, `jobs`, `jobapplications`,
`mentorshiprequests`, `events`, `eventregistrations`, `announcements`,
`notifications`, `activitylogs`.

Highlights:

- `users` stores identity/role/approval; profiles are separate collections.
- `alumniprofiles` is `1:1` with an alumni user; `studentprofiles` with a student.
- `jobapplications` has a **unique `(job, student)`** index.
- `mentorshiprequests` has a **partial unique** index on active requests.
| `eventregistrations` has a **unique** `(event, user)` index.

Full field, index and relationship details are in
[`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md).

---

## 10b. Entity relationship summary

```
User 1───1 AlumniProfile          User 1───1 StudentProfile
User 1───* Job (postedBy)         Job 1───N JobApplication
User 1───* JobApplication         User 1──N MentorshipRequest (student)
User 1──N MentorshipRequest (alumni)  Event 1──N EventRegistration
User 1──N Notification            User 1──N ActivityLog
User 1──N Announcement (createdBy)
```

---

## 11. Module description

1. **Authentication & authorisation** — register, login, logout, me, password
   reset placeholder, CSRF issuance, role/approval guards.
2. **Profiles & directory** — student/alumni profile editing, photo/resume
   upload, searchable directory, metadata for filters.
3. **Jobs & applications** — alumni post jobs (pending approval), students apply
   with a resume, alumni review applicants and update statuses.
4. **Mentorship** — mentor discovery, requests, accept/reject/complete with
   meeting details.
5. **Events** — admin CRUD, public listing, student/alumni registration.
6. **Announcements & notifications** — targeted announcements; per-user inbox
   with unread counts.
7. **Admin & reporting** — dashboard charts, approvals, user management,
   mentorship monitoring, CSV exports, activity log.
8. **Public site** — landing page with live stats, about, public event/announcement
   detail pages.

---

## 12. Implementation

**Backend (summary)**

- `app.js` wires middleware in a deliberate order (security → parsing → static →
  health → rate limit → CSRF → routes → errors).
- `server.js` connects to MongoDB and supports graceful shutdown on signals.
- Controllers use `asyncHandler` and throw `ApiError` helpers; responses use
  `sendSuccess`.
- Services `notificationService` and `activityService` are best-effort and never
  break the request flow.
- 11 Mongoose models with validation, virtuals, `toJSON` transforms and indexes.

**Frontend (summary)**

- One axios instance with CSRF injection and refresh-and-retry.
- `useFetch` standardises loading/error/data handling.
- `AuthContext` owns the session; `ToastContext` owns transient feedback.
- Role-aware `NAV_BY_ROLE` drives the sidebar; guards protect route subtrees.
- Pages are split by role under `pages/{public,student,alumni,admin,shared}`.

**Demo data** — `npm run seed` upserts 1 admin, 3 approved alumni, 1 pending
alumnus, 5 students, 6 jobs, 8 applications, 5 mentorship requests, 4 events,
3 announcements, 8 notifications and 5 activity entries.

---

## 13. Security

The implementation follows OWASP-aligned practices:

- bcryptjs password hashing (10 rounds); hashes never serialised.
- JWT in an **httpOnly**, `SameSite=Lax` cookie; `Secure` configurable.
- **Double-submit CSRF** token on every mutating request.
- Server-side RBAC + approval gate + ownership checks.
- express-validator on all writes; express-mongo-sanitize against NoSQL injection.
- Helmet headers, CORS allow-list, global + auth rate limiting.
- Upload MIME allow-list, size cap, randomised filenames, `nosniff`.
- Centralised error handler that hides internals in production; production
  refuses to boot with a weak JWT secret.

See [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md#5-security-design) for details.

---

## 14. Testing and results

| Suite | Framework | Tests | Result |
|-------|-----------|-------|--------|
| Backend API | Jest + Supertest | 90 | ✅ all passing |
| Frontend | Vitest + Testing Library | 23 | ✅ all passing |
| **Total** | | **113** | ✅ |

Backend suites: `auth` (17), `profiles` (7), `jobs` (19), `mentorship` (11),
`events` (12), `admin` (17), `platform` (7). The suite runs against a dedicated
test database that is wiped after each test. See [`TESTING.md`](TESTING.md).

A live end-to-end smoke test of 35 API calls against the seeded database also
passed (registration → approval → job posting → application → mentorship →
event registration → admin reporting).

---

## 15. Screens and user flow

**Public visitor:** Landing (live stats, featured alumni, testimonials) → Events →
Event detail → Register/Login.

**Student:** Login → Dashboard → Directory → apply to a job (upload resume) →
track applications → request a mentor → register for an event → notifications.

**Alumni:** Login → Dashboard → complete profile → post a job (pending approval) →
review applicants per job → respond to mentorship requests → register for events.

**Admin:** Login → Dashboard (charts + queues) → approve alumni → approve jobs →
manage users → create events → publish announcements → export reports → review
activity log.

> The images/screenshots section can be populated with `docs/screenshots/` when
> preparing the final submission; the routes above map directly to screens.

---

## 16. Advantages and limitations

**Advantages**

- Verified, searchable alumni network.
- Two independent approval workflows keep content trustworthy.
- Full status tracking for applications, mentorship and registrations.
- Strong, demonstrable security posture.
- Reproducible: seeder + env templates + automated tests + docs.
- Clean three-tier separation that scales and is easy to extend.

**Limitations**

- Forgot-password is a development placeholder (no real email delivery).
- Uploads are stored on local disk (not durable across container restarts).
- Search uses regex/text indexes rather than a dedicated search engine.
- No real-time notifications (polling-based unread count).

---

## 17. Conclusion

AlumniConnect demonstrates a complete, secure and well-tested three-tier web
application that solves a real institutional problem. It applies role-based
access control, approval workflows, RESTful design, defensive security and an
automated test suite within a clean, maintainable architecture. The project is
reproducible in minutes thanks to the seeder, environment templates and
documentation, and is structured so that realistic extensions (email, object
storage, real-time notifications, search) can be added without re-architecting.

---

## Appendix A — Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@alumniconnect.example.com` | `AdminDemo@123` |
| Alumni (approved) | `alumni@alumniconnect.example.com` | `AlumniDemo@123` |
| Student | `student@alumniconnect.example.com` | `StudentDemo@123` |
| Alumni (pending) | `pending.alumni@alumniconnect.example.com` | `PendingDemo@123` |
| Other seeded users | — | `DemoUser@123` |

## Appendix B — Key project files

| File | Purpose |
|------|---------|
| `backend/src/app.js` | Express app + middleware order. |
| `backend/src/server.js` | Bootstrap + graceful shutdown. |
| `backend/src/routes/*.js` | Route table + guards. |
| `backend/src/controllers/*.js` | Business logic. |
| `backend/src/models/*.js` | MongoDB schemas. |
| `frontend/src/api/client.js` | axios + CSRF + errors. |
| `frontend/src/context/AuthContext.jsx` | Session lifecycle. |
| `frontend/src/routes/AppRoutes.jsx` | Route map. |
| `backend/scripts/seed.js` | Demo data. |

## References

1. Express.js documentation — https://expressjs.com
2. Mongoose documentation — https://mongoosejs.com
3. React documentation — https://react.dev
4. Vite documentation — https://vitejs.dev
5. OWASP Cheat Sheet Series — https://cheatsheetseries.owasp.org
6. MongoDB Manual — https://www.mongodb.com/docs
7. Jest — https://jestjs.io ; Vitest — https://vitest.dev
8. RFC 7519 — JSON Web Tokens.
