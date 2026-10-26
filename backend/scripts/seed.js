'use strict';

/**
 * AlumniConnect demo data seeder.
 *
 * Usage:
 *   npm run seed          # insert / refresh the demo data (idempotent)
 *   npm run seed:reset    # wipe the database first, then seed (development only)
 *
 * The script is safe to run repeatedly: records are matched on stable keys
 * (email, title, etc.) and updated instead of duplicated.
 */

const env = require('../src/config/env');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');
const User = require('../src/models/User');
const AlumniProfile = require('../src/models/AlumniProfile');
const StudentProfile = require('../src/models/StudentProfile');
const Job = require('../src/models/Job');
const JobApplication = require('../src/models/JobApplication');
const MentorshipRequest = require('../src/models/MentorshipRequest');
const Event = require('../src/models/Event');
const EventRegistration = require('../src/models/EventRegistration');
const Announcement = require('../src/models/Announcement');
const Notification = require('../src/models/Notification');
const ActivityLog = require('../src/models/ActivityLog');
const { computeAlumniCompletion } = require('../src/utils/profileCompletion');

const RESET = process.argv.includes('--reset');

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const monthsAgo = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
};

async function resetDatabase() {
  if (env.isProduction) {
    throw new Error('Refusing to reset the database while NODE_ENV=production.');
  }
  console.log('[seed] --reset requested: clearing all collections in the development database...');
  await Promise.all([
    User.deleteMany({}),
    AlumniProfile.deleteMany({}),
    StudentProfile.deleteMany({}),
    Job.deleteMany({}),
    JobApplication.deleteMany({}),
    MentorshipRequest.deleteMany({}),
    Event.deleteMany({}),
    EventRegistration.deleteMany({}),
    Announcement.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
  console.log('[seed] Database cleared.');
}

/** Upsert a user by email and return the document. */
async function upsertUser({ passwordHash, ...data }) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    Object.assign(existing, data);
    existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }
  return User.create({ ...data, passwordHash });
}

async function seedAdminAndUsers() {
  const passwords = {
    admin: await User.hashPassword('AdminDemo@123'),
    alumni: await User.hashPassword('AlumniDemo@123'),
    student: await User.hashPassword('StudentDemo@123'),
    pending: await User.hashPassword('PendingDemo@123'),
    generic: await User.hashPassword('DemoUser@123'),
  };

  const admin = await upsertUser({
    name: 'Dr. Meera Krishnan',
    email: 'admin@alumniconnect.example.com',
    passwordHash: passwords.admin,
    role: 'admin',
    accountStatus: 'active',
    approvalStatus: 'not_required',
    phone: '+91 90000 00001',
  });

  const alumniSeed = [
    {
      name: 'Arjun Mehta',
      email: 'alumni@alumniconnect.example.com',
      passwordHash: passwords.alumni,
      role: 'alumni',
      accountStatus: 'active',
      approvalStatus: 'approved',
      approvedAt: monthsAgo(8),
      approvedBy: admin._id,
      phone: '+91 90000 00010',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Computer Science',
        degree: 'B.Tech',
        course: 'Computer Science & Engineering',
        graduationYear: 2016,
        batch: '2012-2016',
        currentCompany: 'NovaTech Solutions',
        jobTitle: 'Senior Software Engineer',
        location: 'Bengaluru, India',
        biography:
          'Full-stack engineer with eight years of experience building scalable web platforms. I enjoy mentoring students who are starting their careers in software development.',
        linkedinUrl: 'https://www.linkedin.com/in/example-arjun-mehta',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'System Design'],
        mentorshipAreas: ['Web Development', 'Career Guidance', 'Interview Preparation'],
        openToMentorship: true,
        workExperience: [
          {
            company: 'NovaTech Solutions',
            title: 'Senior Software Engineer',
            from: new Date('2021-04-01'),
            current: true,
            description: 'Leading the platform team and mentoring junior engineers.',
          },
          {
            company: 'BrightApps Pvt Ltd',
            title: 'Software Engineer',
            from: new Date('2016-07-01'),
            to: new Date('2021-03-01'),
            description: 'Built customer facing web applications using React and Node.js.',
          },
        ],
      },
    },
    {
      name: 'Sneha Iyer',
      email: 'sneha.iyer@example.com',
      passwordHash: passwords.generic,
      role: 'alumni',
      accountStatus: 'active',
      approvalStatus: 'approved',
      approvedAt: monthsAgo(6),
      approvedBy: admin._id,
      phone: '+91 90000 00011',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Data Science',
        degree: 'M.Sc',
        course: 'Data Science',
        graduationYear: 2018,
        batch: '2016-2018',
        currentCompany: 'FinEdge Analytics',
        jobTitle: 'Lead Data Scientist',
        location: 'Pune, India',
        biography:
          'Data scientist working on credit risk models and recommendation systems. Happy to guide students interested in analytics and machine learning.',
        linkedinUrl: 'https://www.linkedin.com/in/example-sneha-iyer',
        skills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization'],
        mentorshipAreas: ['Data Science', 'Machine Learning', 'Portfolio Review'],
        openToMentorship: true,
        workExperience: [
          {
            company: 'FinEdge Analytics',
            title: 'Lead Data Scientist',
            from: new Date('2022-01-01'),
            current: true,
            description: 'Leads a team of five data scientists.',
          },
        ],
      },
    },
    {
      name: 'Vikram Rao',
      email: 'vikram.rao@example.com',
      passwordHash: passwords.generic,
      role: 'alumni',
      accountStatus: 'active',
      approvalStatus: 'approved',
      approvedAt: monthsAgo(10),
      approvedBy: admin._id,
      phone: '+91 90000 00012',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Information Technology',
        degree: 'B.Tech',
        course: 'Information Technology',
        graduationYear: 2014,
        batch: '2010-2014',
        currentCompany: 'CloudNine Systems',
        jobTitle: 'Product Manager',
        location: 'Hyderabad, India',
        biography:
          'Product manager focused on developer tools and cloud platforms. I regularly hire interns from my alma mater.',
        linkedinUrl: 'https://www.linkedin.com/in/example-vikram-rao',
        skills: ['Product Management', 'Roadmapping', 'User Research', 'SQL', 'Agile'],
        mentorshipAreas: ['Product Management', 'Resume Review'],
        openToMentorship: true,
        workExperience: [
          {
            company: 'CloudNine Systems',
            title: 'Product Manager',
            from: new Date('2019-06-01'),
            current: true,
            description: 'Owns the developer platform roadmap.',
          },
        ],
      },
    },
  ];

  const alumni = [];
  for (const a of alumniSeed) {
    const profile = a.profile;
    const user = await upsertUser(a);
    const completion = computeAlumniCompletion(profile, user);
    await AlumniProfile.findOneAndUpdate(
      { user: user._id },
      { $set: { ...profile, profileCompletion: completion } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    alumni.push(user);
  }

  // One alumni account still waiting for administrator approval.
  const pendingAlumni = await upsertUser({
    name: 'Neha Gupta',
    email: 'pending.alumni@alumniconnect.example.com',
    passwordHash: passwords.pending,
    role: 'alumni',
    accountStatus: 'active',
    approvalStatus: 'pending',
    phone: '+91 90000 00013',
  });
  await AlumniProfile.findOneAndUpdate(
    { user: pendingAlumni._id },
    {
      $set: {
        university: 'Sunrise Institute of Technology',
        department: 'Electronics',
        degree: 'B.Tech',
        graduationYear: 2020,
        batch: '2016-2020',
        currentCompany: 'Volt Semiconductors',
        jobTitle: 'Hardware Engineer',
        skills: ['VLSI', 'Verilog', 'Embedded C'],
        biography: 'Hardware engineer awaiting approval to start mentoring students.',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const studentsSeed = [
    {
      name: 'Rohan Sharma',
      email: 'student@alumniconnect.example.com',
      passwordHash: passwords.student,
      studentId: 'STU2021001',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Computer Science',
        degree: 'B.Tech',
        course: 'Computer Science & Engineering',
        currentSemester: 7,
        graduationYear: 2026,
        skills: ['JavaScript', 'React', 'Python'],
        interests: ['Web Development', 'Open Source'],
        biography: 'Final year computer science student interested in full-stack development.',
        location: 'Bengaluru, India',
        resume: null,
      },
    },
    {
      name: 'Aditya Kulkarni',
      email: 'aditya.kulkarni@example.com',
      passwordHash: passwords.generic,
      studentId: 'STU2021002',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Computer Science',
        degree: 'B.Tech',
        course: 'Computer Science & Engineering',
        currentSemester: 5,
        graduationYear: 2027,
        skills: ['Java', 'Spring Boot', 'SQL'],
        interests: ['Backend Development', 'Cloud Computing'],
      },
    },
    {
      name: 'Fatima Sheikh',
      email: 'fatima.sheikh@example.com',
      passwordHash: passwords.generic,
      studentId: 'STU2021003',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Data Science',
        degree: 'M.Sc',
        course: 'Data Science',
        currentSemester: 3,
        graduationYear: 2026,
        skills: ['Python', 'Pandas', 'Machine Learning'],
        interests: ['Data Science', 'AI Research'],
      },
    },
    {
      name: 'Karan Patel',
      email: 'karan.patel@example.com',
      passwordHash: passwords.generic,
      studentId: 'STU2021004',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Information Technology',
        degree: 'B.Tech',
        course: 'Information Technology',
        currentSemester: 7,
        graduationYear: 2026,
        skills: ['Node.js', 'MongoDB', 'Docker'],
        interests: ['DevOps', 'Backend Development'],
      },
    },
    {
      name: 'Ananya Reddy',
      email: 'ananya.reddy@example.com',
      passwordHash: passwords.generic,
      studentId: 'STU2021005',
      profile: {
        university: 'Sunrise Institute of Technology',
        department: 'Computer Science',
        degree: 'B.Tech',
        course: 'Computer Science & Engineering',
        currentSemester: 3,
        graduationYear: 2027,
        skills: ['C++', 'Data Structures', 'HTML', 'CSS'],
        interests: ['Competitive Programming', 'UI Design'],
      },
    },
  ];

  const students = [];
  for (const s of studentsSeed) {
    const profile = s.profile;
    const user = await upsertUser({
      name: s.name,
      email: s.email,
      passwordHash: s.passwordHash,
      role: 'student',
      accountStatus: 'active',
      approvalStatus: 'not_required',
    });
    await StudentProfile.findOneAndUpdate(
      { user: user._id },
      { $set: { ...profile, studentId: s.studentId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    students.push(user);
  }

  return { admin, alumni, students, pendingAlumni };
}

async function seedJobs({ alumni }) {
  const [arjun, sneha, vikram] = alumni;

  const jobSeed = [
    {
      title: 'Frontend Developer',
      company: 'NovaTech Solutions',
      description:
        'We are looking for a Frontend Developer with strong React skills to build customer facing dashboards. You will collaborate with designers and backend engineers to ship high quality features.',
      location: 'Bengaluru, India',
      workMode: 'hybrid',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      skillsRequired: ['React', 'JavaScript', 'HTML', 'CSS'],
      salaryMin: 600000,
      salaryMax: 900000,
      applicationDeadline: daysFromNow(30),
      postedBy: arjun._id,
      approvalStatus: 'approved',
      jobStatus: 'open',
      approvedAt: monthsAgo(1),
    },
    {
      title: 'Backend Developer (Node.js)',
      company: 'NovaTech Solutions',
      description:
        'Join our platform team to design REST APIs and work with MongoDB. Experience with Node.js, Express and testing is expected. You will own services end to end.',
      location: 'Remote',
      workMode: 'remote',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      skillsRequired: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
      salaryMin: 900000,
      salaryMax: 1400000,
      applicationDeadline: daysFromNow(21),
      postedBy: arjun._id,
      approvalStatus: 'approved',
      jobStatus: 'open',
      approvedAt: monthsAgo(1),
    },
    {
      title: 'Data Analyst Intern',
      company: 'FinEdge Analytics',
      description:
        'A six month internship for students who enjoy working with data. You will build dashboards, write SQL queries and support the analytics team on live projects.',
      location: 'Pune, India',
      workMode: 'onsite',
      employmentType: 'internship',
      experienceLevel: 'fresher',
      skillsRequired: ['SQL', 'Python', 'Excel'],
      salaryMin: 20000,
      salaryMax: 30000,
      salaryPeriod: 'month',
      applicationDeadline: daysFromNow(14),
      postedBy: sneha._id,
      approvalStatus: 'approved',
      jobStatus: 'open',
      approvedAt: monthsAgo(1),
    },
    {
      title: 'Product Management Trainee',
      company: 'CloudNine Systems',
      description:
        'A rotational trainee programme for students keen on product management. You will assist with user research, write requirement documents and track delivery.',
      location: 'Hyderabad, India',
      workMode: 'hybrid',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      skillsRequired: ['Communication', 'User Research', 'Analytical Thinking'],
      salaryMin: 500000,
      salaryMax: 700000,
      applicationDeadline: daysFromNow(40),
      postedBy: vikram._id,
      approvalStatus: 'pending',
      jobStatus: 'open',
    },
    {
      title: 'Sales Executive',
      company: 'CloudNine Systems',
      description:
        'Field sales role for our enterprise division. Note: this posting was rejected by the administrator during the demo because the requisition was withdrawn by the employer.',
      location: 'Mumbai, India',
      workMode: 'onsite',
      employmentType: 'full-time',
      experienceLevel: 'entry',
      skillsRequired: ['Communication', 'Negotiation'],
      postedBy: vikram._id,
      approvalStatus: 'rejected',
      rejectionReason: 'Requisition was withdrawn by the employer during review.',
      jobStatus: 'closed',
    },
    {
      title: 'UI/UX Design Intern',
      company: 'NovaTech Solutions',
      description:
        'Work with our design system team to produce wireframes, prototypes and usability tests. This internship has now been closed because the position was filled.',
      location: 'Bengaluru, India',
      workMode: 'onsite',
      employmentType: 'internship',
      experienceLevel: 'fresher',
      skillsRequired: ['Figma', 'Wireframing', 'User Research'],
      salaryMin: 15000,
      salaryMax: 25000,
      salaryPeriod: 'month',
      postedBy: arjun._id,
      approvalStatus: 'approved',
      jobStatus: 'closed',
      approvedAt: monthsAgo(3),
    },
  ];

  const jobs = [];
  for (const data of jobSeed) {
    const job = await Job.findOneAndUpdate(
      { title: data.title, company: data.company, postedBy: data.postedBy },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    jobs.push(job);
  }
  return jobs;
}

async function seedApplications({ students, jobs }) {
  const [rohan, aditya, fatima, karan, ananya] = students;
  const [frontend, backend, dataIntern] = jobs;

  const seed = [
    { job: frontend._id, student: rohan._id, coverLetter: 'I have built several React projects and would love to join NovaTech.', applicationStatus: 'shortlisted' },
    { job: dataIntern._id, student: rohan._id, coverLetter: 'I enjoy working with data and have completed two analytics courses.', applicationStatus: 'submitted' },
    { job: frontend._id, student: aditya._id, coverLetter: 'I am comfortable with JavaScript and eager to learn from your team.', applicationStatus: 'under_review' },
    { job: backend._id, student: aditya._id, coverLetter: 'I have experience building Spring Boot services and REST APIs.', applicationStatus: 'submitted' },
    { job: backend._id, student: fatima._id, coverLetter: 'I am exploring backend engineering and have strong Python foundations.', applicationStatus: 'rejected' },
    { job: dataIntern._id, student: fatima._id, coverLetter: 'Analytics is my main interest and I have hands on dashboard experience.', applicationStatus: 'accepted' },
    { job: frontend._id, student: karan._id, coverLetter: 'I would like to move from backend to full stack engineering.', applicationStatus: 'submitted' },
    { job: backend._id, student: ananya._id, coverLetter: 'I am a third year student with strong data structures fundamentals.', applicationStatus: 'submitted' },
  ];

  const applications = [];
  for (const data of seed) {
    const student = await User.findById(data.student);
    const app = await JobApplication.findOneAndUpdate(
      { job: data.job, student: data.student },
      {
        $set: {
          ...data,
          applicantName: student.name,
          applicantEmail: student.email,
          resume: '/uploads/resumes/demo-resume.pdf',
        },
        $setOnInsert: { appliedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    applications.push(app);
  }
  return applications;
}

async function seedMentorship({ students, alumni }) {
  const [rohan, aditya, fatima, karan, ananya] = students;
  const [arjun, sneha, vikram] = alumni;

  const seed = [
    {
      student: rohan._id,
      alumni: arjun._id,
      message: 'I am a final year student targeting full-stack roles and would value your guidance on portfolio building.',
      careerGoal: 'Become a full-stack developer at a product company.',
      areaOfInterest: 'Web Development',
      status: 'accepted',
      responseMessage: 'Happy to help. Let us start with a resume review this weekend.',
      meetingDetails: { mode: 'online', scheduledAt: daysFromNow(3), link: 'https://meet.example.com/arjun-rohan', notes: 'Bring your current resume.' },
      respondedAt: monthsAgo(1),
    },
    {
      student: aditya._id,
      alumni: arjun._id,
      message: 'I would like advice on preparing for backend interviews and choosing between Java and Node.js.',
      careerGoal: 'Get a backend internship for the summer.',
      areaOfInterest: 'Backend Development',
      status: 'pending',
    },
    {
      student: fatima._id,
      alumni: sneha._id,
      message: 'I am pursuing a masters in data science and would appreciate guidance on building a strong project portfolio.',
      careerGoal: 'Land a data scientist role after graduation.',
      areaOfInterest: 'Data Science',
      status: 'pending',
    },
    {
      student: karan._id,
      alumni: sneha._id,
      message: 'Could you review my analytics project and suggest how to present it to recruiters?',
      careerGoal: 'Move into a data engineering role.',
      areaOfInterest: 'Portfolio Review',
      status: 'accepted',
      responseMessage: 'Send me the repository link and I will review it this week.',
      meetingDetails: { mode: 'online', scheduledAt: daysFromNow(5), link: 'https://meet.example.com/sneha-karan' },
      respondedAt: monthsAgo(1),
    },
    {
      student: ananya._id,
      alumni: vikram._id,
      message: 'I am curious about product management as a career and would like to understand the day to day work.',
      careerGoal: 'Decide between product management and software engineering.',
      areaOfInterest: 'Product Management',
      status: 'completed',
      responseMessage: 'We had a great discussion. I shared a reading list and a roadmap.',
      meetingDetails: { mode: 'offline', scheduledAt: monthsAgo(1), location: 'Sunrise Institute of Technology, Seminar Hall' },
      respondedAt: monthsAgo(2),
      completedAt: monthsAgo(1),
    },
  ];

  const requests = [];
  for (const data of seed) {
    const request = await MentorshipRequest.findOneAndUpdate(
      { student: data.student, alumni: data.alumni, status: data.status },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    requests.push(request);
  }
  return requests;
}

async function seedEvents({ admin, students, alumni }) {
  const seed = [
    {
      title: 'Annual Alumni Meet 2026',
      description:
        'Reconnect with classmates and faculty at our flagship annual gathering. The evening includes a keynote, department meetups and a networking dinner.',
      eventType: 'reunion',
      mode: 'offline',
      venue: 'Sunrise Institute of Technology, Main Auditorium',
      startDate: daysFromNow(20),
      endDate: daysFromNow(20),
      registrationDeadline: daysFromNow(17),
      capacity: 250,
      audience: 'all',
      status: 'published',
      bannerColor: 'navy',
    },
    {
      title: 'Career Fair: Technology Edition',
      description:
        'Meet recruiters from more than twenty technology companies. Bring printed resumes and be ready for on the spot screening interviews.',
      eventType: 'career_fair',
      mode: 'offline',
      venue: 'Sunrise Institute of Technology, Central Lawn',
      startDate: daysFromNow(32),
      endDate: daysFromNow(33),
      registrationDeadline: daysFromNow(30),
      capacity: 400,
      audience: 'all',
      status: 'published',
      bannerColor: 'royal',
    },
    {
      title: 'Webinar: Breaking into Data Science',
      description:
        'An online session with alumni working in analytics and machine learning. Topics include learning paths, portfolios and interviews.',
      eventType: 'webinar',
      mode: 'online',
      venue: 'Online (link shared on registration)',
      startDate: daysFromNow(7),
      endDate: daysFromNow(7),
      registrationDeadline: daysFromNow(6),
      capacity: 300,
      audience: 'students',
      status: 'published',
      bannerColor: 'teal',
    },
    {
      title: 'Homecoming Reunion (Draft)',
      description:
        'A draft plan for the golden jubilee homecoming reunion. This event is not published yet and is only visible to administrators.',
      eventType: 'reunion',
      mode: 'offline',
      venue: 'To be confirmed',
      startDate: daysFromNow(120),
      endDate: daysFromNow(120),
      registrationDeadline: daysFromNow(110),
      capacity: 500,
      audience: 'all',
      status: 'draft',
      bannerColor: 'grey',
    },
  ];

  const events = [];
  for (const data of seed) {
    const event = await Event.findOneAndUpdate(
      { title: data.title },
      { $set: { ...data, organizer: admin._id, organizerName: admin.name } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    events.push(event);
  }

  const [annualMeet, careerFair, webinar] = events;
  const registrations = [
    { event: annualMeet._id, user: alumni[0]._id, registrationStatus: 'registered' },
    { event: annualMeet._id, user: alumni[1]._id, registrationStatus: 'registered' },
    { event: annualMeet._id, user: students[0]._id, registrationStatus: 'registered' },
    { event: careerFair._id, user: students[0]._id, registrationStatus: 'registered' },
    { event: careerFair._id, user: students[1]._id, registrationStatus: 'registered' },
    { event: webinar._id, user: students[2]._id, registrationStatus: 'registered' },
  ];

  for (const data of registrations) {
    const user = await User.findById(data.user);
    await EventRegistration.findOneAndUpdate(
      { event: data.event, user: data.user },
      {
        $set: {
          ...data,
          attendeeName: user.name,
          attendeeEmail: user.email,
          attendeeRole: user.role,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return events;
}

async function seedAnnouncements({ admin }) {
  const seed = [
    {
      title: 'Welcome to AlumniConnect',
      body:
        'AlumniConnect is now live. Alumni can post opportunities and offer mentorship, while students can discover alumni and apply for openings. Update your profile to get started.',
      audience: 'all',
      priority: 'normal',
      status: 'published',
      publishedAt: monthsAgo(2),
    },
    {
      title: 'Career Fair registrations are open',
      body:
        'Registrations for the Technology Edition Career Fair are now open. Seats are limited, so please register early from the Events section.',
      audience: 'students',
      priority: 'high',
      status: 'published',
      publishedAt: monthsAgo(1),
    },
    {
      title: 'Call for alumni mentors',
      body:
        'We are looking for alumni volunteers for this semester mentorship programme. Mark your profile as open to mentorship to be listed in the mentor directory.',
      audience: 'alumni',
      priority: 'normal',
      status: 'published',
      publishedAt: monthsAgo(1),
    },
  ];

  const announcements = [];
  for (const data of seed) {
    const announcement = await Announcement.findOneAndUpdate(
      { title: data.title },
      { $set: { ...data, createdBy: admin._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    announcements.push(announcement);
  }
  return announcements;
}

async function seedNotifications({ admin, alumni, students, pendingAlumni, events }) {
  // Notifications are regenerated so demo users always see a tidy inbox.
  await Notification.deleteMany({});

  const docs = [];

  docs.push({
    user: admin._id,
    title: 'New alumni awaiting approval',
    message: `${pendingAlumni.name} registered as an alumnus and is waiting for approval.`,
    type: 'info',
    category: 'account',
    link: '/admin/alumni-approvals',
  });

  docs.push({
    user: admin._id,
    title: 'New job awaiting approval',
    message: 'Vikram Rao posted "Product Management Trainee" at CloudNine Systems.',
    type: 'info',
    category: 'job',
    link: '/admin/job-approvals',
  });

  docs.push({
    user: alumni[0]._id,
    title: 'New job application',
    message: 'Rohan Sharma applied for your job "Frontend Developer".',
    type: 'info',
    category: 'application',
    link: '/alumni/jobs',
  });

  docs.push({
    user: alumni[0]._id,
    title: 'New mentorship request',
    message: 'Aditya Kulkarni would like you to mentor them.',
    type: 'info',
    category: 'mentorship',
    link: '/alumni/mentorship',
  });

  docs.push({
    user: students[0]._id,
    title: 'Application status updated',
    message: 'Your application for "Frontend Developer" at NovaTech Solutions has been shortlisted.',
    type: 'success',
    category: 'application',
    link: '/student/applications',
  });

  docs.push({
    user: students[2]._id,
    title: 'Application status updated',
    message: 'Your application for "Data Analyst Intern" at FinEdge Analytics has been accepted.',
    type: 'success',
    category: 'application',
    link: '/student/applications',
  });

  docs.push({
    user: students[0]._id,
    title: 'Event registration confirmed',
    message: `You are registered for "${events[0].title}".`,
    type: 'success',
    category: 'event',
    link: `/events/${events[0]._id}`,
  });

  docs.push({
    user: pendingAlumni._id,
    title: 'Registration received',
    message: 'Your alumni account is pending administrator approval.',
    type: 'info',
    category: 'account',
    link: '/alumni/profile',
  });

  // Mark the first two as read so the unread counter is realistic.
  docs[0].read = true;
  docs[0].readAt = new Date();

  await Notification.insertMany(docs);
  return docs.length;
}

async function seedActivity({ admin, alumni, students }) {
  await ActivityLog.deleteMany({});
  const entries = [
    { actor: admin, actorName: admin.name, actorRole: admin.role, action: 'admin.alumni_approve', entity: 'User', description: `${admin.name} approved the alumni registration of ${alumni[0].name}.` },
    { actor: alumni[0], actorName: alumni[0].name, actorRole: alumni[0].role, action: 'job.create', entity: 'Job', description: `${alumni[0].name} posted a job: Frontend Developer.` },
    { actor: students[0], actorName: students[0].name, actorRole: students[0].role, action: 'application.create', entity: 'JobApplication', description: `${students[0].name} applied for "Frontend Developer".` },
    { actor: alumni[0], actorName: alumni[0].name, actorRole: alumni[0].role, action: 'mentorship.respond', entity: 'MentorshipRequest', description: 'Mentorship request marked as accepted.' },
    { actor: students[2], actorName: students[2].name, actorRole: students[2].role, action: 'event.register', entity: 'EventRegistration', description: `${students[2].name} registered for "Webinar: Breaking into Data Science".` },
  ];
  await ActivityLog.insertMany(entries);
  return entries.length;
}

async function main() {
  console.log(`[seed] Connecting to ${env.mongoUri}`);
  await connectDatabase();

  if (RESET) await resetDatabase();

  console.log('[seed] Seeding users, alumni and student profiles...');
  const { admin, alumni, students, pendingAlumni } = await seedAdminAndUsers();

  console.log('[seed] Seeding jobs...');
  const jobs = await seedJobs({ alumni });

  console.log('[seed] Seeding job applications...');
  const applications = await seedApplications({ students, jobs });

  console.log('[seed] Seeding mentorship requests...');
  const mentorship = await seedMentorship({ students, alumni });

  console.log('[seed] Seeding events and registrations...');
  const events = await seedEvents({ admin, students, alumni });

  console.log('[seed] Seeding announcements...');
  const announcements = await seedAnnouncements({ admin });

  console.log('[seed] Seeding notifications...');
  const notificationCount = await seedNotifications({ admin, alumni, students, pendingAlumni, events });

  console.log('[seed] Seeding activity log...');
  const activityCount = await seedActivity({ admin, alumni, students });

  console.log('');
  console.log('==========================================================');
  console.log('  Demo data ready');
  console.log('==========================================================');
  console.log(`  Users ................. ${1 + alumni.length + students.length + 1} (1 admin, ${alumni.length} approved alumni, 1 pending alumni, ${students.length} students)`);
  console.log(`  Jobs .................. ${jobs.length}`);
  console.log(`  Job applications ...... ${applications.length}`);
  console.log(`  Mentorship requests ... ${mentorship.length}`);
  console.log(`  Events ................ ${events.length}`);
  console.log(`  Announcements ......... ${announcements.length}`);
  console.log(`  Notifications ......... ${notificationCount}`);
  console.log(`  Activity entries ...... ${activityCount}`);
  console.log('');
  console.log('  Demo logins (local development only):');
  console.log('  --------------------------------------------------------');
  console.log('  Admin    admin@alumniconnect.example.com          / AdminDemo@123');
  console.log('  Alumni   alumni@alumniconnect.example.com         / AlumniDemo@123');
  console.log('  Student  student@alumniconnect.example.com        / StudentDemo@123');
  console.log('  Pending  pending.alumni@alumniconnect.example.com / PendingDemo@123');
  console.log('  Other seeded users use the password: DemoUser@123');
  console.log('  --------------------------------------------------------');
  console.log('');

  await disconnectDatabase();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('[seed] Failed:', error);
  try {
    await disconnectDatabase();
  } catch (_e) {
    /* ignore */
  }
  process.exit(1);
});
