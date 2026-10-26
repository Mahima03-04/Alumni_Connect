'use strict';

const { newClient, createUser } = require('./helpers');
const Job = require('../src/models/Job');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');

async function loginAs(user) {
  const client = await newClient();
  await client.login(user.email, user.plainPassword);
  return client;
}

describe('Administration', () => {
  let admin;

  beforeEach(async () => {
    admin = await createUser({ name: 'Admin User', email: 'admin@example.com', password: 'Password@123', role: 'admin' });
  });

  describe('Access control', () => {
    it('blocks anonymous access to admin routes', async () => {
      const client = await newClient();
      const res = await client.get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('blocks students from admin routes', async () => {
      const student = await createUser({ email: 'notadmin@example.com', password: 'Password@123', role: 'student' });
      const client = await loginAs(student);
      const res = await client.get('/api/v1/admin/dashboard');
      expect(res.status).toBe(403);
    });

    it('blocks alumni from admin routes', async () => {
      const alumni = await createUser({ email: 'notadmin.alumni@example.com', password: 'Password@123', role: 'alumni' });
      const client = await loginAs(alumni);
      const res = await client.get('/api/v1/admin/users');
      expect(res.status).toBe(403);
    });
  });

  describe('Dashboard', () => {
    it('returns summary counts and charts from the database', async () => {
      await createUser({ email: 'dash.student@example.com', role: 'student' });
      await createUser({ email: 'dash.alumni@example.com', role: 'alumni', approvalStatus: 'approved' });
      await createUser({ email: 'dash.pending@example.com', role: 'alumni', approvalStatus: 'pending' });

      const client = await loginAs(admin);
      const res = await client.get('/api/v1/admin/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.data.counts.totalStudents).toBe(1);
      expect(res.body.data.counts.totalAlumni).toBe(1);
      expect(res.body.data.counts.pendingAlumni).toBe(1);
      expect(res.body.data.charts).toBeDefined();
    });
  });

  describe('Alumni approval', () => {
    it('lists pending alumni and approves one, notifying the applicant', async () => {
      const pending = await createUser({
        name: 'Pending Alumni',
        email: 'approve.me@example.com',
        role: 'alumni',
        approvalStatus: 'pending',
      });

      const client = await loginAs(admin);
      const list = await client.get('/api/v1/admin/alumni/pending');
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);

      const res = await client.patch(`/api/v1/admin/alumni/${pending._id}/approval`).send({ approvalStatus: 'approved' });
      expect(res.status).toBe(200);

      const updated = await User.findById(pending._id);
      expect(updated.approvalStatus).toBe('approved');
      expect(updated.approvedAt).not.toBeNull();

      const notifications = await Notification.find({ user: pending._id });
      expect(notifications.some((n) => /approved/i.test(n.title))).toBe(true);
    });

    it('requires a reason when rejecting an alumni registration', async () => {
      const pending = await createUser({ email: 'reject.me@example.com', role: 'alumni', approvalStatus: 'pending' });
      const client = await loginAs(admin);

      const missingReason = await client.patch(`/api/v1/admin/alumni/${pending._id}/approval`).send({ approvalStatus: 'rejected' });
      expect(missingReason.status).toBe(422);

      const withReason = await client
        .patch(`/api/v1/admin/alumni/${pending._id}/approval`)
        .send({ approvalStatus: 'rejected', reason: 'Unable to verify graduation details.' });
      expect(withReason.status).toBe(200);

      const updated = await User.findById(pending._id);
      expect(updated.approvalStatus).toBe('rejected');
      expect(updated.approvalReason).toContain('verify');
    });

    it('refuses to treat an administrator account as an alumni registration', async () => {
      const otherAdmin = await createUser({ email: 'admin2@example.com', role: 'admin' });
      const client = await loginAs(admin);
      const res = await client.patch(`/api/v1/admin/alumni/${otherAdmin._id}/approval`).send({ approvalStatus: 'approved' });
      expect(res.status).toBe(400);
    });
  });

  describe('Job approval', () => {
    it('approves a pending job and notifies the owner', async () => {
      const owner = await createUser({ email: 'job.owner.admin@example.com', role: 'alumni' });
      const job = await Job.create({
        title: 'Backend Developer',
        company: 'NovaTech Solutions',
        description: 'Build and maintain REST APIs using Node.js and MongoDB in a collaborative team.',
        postedBy: owner._id,
        approvalStatus: 'pending',
      });

      const client = await loginAs(admin);
      const pending = await client.get('/api/v1/admin/jobs/pending');
      expect(pending.status).toBe(200);
      expect(pending.body.data).toHaveLength(1);

      const res = await client.patch(`/api/v1/admin/jobs/${job._id}/approval`).send({ approvalStatus: 'approved' });
      expect(res.status).toBe(200);

      const updated = await Job.findById(job._id);
      expect(updated.approvalStatus).toBe('approved');
      expect(updated.jobStatus).toBe('open');

      const notifications = await Notification.find({ user: owner._id });
      expect(notifications.some((n) => /approved/i.test(n.title))).toBe(true);
    });

    it('rejects a job with a reason and closes it', async () => {
      const owner = await createUser({ email: 'job.owner.reject@example.com', role: 'alumni' });
      const job = await Job.create({
        title: 'Suspicious Job',
        company: 'Unknown Company',
        description: 'A job posting that does not meet the platform guidelines for legitimate opportunities.',
        postedBy: owner._id,
        approvalStatus: 'pending',
      });

      const client = await loginAs(admin);
      const res = await client
        .patch(`/api/v1/admin/jobs/${job._id}/approval`)
        .send({ approvalStatus: 'rejected', reason: 'Incomplete company information.' });
      expect(res.status).toBe(200);

      const updated = await Job.findById(job._id);
      expect(updated.approvalStatus).toBe('rejected');
      expect(updated.jobStatus).toBe('closed');
    });
  });

  describe('User management', () => {
    it('suspends a student account', async () => {
      const student = await createUser({ email: 'suspend.me@example.com', role: 'student' });
      const client = await loginAs(admin);

      const res = await client.patch(`/api/v1/admin/users/${student._id}/status`).send({ accountStatus: 'suspended' });
      expect(res.status).toBe(200);

      const updated = await User.findById(student._id);
      expect(updated.accountStatus).toBe('suspended');
    });

    it('refuses to modify the requesting administrator own account', async () => {
      const client = await loginAs(admin);
      const res = await client.patch(`/api/v1/admin/users/${admin._id}/status`).send({ accountStatus: 'suspended' });
      expect(res.status).toBe(400);
    });

    it('refuses to modify another administrator account', async () => {
      const otherAdmin = await createUser({ email: 'admin3@example.com', role: 'admin' });
      const client = await loginAs(admin);
      const res = await client.patch(`/api/v1/admin/users/${otherAdmin._id}/status`).send({ accountStatus: 'suspended' });
      expect(res.status).toBe(403);
    });

    it('rejects a role change that would escalate privileges to admin', async () => {
      const student = await createUser({ email: 'escalate@example.com', role: 'student' });
      const client = await loginAs(admin);
      const res = await client.patch(`/api/v1/admin/users/${student._id}/status`).send({ role: 'admin' });
      expect(res.status).toBe(422);
    });

    it('searches users by name and email', async () => {
      await createUser({ name: 'Searchable Person', email: 'findme@example.com', role: 'student' });
      const client = await loginAs(admin);
      const res = await client.get('/api/v1/admin/users?q=findme');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('Reports and export', () => {
    it('returns an aggregated report', async () => {
      await createUser({ email: 'report.student@example.com', role: 'student' });
      await createUser({ email: 'report.alumni@example.com', role: 'alumni' });

      const client = await loginAs(admin);
      const res = await client.get('/api/v1/admin/reports');
      expect(res.status).toBe(200);
      expect(res.body.data.summary.total).toBeGreaterThanOrEqual(2);
    });

    it('exports a CSV without sensitive fields', async () => {
      await createUser({ name: 'Csv Person', email: 'csv.user@example.com', password: 'Password@123', role: 'student' });

      const client = await loginAs(admin);
      const res = await client.get('/api/v1/admin/reports/export?type=users');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('csv.user@example.com');
      expect(res.text).not.toMatch(/passwordHash/i);
      expect(res.text).not.toMatch(/\$2[aby]\$/);
    });

    it('rejects an unknown export type', async () => {
      const client = await loginAs(admin);
      const res = await client.get('/api/v1/admin/reports/export?type=secrets');
      expect(res.status).toBe(400);
    });
  });
});
