'use strict';

const mongoose = require('mongoose');
const MentorshipRequest = require('../models/MentorshipRequest');
const AlumniProfile = require('../models/AlumniProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** GET /api/v1/mentorship - directory of alumni open to mentoring. */
const listMentors = asyncHandler(async (req, res) => {
  const { q, department, graduationYear, skill } = req.query;
  const pagination = getPagination(req.query, { defaultLimit: 9 });

  const match = { openToMentorship: true };
  if (department) match.department = new RegExp(`^${escapeRegex(department)}$`, 'i');
  if (graduationYear) match.graduationYear = Number(graduationYear);
  if (skill) match.mentorshipAreas = new RegExp(escapeRegex(skill), 'i');

  const pipeline = [
    { $match: match },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.role': 'alumni', 'user.accountStatus': 'active', 'user.approvalStatus': 'approved' } },
  ];

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    pipeline.push({
      $match: {
        $or: [
          { 'user.name': rx },
          { department: rx },
          { currentCompany: rx },
          { jobTitle: rx },
          { mentorshipAreas: rx },
          { skills: rx },
        ],
      },
    });
  }

  pipeline.push({ $sort: { profileCompletion: -1, createdAt: -1 } });
  pipeline.push({
    $facet: {
      data: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await AlumniProfile.aggregate(pipeline);
  const total = result.total[0] ? result.total[0].count : 0;

  const data = result.data.map((p) => ({
    userId: p.user._id,
    name: p.user.name,
    profilePhoto: p.user.profilePhoto,
    department: p.department,
    graduationYear: p.graduationYear,
    batch: p.batch,
    currentCompany: p.currentCompany,
    jobTitle: p.jobTitle,
    location: p.location,
    skills: p.skills,
    mentorshipAreas: p.mentorshipAreas,
    biography: p.biography,
    profileCompletion: p.profileCompletion,
  }));

  return sendSuccess(res, data, { message: 'Mentors loaded.', meta: pagination.meta(total) });
});

/** POST /api/v1/mentorship/requests (students) */
const createRequest = asyncHandler(async (req, res) => {
  const { alumniId, message, careerGoal, areaOfInterest } = req.body;

  if (!mongoose.isValidObjectId(alumniId)) throw ApiError.badRequest('A valid alumni must be selected.');
  if (String(alumniId) === String(req.user._id)) throw ApiError.badRequest('You cannot request mentorship from yourself.');

  const alumni = await User.findById(alumniId);
  if (!alumni || alumni.role !== 'alumni' || alumni.approvalStatus !== 'approved' || alumni.accountStatus !== 'active') {
    throw ApiError.notFound('The selected alumnus is not available for mentorship.');
  }

  const profile = await AlumniProfile.findOne({ user: alumni._id });
  if (profile && profile.openToMentorship === false) {
    throw ApiError.badRequest('This alumnus is currently not accepting mentorship requests.');
  }

  const existing = await MentorshipRequest.findOne({
    student: req.user._id,
    alumni: alumni._id,
    status: { $in: ['pending', 'accepted'] },
  });
  if (existing) {
    throw ApiError.conflict('You already have an active mentorship request with this alumnus.');
  }

  const request = await MentorshipRequest.create({
    student: req.user._id,
    alumni: alumni._id,
    message,
    careerGoal,
    areaOfInterest: areaOfInterest || '',
  });

  await logActivity({
    actor: req.user,
    action: 'mentorship.create',
    entity: 'MentorshipRequest',
    entityId: request._id,
    description: `${req.user.name} requested mentorship from ${alumni.name}.`,
  });

  await createNotification({
    user: alumni._id,
    title: 'New mentorship request',
    message: `${req.user.name} would like you to mentor them.`,
    type: 'info',
    category: 'mentorship',
    link: '/alumni/mentorship',
  });

  return sendSuccess(res, request.toObject(), { status: 201, message: 'Mentorship request sent.' });
});

/**
 * GET /api/v1/mentorship/requests/me
 * Students see requests they sent, alumni see requests they received and
 * administrators see everything.
 */
const getMyRequests = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20 });
  const filter = {};

  if (req.user.role === 'student') filter.student = req.user._id;
  else if (req.user.role === 'alumni') filter.alumni = req.user._id;
  else if (req.user.role !== 'admin') throw ApiError.forbidden();

  if (req.query.status) filter.status = req.query.status;

  const [requests, total] = await Promise.all([
    MentorshipRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate('student', 'name email profilePhoto')
      .populate('alumni', 'name email profilePhoto'),
    MentorshipRequest.countDocuments(filter),
  ]);

  // Counts by status for dashboard widgets.
  const statusCounts = await MentorshipRequest.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return sendSuccess(
    res,
    requests,
    {
      message: 'Mentorship requests loaded.',
      meta: { ...pagination.meta(total), statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}) },
    }
  );
});

/** GET /api/v1/mentorship/requests/:id */
const getRequestById = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findById(req.params.id)
    .populate('student', 'name email profilePhoto')
    .populate('alumni', 'name email profilePhoto');
  if (!request) throw ApiError.notFound('Mentorship request not found.');

  const isParticipant =
    String(request.student?._id || request.student) === String(req.user._id) ||
    String(request.alumni?._id || request.alumni) === String(req.user._id);

  if (!isParticipant && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this mentorship request.');
  }

  return sendSuccess(res, request.toObject(), { message: 'Mentorship request loaded.' });
});

/**
 * PATCH /api/v1/mentorship/requests/:id
 * Alumni accept/reject/complete. Students may cancel their own pending request.
 */
const respondToRequest = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Mentorship request not found.');

  const isAlumni = String(request.alumni) === String(req.user._id);
  const isStudent = String(request.student) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  const { status, responseMessage, meetingDetails } = req.body;

  if (!isAlumni && !isStudent && !isAdmin) {
    throw ApiError.forbidden('You do not have access to this mentorship request.');
  }

  // Students may only cancel; administrators may only moderate.
  if (isStudent && !isAdmin && !isAlumni) {
    if (status !== 'cancelled') {
      throw ApiError.forbidden('Students can only cancel their own mentorship requests.');
    }
    if (!['pending', 'accepted'].includes(request.status)) {
      throw ApiError.badRequest('This request can no longer be cancelled.');
    }
    request.status = 'cancelled';
    await request.save();
    await createNotification({
      user: request.alumni,
      title: 'Mentorship request cancelled',
      message: `${req.user.name} cancelled their mentorship request.`,
      type: 'warning',
      category: 'mentorship',
      link: '/alumni/mentorship',
    });
    return sendSuccess(res, request.toObject(), { message: 'Mentorship request cancelled.' });
  }

  request.status = status;
  if (responseMessage !== undefined) request.responseMessage = responseMessage;
  if (meetingDetails) {
    request.meetingDetails = {
      mode: meetingDetails.mode || request.meetingDetails?.mode || null,
      scheduledAt: meetingDetails.scheduledAt || request.meetingDetails?.scheduledAt || null,
      location: meetingDetails.location || request.meetingDetails?.location || '',
      link: meetingDetails.link || request.meetingDetails?.link || '',
      notes: meetingDetails.notes || request.meetingDetails?.notes || '',
    };
  }
  request.respondedAt = new Date();
  if (status === 'completed') request.completedAt = new Date();
  await request.save();

  await logActivity({
    actor: req.user,
    action: 'mentorship.respond',
    entity: 'MentorshipRequest',
    entityId: request._id,
    description: `Mentorship request marked as ${status}.`,
  });

  const students = [request.student];
  const copy = {
    accepted: { title: 'Mentorship request accepted', type: 'success', msg: 'Your mentorship request was accepted.' },
    rejected: { title: 'Mentorship request declined', type: 'warning', msg: 'Your mentorship request was declined.' },
    completed: { title: 'Mentorship completed', type: 'success', msg: 'Your mentorship has been marked as completed.' },
    cancelled: { title: 'Mentorship request cancelled', type: 'warning', msg: 'The mentorship request was cancelled.' },
  };
  const info = copy[status] || { title: 'Mentorship request updated', type: 'info', msg: 'Your mentorship request was updated.' };

  await Promise.all(
    students
      .filter((id) => String(id) !== String(req.user._id))
      .map((id) =>
        createNotification({
          user: id,
          title: info.title,
          message: info.msg,
          type: info.type,
          category: 'mentorship',
          link: '/student/mentorship',
        })
      )
  );

  return sendSuccess(res, request.toObject(), { message: `Mentorship request ${status}.` });
});

/** DELETE /api/v1/mentorship/requests/:id (student owner or admin) */
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await MentorshipRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Mentorship request not found.');

  const isStudent = String(request.student) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isStudent && !isAdmin) {
    throw ApiError.forbidden('You can only delete your own mentorship requests.');
  }
  if (isStudent && !isAdmin && !['cancelled', 'rejected', 'completed'].includes(request.status)) {
    throw ApiError.badRequest('Only cancelled, rejected or completed requests can be deleted.');
  }

  await request.deleteOne();
  return sendSuccess(res, null, { message: 'Mentorship request deleted.' });
});

module.exports = {
  listMentors,
  createRequest,
  getMyRequests,
  getRequestById,
  respondToRequest,
  deleteRequest,
};
