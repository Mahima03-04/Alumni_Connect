'use strict';

const User = require('../models/User');
const AlumniProfile = require('../models/AlumniProfile');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const MentorshipRequest = require('../models/MentorshipRequest');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/v1/public/stats
 * Public counters used on the landing page. Contains no personal data.
 */
const getPublicStats = asyncHandler(async (_req, res) => {
  const [
    alumniCount,
    studentCount,
    jobCount,
    eventCount,
    applicationCount,
    companyList,
  ] = await Promise.all([
    User.countDocuments({ role: 'alumni', approvalStatus: 'approved', accountStatus: 'active' }),
    User.countDocuments({ role: 'student', accountStatus: 'active' }),
    Job.countDocuments({ approvalStatus: 'approved', jobStatus: 'open' }),
    Event.countDocuments({ status: 'published', startDate: { $gte: new Date() } }),
    JobApplication.countDocuments({ applicationStatus: { $ne: 'withdrawn' } }),
    AlumniProfile.distinct('currentCompany'),
  ]);

  const companies = companyList.filter((c) => c && String(c).trim()).length;

  return sendSuccess(
    res,
    {
      alumni: alumniCount,
      students: studentCount,
      openJobs: jobCount,
      upcomingEvents: eventCount,
      applications: applicationCount,
      companies,
    },
    { message: 'Platform statistics.' }
  );
});

/**
 * GET /api/v1/public/alumni-preview
 * A small, safe preview of approved alumni for the public landing page.
 */
const getAlumniPreview = asyncHandler(async (req, res) => {
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 6));

  const pipeline = [
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.role': 'alumni', 'user.approvalStatus': 'approved', 'user.accountStatus': 'active' } },
    { $sort: { profileCompletion: -1, createdAt: -1 } },
    { $limit: limit },
  ];

  const profiles = await AlumniProfile.aggregate(pipeline);

  const data = profiles.map((p) => ({
    userId: p.user._id,
    name: p.user.name,
    profilePhoto: p.user.profilePhoto,
    jobTitle: p.jobTitle,
    currentCompany: p.currentCompany,
    department: p.department,
    graduationYear: p.graduationYear,
    skills: (p.skills || []).slice(0, 4),
  }));

  return sendSuccess(res, data, { message: 'Alumni preview.' });
});

/**
 * GET /api/v1/public/testimonials
 * Clearly-marked demo testimonials. They are static demo content, not real
 * user submissions, and the frontend labels them as such.
 */
const getTestimonials = asyncHandler(async (_req, res) => {
  const testimonials = [
    {
      id: 't1',
      name: 'Ananya Sharma',
      role: 'B.Tech CSE, Class of 2023',
      quote:
        'I found my first internship through an alumni referral on AlumniConnect. The mentorship I received made all the difference.',
      isDemo: true,
    },
    {
      id: 't2',
      name: 'Rahul Verma',
      role: 'Engineering Manager, Class of 2014',
      quote:
        'Posting openings for my alma mater is effortless, and I get to give back by mentoring final-year students.',
      isDemo: true,
    },
    {
      id: 't3',
      name: 'Priya Nair',
      role: 'M.Sc Data Science, Class of 2025',
      quote:
        'The mentor directory helped me reach the right person. I now have a clear roadmap for a data engineering career.',
      isDemo: true,
    },
    {
      id: 't4',
      name: 'Faizan Ahmed',
      role: 'Product Designer, Class of 2017',
      quote:
        'AlumniConnect keeps our batch connected and makes it simple to give back to current students.',
      isDemo: true,
    },
  ];

  return sendSuccess(res, testimonials, { message: 'Demo testimonials.' });
});

/** Convenience aggregate used by admin + role dashboards. */
async function platformCounts() {
  const [
    totalStudents,
    totalAlumni,
    pendingAlumni,
    rejectedAlumni,
    pendingJobs,
    publishedJobs,
    totalApplications,
    activeEvents,
    totalEvents,
    totalMentorship,
    pendingMentorship,
    totalUsers,
    suspendedUsers,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'alumni', approvalStatus: 'approved' }),
    User.countDocuments({ role: 'alumni', approvalStatus: 'pending' }),
    User.countDocuments({ role: 'alumni', approvalStatus: 'rejected' }),
    Job.countDocuments({ approvalStatus: 'pending' }),
    Job.countDocuments({ approvalStatus: 'approved', jobStatus: 'open' }),
    JobApplication.countDocuments({ applicationStatus: { $ne: 'withdrawn' } }),
    Event.countDocuments({ status: 'published', startDate: { $gte: new Date() } }),
    Event.countDocuments({}),
    MentorshipRequest.countDocuments({}),
    MentorshipRequest.countDocuments({ status: 'pending' }),
    User.countDocuments({}),
    User.countDocuments({ accountStatus: 'suspended' }),
  ]);

  const [publishedAnnouncements, totalAnnouncements] = await Promise.all([
    Announcement.countDocuments({ status: 'published' }),
    Announcement.countDocuments({}),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalAlumni,
    pendingAlumni,
    rejectedAlumni,
    suspendedUsers,
    pendingJobs,
    publishedJobs,
    totalApplications,
    activeEvents,
    totalEvents,
    totalMentorship,
    pendingMentorship,
    publishedAnnouncements,
    totalAnnouncements,
  };
}

module.exports = { getPublicStats, getAlumniPreview, getTestimonials, platformCounts };
