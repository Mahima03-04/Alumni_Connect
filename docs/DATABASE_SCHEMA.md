# AlumniConnect — Database Schema

AlumniConnect uses **MongoDB** with **Mongoose ODM**. This document describes
every collection, its fields, validation rules, indexes and relationships.

- **Database name (dev):** `alumniconnect`
- **Database name (test):** `alumniconnect_test`
- **ODM:** Mongoose 8
- **Collections:** 11

> **Conventions**
> - Every document has `createdAt` / `updatedAt` (Mongoose `timestamps: true`)
>   unless noted.
> - `_id` is a MongoDB `ObjectId`. Models that expose a virtual-friendly JSON
>   (`User`, `Job`, `Event`) also add a string `id` via a `toJSON` transform.
> - References are stored as `ObjectId` with `ref` to the target model.

---

## 1. Entity relationship overview

```
                       ┌──────────────┐
                       │     User     │
                       └──────┬───────┘
        ┌─────────────┬───────┼──────────┬──────────────┬───────────────┐
        │             │       │          │              │               │
  AlumniProfile  StudentProfile │    Notification   ActivityLog   (approver)
        │             │       │          │              │
        │             │   JobApplication  │              │
        │             │       │          │              │
        │             │     Job ─────────┘              │
        │             │       │                          │
        │        MentorshipRequest                       │
        │             │                                  │
        └──── Event ──┴── EventRegistration ─────────────┘
                       │
                  Announcement (createdBy → User)
```

| Relationship | Cardinality | Notes |
|--------------|-------------|-------|
| `User` → `AlumniProfile` | 1 : 0..1 | Alumni accounts. |
| `User` → `StudentProfile` | 1 : 0..1 | Student accounts. |
| `User` (alumni) → `Job` | 1 : N | `postedBy`. |
| `Job` → `JobApplication` | 1 : N | Unique per `(job, student)`. |
| `User` (student) → `JobApplication` | 1 : N | `student`. |
| `User` (student) → `MentorshipRequest` | 1 : N | `student`. |
| `User` (alumni) → `MentorshipRequest` | 1 : N | `alumni`. |
| `Event` → `EventRegistration` | 1 : N | Unique per `(event, user)`. |
| `User` → `Notification` | 1 : N | `user`. |
| `User` (admin) → `Announcement` | 1 : N | `createdBy`. |
| `User` → `ActivityLog` | 1 : N | `actor`. |

---

## 2. `users`

Core identity, authentication and role information. Profiles live in separate
collections to keep this document small.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `_id` | ObjectId | auto | |
| `name` | String | ✔ | 2–120 chars, trimmed. |
| `email` | String | ✔ | **unique**, lowercase, trimmed, email regex. |
| `passwordHash` | String | ✔ | bcrypt hash; `select: false` (never returned). |
| `role` | String | ✔ | enum `student` \| `alumni` \| `admin`; default `student`. |
| `accountStatus` | String | | enum `active` \| `inactive` \| `suspended`; default `active`. |
| `approvalStatus` | String | | enum `not_required` \| `pending` \| `approved` \| `rejected`; default `not_required` (meaningful for alumni). |
| `approvalReason` | String | | ≤ 500 chars, review note on rejection. |
| `approvedAt` | Date | | When an admin approved the alumni. |
| `approvedBy` | ObjectId → User | | Reviewing admin. |
| `profilePhoto` | String | | Relative path e.g. `/uploads/photos/xyz.jpg`. |
| `phone` | String | | ≤ 30 chars. |
| `lastLogin` | Date | | Updated on successful login. |
| `passwordResetToken` | String | | `select: false`; local forgot-password placeholder. |
| `passwordResetExpires` | Date | | `select: false`. |
| `createdAt` / `updatedAt` | Date | auto | |

**Indexes**

| Index | Purpose |
|-------|---------|
| `email` (unique) | Login lookups + duplicate prevention. |
| `{ role, accountStatus }` | Admin user filters. |
| `{ approvalStatus, role }` | Alumni approval queue. |
| `{ name: 'text', email: 'text' }` | Admin search. |

**Virtuals**

- `isApprovedAlumni` → `role === 'alumni' && approvalStatus === 'approved'`.
- `canApprove...`/`canLogin` → active accounts that are not rejected alumni.

**Instance methods:** `matchPassword`, `setPassword` (hashes with bcrypt).
**Static methods:** `hashPassword`.

---

## 3. `alumniprofiles`

Extended alumni information (education, career, mentorship preferences).

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `user` | ObjectId → User | ✔ | **unique** (1:1). |
| `university` | String | | ≤ 200 chars. |
| `department` | String | | ≤ 200 chars. |
| `degree` | String | | ≤ 160 chars. |
| `course` | String | | ≤ 160 chars. |
| `graduationYear` | Number | | 1950–2100. |
| `batch` | String | | e.g. `2012-2016`. |
| `currentCompany` | String | | ≤ 160 chars. |
| `jobTitle` | String | | ≤ 160 chars. |
| `workExperience` | Array of subdocs | | See below. |
| `skills` | [String] | | Tag list. |
| `mentorshipAreas` | [String] | | Topics the alumnus will mentor on. |
| `openToMentorship` | Boolean | | default `true`. |
| `biography` | String | | ≤ 2000 chars. |
| `linkedinUrl` | String | | |
| `location` | String | | |
| `profileCompletion` | Number | | 0–100, computed. |

**`workExperience` subdocument**

| Field | Type | Notes |
|-------|------|-------|
| `company` | String | required, ≤ 160. |
| `title` | String | required, ≤ 160. |
| `from` / `to` | Date | |
| `current` | Boolean | Hides `to`. |
| `description` | String | ≤ 1000. |

**Indexes:** `{ department, graduationYear }`, `{ skills }`, `{ skills }`,
`{ university, department, currentCompany, jobTitle, skills, biography }` (text),
`{ user }` unique.

---

## 4. `studentprofiles`

Student academic and application information.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `user` | ObjectId → User | ✔ | **unique** (1:1). |
| `studentId` | String | | unique (sparse), e.g. `STU2021001`. |
| `university` | String | | |
| `department` | String | | |
| `degree` | String | | |
| `course` | String | | |
| `currentSemester` | Number | | 1–16. |
| `graduationYear` | Number | | 1950–2100. |
| `skills` | [String] | | |
| `interests` | [String] | | |
| `resume` | String | | Path to the latest uploaded resume PDF. |
| `biography` | String | | ≤ 2000. |
| `location` | String | | |

**Indexes:** `{ user }` unique, `{ studentId }` unique sparse,
`{ department, graduationYear }`, `{ skills }`.

---

## 5. `jobs`

Job / internship opportunities posted by approved alumni.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `title` | String | ✔ | ≤ 200. |
| `company` | String | ✔ | ≤ 200. |
| `description` | String | ✔ | 30–8000 chars (validated). |
| `location` | String | | |
| `workMode` | String | | `remote` \| `onsite` \| `hybrid`. |
| `employmentType` | String | | `full-time` \| `part-time` \| `internship` \| `contract` \| `freelance`. |
| `skillsRequired` | [String] | | |
| `experienceLevel` | String | | `fresher` \| `entry` \| `mid` \| `senior` \| `lead`. |
| `salaryMin` / `salaryMax` | Number | | ≥ 0. |
| `salaryCurrency` | String | | default `INR`. |
| `salaryPeriod` | String | | `month` \| `year`. |
| `applicationDeadline` | Date | | |
| `openings` | Number | | 1–1000, default 1. |
| `contactEmail` | String | | |
| `postedBy` | ObjectId → User | ✔ | The alumni author. |
| `approvalStatus` | String | | `pending` \| `approved` \| `rejected`, default `pending`. |
| `rejectionReason` | String | | ≤ 500. |
| `approvedAt` / `approvedBy` | Date / ObjectId | | Admin approval metadata. |
| `jobStatus` | String | | `open` \| `closed` \| `withdrawn`, default `open`. |
| `views` | Number | | Incremented on detail view. |

**Virtuals:** `isAcceptingApplications` (approved **and** open **and** before
deadline). Added to `toJSON` / `toObject`.

**Indexes:** `{ postedBy }`, `{ approvalStatus, jobStatus }`, `{ approvalStatus, createdAt: -1 }`,
text index on `title, company, description`.

---

## 6. `jobapplications`

A student's application to a specific job.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `job` | ObjectId → Job | ✔ | |
| `student` | ObjectId → User | ✔ | |
| `applicantName` / `applicantEmail` | String | | Snapshot at apply time. |
| `resume` | String | ✔ | Path to the submitted PDF. |
| `coverLetter` | String | | ≤ 4000. |
| `applicationStatus` | String | | `submitted` \| `under_review` \| `shortlisted` \| `accepted` \| `rejected` \| `withdrawn`. |
| `statusNote` | String | | ≤ 1000, reviewer note. |
| `appliedAt` / `statusUpdatedAt` | Date | | |

**Indexes**

| Index | Purpose |
|-------|---------|
| `{ job, student }` **unique** | A student applies to a job only once. |
| `{ student, createdAt: -1 }` | "My applications" list. |

---

## 7. `mentorshiprequests`

A student's request for guidance from an alumnus.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `student` | ObjectId → User | ✔ | |
| `alumni` | ObjectId → User | ✔ | |
| `message` | String | ✔ | 10–2000 chars (validated). |
| `careerGoal` | String | ✔ | 3–1000 chars. |
| `areaOfInterest` | String | | |
| `status` | String | | `pending` \| `accepted` \| `rejected` \| `completed` \| `cancelled`. |
| `responseMessage` | String | | Alumni reply. |
| `meetingDetails` | Object | | `{ mode, scheduledAt, location, link, notes }`. |
| `requestedAt` / `respondedAt` / `completedAt` | Date | | |

**Indexes**

| Index | Purpose |
|-------|---------|
| `{ student, alumni }` unique **partial** (`status ∈ {pending, accepted}`) | Prevent duplicate active requests to the same mentor. |
| `{ alumni, status, createdAt: -1 }` | Alumni inbox. |

> The partial unique index is the key integrity rule: a student may re-request
> a mentor only after the previous request is rejected, completed or cancelled.

---

## 8. `events`

Events / webinars / reunions created by administrators.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `title` | String | ✔ | ≤ 200. |
| `description` | String | ✔ | 20–8000 chars (validated). |
| `eventType` | String | | `workshop` \| `seminar` \| `webinar` \| `reunion` \| `career_fair` \| `guest_lecture` \| `other`. |
| `mode` | String | | `online` \| `offline` \| `hybrid`. |
| `venue` | String | | ≤ 300. |
| `startDate` / `endDate` | Date | ✔ | `endDate >= startDate`. |
| `registrationDeadline` | Date | | |
| `capacity` | Number | | 1–100000, default 100. |
| `organizer` | ObjectId → User | ✔ | Admin who created it. |
| `organizerName` | String | | Denormalised display name. |
| `audience` | String | | `all` \| `students` \| `alumni`. |
| `status` | String | | `draft` \| `published` \| `cancelled` \| `completed`. |
| `bannerColor` | String | | UI hint. |

**Virtuals:** `isRegistrationOpen`, `registeredCount` (populated by controller
aggregation where needed). Both exposed in JSON.

**Indexes:** `{ status, startDate }`, `{ eventType }`, `{ organizer }`.

---

## 9. `eventregistrations`

Join record between a user and an event.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `event` | ObjectId → Event | ✔ | |
| `user` | ObjectId → User | ✔ | |
| `registrationStatus` | String | | `registered` \| `cancelled` \| `attended`. |
| `attendeeName` / `attendeeEmail` | String | | Snapshot. |
| `attendeeRole` | String | | `student` \| `alumni`. |
| `createdAt` / `updatedAt` | Date | auto | |

**Indexes:** `{ event, user }` **unique** (one registration per user per event),
`{ event, registrationStatus }`.

---

## 10. `announcements`

Admin-authored messages targeted at a role.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `title` | String | ✔ | ≤ 200. |
| `body` | String | ✔ | 10–8000 chars. |
| `audience` | String | | `all` \| `students` \| `alumni` \| `admins`. |
| `priority` | String | | `low` \| `normal` \| `high` \| `urgent`. |
| `status` | String | | `draft` \| `published` \| `archived`. |
| `createdBy` | ObjectId → User | ✔ | |
| `publishedAt` | Date | | |
| `expiresAt` | Date | | |

**Indexes:** `{ status, publishedAt: -1 }`, `{ audience }`, `{ priority }`,
text on `title, body`.

---

## 11. `notifications`

Per-user in-app notifications.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `user` | ObjectId → User | ✔ | Recipient. |
| `title` | String | ✔ | ≤ 200. |
| `message` | String | ✔ | ≤ 1000. |
| `type` | String | | `info` \| `success` \| `warning` \| `error`. |
| `category` | String | | `account` \| `job` \| `application` \| `mentorship` \| `event` \| `announcement` \| `system`. |
| `link` | String | | Deep link e.g. `/student/applications`. |
| `read` | Boolean | | default `false`. |
| `readAt` | Date | | |

**Indexes:** `{ user, read, createdAt: -1 }`, `{ category }`.

---

## 12. `activitylogs`

Append-only audit trail of significant actions.

| Field | Type | Required | Constraints / notes |
|-------|------|----------|---------------------|
| `actor` | ObjectId → User | | Who performed the action. |
| `actorName` | String | | Denormalised. |
| `actorRole` | String | | |
| `action` | String | ✔ | e.g. `job.create`, `admin.alumni_approve`. |
| `entity` | String | | Model name, e.g. `Job`. |
| `entityId` | ObjectId | | Affected document. |
| `description` | String | | Human-readable summary ≤ 300. |
| `createdAt` | Date | auto | (no `updatedAt` — append only). |

**Indexes:** `{ createdAt: -1 }`, `{ actor }`.

---

## 13. Index summary

| Collection | Key indexes |
|------------|-------------|
| `users` | `email` (unique), `{role, accountStatus}`, `{approvalStatus, role}`, text |
| `alumniprofiles` | `user` (unique), `{department, graduationYear}`, text |
| `studentprofiles` | `user` (unique), `studentId` (unique sparse), `{department, graduationYear}` |
| `jobs` | `{approvalStatus, jobStatus}`, `{postedBy}`, text |
| `jobapplications` | `{job, student}` **unique**, `{student, createdAt}` |
| `mentorshiprequests` | `{student, alumni}` partial unique, `{alumni, status}` |
| `events` | `{status, startDate}`, `{eventType}` |
| `eventregistrations` | `{event, user}` **unique**, `{event, registrationStatus}` |
| `announcements` | `{status, publishedAt}`, text |
| `notifications` | `{user, read, createdAt}` |
| `activitylogs` | `{createdAt}`, `{actor}` |

---

## 14. Data lifecycle & hooks

- **User creation:** controllers create the `User`, then `AlumniProfile` or
  `StudentProfile`, usually via `findOneAndUpdate(..., { upsert: true })`.
- **Alumni approval:** setting `approvalStatus: 'approved'` stamps `approvedAt` /
  `approvedBy` and creates a notification.
- **Job posting:** created with `approvalStatus: 'pending'`; only `approved`
  jobs appear on the student job board.
- **Application:** the unique `(job, student)` index rejects duplicates; a
  notification is created for the job owner.
- **Mentorship:** the partial unique index enforces one active request per
  mentor; responses stamp `respondedAt`.
- **Event registration:** `deleteMany`-free — cancellation flips the status so
  history is retained.
- **Notifications:** regenerated by the seeder; production code creates them via
  `notificationService`.
- **Activity log:** written by `activityService` from controllers; never updated.

---

## 15. Sample documents

<details>
<summary><code>users</code></summary>

```json
{
  "_id": "665f1c2e9b1e4a0012a3b4c5",
  "id": "665f1c2e9a1b2c3d4e5f6789",
  "name": "Arjun Mehta",
  "email": "alumni@alumniconnect.example.com",
  "role": "alumni",
  "accountStatus": "active",
  "approvalStatus": "approved",
  "approvedAt": "2026-02-01T10:00:00.000Z",
  "approvedBy": "66a1...",
  "profilePhoto": "/uploads/photos/arjun.jpg",
  "phone": "+91 90000 00010",
  "lastLogin": "2026-10-14T09:22:11.000Z",
  "createdAt": "2026-01-02T08:00:00.000Z",
  "updatedAt": "2026-10-14T09:22:11.000Z"
}
```
