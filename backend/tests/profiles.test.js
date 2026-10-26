'use strict';

const { newClient, createUser } = require('./helpers');
const AlumniProfile = require('../src/models/AlumniProfile');

async function loginAs(user) {
  const client = await newClient();
  await client.login(user.email, user.plainPassword);
  return client;
}

describe('Profiles and directory', () => {
  it('requires authentication to browse the directory', async () => {
    const client = await newClient();
    const res = await client.get('/api/v1/profiles');
    expect(res.status).toBe(401);
  });

  it('lists only approved alumni and hides pending or rejected accounts', async () => {
    await createUser({ name: 'Approved Alumni', email: 'approved.list@example.com', role: 'alumni', approvalStatus: 'approved' });
    await createUser({ name: 'Pending Alumni', email: 'pending.list@example.com', role: 'alumni', approvalStatus: 'pending' });
    await createUser({ name: 'Rejected Alumni', email: 'rejected.list@example.com', role: 'alumni', approvalStatus: 'rejected' });

    const student = await createUser({ email: 'dir.student@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(student);

    const res = await client.get('/api/v1/profiles');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Approved Alumni');
  });

  it('supports search and filters', async () => {
    await createUser({
      name: 'Sneha Iyer',
      email: 'sneha.dir@example.com',
      role: 'alumni',
      profile: { department: 'Data Science', currentCompany: 'FinEdge Analytics', graduationYear: 2018, skills: ['Python'] },
    });
    await createUser({
      name: 'Vikram Rao',
      email: 'vikram.dir@example.com',
      role: 'alumni',
      profile: { department: 'Information Technology', currentCompany: 'CloudNine Systems', graduationYear: 2014, skills: ['Product Management'] },
    });

    const student = await createUser({ email: 'filter.student@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(student);

    const byName = await client.get('/api/v1/profiles?q=Sneha');
    expect(byName.body.data).toHaveLength(1);

    const byDepartment = await client.get('/api/v1/profiles?department=Data%20Science');
    expect(byDepartment.body.data).toHaveLength(1);
    expect(byDepartment.body.data[0].name).toBe('Sneha Iyer');
  });

  it('updates the signed-in alumnus own profile and recalculates completion', async () => {
    const alumni = await createUser({ email: 'update.me@example.com', password: 'Password@123', role: 'alumni' });
    const client = await loginAs(alumni);

    const res = await client.put('/api/v1/profiles/me').send({
      jobTitle: 'Staff Engineer',
      biography: 'Updated biography for the profile completion calculation test.',
      linkedinUrl: 'https://www.linkedin.com/in/example-updated',
      skills: ['JavaScript', 'Node.js', 'MongoDB'],
    });

    expect(res.status).toBe(200);
    const profile = await AlumniProfile.findOne({ user: alumni._id });
    expect(profile.jobTitle).toBe('Staff Engineer');

    const me = await client.get('/api/v1/auth/me');
    expect(me.body.data.profile.profileCompletion).toBeGreaterThan(0);
  });

  it('ignores attempts to mass assign protected fields', async () => {
    const alumni = await createUser({ email: 'mass.assign@example.com', password: 'Password@123', role: 'alumni' });
    const client = await loginAs(alumni);

    await client.put('/api/v1/profiles/me').send({
      jobTitle: 'Engineer',
      role: 'admin',
      approvalStatus: 'approved',
      accountStatus: 'active',
    });

    const me = await client.get('/api/v1/auth/me');
    expect(me.body.data.user.role).toBe('alumni');
  });

  it('returns 404 for a profile that does not exist', async () => {
    const student = await createUser({ email: 'missing.profile@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(student);
    const res = await client.get('/api/v1/profiles/64b7f0c2f1a2b3c4d5e6f7a8');
    expect(res.status).toBe(404);
  });

  it('hides a pending alumnus profile from students', async () => {
    const pending = await createUser({ email: 'hidden.profile@example.com', role: 'alumni', approvalStatus: 'pending' });
    const student = await createUser({ email: 'hidden.viewer@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(student);

    const res = await client.get(`/api/v1/profiles/${pending._id}`);
    expect(res.status).toBe(404);
  });
});
