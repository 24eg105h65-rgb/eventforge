const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const Event = require('../models/Event');
const User = require('../models/User');

let mongoServer;
let request;
let platformAdmin;
let organizer;

const buildEvent = () => ({
  name: 'Annual Product Summit',
  description: 'A strategic leadership event.',
  eventType: 'summit',
  status: 'draft',
  startDate: '2030-06-15T09:00:00.000Z',
  endDate: '2030-06-17T18:00:00.000Z',
  timezone: 'UTC',
  venue: 'North Hall',
  address: '10 Market Street',
  city: 'New York',
  country: 'US',
  capacity: 250,
  registrationOpen: '2030-04-01T00:00:00.000Z',
  registrationClose: '2030-06-10T23:59:59.000Z',
  contactEmail: 'hello@example.com',
  website: 'https://example.com',
  tags: ['Leadership', 'Product'],
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const registerUser = async (override = {}) => {
  const response = await request.post('/api/auth/register').send({
    name: 'Test User',
    email: `${Date.now()}-${Math.random()}@example.com`,
    password: 'Password123!',
    role: 'organizer',
    ...override,
  });

  return response.body.token;
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri('eventforge_events_test');
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(process.env.MONGODB_URI);
  request = supertest(app);

  const adminResponse = await request.post('/api/auth/register').send({
    name: 'Platform Admin',
    email: 'admin@example.com',
    password: 'Password123!',
    role: 'platform_admin',
  });
  platformAdmin = adminResponse.body.token;

  organizer = await registerUser({ email: 'organizer@example.com' });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.afterEach(async () => {
  await Event.deleteMany({});
});

test('creates an event for an authorized organizer', async () => {
  const response = await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send(buildEvent());

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.event.slug, 'annual-product-summit');
  assert.equal(response.body.event.createdBy, (await User.findOne({ email: 'organizer@example.com' }))._id.toString());
});

test('allows an organizer to create an event', async () => {
  const organizerUser = await registerUser({ email: 'organizer-no-org@example.com' });
  const response = await request
    .post('/api/events')
    .set(authHeader(organizerUser))
    .send(buildEvent());

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.event.organizer, (await User.findOne({ email: 'organizer-no-org@example.com' }))._id.toString());
});

test('allows an attendee to see events', async () => {
  const attendee = await registerUser({ role: 'attendee', email: 'attendee-no-org@example.com' });
  const created = await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send(buildEvent());
  const response = await request
    .get('/api/events')
    .set(authHeader(attendee));

  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0]._id, created.body.event._id);
});

test('accepts date-only event start and end dates', async () => {
  const response = await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send({
      ...buildEvent(),
      startDate: '2030-06-15',
      endDate: '2030-06-17',
      registrationClose: '2030-06-10',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
});

test('allows an organizer to manage registrations for an event', async () => {
  const organizerUser = await registerUser({ email: 'organizer-no-org-registrations@example.com' });
  const created = await request
    .post('/api/events')
    .set(authHeader(organizerUser))
    .send(buildEvent());
  const response = await request
    .get(`/api/events/${created.body.event._id}/registrations`)
    .set(authHeader(organizerUser));

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, []);
});

test('validates required event data and date ordering', async () => {
  const response = await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send({
      ...buildEvent(),
      name: '',
      capacity: 0,
      startDate: '2030-06-20T09:00:00.000Z',
      endDate: '2030-06-17T18:00:00.000Z',
    });

  assert.equal(response.status, 422);
  assert.equal(response.body.success, false);
  assert.ok(Array.isArray(response.body.details));
});

test('lists events with filters and returns useful statistics', async () => {
  await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send(buildEvent());

  const listResponse = await request
    .get('/api/events')
    .set(authHeader(organizer))
    .query({ search: 'annual', status: 'draft', eventType: 'summit' });
  const detailResponse = await request
    .get('/api/events')
    .set(authHeader(organizer))
    .query({ page: 1, limit: 10 });
  const overviewResponse = await request
    .get(`/api/events/${(await Event.findOne())._id}/overview`)
    .set(authHeader(organizer));

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.data.length, 1);
  assert.equal(detailResponse.body.pagination.total, 1);
  assert.equal(overviewResponse.body.data.capacity, 250);
  assert.equal(overviewResponse.body.data.totalRegistrations, 0);
});

test('allows event owner and blocks unauthorized modification', async () => {
  const created = await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send(buildEvent());

  const updateResponse = await request
    .put(`/api/events/${created.body.event._id}`)
    .set(authHeader(organizer))
    .send({ name: 'Updated Event Name' });
  const attendeeToken = await registerUser({
    role: 'attendee',
    email: 'attendee@example.com',
  });
  const forbiddenResponse = await request
    .put(`/api/events/${created.body.event._id}`)
    .set(authHeader(attendeeToken))
    .send({ name: 'Blocked Update' });

  assert.equal(updateResponse.status, 200);
  assert.equal(forbiddenResponse.status, 403);
});

test('deletes an event after confirmation and rejects missing IDs', async () => {
  const created = await request
    .post('/api/events')
    .set(authHeader(organizer))
    .send(buildEvent());

  const deleteResponse = await request
    .delete(`/api/events/${created.body.event._id}`)
    .set(authHeader(organizer));
  const invalidResponse = await request
    .delete(`/api/events/invalid-id`)
    .set(authHeader(organizer));

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.success, true);
  assert.equal(invalidResponse.status, 400);
});

test('requires authentication for event routes', async () => {
  const response = await request.get('/api/events');

  assert.equal(response.status, 401);
});
