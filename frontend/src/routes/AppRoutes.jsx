import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Public pages
import LandingPage from '../pages/public/LandingPage';
import AboutPage from '../pages/public/AboutPage';
import PublicEventsPage from '../pages/public/PublicEventsPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';
import ResetPasswordPage from '../pages/public/ResetPasswordPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Shared authenticated pages
import NotificationsPage from '../pages/shared/NotificationsPage';
import SettingsPage from '../pages/shared/SettingsPage';
import UnauthorizedPage from '../pages/shared/UnauthorizedPage';
import EventDetailsPage from '../pages/shared/EventDetailsPage';
import AnnouncementDetailsPage from '../pages/shared/AnnouncementDetailsPage';
import AlumniProfileViewPage from '../pages/shared/AlumniProfileViewPage';

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentAlumniDirectoryPage from '../pages/student/StudentAlumniDirectoryPage';
import JobBoardPage from '../pages/student/JobBoardPage';
import JobDetailPage from '../pages/student/JobDetailPage';
import MyApplicationsPage from '../pages/student/MyApplicationsPage';
import FindMentorPage from '../pages/student/FindMentorPage';
import MyMentorshipPage from '../pages/student/MyMentorshipPage';
import StudentEventsPage from '../pages/student/StudentEventsPage';

// Alumni pages
import AlumniDashboardPage from '../pages/alumni/AlumniDashboardPage';
import AlumniProfilePage from '../pages/alumni/AlumniProfilePage';
import AlumniDirectoryPage from '../pages/alumni/AlumniDirectoryPage';
import AlumniJobPostsPage from '../pages/alumni/AlumniJobPostsPage';
import JobFormPage from '../pages/alumni/JobFormPage';
import JobApplicantsPage from '../pages/alumni/JobApplicantsPage';
import ReceivedApplicationsPage from '../pages/alumni/ReceivedApplicationsPage';
import MentorshipRequestsPage from '../pages/alumni/MentorshipRequestsPage';
import AlumniEventsPage from '../pages/alumni/AlumniEventsPage';

// Admin pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AlumniApprovalsPage from '../pages/admin/AlumniApprovalsPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import UserDetailPage from '../pages/admin/UserDetailPage';
import JobApprovalsPage from '../pages/admin/JobApprovalsPage';
import AllJobsPage from '../pages/admin/AllJobsPage';
import EventManagementPage from '../pages/admin/EventManagementPage';
import EventFormPage from '../pages/admin/EventFormPage';
import MentorshipAdminPage from '../pages/admin/MentorshipAdminPage';
import AnnouncementsPage from '../pages/admin/AnnouncementsPage';
import ReportsPage from '../pages/admin/ReportsPage';
import ActivityPage from '../pages/admin/ActivityPage';

/**
 * Central route table. Three layout shells are used:
 *  - PublicLayout  : marketing + public detail pages
 *   - AuthLayout   : sign in / register / password flows
 *   - DashboardLayout for every authenticated, role-scoped area.
 *
 * Client side guards (ProtectedRoute, RoleRoute) only improve the experience;
 * the API re-checks authentication and roles on every request.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="events" element={<PublicEventsPage />} />
        <Route path="events/:id" element={<EventDetailsPage />} />
        <Route path="announcements/:id" element={<AnnouncementDetailsPage />} />
      </Route>

      {/* Authentication */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Authenticated application shell */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Student */}
        <Route path="student" element={<RoleRoute roles={['student']}><Outlet /></RoleRoute>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="alumni" element={<StudentAlumniDirectoryPage />} />
          <Route path="alumni/:id" element={<AlumniProfileViewPage />} />
          <Route path="jobs" element={<JobBoardPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="applications" element={<MyApplicationsPage />} />
          <Route path="mentorship" element={<FindMentorPage />} />
          <Route path="mentorship/requests" element={<MyMentorshipPage />} />
          <Route path="events" element={<StudentEventsPage />} />
        </Route>

        {/* Alumni */}
        <Route path="alumni" element={<RoleRoute roles={['alumni']}><Outlet /></RoleRoute>}>
          <Route index element={<Navigate to="/alumni/dashboard" replace />} />
          <Route path="dashboard" element={<AlumniDashboardPage />} />
          <Route path="profile" element={<AlumniProfilePage />} />
          <Route path="directory" element={<AlumniDirectoryPage />} />
          <Route path="directory/:id" element={<AlumniProfileViewPage />} />
          <Route path="jobs" element={<AlumniJobPostsPage />} />
          <Route path="jobs/new" element={<JobFormPage />} />
          <Route path="jobs/:id/edit" element={<JobFormPage />} />
          <Route path="jobs/:id/applicants" element={<JobApplicantsPage />} />
          <Route path="applications" element={<ReceivedApplicationsPage />} />
          <Route path="mentorship" element={<MentorshipRequestsPage />} />
          <Route path="events" element={<AlumniEventsPage />} />
        </Route>

        {/* Administrator */}
        <Route path="admin" element={<RoleRoute roles={['admin']}><Outlet /></RoleRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="alumni-approvals" element={<AlumniApprovalsPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="job-approvals" element={<JobApprovalsPage />} />
          <Route path="jobs" element={<AllJobsPage />} />
          <Route path="events" element={<EventManagementPage />} />
          <Route path="events/new" element={<EventFormPage />} />
          <Route path="events/:id/edit" element={<EventFormPage />} />
          <Route path="mentorship" element={<MentorshipAdminPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="activity" element={<ActivityPage />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
