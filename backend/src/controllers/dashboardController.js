'use strict';

const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const MentorshipRequest = require('../models/MentorshipRequest');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const AlumniProfile = require('../models/AlumniProfile');
const StudentProfile = require('../models/StudentProfile');
const Announcement = require('../models/Announcement');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { computeAlumniCompletion } = require('../utils/profileCompletion');

const toMap = (arr) => arr.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});

async function upcomingEventsFor(userId, role) {
  const registrations = await EventRegistration.find({ user: userId, registrationStatus: 'registered' })
    .populate({
      path: 'event',
      match: { startDate: { $gte: new Date() }, status: 'published' },
    })
    .lean();

  const fromRegistrations = registrations
    .filter((r) => r.event)
    .map((r) => ({ ...r.event, isRegistered: true }));

  const audienceFilter = role === 'alumni' ? { $in: ['all', 'alumni'] } : { $in: ['all', 'students'] };
  const general = await Event.find({
    status: 'published',
    startDate: { $gte: new Date() },
    audience: audienceFilter,
  })
    .sort({ startDate: 1 })
    .limit(5)
    .lean();

  const seen = new Set(fromRegistrations.map((e) => String(e._id)));
  const merged = [...fromRegistrations];
  general.forEach((e) => {
    if (!seen.has(String(e._id))) {
      merged.push({ ...e, isRegistered: false });
      seen.add(String(e._id));
    }
  });
  return merged.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 5);
}

/** GET /api/v1/dashboard/student */
const getStudentDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Loaded first because the recommended alumni query depends on the
  // student's department.
  const profile = await StudentProfile.findOne({ user: userId }).lean();

  const [
    applicationCounts,
    totalApplications,
    mentorshipCounts,
    myRegistrations,
    recentJobs,
    recommendedAlumni,
    recentApplications,
    announcements,
  ] = await Promise.all([
    JobApplication.aggregate([
      { $match: { student: userId } },
      { $group: { _id: '$applicationStatus', count: { $sum: 1 } } },
    ]),
    JobApplication.countDocuments({ student: userId }),
    MentorshipRequest.aggregate([
      { $match: { student: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    EventRegistration.countDocuments({ user: userId, registrationStatus: 'registered' }),
    Job.find({ approvalStatus: 'approved', jobStatus: 'open' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title company location workMode employmentType createdAt applicationDeadline'),
    AlumniProfile.aggregate([
      { $match: { openToMentorship: true } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: { 'user.approvalStatus': 'approved', 'user.accountStatus': 'active' } },
      ...(profile && profile.department ? [{ $match: { department: profile.department } }] : []),
      { $sort: { profileCompletion: -1 } },
      { $limit: 4 },
    ]),
    JobApplication.find({ student: userId })
      .sort({ appliedAt: -1 })
      .limit(5)
      .populate('job', 'title company')
      .lean(),
    Announcement.find({ status: 'published', $or: [{ audience: 'all' }, { audience: 'students' }] })
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean(),
  ]);

  const statusMap = toMap(applicationCounts);
  const mentorshipMap = toMap(mentorshipCounts);

  return sendSuccess(
    res,
    {
      profile,
      stats: {
        totalApplications,
        pendingApplications:
          (statusMap.submitted || 0) + (statusMap.under_review || 0) + (statusMap.shortlisted || 0),
        acceptedApplications: statusMap.accepted || 0,
        rejectedApplications: statusMap.rejected || 0,
        mentorshipPending: mentorshipMap.pending || 0,
        mentorshipAccepted: mentorshipMap.accepted || 0,
        mentorshipCompleted: mentorshipMap.completed || 0,
        eventRegistrations: myRegistrations,
      },
      applicationStatus: statusMap,
      recentJobs,
      recommendedAlumni: recommendedAlumni.map((p) => ({
        userId: p.user._id,
        name: p.user.name,
        profilePhoto: p.user.profilePhoto,
        jobTitle: p.jobTitle,
        currentCompany: p.currentCompany,
        department: p.department,
        graduationYear: p.graduationYear,
        skills: (p.skills || []).slice(0, 4),
      })),
      recentApplications,
      upcomingEvents: await upcomingEventsFor(userId, 'student'),
      announcements,
    },
    { message: 'Student dashboard loaded.' }
  );
});

/** GET /api/v1/dashboard/alumni */
const getAlumniDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await AlumniProfile.findOne({ user: userId });
  const completion = profile ? computeAlumniCompletion(profile.toObject(), req.user) : 0;
  if (profile && profile.profileCompletion !== completion) {
    profile.profileCompletion = completion;
    await profile.save();
  }

  const myJobs = await Job.find({ postedBy: userId }).select('_id title company approvalStatus jobStatus createdAt');
  const jobIds = myJobs.map((j) => j._id);

  const [applicationCounts, totalApplications, recentApplications, mentorshipCounts, recentMentorship, announcements] =
    await Promise.all([
      JobApplication.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: '$applicationStatus', count: { $sum: 1 } } },
      ]),
      JobApplication.countDocuments({ job: { $in: jobIds } }),
      JobApplication.find({ job: { $in: jobIds } })
        .sort({ appliedAt: -1 })
        .limit(5)
        .populate('job', 'title company')
        .populate('student', 'name email')
        .lean(),
      MentorshipRequest.aggregate([
        { $match: { alumni: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      MentorshipRequest.find({ alumni: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name email profilePhoto')
        .lean(),
      Announcement.find({ status: 'published', $or: [{ audience: 'all' }, { audience: 'alumni' }] })
        .sort({ publishedAt: -1 })
        .limit(3)
        .lean(),
    ]);

  const appStatus = toMap(applicationCounts);
  const mentStatus = toMap(mentorshipCounts);

  return sendSuccess(
    res,
    {
      profile,
      stats: {
        profileCompletion: completion,
        totalJobs: myJobs.length,
        publishedJobs: myJobs.filter((j) => j.approvalStatus === 'approved' && j.jobStatus === 'open').length,
        pendingJobs: myJobs.filter((j) => j.approvalStatus === 'pending').length,
        totalApplications,
        newApplications: (appStatus.submitted || 0) + (appStatus.under_review || 0),
        mentorshipPending: mentStatus.pending || 0,
        mentorshipAccepted: mentStatus.accepted || 0,
        mentorshipCompleted: mentStatus.completed || 0,
      },
      applicationStatus: appStatus,
      mentorshipStatus: mentStatus,
      myJobs: myJobs.slice(0, 5),
      recentApplications,
      recentMentorship,
      upcomingEvents: await upcomingEventsFor(userId, 'alumni'),
      announcements,
    },
    { message: 'Alumni dashboard loaded.' }
  );
});

module.exports = { getStudentDashboard, getAlumniDashboard };
