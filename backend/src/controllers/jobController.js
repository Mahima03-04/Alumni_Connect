'use strict';

const mongoose = require('mongoose');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CREATABLE_FIELDS = [
  'title',
  'company',
  'description',
  'location',
  'workMode',
  'employmentType',
  'experienceLevel',
  'skillsRequired',
  'salaryMin',
  'salaryMax',
  'salaryCurrency',
  'salaryPeriod',
  'openings',
  'applicationDeadline',
  'contactEmail',
];

function pick(source, allowed) {
  const out = {};
  allowed.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key];
  });
  return out;
}

const OWNER_FIELDS = 'name email role profilePhoto';

/**
 * GET /api/v1/jobs
 * Approved + open jobs for students/alumni. Administrators may pass
 * `includeAll=true` to see every job regardless of status.
 */
const listJobs = asyncHandler(async (req, res) => {
  const { q, location, workMode, employmentType, experienceLevel, company, skill, onlyOpen } = req.query;
  const pagination = getPagination(req.query, { defaultLimit: 9 });

  const filter = {};

  // Administrators may opt into every job. An owner (alumni) is always allowed
  // to see all of their own posts, including pending / rejected / closed ones.
  const isOwnPosts = Boolean(req.query.postedBy) && String(req.query.postedBy) === String(req.user._id);
  const canSeeAll = (req.user.role === 'admin' && req.query.includeAll === 'true') || isOwnPosts;
  if (!canSeeAll) {
    filter.approvalStatus = 'approved';
  }
  if (onlyOpen === 'true' || !canSeeAll) {
    if (!canSeeAll) filter.jobStatus = 'open';
  }
  if (req.query.approvalStatus && req.user.role === 'admin') {
    filter.approvalStatus = req.query.approvalStatus;
  }
  if (req.query.jobStatus && req.user.role === 'admin') {
    filter.jobStatus = req.query.jobStatus;
  }
  if (req.query.postedBy) {
    filter.postedBy = req.query.postedBy;
  }

  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (company) filter.company = new RegExp(escapeRegex(company), 'i');
  if (workMode) filter.workMode = workMode;
  if (employmentType) filter.employmentType = employmentType;
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (skill) {
    const skills = String(skill)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length) filter.skillsRequired = { $in: skills.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { company: rx }, { description: rx }, { skillsRequired: rx }, { location: rx }];
  }

  const sortMap = { recent: 'createdAt', deadline: 'applicationDeadline', title: 'title' };
  const sortBy = sortMap[req.query.sortBy] || 'createdAt';
  const sortOrder = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('postedBy', OWNER_FIELDS),
    Job.countDocuments(filter),
  ]);

  // Attach the caller's own application status where relevant.
  let myApplications = [];
  if (req.user.role === 'student' && jobs.length) {
    myApplications = await JobApplication.find({
      student: req.user._id,
      job: { $in: jobs.map((j) => j._id) },
    }).select('job applicationStatus');
  }
  const appliedMap = new Map(myApplications.map((a) => [String(a.job), a.applicationStatus]));

  const data = jobs.map((job) => ({
    ...job.toObject(),
    myApplicationStatus: appliedMap.get(String(job._id)) || null,
  }));

  return sendSuccess(res, data, { message: 'Jobs loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/jobs/:id */
const getJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid job identifier.');

  const job = await Job.findById(id).populate('postedBy', OWNER_FIELDS);
  if (!job) throw ApiError.notFound('Job not found.');

  const isOwner = String(job.postedBy?._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  const isApproved = job.approvalStatus === 'approved';

  if (!isApproved && !isOwner && !isAdmin) {
    throw ApiError.notFound('Job not found.');
  }

  let applicationCount = 0;
  let myApplication = null;
  if (isOwner || isAdmin) {
    applicationCount = await JobApplication.countDocuments({ job: job._id, applicationStatus: { $ne: 'withdrawn' } });
  }
  if (req.user.role === 'student') {
    myApplication = await JobApplication.findOne({ job: job._id, student: req.user._id });
  }

  // Fire and forget a view counter.
  Job.updateOne({ _id: job._id }, { $inc: { views: 1 } }).catch(() => {});

  return sendSuccess(
    res,
    { ...job.toObject(), applicationCount, myApplication },
    { message: 'Job loaded.' }
  );
});

/** POST /api/v1/jobs (approved alumni) */
const createJob = asyncHandler(async (req, res) => {
  const payload = pick(req.body, CREATABLE_FIELDS);
  payload.postedBy = req.user._id;
  payload.approvalStatus = 'pending';
  payload.jobStatus = 'open';

  if (payload.salaryMin && payload.salaryMax && payload.salaryMax < payload.salaryMin) {
    throw ApiError.badRequest('Maximum salary cannot be lower than the minimum salary.');
  }

  const job = await Job.create(payload);

  await logActivity({
    actor: req.user,
    action: 'job.create',
    entity: 'Job',
    entityId: job._id,
    description: `${req.user.name} posted a job: ${job.title}.`,
  });

  const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
  await Promise.all(
    admins.map((a) =>
      createNotification({
        user: a._id,
        title: 'New job awaiting approval',
        message: `${req.user.name} posted "${job.title}" at ${job.company}.`,
        type: 'info',
        category: 'job',
        link: '/admin/job-approvals',
      })
    )
  );

  return sendSuccess(res, job.toObject(), {
    status: 201,
    message: 'Job posted successfully. It will appear once an administrator approves it.',
  });
});

/** PUT /api/v1/jobs/:id (owner alumni or admin) */
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');

  const isOwner = String(job.postedBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You can only edit your own job posts.');

  const updates = pick(req.body, [...CREATABLE_FIELDS, 'jobStatus']);
  Object.assign(job, updates);

  // Any content edit by the owner requires a fresh approval.
  if (isOwner && !isAdmin) {
    const contentFields = CREATABLE_FIELDS.filter((f) => updates[f] !== undefined);
    if (contentFields.length) {
      job.approvalStatus = 'pending';
      job.rejectionReason = null;
    }
  }

  if (job.salaryMin && job.salaryMax && job.salaryMax < job.salaryMin) {
    throw ApiError.badRequest('Maximum salary cannot be lower than the minimum salary.');
  }

  await job.save();

  await logActivity({
    actor: req.user,
    action: 'job.update',
    entity: 'Job',
    entityId: job._id,
    description: `${req.user.name} updated the job "${job.title}".`,
  });

  return sendSuccess(res, job.toObject(), { message: 'Job updated successfully.' });
});

/** DELETE /api/v1/jobs/:id (owner alumni or admin) */
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');

  const isOwner = String(job.postedBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You can only delete your own job posts.');

  await JobApplication.deleteMany({ job: job._id });
  await job.deleteOne();

  await logActivity({
    actor: req.user,
    action: 'job.delete',
    entity: 'Job',
    entityId: job._id,
    description: `${req.user.name} deleted the job "${job.title}".`,
  });

  return sendSuccess(res, null, { message: 'Job deleted successfully.' });
});

/**
 * POST /api/v1/jobs/:id/apply (students)
 * Accepts multipart/form-data with an optional `resume` file, or JSON that
 * references an already uploaded resume on the student profile.
 */
const applyToJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid job identifier.');

  const job = await Job.findById(id);
  if (!job) throw ApiError.notFound('Job not found.');
  if (job.approvalStatus !== 'approved') throw ApiError.notFound('Job not found.');
  if (job.jobStatus !== 'open') throw ApiError.badRequest('This job is no longer accepting applications.');
  if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
    throw ApiError.badRequest('The application deadline for this job has passed.');
  }
  if (String(job.postedBy) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot apply to a job you posted.');
  }

  const existing = await JobApplication.findOne({ job: job._id, student: req.user._id });
  if (existing) {
    throw ApiError.conflict('You have already applied for this job.');
  }

  const profile = await StudentProfile.findOne({ user: req.user._id });
  let resumePath = null;
  if (req.file) resumePath = `/uploads/resumes/${req.file.filename}`;
  else if (req.body.resume) resumePath = String(req.body.resume);
  else if (profile && profile.resume) resumePath = profile.resume;

  if (!resumePath) {
    throw ApiError.badRequest('Please upload a resume (PDF or Word document) before applying.');
  }

  const application = await JobApplication.create({
    job: job._id,
    student: req.user._id,
    applicantName: req.user.name,
    applicantEmail: req.user.email,
    resume: resumePath,
    coverLetter: req.body.coverLetter || '',
  });

  await logActivity({
    actor: req.user,
    action: 'application.create',
    entity: 'JobApplication',
    entityId: application._id,
    description: `${req.user.name} applied for "${job.title}".`,
  });

  await createNotification({
    user: job.postedBy,
    title: 'New job application',
    message: `${req.user.name} applied for your job "${job.title}".`,
    type: 'info',
    category: 'application',
    link: `/alumni/jobs/${job._id}/applicants`,
  });

  return sendSuccess(res, application.toObject(), {
    status: 201,
    message: 'Application submitted successfully.',
  });
});

/** GET /api/v1/jobs/:id/applications (job owner or admin) */
const getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found.');

  const isOwner = String(job.postedBy) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view applications for your own job posts.');
  }

  const pagination = getPagination(req.query, { defaultLimit: 20 });
  const filter = { job: job._id };
  if (req.query.applicationStatus) filter.applicationStatus = req.query.applicationStatus;

  const [applications, total] = await Promise.all([
    JobApplication.find(filter)
      .sort({ appliedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('student', 'name email profilePhoto'),
    JobApplication.countDocuments(filter),
  ]);

  const data = applications.map((a) => {
    const obj = a.toObject();
    return {
      ...obj,
      applicant: obj.student
        ? { id: obj.student._id, name: obj.student.name, email: obj.student.email, profilePhoto: obj.student.profilePhoto }
        : null,
    };
  });

  return sendSuccess(res, { job: { id: job._id, title: job.title, company: job.company }, applications: data }, {
    message: 'Applications loaded.',
    meta: pagination.meta(total),
  });
});

/** GET /api/v1/applications/me (students) */
const getMyApplications = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20 });
  const filter = { student: req.user._id };
  if (req.query.applicationStatus) filter.applicationStatus = req.query.applicationStatus;

  const [applications, total] = await Promise.all([
    JobApplication.find(filter)
      .sort({ appliedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('job', 'title company location workMode employmentType jobStatus applicationDeadline postedBy'),
    JobApplication.countDocuments(filter),
  ]);

  return sendSuccess(res, applications, { message: 'Your applications loaded.', meta: pagination.meta(total) });
});

/** GET /api/v1/applications/received (alumni owner view across all their jobs) */
const getReceivedApplications = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id }).select('_id');
  const jobIds = jobs.map((j) => j._id);

  const pagination = getPagination(req.query, { defaultLimit: 20 });
  const filter = { job: { $in: jobIds } };
  if (req.query.applicationStatus) filter.applicationStatus = req.query.applicationStatus;

  const [applications, total] = await Promise.all([
    JobApplication.find(filter)
      .sort({ appliedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('job', 'title company')
      .populate('student', 'name email profilePhoto'),
    JobApplication.countDocuments(filter),
  ]);

  return sendSuccess(res, applications, {
    message: 'Received applications loaded.',
    meta: pagination.meta(total),
  });
});

/** PATCH /api/v1/applications/:id/status (job owner or admin) */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id).populate('job');
  if (!application) throw ApiError.notFound('Application not found.');

  const job = application.job;
  const isOwner = job && String(job.postedBy) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only update applications for your own job posts.');
  }

  const { applicationStatus, statusNote } = req.body;
  application.applicationStatus = applicationStatus;
  if (statusNote !== undefined) application.statusNote = statusNote;
  application.statusUpdatedAt = new Date();
  await application.save();

  await logActivity({
    actor: req.user,
    action: 'application.status_update',
    entity: 'JobApplication',
    entityId: application._id,
    description: `Application for "${job.title}" marked as ${applicationStatus}.`,
  });

  const statusCopy = {
    under_review: 'is under review',
    shortlisted: 'has been shortlisted',
    accepted: 'has been accepted',
    rejected: 'was not successful this time',
    submitted: 'was received',
    withdrawn: 'was withdrawn',
  };

  await createNotification({
    user: application.student,
    title: 'Application status updated',
    message: `Your application for "${job.title}" at ${job.company} ${statusCopy[applicationStatus] || 'was updated'}.`,
    type: applicationStatus === 'rejected' ? 'warning' : 'success',
    category: 'application',
    link: '/student/applications',
  });

  return sendSuccess(res, application.toObject(), { message: 'Application status updated.' });
});

/** PATCH /api/v1/applications/:id/withdraw (owning student) */
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id).populate('job');
  if (!application) throw ApiError.notFound('Application not found.');
  if (String(application.student) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only withdraw your own applications.');
  }
  if (['accepted', 'rejected', 'withdrawn'].includes(application.applicationStatus)) {
    throw ApiError.badRequest('This application can no longer be withdrawn.');
  }

  application.applicationStatus = 'withdrawn';
  application.statusUpdatedAt = new Date();
  await application.save();

  return sendSuccess(res, application.toObject(), { message: 'Application withdrawn.' });
});

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getJobApplications,
  getMyApplications,
  getReceivedApplications,
  updateApplicationStatus,
  withdrawApplication,
};
