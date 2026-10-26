# AlumniConnect — User Guide

A practical, step-by-step guide for every role. No programming knowledge is
required.

---

## Contents

1. [Getting started](#1-getting-started)
2. [For everyone](#2-for-everyone)
3. [Student guide](#3-student-guide)
4. [Alumni guide](#4-alumni-guide)
5. [Administrator guide](#5-administrator-guide)
6. [Understanding statuses](#6-understanding-statuses)
7. [Notifications](#7-notifications)
8. [Account & settings](#8-account--settings)
9. [Demo accounts](#9-demo-accounts)
10. [FAQ](#10-faq)

---

## 1. Getting started

AlumniConnect runs in your browser. When it is started locally by a developer,
the addresses are:

- **Website:** http://localhost:5173
- **API (technical):** http://localhost:5000/api/v1

You do not need to install anything to *use* the site. If you are running it
yourself, follow the setup steps in the main `README.md`.

**First steps**

1. Open the website.
2. Click **Get started** / **Register**.
3. Choose your role: **Student** or **Alumni**, and complete the form.

> Administrators are created by the system/seeder, not through public
> registration.

---

## 2. For everyone

### Logging in

1. Click **Log in**.
2. Enter your email and password.
3. You land on the dashboard for your role.

### Logging out

Open the account menu (top-right) and choose **Log out**.

### Finding your way

After logging in you get a sidebar (or a menu on mobile) listing everything your
role can do. The top bar has a **notification bell** and your **profile menu**.

### Common page elements

- **Filters / search bars** — narrow long lists by keyword or category.
- **Status badges** — colour-coded pills (green = good, amber = waiting,
  red = negative).
- **Empty states** — a friendly message when a list has no items yet.
- **Toasts** — small messages in a corner confirming an action.

---

## 3. Student guide

### 3.1 Complete your profile

1. Sidebar → **My Profile**.
2. Fill in your university, department, degree, semester, graduation year, skills
   and interests.
3. Upload a **profile photo** (JPG/PNG/WebP/GIF) and a **resume** (PDF/DOC).
4. Click **Save**.

A complete profile improves how you appear to alumni and is required before you
submit applications.

### 3.2 Explore the alumni directory

1. Sidebar → **Alumni Directory**.
2. Search by name/company or filter by **department**, **graduation year**,
   **batch**, **company** or **skills**.
3. Click a card to open the full alumni profile (education, work experience,
   mentorship areas).

### 3.3 Find and apply for a job

1. Sidebar → **Job Board**.
2. Filter by location, work mode, employment type, experience level or skill.
3. Open a job and click **Apply**.
4. Attach your **resume** and optionally write a **cover letter**.
5. Submit.

> You can apply to each job only once. The button disappears after you apply.

### 3.4 Track your applications

1. Sidebar → **My Applications**.
2. Each row shows the job and its current status.
3. While an application is still early (e.g. submitted / under review), you can
   **Withdraw** it.

### 3.5 Request a mentor

1. Sidebar → **Find a Mentor**.
2. Browse alumni who have enabled mentorship.
3. Click **Request mentorship**, write a message and your career goal.
4. Submit.

1. Sidebar → **My Mentorship** to track requests. Once a mentor accepts, any
   meeting details they added appear here.

> You may have one active request per mentor at a time.

### 3.6 Register for events

1. Sidebar → **Events**.
2. Open an event and click **Register**.
3. Registered events appear under your registrations; you can cancel any time
   before the deadline.

---

## 4. Alumni guide

### 4.1 Get approved

When you register as an alumnus, your account starts as **Pending**. An
administrator reviews it. You can sign in and complete your profile while
pending, but **you cannot post jobs until you are approved**. You receive a
notification once a decision is made.

### 4.2 Complete your profile

1. Sidebar → **My Profile**.
2. Add education, current company, job title, **work experience**, skills and the
   **mentorship areas** you are comfortable with.
3. Toggle **Open to mentorship** so students can find and request you.
4. Upload a profile photo and save.

The dashboard shows your **profile completion** percentage to help you finish.

### 4.3 Post a job

1. Sidebar → **My Job Posts** → **New job post**.
2. Enter the title, company, a detailed description (at least 30 characters),
   location, work mode, employment type, skills, salary range and deadline.
3. Submit. The post status is **Pending approval** and is **not visible to
   students yet**.
4. Once an administrator approves it, it appears on the student Job Board.

You can **edit**, **close/reopen** or **delete** your own posts at any time.

### 4.4 Review applicants

1. Open a job under **My Job Posts** and click **View applicants** (or use the
   **Applications** page to see all applicants across your jobs).
2. For each applicant you can view their resume and update the status:
   *Under review*, *Shortlisted*, *Accepted* or *Rejected* (optionally with a note).
3. The student is notified of the change.

### 4.5 Respond to mentorship requests

1. Sidebar → **Mentorship Requests**.
2. Open a pending request and choose **Accept**, **Reject** or (later)
   **Complete**.
3. On accept, add meeting details (mode, date/time, link or location, notes).
4. The student is notified.

---

## 5. Administrator guide

### 5.1 The dashboard

The admin dashboard summarises the platform: totals, charts (users by
department, alumni by graduation year, application status, mentorship status,
monthly registrations) and quick queues for pending alumni and jobs.

### 5.2 Approve or reject alumni

1. Sidebar → **Alumni Approvals**.
2. Review an applicant's profile.
3. Click **Approve**, or **Reject** with a reason (required).
4. The alumnus is notified; approved alumni can immediately post jobs.

### 5.3 Approve or reject jobs

1. Sidebar → **Job Approvals**.
2. Review a pending posting.
3. **Approve** (it becomes visible to students) or **Reject** with a reason.

### 5.4 Manage users

1. Sidebar → **User Management**.
2. Search or filter by role and account status.
3. Open a user to view their profile and platform stats.
4. Change **account status** (Active / Inactive / Suspended). Suspended and
   inactive users cannot log in.

### 5.5 Manage events

1. Sidebar → **Event Management** → **New event**.
2. Fill in title, description (≥ 20 chars), type, mode, venue, dates, capacity,
   audience and status (**Draft** or **Published**).
3. Publish when ready. Drafts are hidden from the public and from students/alumni.

### 5.6 Announcements

1. Sidebar → **Announcements** → **New announcement**.
2. Write a title and body, choose the **audience** (everyone / students / alumni /
   admins), a **priority** and a **status**.
3. Published announcements appear on the platform and can link to detail pages.

### 5.7 Reports and exports

1. Sidebar → **Reports**.
2. Review the summary tables and charts.
3. Use **Export CSV** for any dataset: users, alumni, jobs, applications,
   mentorship or events.

### 5.8 Activity log

Sidebar → **Activity** shows a chronological audit trail of important actions
(who did what, and when).

---

## 6. Understanding statuses

| Area | Status | Means |
|------|--------|-------|
| Account | Active | Normal, can sign in. |
| Account | Inactive / Suspended | Cannot sign in. |
| Alumni approval | Pending | Awaiting admin review; cannot post jobs. |
| Account | Approved | Verified alumni; full access. |
| Account | Rejected | Not approved; cannot sign in. |
| Job | Pending | Awaiting admin review; hidden from students. |
| Job | Approved | Visible on the job board. |
| Job | Rejected | Not approved (reason recorded). |
| Job | Open / Closed | Owner-controlled availability. |
| Application | Submitted | Received by the alumni. |
| Application | Under review | Being reviewed. |
| Application | Shortlisted | Advanced; expect contact. |
| Application | Accepted / Rejected | Final outcome. |
| Application | Withdrawn | Cancelled by the student. |
| Mentorship | Pending → Accepted / Rejected | Mentor's decision. |
| Mentorship | Completed / Cancelled | Finished or withdrawn. |
| Event | Draft / Published / Cancelled / Completed | Visibility and lifecycle. |
| Registration | Registered / Attended / Cancelled | Your attendance state. |

---

## 7. Notifications

- The bell in the top bar shows an **unread count**.
2. Open it to read notifications (application updates, mentorship responses,
   approvals, event confirmations).
- Click a notification to jump to the related page.
- Use **Mark all as read** or delete individual items.

Notifications are generated automatically by actions elsewhere in the platform.

---

## 7. Accounts & settings

*(See **Settings** in the sidebar.)* You can review your account details, and
from **My Profile** update your personal information, photo and (for students)
resume.

### Password

If you forget your password, use **Forgot password** on the login page. In this
development build the reset link/token is shown by the developer (console) rather
than emailed; then open the reset page and set a new password.

---

## 9. Demo accounts

If the project has been seeded, you can sign in immediately:

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@alumniconnect.example.com` | `AdminDemo@123` |
| Alumni (approved) | `alumni@alumniconnect.example.com` | `AlumniDemo@123` |
| Student | `student@alumniconnect.example.com` | `StudentDemo@123` |
| Alumni (pending) | `pending.alumni@alumniconnect.example.com` | `PendingDemo@123` |
| Other seeded users | — | `DemoUser@123` |

> Demo credentials are for local development only.

---

## 10. FAQ

**Why can't I post a job?**
Your alumni account is still pending administrator approval. Wait for the
approval notification.

**Why can't I see a job that was mentioned to me?**
Only **approved** and **open** jobs are visible to students. A pending or closed
post is hidden.

**Can I apply to the same job twice?**
No. One application per student per job.

**Can I request the same mentor again?**
Yes, once your previous request is rejected, completed or cancelled. You cannot
hold two active requests with the same mentor.

**I forgot my password.**
Use **Forgot password** on the login page.

**My account is suspended.**
Contact the administrator.

**Who approves alumni and jobs?**
Administrators, using the Alumni Approvals and Job Approvals pages.
