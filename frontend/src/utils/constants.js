import {
  Award,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Settings,
  UserCheck,
  Users,
  UserSquare2,
  Handshake,
  BarChart3,
} from 'lucide-react';

/** Sidebar navigation menus per role. Only authorised links are shown. */
export const NAV_BY_ROLE = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', to: '/student/profile', icon: UserSquare2 },
    { label: 'Alumni Directory', to: '/student/alumni', icon: Users },
    { label: 'Job Board', to: '/student/jobs', icon: Briefcase },
    { label: 'My Applications', to: '/student/applications', icon: ClipboardList },
    { label: 'Find a Mentor', to: '/student/mentorship', icon: Handshake },
    { label: 'My Mentorship', to: '/student/mentorship/requests', icon: Award },
    { label: 'Events', to: '/student/events', icon: CalendarDays },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
  alumni: [
    { label: 'Dashboard', to: '/alumni/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', to: '/alumni/profile', icon: UserSquare2 },
    { label: 'Alumni Directory', to: '/alumni/directory', icon: Users },
    { label: 'My Job Posts', to: '/alumni/jobs', icon: Briefcase },
    { label: 'Applications', to: '/alumni/applications', icon: ClipboardList },
    { label: 'Mentorship Requests', to: '/alumni/mentorship', icon: Handshake },
    { label: 'Events', to: '/alumni/events', icon: CalendarDays },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Alumni Approvals', to: '/admin/alumni-approvals', icon: UserCheck },
    { label: 'User Management', to: '/admin/users', icon: Users },
    { label: 'Job Approvals', to: '/admin/job-approvals', icon: ClipboardList },
    { label: 'All Job Posts', to: '/admin/jobs', icon: Briefcase },
    { label: 'Event Management', to: '/admin/events', icon: CalendarDays },
    { label: 'Mentorship', to: '/admin/mentorship', icon: Handshake },
    { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
    { label: 'Activity', to: '/admin/activity', icon: FileText },
    { label: 'Settings', to: '/settings', icon: Settings },
  ],
};

export const ROLE_LABELS = {
  student: 'Student',
  alumni: 'Alumni',
  admin: 'Administrator',
};

export const ROLE_HOME = {
  student: '/student/dashboard',
  alumni: '/alumni/dashboard',
  admin: '/admin/dashboard',
};

/** Colour classes for status badges (background + text). */
export const STATUS_STYLES = {
  // generic
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-navy-100 text-navy-600',
  suspended: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  not_required: 'bg-navy-100 text-navy-600',
  // jobs
  open: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-navy-100 text-navy-600',
  withdrawn: 'bg-amber-50 text-amber-700',
  // applications
  submitted: 'bg-royal-50 text-royal-700',
  under_review: 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-accent-50 text-accent-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  // mentorship
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-navy-100 text-navy-600',
  // events / announcements
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-navy-100 text-navy-600',
  archived: 'bg-navy-100 text-navy-600',
  registered: 'bg-emerald-50 text-emerald-700',
  attended: 'bg-accent-50 text-accent-700',
};

export const WORK_MODE_LABELS = {
  remote: 'Remote',
  onsite: 'On-site',
  hybrid: 'Hybrid',
};

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'internship', 'contract', 'freelance'];
export const WORK_MODES = ['remote', 'onsite', 'hybrid'];
export const EXPERIENCE_LEVELS = ['fresher', 'entry', 'mid', 'senior', 'lead'];
export const EVENT_TYPES = ['workshop', 'seminar', 'webinar', 'reunion', 'career_fair', 'guest_lecture', 'other'];
export const EVENT_MODES = ['online', 'offline', 'hybrid'];
export const EVENT_AUDIENCES = ['all', 'students', 'alumni'];
export const ANNOUNCEMENT_AUDIENCES = ['all', 'students', 'alumni', 'admins'];
export const ANNOUNCEMENT_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const ICONS = {
  Award,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Handshake,
  Megaphone,
  Users,
};
