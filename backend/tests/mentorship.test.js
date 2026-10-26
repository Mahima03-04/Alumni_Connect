'use strict';

const { newClient, createUser } = require('./helpers');
const MentorshipRequest = require('../src/models/MentorshipRequest');
const Notification = require('../src/models/Notification');

async function loginAs(user) {
  const client = await newClient();
  await client.login(user.email, user.plainPassword);
  return client;
}

describe('Mentorship', () => {
  let alumni;
  let student;

  beforeEach(async () => {
    alumni = await createUser({
      name: 'Mentor Alumni',
      email: 'mentor@example.com',
      password: 'Password@123',
      role: 'alumni',
      profile: { openToMentorship: true, mentorshipAreas: ['Web Development'] },
    });
    student = await createUser({
      name: 'Mentee Student',
      email: 'mentee@example.com',
      password: 'Password@123',
      role: 'student',
    });
  });

  it('lists alumni who are open to mentorship', async () => {
    const client = await loginAs(student);
    const res = await client.get('/api/v1/mentorship');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Mentor Alumni');
  });

  it('lets a student send a mentorship request', async () => {
    const client = await loginAs(student);
    const res = await client.post('/api/v1/mentorship/requests').send({
      alumniId: String(alumni._id),
      message: 'I would like guidance on becoming a web developer.',
      careerGoal: 'Become a frontend engineer within one year.',
      areaOfInterest: 'Web Development',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');

    const notifications = await Notification.find({ user: alumni._id });
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('validates the mentorship request payload', async () => {
    const client = await loginAs(student);
    const res = await client.post('/api/v1/mentorship/requests').send({ alumniId: String(alumni._id), message: 'hi' });
    expect(res.status).toBe(422);
  });

  it('prevents duplicate active requests to the same alumnus', async () => {
    const client = await loginAs(student);
    await client.post('/api/v1/mentorship/requests').send({
      alumniId: String(alumni._id),
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
    });

    const second = await client.post('/api/v1/mentorship/requests').send({
      alumniId: String(alumni._id),
      message: 'Sending the same request again.',
      careerGoal: 'Get a frontend internship.',
    });

    expect(second.status).toBe(409);
    const count = await MentorshipRequest.countDocuments({ student: student._id, alumni: alumni._id });
    expect(count).toBe(1);
  });

  it('blocks students from requesting an unapproved alumnus', async () => {
    const pending = await createUser({
      email: 'pending.mentor@example.com',
      password: 'Password@123',
      role: 'alumni',
      approvalStatus: 'pending',
    });
    const client = await loginAs(student);
    const res = await client.post('/api/v1/mentorship/requests').send({
      alumniId: String(pending._id),
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
    });
    expect(res.status).toBe(404);
  });

  it('lets the alumnus accept a request and notifies the student', async () => {
    const request = await MentorshipRequest.create({
      student: student._id,
      alumni: alumni._id,
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
    });

    const client = await loginAs(alumni);
    const res = await client.patch(`/api/v1/mentorship/requests/${request._id}`).send({
      status: 'accepted',
      responseMessage: 'Happy to help, let us start this weekend.',
      meetingDetails: { mode: 'online', scheduledAt: new Date(Date.now() + 86400000).toISOString() },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('accepted');
    expect(res.body.data.respondedAt).not.toBeNull();

    const notifications = await Notification.find({ user: student._id });
    expect(notifications.some((n) => /accepted/i.test(n.title))).toBe(true);
  });

  it('allows both participants to see the updated status', async () => {
    const request = await MentorshipRequest.create({
      student: student._id,
      alumni: alumni._id,
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
      status: 'accepted',
    });

    const studentClient = await loginAs(student);
    const studentView = await studentClient.get('/api/v1/mentorship/requests/me');
    expect(studentView.status).toBe(200);
    expect(studentView.body.data[0].status).toBe('accepted');

    const alumniClient = await loginAs(alumni);
    const alumniView = await alumniClient.get('/api/v1/mentorship/requests/me');
    expect(alumniView.status).toBe(200);
    expect(alumniView.body.data[0].status).toBe('accepted');
  });

  it('stops a student from accepting their own request', async () => {
    const request = await MentorshipRequest.create({
      student: student._id,
      alumni: alumni._id,
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
    });

    const client = await loginAs(student);
    const res = await client.patch(`/api/v1/mentorship/requests/${request._id}`).send({ status: 'accepted' });
    expect(res.status).toBe(403);
  });

  it('lets a student cancel their own pending request', async () => {
    const request = await MentorshipRequest.create({
      student: student._id,
      alumni: alumni._id,
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
    });

    const client = await loginAs(student);
    const res = await client.patch(`/api/v1/mentorship/requests/${request._id}`).send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('keeps unrelated users out of a mentorship request', async () => {
    const request = await MentorshipRequest.create({
      student: student._id,
      alumni: alumni._id,
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
    });

    const stranger = await createUser({ email: 'stranger.mentee@example.com', password: 'Password@123', role: 'student' });
    const client = await loginAs(stranger);
    const res = await client.get(`/api/v1/mentorship/requests/${request._id}`);
    expect(res.status).toBe(403);
  });

  it('lets a student delete their cancelled request', async () => {
    const request = await MentorshipRequest.create({
      student: student._id,
      alumni: alumni._id,
      message: 'Please mentor me for web development roles.',
      careerGoal: 'Get a frontend internship.',
      status: 'cancelled',
    });

    const client = await loginAs(student);
    const res = await client.delete(`/api/v1/mentorship/requests/${request._id}`);
    expect(res.status).toBe(200);
    expect(await MentorshipRequest.findById(request._id)).toBeNull();
  });
});
