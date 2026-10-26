# AlumniConnect — API Documentation

REST API for the AlumniConnect platform.

- **Base URL (local):** `http://localhost:5000/api/v1`
- **Health check:** `GET /health` (note: **not** under `/api/v1`)
- **Content type:** `application/json` (uploads use `multipart/form-data`)
- **Authentication:** httpOnly cookie named `ac_token` (default), or
  `Authorization: Bearer <token>` for API clients and tests.
- **CSRF:** every non-`GET` request must send the `x-csrf-token` header that
  matches the readable `ac_csrf` cookie. Get one from `GET /auth/csrf` (the
  client fetches it automatically).

---

## Response envelope

**Success**

```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "meta": { "page": 1, "limit": 9, "total": 42, "totalPages": 5 }
}
```

`meta` is only present on paginated or aggregating endpoints.

**Error**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "A valid email is required." }],
  "code": "CSRF_INVALID"
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success / updated. |
| 201 | Created. |
| 400 | Bad request / validation error. |
| 401 | Not authenticated. |
| 403 | Forbidden (role, approval, CSRF). |
| 404 | Not found. |
| 409 | Conflict (duplicate). |
| 422 | Validation failed (express-validator). |
| 429 | Rate limited. |
| 500 | Server error. |

## Common query parameters

Most list endpoints accept:

| Param | Example | Notes |
|-------|---------|-------|
| `page` | `1` | 1-based page number. |
| `limit` | `9` | Page size (endpoint-specific default). |
| `q` | `react` | Free-text search. |
| `sortBy` | `createdAt` | Endpoint-specific allow-list. |
| `order` | `asc` \| `desc` | Sort direction. |

Paginated responses include `meta: { page, limit, total, totalPages }`.

---

## 1. Auth — `/auth`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/auth/csrf` | Public | Issue/return a CSRF token. |
| `POST` | `/auth/register` | Public | Register as `student` or `alumni`. |
| `POST` | `/auth/login` | Public | Sign in, sets the httpOnly cookie. |
| `POST` | `/auth/logout` | Authenticated | Clear the auth cookie. |
| `GET` | `/auth/me` | Authenticated | Current user + profile. |
| `POST` | `/auth/forgot-password` | Public | Generate a reset token (dev: logged). |
| `POST` | `/auth/reset-password` | Public | Reset the password using a token. |

### `POST /auth/register`

```json
{
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "password": "Secret123",
  "role": "student",
  "phone": "+91 90000 00000"
}
```

- `password`: 8–72 chars, must contain a letter and a number.
- `role`: `student` (default) or `alumni`. `admin` cannot self-register.
- An `alumni` registration starts with `approvalStatus: "pending"`.
- **201** → `data: { user }` and sets the auth cookie.

### `POST /auth/login`

```json
{ "email": "student@alumniconnect.example.com", "password": "StudentDemo@123" }
```

- Rejects suspended / inactive accounts and rejected alumni (403).
- **200** → `data: { user, csrfToken }`, sets `ac_token` + `ac_csrf` cookies.

### `GET /auth/me`

**200** →

```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "...", "role": "alumni", "approvalStatus": "approved" },
    "profile": { "department": "Computer Science", "...": "..." }
  }
}
```

### `POST /auth/reset-password`

```json
{ "token": "<reset token>", "password": "NewSecret123" }
```

---

## 2. Profiles — `/profiles`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/profiles` | Any signed-in user | Alumni directory (paginated). |
| `GET` | `/profiles/metadata` | Any signed-in user | Distinct departments, batches, companies, skills. |
| `PUT` | `/profiles/me` | Student \| Alumni | Update own profile. |
| `POST` | `/profiles/me/photo` | Student \| Alumni | Upload a profile photo (`multipart`, field `photo`). |
| `DELETE` | `/profiles/me/photo` | Student \| Alumni | Remove the profile photo. |
| `POST` | `/profiles/me/resume` | Student | Upload a resume (`multipart`, field `resume`). |
| `GET` | `/profiles/:id` | Any signed-in user | A single alumni profile by user id. |

**Directory query params:** `q`, `department`, `graduationYear`, `batch`,
`company`, `jobTitle`, `skill`, `openToMentorship`, `sortBy`
(`name` \| `graduationYear` \| `createdAt`), `order`, `page`, `limit`.

**`PUT /profiles/me`** accepts student **or** alumni fields (whichever match the
role). Common: `name`, `phone`, `university`, `department`, `degree`, `course`,
`graduationYear`, `biography`, `location`, `skills[]`.
Alumni-only: `currentCompany`, `jobTitle`, `batch`, `linkedinUrl`,
`mentorshipAreas`, `openToMentorship`, `workExperience[]`.
Student-only: `studentId`, `currentSemester`, `interests`.

**Upload rules:** images `image/jpeg|png|webp|gif`; documents `application/pdf`,
`application/msword`, `.docx`. Max size `MAX_UPLOAD_MB` (default 5 MB).

---

## 3. Jobs — `/jobs`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/jobs` | Student \| Alumni \| Admin | List jobs (paginated). |
| `POST` | `/jobs` | **Approved alumni** | Create a job (starts `pending`). |
| `POST` | `/jobs/:id/apply` | Student | Apply (`multipart`, field `resume` + `coverLetter`). |
| `GET` | `/jobs/:id/applications` | Alumni \| Admin | Applications for a job. |
| `GET` | `/jobs/:id` | Student \| Alumni \| Admin | Job detail (increments `views`). |
| `PUT` | `/jobs/:id` | Alumni (owner) \| Admin | Update a job. |
| `DELETE` | `/jobs/:id` | Alumni (owner) \| Admin | Delete a job. |

**List query params:** `q`, `location`, `workMode`, `employmentType`,
`experienceLevel`, `company`, `skill`, `onlyOpen`, `postedBy`
(alumni see all of their own posts incl. pending/closed), `page`, `limit`.

Students/alumni only ever see **approved** jobs in the list; a job's detail is
also restricted to approved jobs unless the caller is the owner or an admin.

**`POST /jobs` body**

```json
{
  "title": "Frontend Developer",
  "company": "NovaTech Solutions",
  "description": "At least 30 characters describing the role...",
  "location": "Bengaluru, India",
  "workMode": "hybrid",
  "employmentType": "full-time",
  "experienceLevel": "entry",
  "skillsRequired": ["React", "JavaScript"],
  "salaryMin": 600000,
  "salaryMax": 900000,
  "salaryCurrency": "INR",
  "salaryPeriod": "year",
  "applicationDeadline": "2026-12-01",
  "openings": 2,
  "contactEmail": "jobs@novatech.example.com"
}
```

> Posting requires an **approved** alumni account (`requireApprovedAlumni`).
> A pending alumnus receives `403` with an explanatory message.

**`POST /jobs/:id/apply`** — `multipart/form-data`:
`resume` (file, required), `coverLetter` (text, optional ≤ 4000).
A student can apply to a job **once** (409 on duplicate).

**`GET /jobs/:id/applications` query:** `applicationStatus`, `page`, `limit`.

---

## 3b. Applications — `/applications`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/applications/me` | Student | My applications. |
| `GET` | `/applications/received` | Alumni | Applications across my jobs. |
| `PATCH` | `/applications/:id/status` | Alumni (owner) \| Admin | Update status. |
| `PATCH` | `/applications/:id/withdraw` | Student (owner) | Withdraw an application. |

**Status update body**

```json
{ "applicationStatus": "shortlisted", "statusNote": "Great portfolio." }
```

Allowed: `submitted`, `under_review`, `shortlisted`, `accepted`, `rejected`,
`withdrawn`.

---

## 4. Mentorship — `/mentorship`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/mentorship` | Student \| Alumni \| Admin | List mentors (approved alumni). |
| `POST` | `/mentorship/requests` | Student | Create a request. |
| `GET` | `/mentorship/requests/me` | Student \| Alumni \| Admin | Requests I sent or received. |
| `GET` | `/mentorship/requests/:id` | Participants \| Admin | Request detail. |
| `PATCH` | `/mentorship/requests/:id` | Student \| Alumni \| Admin | Respond / update status. |
| `DELETE` | `/mentorship/requests/:id` | Student (owner) \| Admin | Cancel a request. |

**Mentor list query:** `q`, `department`, `graduationYear`, `skill`, `page`, `limit`.

**Create request body**

```json
{
  "alumniId": "66f...",
  "message": "At least 10 characters about why you want guidance.",
  "careerGoal": "Become a full-stack developer.",
  "areaOfInterest": "Web Development"
}
```

A student may hold only **one active request per alumnus** (partial unique index).

**Respond body** (alumnus)

```json
{
  "status": "accepted",
  "responseMessage": "Happy to help — let's meet this weekend.",
  "meetingDetails": {
    "mode": "online",
    "scheduledAt": "2026-11-02T15:00:00.000Z",
    "link": "https://meet.example.com/abc",
    "location": "",
    "notes": "Bring your resume."
  }
}
```

Allowed statuses: `accepted`, `rejected`, `completed`, `cancelled`.

---

## 5. Events — `/events`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/events` | Public | List published events. |
| `GET` | `/events/registrations/me` | Authenticated | My event registrations. |
| `POST` | `/events` | Admin | Create an event. |
| `GET` | `/events/:id/registrations` | Admin \| Alumni | Registrations for an event. |
| `POST` | `/events/:id/register` | Student \| Alumni | Register for an event. |
| `DELETE` | `/events/:id/register` | Student \| Alumni | Cancel a registration. |
| `GET` | `/events/:id` | Public | Event detail. |
| `PUT` | `/events/:id` | Admin | Update an event. |
| `DELETE` | `/events/:id` | Admin | Delete an event. |

**List query:** `q`, `eventType`, `mode`, `audience`, `upcoming`, `sortBy`
(`startDate` \| `createdAt`), `order`, `page`, `limit`, and
`includeAll=true` (admins only — includes drafts/cancelled).

Public callers never see `draft` events. Registration is only allowed while the
event is `published`, before its deadline and before `endDate`.

**Create / update body**

```json
{
  "title": "Career Fair 2026",
  "description": "At least 20 characters describing the event...",
  "eventType": "career_fair",
  "mode": "offline",
  "venue": "Main Auditorium",
  "startDate": "2026-12-05T09:00:00.000Z",
  "endDate": "2026-12-05T17:00:00.000Z",
  "registrationDeadline": "2026-12-01T00:00:00.000Z",
  "capacity": 400,
  "audience": "all",
  "status": "published",
  "bannerColor": "royal"
}
```

`endDate` must be on or after `startDate`.

---

## 6. Announcements — `/announcements`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/announcements` | Public | List announcements (published for non-admins). |
| `GET` | `/announcements/:id` | Public | Announcement detail. |
| `POST` | `/announcements` | Admin | Create an announcement. |
| `PUT` | `/announcements/:id` | Admin | Update an announcement. |
| `DELETE` | `/announcements/:id` | Admin | Delete an announcement. |

**List query:** `q`, `audience`, `status` (admin), `page`, `limit`.

**Create body**

```json
{
  "title": "Call for alumni mentors",
  "body": "At least 10 characters...",
  "audience": "alumni",
  "priority": "high",
  "status": "published",
  "expiresAt": "2026-12-31T00:00:00.000Z"
}
```

---

## 6b. Notifications — `/notifications`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/notifications` | Authenticated | My notifications. |
| `GET` | `/notifications/unread-count` | Authenticated | `data: { count }`. |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all as read. |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark one as read. |
| `DELETE` | `/notifications/:id` | Authenticated | Delete a notification. |

**List query:** `read` (`true`/`false`), `category`, `page`, `limit`.

---

## 7. Dashboard — `/dashboard`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/dashboard/student` | Student | Student KPIs + recent activity. |
| `GET` | `/dashboard/alumni` | Alumni | Alumni KPIs + recent activity. |

> Admins use `GET /admin/dashboard`.

---

## 8. Admin — `/admin`

All routes require `role: admin`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/dashboard` | Counts, charts, queues, recent activity. |
| `GET` | `/admin/users` | List users. Query: `q`, `role`, `accountStatus`, `approvalStatus`, `sortBy`, `order`, `page`, `limit`. |
| `GET` | `/admin/users/:id` | User + profile + stats. |
| `PATCH` | `/admin/users/:id/status` | Update `accountStatus` / `role` (+ `reason`). |
| `GET` | `/admin/alumni/pending` | Pending alumni queue (`[{ user, profile }]`). |
| `GET` | `/admin/alumni/reviewed` | Previously reviewed alumni. |
| `PATCH` | `/admin/alumni/:id/approval` | Approve/reject alumni. |
| `GET` | `/admin/jobs/pending` | Jobs awaiting approval. |
| `GET` | `/admin/jobs` | All jobs. Query: `q`, `approvalStatus`, `jobStatus`, `page`, `limit`. |
| `PATCH` | `/admin/jobs/:id/approval` | Approve/reject a job. |
| `GET` | `/admin/mentorship` | Mentorship monitoring. |
| `GET` | `/admin/reports` | Aggregate report data. |
| `GET` | `/admin/reports/export` | CSV export. Query: `type` (`users` \| `alumni` \| `jobs` \| `applications` \| `mentorship` \| `events`). |
| `GET` | `/admin/activity` | Activity log. Query: `action`, `actor`, `page`, `limit`. |

**Approval bodies**

```json
// PATCH /admin/alumni/:id/approval
{ "approvalStatus": "approved" }
{ "approvalStatus": "rejected", "reason": "Could not verify graduation details." }
```

```json
// PATCH /admin/jobs/:id/approval
{ "approvalStatus": "rejected", "reason": "Duplicate posting." }
```

`reason` is **required** when rejecting.

**User status body**

```json
{ "accountStatus": "suspended", "reason": "Policy violation." }
```

Admins may only assign the `student` or `alumni` role (never `admin`).

**Dashboard response (shape)**

```json
{
  "data": {
    "counts": { "students": 5, "alumni": 4, "jobs": 6, "applications": 8, "events": 4 },
    "charts": {
      "usersByDepartment": [],
      "alumniByGraduationYear": [],
      "applicationStatus": [],
      "mentorshipStatus": [],
      "monthlyRegistrations": []
    },
    "pendingAlumni": [],
    "pendingJobs": [],
    "upcomingEvents": [],
    "recentActivity": []
  }
}
```

---

## 9. Public — `/public`

Unauthenticated endpoints used by the landing page.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/public/stats` | Platform counts (alumni, students, jobs, events). |
| `GET` | `/public/alumni-preview` | A few featured alumni (`limit`, default 6). |
| `GET` | `/public/alumni-preview?limit=6` | |
| `GET` | `/public/testimonials` | Static/curated testimonials. |

---

## 9b. Health — `/health`

```
GET /health
→ 200 { "success": true, "message": "AlumniConnect API is healthy.", "data": { "uptime": 123.4 } }
```

---

## 9c. Static uploads

Uploaded files are served from `/uploads/...`, e.g.
`http://localhost:5000/uploads/photos/abc-123.jpg`. In development the Vite
proxy also serves them at `/uploads/...` on the frontend origin.

---

## cURL examples

```bash
# 1. Get a CSRF token + cookies
curl -c cookies.txt http://localhost:5000/api/v1/auth/csrf

# 2. Log in (reuse the CSRF cookie in the header)
CSRF=$(grep ac_csrf cookies.txt | awk '{print $7}')
curl -b cookies.txt -c cookies.txt -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"email":"student@alumniconnect.example.com","password":"StudentDemo@123"}'

# 3. Call a protected endpoint with the cookie
curl http://localhost:5000/api/v1/jobs -b cookies.txt
```

> For quick server-side testing you can bypass CSRF by setting
> `CSRF_ENABLED=false` in `backend/.env`. Rate limiting is disabled automatically
> when `NODE_ENV=test`.

---

## Error codes reference

| Code | Where | Meaning |
|------|-------|---------|
| `CSRF_INVALID` | Any non-GET | Missing or mismatched CSRF header. |
| `VALIDATION_ERROR` | Write endpoints | Field-level validation failed (see `errors`). |
| `RATE_LIMITED` | Global / auth | Too many requests. |
| `NOT_FOUND` | Any | Resource does not exist. |
| `FORBIDDEN` | Role / approval guards | Authenticated but not allowed. |
| `UNAUTHORIZED` | `protect` | No valid session. |
