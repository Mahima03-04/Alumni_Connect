'use strict';

const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const MentorshipRequest = require('../models/MentorshipRequest');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { platformCounts } = require('./publicController');
const { createNotification } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** GET /api/v1/admin/dashboard */
const getDashboard = asyncHandler(async (_req, res) => {
  const counts = await platformCounts();

  const [
    alumniByDepartment,
    studentsByDepartment,
    alumniByGraduationYear,
    applicationStatus,
    mentorshipStatus,
    monthlyRegistrations,
    recentActivity,
    pendingAlumni,
    pendingJobs,
    upcomingEvents,
  ] = await Promise.all([
    AlumniProfile.aggregate([
      { $match: { department: { $nin: ['', null] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    StudentProfile.aggregate([
      { $match: { department: { $nin: ['', null] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    AlumniProfile.aggregate([
      { $match: { graduationYear: { $ne: null } } },
      { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    JobApplication.aggregate([{ $group: { _id: '$applicationStatus', count: { $sum: 1 } } }]),
    MentorshipRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ActivityLog.find().sort({ createdAt: -1 }).limit(12).lean(),
    User.find({ role: 'alumni', approvalStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt'),
    Job.find({ approvalStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title company createdAt postedBy')
      .populate('postedBy', 'name'),
    Event.find({ status: 'published', startDate: { $gte: new Date() } })
      .sort({ startDate: 1 })
      .limit(5)
      .select('title startDate venue capacity'),
  ]);

  const toMap = (arr) => arr.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

  return sendSuccess(
    res,
    {
      counts,
      charts: {
        usersByDepartment: [...alumniByDepartment.map((d) => ({ department: d._id, alumni: d.count }))].map((d) => ({
          ...d,
          students: (studentsByDepartment.find((s) => s._id === d.department) || {}).count || 0,
        })),
        alumniByGraduationYear: alumniByGraduationYear.map((y) => ({ year: y._id, count: y.count })),
        applicationStatus: toMap(applicationStatus),
        mentorshipStatus: toMap(mentorshipStatus),
        monthlyRegistrations: monthlyRegistrations.map((m) => ({ month: m._id, count: m.count })),
      },
      pendingAlumni,
      pendingJobs,
      upcomingEvents,
      recentActivity,
    },
    { message: 'Admin dashboard loaded.' }
  );
});

/** GET /api/v1/admin/users */
const listUsers = asyncHandler(async (req, res) => {
  const { q, role, accountStatus, approvalStatus } = req.query;
  const pagination = getPagination(req.query, { defaultLimit: 15 });

  const filter = {};
  if (role) filter.role = role;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const sortBy = ['name', 'email', 'createdAt', 'lastLogin'].includes(req.query.sortBy)
    ? req.query.sortBy
    : 'createdAt';
  const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ [sortBy]: order }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, users, { message: 'Users loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/admin/users/:id */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  let profile = null;
  if (user.role === 'alumni') profile = await AlumniProfile.findOne({ user: user._id });
  if (user.role === 'student') profile = await StudentProfile.findOne({ user: user._id });

  const [applicationCount, jobCount] = await Promise.all([
    JobApplication.countDocuments({ student: user._id }),
    Job.countDocuments({ postedBy: user._id }),
  ]);

  return sendSuccess(res, { user, profile, stats: { applicationCount, jobCount } }, { message: 'User loaded.' });
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Activate / deactivate / suspend an account. Administrators may also correct
 * a role between student and alumni. Privilege escalation to admin is blocked.
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change the status of your own account.');
  }
  if (user.role === 'admin') {
    throw ApiError.forbidden('Administrator accounts cannot be modified through this endpoint.');
  }

  const { accountStatus, role, reason } = req.body;

  if (role && role !== user.role) {
    if (!['student', 'alumni'].includes(role)) {
      throw ApiError.forbidden('You may only assign the student or alumni role.');
    }
    if (user.role === 'admin') throw ApiError.forbidden('Administrator roles cannot be changed.');
    user.role = role;
    if (role === 'alumni') {
      user.approvalStatus = 'approved';
      user.approvedAt = new Date();
      user.approvedBy = req.user._id;
      if (!(await AlumniProfile.findOne({ user: user._id }))) await AlumniProfile.create({ user: user._id });
    } else {
      user.approvalStatus = 'not_required';
      if (!(await StudentProfile.findOne({ user: user._id }))) await StudentProfile.create({ user: user._id });
    }
  }

  if (accountStatus) user.accountStatus = accountStatus;
  await user.save();

  await logActivity({
    actor: req.user,
    action: 'admin.user_status_update',
    entity: 'User',
    entityId: user._id,
    description: `${req.user.name} updated ${user.name}: ${accountStatus || ''} ${role || ''}`.trim(),
    meta: { reason: reason || null },
  });

  await createNotification({
    user: user._id,
    title: 'Account updated',
    message: `Your account status was updated by an administrator${reason ? `: ${reason}` : '.'}`,
    type: 'info',
    category: 'account',
    link: '/settings',
  });

  return sendSuccess(res, user, { message: 'User account updated.' });
});

/** GET /api/v1/admin/alumni/pending */
const getPendingAlumni = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 15 });
  const filter = { role: 'alumni', approvalStatus: 'pending' };

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: 1 }).skip(pagination.skip).limit(pagination.limit),
    User.countDocuments(filter),
  ]);

  const profiles = await AlumniProfile.find({ user: { $in: users.map((u) => u._id) } });

  const data = users.map((u) => ({
    user: u.toJSON(),
    profile: profiles.find((p) => String(p.user) === String(u._id)) || null,
  }));

  return sendSuccess(res, data, { message: 'Pending alumni loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/admin/alumni/reviewed - approvals and rejections history. */
const getReviewedAlumni = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 15 });
  const filter = { role: 'alumni', approvalStatus: { $in: ['approved', 'rejected'] } };
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ approvedAt: -1, updatedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('approvedBy', 'name'),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, users, { message: 'Reviewed alumni loaded.', meta: pagination.meta(total) });
});

/** PATCH /api/v1/admin/alumni/:id/approval */
const updateAlumniApproval = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Alumni account not found.');
  if (user.role !== 'alumni') throw ApiError.badRequest('This account is not an alumni account.');
  if (String(user._id) === String(req.user._id)) {
    throw ApiError.forbidden('You cannot approve your own registration.');
  }

  const { approvalStatus, reason } = req.body;
  user.approvalStatus = approvalStatus;
  user.approvalReason = approvalStatus === 'rejected' ? reason : null;
  user.approvedAt = approvalStatus === 'approved' ? new Date() : null;
  user.approvedBy = req.user._id;
  await user.save();

  if (approvalStatus === 'approved' && !(await AlumniProfile.findOne({ user: user._id }))) {
    await AlumniProfile.create({ user: user._id });
  }

  await logActivity({
    actor: req.user,
    action: approvalStatus === 'approved' ? 'admin.alumni_approve' : 'admin.alumni_reject',
    entity: 'User',
    entityId: user._id,
    description: `${req.user.name} ${approvalStatus} the alumni registration of ${user.name}.`,
    meta: { reason: reason || null },
  });

  await createNotification({
    user: user._id,
    title: approvalStatus === 'approved' ? 'Alumni account approved' : 'Alumni registration rejected',
    message:
      approvalStatus === 'approved'
        ? 'Your alumni account has been approved. You can now post jobs and mentor students.'
        : `Your alumni registration was rejected${reason ? `: ${reason}` : '.'}`,
    type: approvalStatus === 'approved' ? 'success' : 'error',
    category: 'account',
    link: approvalStatus === 'approved' ? '/alumni/dashboard' : '/login',
  });

  return sendSuccess(res, user, { message: `Alumni registration ${approvalStatus}.` });
});

/** GET /api/v1/admin/jobs/pending */
const getPendingJobs = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 15 });
  const filter = { approvalStatus: 'pending' };

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: 1 }).skip(pagination.skip).limit(pagination.limit).populate('postedBy', 'name email'),
    Job.countDocuments(filter),
  ]);

  return sendSuccess(res, jobs, { message: 'Pending jobs loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/admin/jobs */
const listAllJobs = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 15 });
  const filter = {};
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
  if (req.query.jobStatus) filter.jobStatus = req.query.jobStatus;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ title: rx }, { company: rx }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit).populate('postedBy', 'name email'),
    Job.countDocuments(filter),
  ]);

  return sendSuccess(res, jobs, { message: 'Jobs loaded.', meta: pagination.meta(total) });
});

/** PATCH /api/v1/admin/jobs/:id/approval */
const updateJobApproval = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');

  const { approvalStatus, reason } = req.body;
  job.approvalStatus = approvalStatus;
  job.rejectionReason = approvalStatus === 'rejected' ? reason : null;
  job.approvedAt = approvalStatus === 'approved' ? new Date() : null;
  job.approvedBy = req.user._id;
  if (approvalStatus === 'rejected') job.jobStatus = 'closed';
  await job.save();

  await logActivity({
    actor: req.user,
    action: approvalStatus === 'approved' ? 'admin.job_approve' : 'admin.job_reject',
    entity: 'Job',
    entityId: job._id,
    description: `${req.user.name} ${approvalStatus} the job "${job.title}".`,
    meta: { reason: reason || null },
  });

  await createNotification({
    user: job.postedBy,
    title: approvalStatus === 'approved' ? 'Job posting approved' : 'Job posting rejected',
    message:
      approvalStatus === 'approved'
        ? `Your job "${job.title}" is now live for students.`
        : `Your job "${job.title}" was rejected${reason ? `: ${reason}` : '.'}`,
    type: approvalStatus === 'approved' ? 'success' : 'error',
    category: 'job',
    link: '/alumni/jobs',
  });

  return sendSuccess(res, job, { message: `Job ${approvalStatus}.` });
});

/** GET /api/v1/admin/mentorship - monitoring view. */
const getMentorshipMonitoring = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 15 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [requests, total, statusCounts] = await Promise.all([
    MentorshipRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('student', 'name email')
      .populate('alumni', 'name email'),
    MentorshipRequest.countDocuments(filter),
    MentorshipRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  return sendSuccess(res, requests, {
    message: 'Mentorship requests loaded.',
    meta: {
      ...pagination.meta(total),
      statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    },
  });
});

/** GET /api/v1/admin/events/:id/registrations is handled by the events router. */

/** Build a date range filter object from query params. */
function buildDateRange(query) {
  const range = {};
  if (query.from) {
    const from = new Date(query.from);
    if (!Number.isNaN(from.getTime())) range.$gte = from;
  }
  if (query.to) {
    const to = new Date(query.to);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
  }
  return Object.keys(range).length ? range : null;
}

/**
 * GET /api/v1/admin/reports
 * Aggregated analytics with optional date range, department, graduation year
 * and role filters. Every number comes from the database.
 */
const getReports = asyncHandler(async (req, res) => {
  const { department, graduationYear, role } = req.query;
  const dateRange = buildDateRange(req.query);

  const userMatch = {};
  if (role) userMatch.role = role;
  if (dateRange) userMatch.createdAt = dateRange;
  if (department) {
    const ids = await ProfileDepartments(department);
    userMatch._id = { $in: ids };
  }
  if (graduationYear) {
    const ids = await ProfileGraduationYears(Number(graduationYear));
    userMatch._id = userMatch._id
      ? { $in: ids.filter((id) => userMatch._id.$in.map(String).includes(String(id))) }
      : { $in: ids };
  }

  const applicationMatch = dateRange ? { createdAt: dateRange } : {};
  const jobMatch = dateRange ? { createdAt: dateRange } : {};

  const [summary, usersByRole, applicationsByStatus, jobsByApproval, mentorshipByStatus, registrationsByEvent] =
    await Promise.all([
      User.aggregate([
        { $match: userMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
            alumni: { $sum: { $cond: [{ $eq: ['$role', 'alumni'] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            pendingApproval: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$accountStatus', 'active'] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ['$accountStatus', 'suspended'] }, 1, 0] } },
          },
        },
      ]),
      User.aggregate([{ $match: userMatch }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
      JobApplication.aggregate([{ $match: applicationMatch }, { $group: { _id: '$applicationStatus', count: { $sum: 1 } } }]),
      Job.aggregate([{ $match: jobMatch }, { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }]),
      MentorshipRequest.aggregate([
        { $match: { ...(dateRange ? { createdAt: dateRange } : {}) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      EventRegistration.aggregate([
        { $match: { ...(dateRange ? { createdAt: dateRange } : {}) } },
        { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        { $group: { _id: '$event.title', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

  const toMap = (arr) => arr.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

  return sendSuccess(
    res,
    {
      filters: { department: department || null, graduationYear: graduationYear || null, role: role || null, ...req.query },
      summary: summary[0] || {
        total: 0,
        students: 0,
        alumni: 0,
        admins: 0,
        pendingApproval: 0,
        active: 0,
        suspended: 0,
      },
      usersByRole: toMap(usersByRole),
      applicationsByStatus: toMap(applicationsByStatus),
      jobsByApproval: toMap(jobsByApproval),
      mentorshipByStatus: toMap(mentorshipByStatus),
      registrationsByEvent: registrationsByEvent.map((r) => ({ event: r._id, count: r.count })),
    },
    { message: 'Report generated.' }
  );
});

/** Helper: user ids matching a department in either profile collection. */
async function ProfileDepartments(department) {
  const rx = new RegExp(`^${escapeRegex(department)}$`, 'i');
  const [a, s] = await Promise.all([
    AlumniProfile.find({ department: rx }).select('user'),
    StudentProfile.find({ department: rx }).select('user'),
  ]);
  return [...a.map((p) => p.user), ...s.map((p) => p.user)];
}

async function ProfileGraduationYears(year) {
  const [a, s] = await Promise.all([
    AlumniProfile.find({ graduationYear: year }).select('user'),
    StudentProfile.find({ graduationYear: year }).select('user'),
  ]);
  return [...a.map((p) => p.user), ...s.map((p) => p.user)];
}

/** Escape a value for CSV output. */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  return /[",\n]/.test(str) ? `"${str}"` : str;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

const EXPORT_SAFE_FIELDS = {
  users: [
    { label: 'Name', value: (u) => u.name },
    { label: 'Email', value: (u) => u.email },
    { label: 'Role', value: (u) => u.role },
    { label: 'Account Status', value: (u) => u.accountStatus },
    { label: 'Approval Status', value: (u) => u.approvalStatus },
    { label: 'Phone', value: (u) => u.phone },
    { label: 'Last Login', value: (u) => (u.lastLogin ? new Date(u.lastLogin).toISOString() : '') },
    { label: 'Registered On', value: (u) => new Date(u.createdAt).toISOString() },
  ],
  alumni: [
    { label: 'Name', value: (u) => u.name },
    { label: 'Email', value: (u) => u.email },
    { label: 'Department', value: (u) => u.department },
    { label: 'Degree', value: (u) => u.degree },
    { label: 'Graduation Year', value: (u) => u.graduationYear },
    { label: 'Batch', value: (u) => u.batch },
    { label: 'Company', value: (u) => u.currentCompany },
    { label: 'Job Title', value: (u) => u.jobTitle },
    { label: 'Profile Completion', value: (u) => u.profileCompletion },
  ],
  jobs: [
    { label: 'Title', value: (j) => j.title },
    { label: 'Company', value: (j) => j.company },
    { label: 'Location', value: (j) => j.location },
    { label: 'Work Mode', value: (j) => j.workMode },
    { label: 'Employment Type', value: (j) => j.employmentType },
    { label: 'Approval Status', value: (j) => j.approvalStatus },
    { label: 'Job Status', value: (j) => j.jobStatus },
    { label: 'Posted On', value: (j) => new Date(j.createdAt).toISOString() },
  ],
  applications: [
    { label: 'Job Title', value: (a) => a.job?.title || '' },
    { label: 'Company', value: (a) => a.job?.company || '' },
    { label: 'Applicant', value: (a) => a.applicantName },
    { label: 'Applicant Email', value: (a) => a.applicantEmail },
    { label: 'Status', value: (a) => a.applicationStatus },
    { label: 'Applied On', value: (a) => new Date(a.appliedAt).toISOString() },
  ],
  mentorship: [
    { label: 'Student', value: (m) => m.student?.name || '' },
    { label: 'Student Email', value: (m) => m.student?.email || '' },
    { label: 'Alumnus', value: (m) => m.alumni?.name || '' },
    { label: 'Alumnus Email', value: (m) => m.alumni?.email || '' },
    { label: 'Status', value: (m) => m.status },
    { label: 'Requested On', value: (m) => new Date(m.requestedAt).toISOString() },
  ],
  events: [
    { label: 'Title', value: (e) => e.title },
    { label: 'Type', value: (e) => e.eventType },
    { label: 'Mode', value: (e) => e.mode },
    { label: 'Venue', value: (e) => e.venue },
    { label: 'Start Date', value: (e) => new Date(e.startDate).toISOString() },
    { label: 'Status', value: (e) => e.status },
    { label: 'Capacity', value: (e) => e.capacity },
  ],
};

/**
 * GET /api/v1/admin/reports/export?type=users|alumni|jobs|applications|mentorship|events
 * Streams a CSV built only from non-sensitive fields. Password hashes and
 * reset tokens are never selected.
 */
const exportReport = asyncHandler(async (req, res) => {
  const type = req.query.type || 'users';
  const columns = EXPORT_SAFE_FIELDS[type];
  if (!columns) {
    throw ApiError.badRequest('Unknown export type. Use users, alumni, jobs, applications, mentorship or events.');
  }

  const dateRange = buildDateRange(req.query);
  let rows = [];

  if (type === 'users') {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.accountStatus) filter.accountStatus = req.query.accountStatus;
    if (dateRange) filter.createdAt = dateRange;
    rows = await User.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
  } else if (type === 'alumni') {
    const filter = {};
    if (dateRange) filter.createdAt = dateRange;
    rows = await AlumniProfile.find(filter)
      .populate('user', 'name email approvalStatus accountStatus role')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean()
      .then((profiles) =>
        profiles
          .filter((p) => p.user)
          .map((p) => ({
            name: p.user.name,
            email: p.user.email,
            department: p.department,
            degree: p.degree,
            graduationYear: p.graduationYear,
            batch: p.batch,
            currentCompany: p.currentCompany,
            jobTitle: p.jobTitle,
            profileCompletion: p.profileCompletion,
          }))
      );
  } else if (type === 'jobs') {
    const filter = {};
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
    if (dateRange) filter.createdAt = dateRange;
    rows = await Job.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
  } else if (type === 'applications') {
    const filter = {};
    if (req.query.applicationStatus) filter.applicationStatus = req.query.applicationStatus;
    if (dateRange) filter.createdAt = dateRange;
    rows = await JobApplication.find(filter)
      .populate('job', 'title company')
      .sort({ appliedAt: -1 })
      .limit(5000)
      .lean();
  } else if (type === 'mentorship') {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (dateRange) filter.createdAt = dateRange;
    rows = await MentorshipRequest.find(filter)
      .populate('student', 'name email')
      .populate('alumni', 'name email')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();
  } else if (type === 'events') {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (dateRange) filter.createdAt = dateRange;
    rows = await Event.find(filter).sort({ startDate: -1 }).limit(5000).lean();
  }

  const csv = toCsv(rows, columns);
  const filename = `alumniconnect-${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;

  await logActivity({
    actor: req.user,
    action: 'admin.report_export',
    entity: 'Report',
    description: `${req.user.name} exported the ${type} report.`,
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
});

/** GET /api/v1/admin/activity */
const getActivity = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.actor) filter.actor = req.query.actor;

  const [activity, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    ActivityLog.countDocuments(filter),
  ]);

  return sendSuccess(res, activity, { message: 'Activity loaded.', meta: pagination.meta(total) });
});

module.exports = {
  getDashboard,
  listUsers,
  getUserById,
  updateUserStatus,
  getPendingAlumni,
  getReviewedAlumni,
  updateAlumniApproval,
  getPendingJobs,
  listAllJobs,
  updateJobApproval,
  getMentorshipMonitoring,
  getReports,
  exportReport,
  getActivity,
};
