'use strict';

const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/db');

// Load every model so index creation and collection cleanup covers them all.
const models = [
  require('../src/models/User'),
  require('../src/models/AlumniProfile'),
  require('../src/models/StudentProfile'),
  require('../src/models/Job'),
  require('../src/models/JobApplication'),
  require('../src/models/MentorshipRequest'),
  require('../src/models/Event'),
  require('../src/models/EventRegistration'),
  require('../src/models/Announcement'),
  require('../src/models/Notification'),
  require('../src/models/ActivityLog'),
];

beforeAll(async () => {
  await connectDatabase();
  // Make sure unique indexes exist before the duplicate-prevention tests run.
  await Promise.all(models.map((model) => model.init()));
}, 60000);

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();
});
