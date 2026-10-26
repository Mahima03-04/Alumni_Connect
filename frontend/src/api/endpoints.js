import api from './client';

/**
 * Thin wrappers around the REST API. Components should import from here rather
 * than calling axios directly so that endpoint paths live in one place.
 */

export const authApi = {
  csrf: () => api.get('/auth/csrf'),
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const publicApi = {
  stats: () => api.get('/public/stats'),
  alumniPreview: (params) => api.get('/public/alumni-preview', { params }),
  testimonials: () => api.get('/public/testimonials'),
};

export const profileApi = {
  list: (params) => api.get('/profiles', { params }),
  metadata: () => api.get('/profiles/metadata'),
  get: (id) => api.get(`/profiles/${id}`),
  updateMe: (payload) => api.put('/profiles/me', payload),
  uploadPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/profiles/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePhoto: () => api.delete('/profiles/me/photo'),
  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/profiles/me/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const jobApi = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (payload) => api.post('/jobs', payload),
  update: (id, payload) => api.put(`/jobs/${id}`, payload),
  remove: (id) => api.delete(`/jobs/${id}`),
  apply: (id, formData) =>
    api.post(`/jobs/${id}/apply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  applications: (id, params) => api.get(`/jobs/${id}/applications`, { params }),
};

export const applicationApi = {
  mine: (params) => api.get('/applications/me', { params }),
  received: (params) => api.get('/applications/received', { params }),
  updateStatus: (id, payload) => api.patch(`/applications/${id}/status`, payload),
  withdraw: (id) => api.patch(`/applications/${id}/withdraw`),
};

export const mentorshipApi = {
  mentors: (params) => api.get('/mentorship', { params }),
  create: (payload) => api.post('/mentorship/requests', payload),
  mine: (params) => api.get('/mentorship/requests/me', { params }),
  get: (id) => api.get(`/mentorship/requests/${id}`),
  respond: (id, payload) => api.patch(`/mentorship/requests/${id}`, payload),
  remove: (id) => api.delete(`/mentorship/requests/${id}`),
};

export const eventApi = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
  create: (payload) => api.post('/events', payload),
  update: (id, payload) => api.put(`/events/${id}`, payload),
  remove: (id) => api.delete(`/events/${id}`),
  register: (id) => api.post(`/events/${id}/register`),
  cancel: (id) => api.delete(`/events/${id}/register`),
  registrations: (id, params) => api.get(`/events/${id}/registrations`, { params }),
  myRegistrations: () => api.get('/events/registrations/me'),
};

export const announcementApi = {
  list: (params) => api.get('/announcements', { params }),
  get: (id) => api.get(`/announcements/${id}`),
  create: (payload) => api.post('/announcements', payload),
  update: (id, payload) => api.put(`/announcements/${id}`, payload),
  remove: (id) => api.delete(`/announcements/${id}`),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const dashboardApi = {
  student: () => api.get('/dashboard/student'),
  alumni: () => api.get('/dashboard/alumni'),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  user: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, payload) => api.patch(`/admin/users/${id}/status`, payload),
  pendingAlumni: (params) => api.get('/admin/alumni/pending', { params }),
  reviewedAlumni: (params) => api.get('/admin/alumni/reviewed', { params }),
  updateAlumniApproval: (id, payload) => api.patch(`/admin/alumni/${id}/approval`, payload),
  pendingJobs: (params) => api.get('/admin/jobs/pending', { params }),
  jobs: (params) => api.get('/admin/jobs', { params }),
  updateJobApproval: (id, payload) => api.patch(`/admin/jobs/${id}/approval`, payload),
  mentorship: (params) => api.get('/admin/mentorship', { params }),
  reports: (params) => api.get('/admin/reports', { params }),
  activity: (params) => api.get('/admin/activity', { params }),
};

/** Trigger a CSV download in the browser. */
export async function downloadReportCsv(params) {
  const res = await api.get('/admin/reports/export', { params, responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : `alumniconnect-report.csv`;

  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return filename;
}
