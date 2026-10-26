'use strict';

const { newClient, createUser } = require('./helpers');
const Job = require('../src/models/Job');
const JobApplication = require('../src/models/JobApplication');
const Notification = require('../src/models/Notification');

const JOB_PAYLOAD = {
  title: 'Frontend Developer',
  company: 'NovaTech Solutions',
  description:
    'We are looking for a frontend developer with React experience to build dashboards and collaborate with designers.',
  location: 'Bengaluru, India',
  workMode: 'hybrid',
  employmentType: 'full-time',
  experienceLevel: 'entry',
  skillsRequired: ['React', 'JavaScript'],
};

async function approvedAlumniClient(email = 'alumni@example.com') {
  await createUser({ name: 'Approved Alumnus', email, password: 'Password@123', role: 'alumni', approvalStatus: 'approved' });
  const client = await newClient();
  await client.login(email, 'Password@123');
  return client;
}

describe('Jobs and applications', () => {
  describe('Job creation permissions', () => {
    it('lets an approved alumnus create a job that starts in pending approval', async () => {
      const alumni = await approvedAlumniClient();
      const res = await alumni.post('/api/v1/jobs').send(JOB_PAYLOAD);

      expect(res.status).toBe(201);
      expect(res.body.data.approvalStatus).toBe('pending');
      expect(res.body.data.postedBy).toBeDefined();
    });

    it('blocks a pending alumnus from creating a job', async () => {
      await createUser({
        email: 'pending.alumni@example.com',
        password: 'Password@123',
        role: 'alumni',
        approvalStatus: 'pending',
      });
      const client = await newClient();
      await client.login('pending.alumni@example.com', 'Password@123');

      const res = await client.post('/api/v1/jobs').send(JOB_PAYLOAD);
      expect(res.status).toBe(403);
    });

    it('blocks students from creating a job', async () => {
      await createUser({ email: 'student.job@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('student.job@example.com', 'Password@123');

      const res = await client.post('/api/v1/jobs').send(JOB_PAYLOAD);
      expect(res.status).toBe(403);
    });

    it('requires authentication to post a job', async () => {
      const client = await newClient();
      const res = await client.post('/api/v1/jobs').send(JOB_PAYLOAD);
      expect(res.status).toBe(401);
    });

    it('validates the job payload', async () => {
      const alumni = await approvedAlumniClient('validator@example.com');
      const res = await alumni.post('/api/v1/jobs').send({ title: '', company: '', description: 'too short' });
      expect(res.status).toBe(422);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Job visibility', () => {
    it('only lists approved and open jobs to students', async () => {
      const owner = await createUser({ email: 'owner@example.com', role: 'alumni' });
      await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved', jobStatus: 'open' });
      await Job.create({
        ...JOB_PAYLOAD,
        title: 'Pending Job',
        postedBy: owner._id,
        approvalStatus: 'pending',
      });

      await createUser({ email: 'viewer@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('viewer@example.com', 'Password@123');

      const res = await client.get('/api/v1/jobs');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Frontend Developer');
    });

    it('hides a pending job from students by id', async () => {
      const owner = await createUser({ email: 'owner2@example.com', role: 'alumni' });
      const pending = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'pending' });

      await createUser({ email: 'viewer2@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('viewer2@example.com', 'Password@123');

      const res = await client.get(`/api/v1/jobs/${pending._id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Job ownership', () => {
    it('prevents a different alumnus from editing or deleting a job', async () => {
      const owner = await createUser({ email: 'owner3@example.com', role: 'alumni' });
      const job = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved' });

      const other = await approvedAlumniClient('other.alumni@example.com');

      const edit = await other.put(`/api/v1/jobs/${job._id}`).send({ ...JOB_PAYLOAD, title: 'Hijacked' });
      expect(edit.status).toBe(403);

      const remove = await other.delete(`/api/v1/jobs/${job._id}`);
      expect(remove.status).toBe(403);
    });

    it('resets a job to pending when the owner edits its content', async () => {
      const alumni = await approvedAlumniClient('editor@example.com');
      const created = await alumni.post('/api/v1/jobs').send(JOB_PAYLOAD);
      const jobId = created.body.data._id;

      const owner = await createUser({ email: 'admin.approver@example.com', role: 'admin' });
      await Job.findByIdAndUpdate(jobId, { approvalStatus: 'approved', approvedBy: owner._id });

      const res = await alumni.put(`/api/v1/jobs/${jobId}`).send({ ...JOB_PAYLOAD, title: 'Updated Title' });
      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('pending');
    });
  });

  describe('Applying to a job', () => {
    let job;
    let owner;

    beforeEach(async () => {
      owner = await createUser({ email: 'job.owner@example.com', role: 'alumni' });
      job = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved', jobStatus: 'open' });
    });

    it('lets a student apply and records the application', async () => {
      await createUser({ email: 'applicant@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('applicant@example.com', 'Password@123');

      const res = await client.post(`/api/v1/jobs/${job._id}/apply`).send({ coverLetter: 'I am very interested.' });
      expect(res.status).toBe(201);
      expect(res.body.data.applicationStatus).toBe('submitted');

      const mine = await client.get('/api/v1/applications/me');
      expect(mine.status).toBe(200);
      expect(mine.body.data).toHaveLength(1);
    });

    it('prevents duplicate applications to the same job', async () => {
      await createUser({ email: 'dupe@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('dupe@example.com', 'Password@123');

      const first = await client.post(`/api/v1/jobs/${job._id}/apply`).send({});
      expect(first.status).toBe(201);

      const second = await client.post(`/api/v1/jobs/${job._id}/apply`).send({});
      expect(second.status).toBe(409);

      const count = await JobApplication.countDocuments({ job: job._id });
      expect(count).toBe(1);
    });

    it('rejects an application when the student has no resume on file', async () => {
      await createUser({
        email: 'noresume@example.com',
        password: 'Password@123',
        role: 'student',
        profile: { resume: null },
      });
      const client = await newClient();
      await client.login('noresume@example.com', 'Password@123');

      const res = await client.post(`/api/v1/jobs/${job._id}/apply`).send({});
      expect(res.status).toBe(400);
    });

    it('blocks alumni from applying to a job', async () => {
      const alumni = await approvedAlumniClient('apply.alumni@example.com');
      const res = await alumni.post(`/api/v1/jobs/${job._id}/apply`).send({});
      expect(res.status).toBe(403);
    });

    it('rejects applications after the deadline', async () => {
      await Job.findByIdAndUpdate(job._id, { applicationDeadline: new Date(Date.now() - 86400000) });
      await createUser({ email: 'late@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('late@example.com', 'Password@123');

      const res = await client.post(`/api/v1/jobs/${job._id}/apply`).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('Reviewing applications', () => {
    it('lets the job owner view applications but not other alumni', async () => {
      const owner = await createUser({ email: 'reviewer@example.com', password: 'Password@123', role: 'alumni' });
      const job = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved', jobStatus: 'open' });

      const student = await createUser({ email: 'candidate@example.com', role: 'student' });
      await JobApplication.create({ job: job._id, student: student._id, resume: '/uploads/resumes/cv.pdf' });

      const ownerClient = await newClient();
      await ownerClient.login('reviewer@example.com', 'Password@123');
      const ok = await ownerClient.get(`/api/v1/jobs/${job._id}/applications`);
      expect(ok.status).toBe(200);
      expect(ok.body.data.applications).toHaveLength(1);

      const stranger = await approvedAlumniClient('stranger@example.com');
      const denied = await stranger.get(`/api/v1/jobs/${job._id}/applications`);
      expect(denied.status).toBe(403);
    });

    it('lets the owner update an application status and notifies the student', async () => {
      const owner = await createUser({ email: 'status.owner@example.com', password: 'Password@123', role: 'alumni' });
      const job = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved', jobStatus: 'open' });
      const student = await createUser({ email: 'status.student@example.com', password: 'Password@123', role: 'student' });
      const application = await JobApplication.create({ job: job._id, student: student._id, resume: '/uploads/resumes/cv.pdf' });

      const ownerClient = await newClient();
      await ownerClient.login('status.owner@example.com', 'Password@123');
      const res = await ownerClient
        .patch(`/api/v1/applications/${application._id}/status`)
        .send({ applicationStatus: 'shortlisted', statusNote: 'Great profile.' });

      expect(res.status).toBe(200);
      expect(res.body.data.applicationStatus).toBe('shortlisted');

      const notifications = await Notification.find({ user: student._id });
      expect(notifications.length).toBeGreaterThan(0);

      const studentClient = await newClient();
      await studentClient.login('status.student@example.com', 'Password@123');
      const mine = await studentClient.get('/api/v1/applications/me');
      expect(mine.body.data[0].applicationStatus).toBe('shortlisted');
    });

    it('blocks an unrelated alumnus from updating an application status', async () => {
      const owner = await createUser({ email: 'real.owner@example.com', role: 'alumni' });
      const job = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved', jobStatus: 'open' });
      const student = await createUser({ email: 'cand2@example.com', role: 'student' });
      const application = await JobApplication.create({ job: job._id, student: student._id, resume: '/uploads/resumes/cv.pdf' });

      const stranger = await approvedAlumniClient('unrelated@example.com');
      const res = await stranger
        .patch(`/api/v1/applications/${application._id}/status`)
        .send({ applicationStatus: 'accepted' });
      expect(res.status).toBe(403);
    });

    it('rejects an invalid application status value', async () => {
      const owner = await createUser({ email: 'strict.owner@example.com', password: 'Password@123', role: 'alumni' });
      const job = await Job.create({ ...JOB_PAYLOAD, postedBy: owner._id, approvalStatus: 'approved', jobStatus: 'open' });
      const student = await createUser({ email: 'cand3@example.com', role: 'student' });
      const application = await JobApplication.create({ job: job._id, student: student._id, resume: '/uploads/resumes/cv.pdf' });

      const client = await newClient();
      await client.login('strict.owner@example.com', 'Password@123');
      const res = await client
        .patch(`/api/v1/applications/${application._id}/status`)
        .send({ applicationStatus: 'made-up-status' });
      expect(res.status).toBe(422);
    });
  });

  describe('Unknown resources', () => {
    it('returns 404 for a job that does not exist', async () => {
      await createUser({ email: 'notfound@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('notfound@example.com', 'Password@123');

      const res = await client.get('/api/v1/jobs/64b7f0c2f1a2b3c4d5e6f7a8');
      expect(res.status).toBe(404);
    });
  });
});
