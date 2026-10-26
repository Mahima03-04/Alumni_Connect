'use strict';

const { newClient, createUser } = require('./helpers');
const Event = require('../src/models/Event');
const EventRegistration = require('../src/models/EventRegistration');

async function loginAs(user) {
  const client = await newClient();
  await client.login(user.email, user.plainPassword);
  return client;
}

function eventPayload(overrides = {}) {
  return {
    title: 'Alumni Career Fair',
    description: 'Meet recruiters from leading companies and explore internship opportunities on campus.',
    eventType: 'career_fair',
    mode: 'offline',
    venue: 'Main Auditorium',
    startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    registrationDeadline: new Date(Date.now() + 8 * 86400000).toISOString(),
    capacity: 100,
    audience: 'all',
    status: 'published',
    ...overrides,
  };
}

describe('Events', () => {
  it('allows only administrators to create events', async () => {
    const student = await createUser({ email: 'ev.student@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(student);
    const res = await client.post('/api/v1/events').send(eventPayload());
    expect(res.status).toBe(403);
  });

  it('creates a published event as an administrator', async () => {
    const admin = await createUser({ email: 'ev.admin@example.com', password: 'Password@123', role: 'admin' });
    const client = await loginAs(admin);
    const res = await client.post('/api/v1/events').send(eventPayload());

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Alumni Career Fair');
    expect(res.body.data.status).toBe('published');
  });

  it('validates an event where the end date precedes the start date', async () => {
    const admin = await createUser({ email: 'ev.admin2@example.com', password: 'Password@123', role: 'admin' });
    const client = await loginAs(admin);
    const res = await client.post('/api/v1/events').send(
      eventPayload({
        startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      })
    );
    expect(res.status).toBe(422);
  });

  it('does not list draft events to students', async () => {
    const admin = await createUser({ email: 'ev.admin3@example.com', role: 'admin' });
    await Event.create({
      ...eventPayload({ status: 'draft', title: 'Draft Event' }),
      organizer: admin._id,
      organizerName: admin.name,
      startDate: new Date(Date.now() + 10 * 86400000),
      endDate: new Date(Date.now() + 10 * 86400000),
    });

    const student = await createUser({ email: 'ev.student2@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(student);
    const res = await client.get('/api/v1/events');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  describe('Registration', () => {
    let admin;
    let event;

    beforeEach(async () => {
      admin = await createUser({ email: 'reg.admin@example.com', role: 'admin' });
      event = await Event.create({
        ...eventPayload(),
        organizer: admin._id,
        organizerName: admin.name,
        startDate: new Date(Date.now() + 10 * 86400000),
        endDate: new Date(Date.now() + 10 * 86400000),
        registrationDeadline: new Date(Date.now() + 8 * 86400000),
      });
    });

    it('lets a student register and then blocks duplicates', async () => {
      const student = await createUser({ email: 'reg.student@example.com', password: 'Password@123', role: 'student' });
      const client = await loginAs(student);

      const first = await client.post(`/api/v1/events/${event._id}/register`).send({});
      expect(first.status).toBe(201);

      const second = await client.post(`/api/v1/events/${event._id}/register`).send({});
      expect(second.status).toBe(409);

      const count = await EventRegistration.countDocuments({ event: event._id });
      expect(count).toBe(1);
    });

    it('enforces event capacity', async () => {
      await Event.findByIdAndUpdate(event._id, { capacity: 1 });

      const first = await createUser({ email: 'cap.first@example.com', password: 'Password@123', role: 'student' });
      const firstClient = await loginAs(first);
      const ok = await firstClient.post(`/api/v1/events/${event._id}/register`).send({});
      expect(ok.status).toBe(201);

      const second = await createUser({ email: 'cap.second@example.com', password: 'Password@123', role: 'student' });
      const secondClient = await loginAs(second);
      const full = await secondClient.post(`/api/v1/events/${event._id}/register`).send({});
      expect(full.status).toBe(409);
    });

    it('rejects registration after the deadline', async () => {
      await Event.findByIdAndUpdate(event._id, { registrationDeadline: new Date(Date.now() - 86400000) });
      const student = await createUser({ email: 'late.reg@example.com', password: 'Password@123', role: 'student' });
      const client = await loginAs(student);

      const res = await client.post(`/api/v1/events/${event._id}/register`).send({});
      expect(res.status).toBe(400);
    });

    it('rejects alumni registering for a students-only event', async () => {
      await Event.findByIdAndUpdate(event._id, { audience: 'students' });
      const alumni = await createUser({ email: 'reg.alumni@example.com', password: 'Password@123', role: 'alumni' });
      const client = await loginAs(alumni);

      const res = await client.post(`/api/v1/events/${event._id}/register`).send({});
      expect(res.status).toBe(403);
    });

    it('allows a user to cancel and then re-register', async () => {
      const student = await createUser({ email: 'cancel.reg@example.com', password: 'Password@123', role: 'student' });
      const client = await loginAs(student);

      await client.post(`/api/v1/events/${event._id}/register`).send({});
      const cancel = await client.delete(`/api/v1/events/${event._id}/register`);
      expect(cancel.status).toBe(200);
      expect(cancel.body.data.registrationStatus).toBe('cancelled');

      const reRegister = await client.post(`/api/v1/events/${event._id}/register`).send({});
      expect(reRegister.status).toBe(201);

      const count = await EventRegistration.countDocuments({ event: event._id });
      expect(count).toBe(1);
    });

    it('requires authentication to register', async () => {
      const client = await newClient();
      const res = await client.post(`/api/v1/events/${event._id}/register`).send({});
      expect(res.status).toBe(401);
    });

    it('shows participant lists to administrators', async () => {
      const student = await createUser({ email: 'list.student@example.com', password: 'Password@123', role: 'student' });
      const studentClient = await loginAs(student);
      await studentClient.post(`/api/v1/events/${event._id}/register`).send({});

      const adminClient = await loginAs(admin);
      const res = await adminClient.get(`/api/v1/events/${event._id}/registrations`);
      expect(res.status).toBe(200);
      expect(res.body.data.event.registeredCount).toBe(1);
      expect(res.body.data.registrations).toHaveLength(1);
    });

    it('blocks students from viewing the participant list', async () => {
      const student = await createUser({ email: 'blocked.list@example.com', password: 'Password@123', role: 'student' });
      const client = await loginAs(student);
      const res = await client.get(`/api/v1/events/${event._id}/registrations`);
      expect(res.status).toBe(403);
    });
  });
});
