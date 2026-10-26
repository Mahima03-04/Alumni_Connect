'use strict';

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AlumniProfile = require('../src/models/AlumniProfile');
const StudentProfile = require('../src/models/StudentProfile');

/**
 * Small HTTP client that keeps the session cookie (via a supertest agent) and
 * automatically attaches the CSRF header to state-changing requests.
 */
class Client {
  constructor() {
    this.agent = request.agent(app);
    this.csrf = null;
    this.user = null;
  }

  async init() {
    const res = await this.agent.get('/api/v1/auth/csrf');
    this.csrf = res.body?.data?.csrfToken || null;
    return this;
  }

  request(method, url) {
    const req = this.agent[method](url);
    if (!['get', 'head'].includes(method) && this.csrf) {
      req.set('x-csrf-token', this.csrf);
    }
    return req;
  }

  get(url) {
    return this.request('get', url);
  }
  post(url) {
    return this.request('post', url);
  }
  put(url) {
    return this.request('put', url);
  }
  patch(url) {
    return this.request('patch', url);
  }
  delete(url) {
    return this.request('delete', url);
  }

  async login(email, password) {
    const res = await this.post('/api/v1/auth/login').send({ email, password });
    if (res.status === 200) this.user = res.body.data.user;
    return res;
  }

  async register(payload) {
    const res = await this.post('/api/v1/auth/register').send(payload);
    if (res.status === 201) this.user = res.body.data.user;
    return res;
  }
}

async function newClient() {
  const client = new Client();
  await client.init();
  return client;
}

/** Create a user directly in the database (faster than the register route). */
async function createUser({
  name = 'Test User',
  email,
  role = 'student',
  password = 'Password@123',
  accountStatus = 'active',
  approvalStatus,
  profile = null,
} = {}) {
  if (!email) email = `${role}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

  const resolvedApproval =
    approvalStatus !== undefined
      ? approvalStatus
      : role === 'alumni'
        ? 'approved'
        : 'not_required';

  const user = await User.create({
    name,
    email,
    role,
    accountStatus,
    approvalStatus: resolvedApproval,
    passwordHash: await User.hashPassword(password),
  });

  if (role === 'alumni') {
    await AlumniProfile.create({
      user: user._id,
      university: 'Sunrise Institute of Technology',
      department: 'Computer Science',
      degree: 'B.Tech',
      graduationYear: 2018,
      currentCompany: 'NovaTech Solutions',
      jobTitle: 'Engineer',
      skills: ['JavaScript'],
      biography: 'Test alumni biography.',
      ...(profile || {}),
    });
  } else if (role === 'student') {
    await StudentProfile.create({
      user: user._id,
      studentId: `STU${Date.now()}${Math.round(Math.random() * 1000)}`,
      department: 'Computer Science',
      graduationYear: 2026,
      resume: '/uploads/resumes/test-resume.pdf',
      ...(profile || {}),
    });
  }

  user.plainPassword = password;
  return user;
}

module.exports = { app, request, Client, newClient, createUser };
