'use strict';

const { request, app, newClient, createUser } = require('./helpers');
const Job = require('../src/models/Job');

describe('Public endpoints and platform behaviour', () => {
  it('reports API health without authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('serves API metadata at the version root', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.data.version).toBe('1.0.0');
  });

  it('returns public platform statistics', async () => {
    const owner = await createUser({ email: 'stats.owner@example.com', role: 'alumni' });
    await createUser({ email: 'stats.student@example.com', role: 'student' });
    await Job.create({
      title: 'Public Stats Job',
      company: 'NovaTech Solutions',
      description: 'A job used to verify that the public statistics endpoint counts approved open jobs.',
      postedBy: owner._id,
      approvalStatus: 'approved',
      jobStatus: 'open',
    });

    const res = await request(app).get('/api/v1/public/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.alumni).toBe(1);
    expect(res.body.data.students).toBe(1);
    expect(res.body.data.openJobs).toBe(1);
  });

  it('exposes an alumni preview without leaking email addresses', async () => {
    await createUser({ name: 'Preview Alumni', email: 'preview@example.com', role: 'alumni' });
    const res = await request(app).get('/api/v1/public/alumni-preview');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBeUndefined();
  });

  it('returns demo testimonials that are clearly marked', async () => {
    const res = await request(app).get('/api/v1/public/testimonials');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((t) => t.isDemo === true)).toBe(true);
  });

  it('returns a consistent 404 envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Route not found');
  });

  it('rejects an invalid object id with a clear message', async () => {
    const student = await createUser({ email: 'badid@example.com', password: 'Password@123', role: 'student' });
    const client = await newClient();
    await client.login('badid@example.com', 'Password@123');
    const res = await client.get('/api/v1/jobs/not-an-id');
    expect(res.status).toBe(400);
  });
});
