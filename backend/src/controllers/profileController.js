'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const Job = require('../models/Job');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { computeAlumniCompletion } = require('../utils/profileCompletion');
const { UPLOAD_ROOT } = require('../middleware/upload');
const { logActivity } = require('../services/activityService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ALLOWED_ALUMNI_FIELDS = [
  'university',
  'department',
  'degree',
  'course',
  'graduationYear',
  'batch',
  'currentCompany',
  'jobTitle',
  'workExperience',
  'skills',
  'biography',
  'linkedinUrl',
  'location',
  'openToMentorship',
  'mentorshipAreas',
];

const ALLOWED_STUDENT_FIELDS = [
  'studentId',
  'university',
  'department',
  'degree',
  'course',
  'currentSemester',
  'graduationYear',
  'skills',
  'interests',
  'biography',
  'location',
];

function pick(source, allowed) {
  const out = {};
  allowed.forEach((key) => {
    if (source[key] !== undefined) out[key] = source[key];
  });
  return out;
}

/** Shape a profile + user pair for directory/profile responses. */
function shapeAlumni(profile, user) {
  return {
    id: profile._id,
    userId: user._id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
    university: profile.university,
    department: profile.department,
    degree: profile.degree,
    course: profile.course,
    graduationYear: profile.graduationYear,
    batch: profile.batch,
    currentCompany: profile.currentCompany,
    jobTitle: profile.jobTitle,
    location: profile.location,
    skills: profile.skills,
    biography: profile.biography,
    linkedinUrl: profile.linkedinUrl,
    mentorshipAreas: profile.mentorshipAreas,
    openToMentorship: profile.openToMentorship,
    profileCompletion: profile.profileCompletion,
    workExperience: profile.workExperience,
    joinedAt: user.createdAt,
  };
}

/**
 * GET /api/v1/profiles
 * Public directory of approved alumni with search, filtering, sorting and
 * pagination. Pending/rejected alumni are never listed.
 */
const listProfiles = asyncHandler(async (req, res) => {
  const { q, department, graduationYear, batch, company, jobTitle, skill, openToMentorship } = req.query;
  const pagination = getPagination(req.query, { defaultLimit: 9 });

  const profileMatch = {};
  if (department) profileMatch.department = new RegExp(`^${escapeRegex(department)}$`, 'i');
  if (graduationYear) profileMatch.graduationYear = Number(graduationYear);
  if (batch) profileMatch.batch = new RegExp(`^${escapeRegex(batch)}$`, 'i');
  if (company) profileMatch.currentCompany = new RegExp(escapeRegex(company), 'i');
  if (jobTitle) profileMatch.jobTitle = new RegExp(escapeRegex(jobTitle), 'i');
  if (skill) {
    const skills = String(skill)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (skills.length) profileMatch.skills = { $in: skills.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
  }
  if (openToMentorship === 'true') profileMatch.openToMentorship = true;

  const sortMap = {
    name: 'user.name',
    graduationYear: 'graduationYear',
    currentCompany: 'currentCompany',
    jobTitle: 'jobTitle',
    createdAt: 'createdAt',
  };
  const sortField = sortMap[req.query.sortBy] || 'createdAt';
  const sortDir = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  const searchStage = q
    ? {
        $or: [
          { 'user.name': new RegExp(escapeRegex(q), 'i') },
          { currentCompany: new RegExp(escapeRegex(q), 'i') },
          { jobTitle: new RegExp(escapeRegex(q), 'i') },
          { department: new RegExp(escapeRegex(q), 'i') },
          { university: new RegExp(escapeRegex(q), 'i') },
          { skills: new RegExp(escapeRegex(q), 'i') },
        ],
      }
    : null;

  const pipeline = [
    { $match: profileMatch },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $match: {
        'user.role': 'alumni',
        'user.accountStatus': 'active',
        'user.approvalStatus': 'approved',
      },
    },
    ...(searchStage ? [{ $match: searchStage }] : []),
    { $sort: { [sortField]: sortDir } },
    {
      $facet: {
        data: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await AlumniProfile.aggregate(pipeline);
  const total = result.total[0] ? result.total[0].count : 0;

  const data = result.data.map((doc) => shapeAlumni(doc, doc.user));

  return sendSuccess(res, data, {
    message: 'Alumni directory loaded.',
    meta: pagination.meta(total),
  });
});

/** GET /api/v1/profiles/:id - :id is the alumni user id. */
const getProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid profile identifier.');

  const profile = await AlumniProfile.findOne({ user: id });
  if (!profile) throw ApiError.notFound('Alumni profile not found.');

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Alumni profile not found.');

  const isAdmin = req.user && req.user.role === 'admin';
  const isSelf = req.user && String(req.user._id) === String(user._id);

  if (!isAdmin && !isSelf) {
    const visible = user.role === 'alumni' && user.accountStatus === 'active' && user.approvalStatus === 'approved';
    if (!visible) throw ApiError.notFound('Alumni profile not found.');
  }

  const recentJobs = await Job.find({
    postedBy: user._id,
    approvalStatus: 'approved',
    jobStatus: 'open',
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title company location workMode employmentType createdAt applicationDeadline');

  return sendSuccess(
    res,
    { ...shapeAlumni(profile, user), recentJobs },
    { message: 'Alumni profile loaded.' }
  );
});

/**
 * PUT /api/v1/profiles/me
 * Updates the caller's own profile. Only whitelisted fields are accepted.
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, phone } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone || null;
  await user.save();

  let profile;
  if (user.role === 'alumni') {
    profile = await AlumniProfile.findOne({ user: user._id });
    if (!profile) profile = new AlumniProfile({ user: user._id });
    Object.assign(profile, pick(req.body, ALLOWED_ALUMNI_FIELDS));
    profile.profileCompletion = computeAlumniCompletion(profile.toObject(), user);
    await profile.save();
  } else if (user.role === 'student') {
    profile = await StudentProfile.findOne({ user: user._id });
    if (!profile) profile = new StudentProfile({ user: user._id });
    Object.assign(profile, pick(req.body, ALLOWED_STUDENT_FIELDS));
    await profile.save();
  } else {
    profile = null;
  }

  await logActivity({
    actor: user,
    action: 'profile.update',
    entity: 'Profile',
    entityId: user._id,
    description: `${user.name} updated their profile.`,
  });

  return sendSuccess(
    res,
    { user: user.toJSON(), profile: profile ? profile.toObject() : null },
    { message: 'Profile updated successfully.' }
  );
});

/** DELETE a previously uploaded file, ignoring "already gone" errors. */
function removeFileIfExists(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) return;
  const abs = path.join(UPLOAD_ROOT, relativeUrl.replace('/uploads/', ''));
  fs.promises.unlink(abs).catch(() => {});
}

/** POST /api/v1/profiles/me/photo */
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Please choose an image file to upload.');

  const url = `/uploads/photos/${req.file.filename}`;
  removeFileIfExists(req.user.profilePhoto);
  req.user.profilePhoto = url;
  await req.user.save();

  await logActivity({
    actor: req.user,
    action: 'profile.photo_update',
    entity: 'User',
    entityId: req.user._id,
    description: `${req.user.name} updated their profile photo.`,
  });

  return sendSuccess(res, { profilePhoto: url }, { message: 'Profile photo updated.' });
});

/** DELETE /api/v1/profiles/me/photo */
const deleteProfilePhoto = asyncHandler(async (req, res) => {
  removeFileIfExists(req.user.profilePhoto);
  req.user.profilePhoto = null;
  await req.user.save();
  return sendSuccess(res, { profilePhoto: null }, { message: 'Profile photo removed.' });
});

/** POST /api/v1/profiles/me/resume (students) */
const uploadResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    throw ApiError.forbidden('Only student accounts can upload a resume here.');
  }
  if (!req.file) throw ApiError.badRequest('Please choose a PDF or Word document to upload.');

  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) throw ApiError.notFound('Student profile not found.');

  const url = `/uploads/resumes/${req.file.filename}`;
  removeFileIfExists(profile.resume);
  profile.resume = url;
  await profile.save();

  return sendSuccess(res, { resume: url }, { message: 'Resume uploaded successfully.' });
});

/** GET /api/v1/profiles/metadata - filter helper values for the directory UI. */
const getDirectoryMetadata = asyncHandler(async (_req, res) => {
  const [departments, years, companies] = await Promise.all([
    AlumniProfile.distinct('department'),
    AlumniProfile.distinct('graduationYear'),
    AlumniProfile.distinct('currentCompany'),
  ]);

  const clean = (arr) => arr.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');

  return sendSuccess(
    res,
    {
      departments: clean(departments).sort(),
      graduationYears: clean(years).sort((a, b) => b - a),
      companies: clean(companies).sort().slice(0, 50),
    },
    { message: 'Directory metadata loaded.' }
  );
});

module.exports = {
  listProfiles,
  getProfileById,
  updateMyProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  uploadResume,
  getDirectoryMetadata,
};
