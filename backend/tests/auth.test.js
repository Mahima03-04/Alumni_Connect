'use strict';

const { newClient, createUser } = require('./helpers');
const User = require('../src/models/User');

describe('Authentication', () => {
  describe('Registration', () => {
    it('registers a student and returns a session', async () => {
      const client = await newClient();
      const res = await client.register({
        name: 'New Student',
        email: 'new.student@example.com',
        password: 'Password@123',
        role: 'student',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.approvalStatus).toBe('not_required');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.headers['set-cookie'].join(';')).toContain('ac_token=');
    });

    it('registers an alumni with pending approval status', async () => {
      const client = await newClient();
      const res = await client.register({
        name: 'New Alumni',
        email: 'new.alumni@example.com',
        password: 'Password@123',
        role: 'alumni',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('alumni');
      expect(res.body.data.user.approvalStatus).toBe('pending');
    });

    it('never allows self-registration as an administrator', async () => {
      const client = await newClient();
      const res = await client.register({
        name: 'Sneaky Admin',
        email: 'sneaky@example.com',
        password: 'Password@123',
        role: 'admin',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      const adminCount = await User.countDocuments({ role: 'admin' });
      expect(adminCount).toBe(0);
    });

    it('rejects a duplicate email address', async () => {
      const client = await newClient();
      await client.register({
        name: 'First',
        email: 'duplicate@example.com',
        password: 'Password@123',
        role: 'student',
      });

      const second = await newClient();
      const res = await second.register({
        name: 'Second',
        email: 'duplicate@example.com',
        password: 'Password@123',
        role: 'student',
      });

      expect(res.status).toBe(409);
    });

    it('rejects a weak password', async () => {
      const client = await newClient();
      const res = await client.register({
        name: 'Weak Password',
        email: 'weak@example.com',
        password: 'short',
        role: 'student',
      });

      expect(res.status).toBe(422);
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('normalises email addresses to lower case', async () => {
      const client = await newClient();
      await client.register({
        name: 'Case Test',
        email: 'MiXeD.CaSe@Example.com',
        password: 'Password@123',
        role: 'student',
      });

      const user = await User.findOne({ email: 'mixed.case@example.com' });
      expect(user).not.toBeNull();
    });
  });

  describe('Password hashing', () => {
    it('stores a bcrypt hash and never the plaintext password', async () => {
      await createUser({ email: 'hash@example.com', password: 'Password@123', role: 'student' });
      const user = await User.findOne({ email: 'hash@example.com' }).select('+passwordHash');

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('Password@123');
      expect(user.passwordHash.startsWith('$2')).toBe(true);
      expect(await user.comparePassword('Password@123')).toBe(true);
      expect(await user.comparePassword('WrongPassword@123')).toBe(false);
    });
  });

  describe('Login', () => {
    it('signs in with valid credentials and updates lastLogin', async () => {
      await createUser({ email: 'login@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      const res = await client.login('login@example.com', 'Password@123');

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('login@example.com');

      const user = await User.findOne({ email: 'login@example.com' });
      expect(user.lastLogin).not.toBeNull();
    });

    it('rejects an invalid password', async () => {
      await createUser({ email: 'badpass@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      const res = await client.login('badpass@example.com', 'WrongPassword@123');
      expect(res.status).toBe(401);
    });

    it('rejects an unknown email without revealing whether it exists', async () => {
      const client = await newClient();
      const res = await client.login('nobody@example.com', 'Password@123');
      expect(res.status).toBe(401);
      expect(res.body.message.toLowerCase()).toContain('invalid');
    });

    it('blocks suspended accounts', async () => {
      await createUser({ email: 'suspended@example.com', password: 'Password@123', role: 'student', accountStatus: 'suspended' });
      const client = await newClient();
      const res = await client.login('suspended@example.com', 'Password@123');
      expect(res.status).toBe(403);
    });

    it('blocks rejected alumni accounts', async () => {
      await createUser({
        email: 'rejected@example.com',
        password: 'Password@123',
        role: 'alumni',
        approvalStatus: 'rejected',
      });
      const client = await newClient();
      const res = await client.login('rejected@example.com', 'Password@123');
      expect(res.status).toBe(403);
    });

    it('allows pending alumni to sign in but keeps them unapproved', async () => {
      await createUser({
        email: 'pending@example.com',
        password: 'Password@123',
        role: 'alumni',
        approvalStatus: 'pending',
      });
      const client = await newClient();
      const res = await client.login('pending@example.com', 'Password@123');
      expect(res.status).toBe(200);
      expect(res.body.data.user.approvalStatus).toBe('pending');
    });
  });

  describe('Session', () => {
    it('returns the current user from /auth/me', async () => {
      await createUser({ email: 'me@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('me@example.com', 'Password@123');

      const res = await client.get('/api/v1/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('me@example.com');
      expect(res.body.data.profile).toBeDefined();
    });

    it('rejects /auth/me without a session', async () => {
      const client = await newClient();
      const res = await client.get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('clears the cookie on logout', async () => {
      await createUser({ email: 'logout@example.com', password: 'Password@123', role: 'student' });
      const client = await newClient();
      await client.login('logout@example.com', 'Password@123');

      const res = await client.post('/api/v1/auth/logout');
      expect(res.status).toBe(200);

      const after = await client.get('/api/v1/auth/me');
      expect(after.status).toBe(401);
    });
  });

  describe('CSRF protection', () => {
    it('rejects a state changing request without a CSRF token', async () => {
      const client = await newClient();
      const res = await client.agent
        .post('/api/v1/auth/register')
        .send({ name: 'No CSRF', email: 'nocsrf@example.com', password: 'Password@123', role: 'student' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_INVALID');
    });
  });
});
