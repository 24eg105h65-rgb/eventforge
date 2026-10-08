const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

let mongoServer;
let request;
let token;

const demoUser = {
  name: 'Test Organizer',
  email: 'organizer@example.com',
  password: 'Password123!',
  role: 'organizer',
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri('eventforge_test');
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(process.env.MONGODB_URI);
  request = supertest(app);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.afterEach(async () => {
  await User.deleteMany({});
});

test('registers a user and hides the password', async () => {
  const response = await request.post('/api/auth/register').send({
    ...demoUser,
    phone: '+1 555 0100',
    interests: ['Design', 'Music'],
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.user.email, demoUser.email);
  assert.equal(response.body.user.password, undefined);
  assert.equal(response.body.user.role, 'organizer');
  assert.equal(response.body.user.phone, '+1 555 0100');
  assert.deepEqual(response.body.user.interests, ['Design', 'Music']);

  const storedUser = await User.findById(response.body.user._id);
  assert.equal(storedUser.phone, '+1 555 0100');
  assert.deepEqual(storedUser.interests, ['Design', 'Music']);
});

test('rejects a duplicate email', async () => {
  await request.post('/api/auth/register').send(demoUser);
  const response = await request.post('/api/auth/register').send(demoUser);

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /already exists/i);
});

test('logs in with valid credentials and returns a JWT', async () => {
  await request.post('/api/auth/register').send(demoUser);
  const response = await request.post('/api/auth/login').send({
    email: demoUser.email,
    password: demoUser.password,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.token);
  assert.equal(response.body.user.password, undefined);
  token = response.body.token;
});

test('rejects invalid login credentials', async () => {
  const response = await request.post('/api/auth/login').send({
    email: demoUser.email,
    password: 'wrong-password',
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('rejects invalid email format', async () => {
  const response = await request.post('/api/auth/register').send({
    ...demoUser,
    email: 'not-an-email',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('rejects short passwords', async () => {
  const response = await request.post('/api/auth/register').send({
    ...demoUser,
    password: 'short',
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('returns the authenticated user on the protected /me route', async () => {
  await request.post('/api/auth/register').send(demoUser);
  const login = await request.post('/api/auth/login').send({
    email: demoUser.email,
    password: demoUser.password,
  });

  const response = await request
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${login.body.token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, demoUser.email);
});

test('updates only the authenticated user profile fields', async () => {
  const registration = await request.post('/api/auth/register').send(demoUser);
  const login = await request.post('/api/auth/login').send({
    email: demoUser.email,
    password: demoUser.password,
  });

  const response = await request
    .put('/api/auth/me')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      name: 'Updated Organizer',
      avatar: 'https://example.com/avatar.png',
      interests: ['Design', 'Events'],
      role: 'attendee',
      email: 'changed@example.com',
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.name, 'Updated Organizer');
  assert.equal(response.body.user.avatar, 'https://example.com/avatar.png');
  assert.deepEqual(response.body.user.interests, ['Design', 'Events']);
  assert.equal(response.body.user.email, demoUser.email);
  assert.equal(response.body.user.role, demoUser.role);
  assert.equal(response.body.user.password, undefined);

  const storedUser = await User.findById(registration.body.user._id);
  assert.equal(storedUser.email, demoUser.email);
  assert.equal(storedUser.role, demoUser.role);
  assert.equal(storedUser.name, 'Updated Organizer');
});

test('blocks unauthenticated access to protected routes', async () => {
  const response = await request.get('/api/auth/me');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('blocks invalid access tokens', async () => {
  const response = await request
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid-token');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('blocks expired access tokens', async () => {
  const expiredToken = jwt.sign({ id: 'invalid-user', role: 'attendee' }, process.env.JWT_SECRET, {
    expiresIn: '-1h',
  });

  const response = await request
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${expiredToken}`);

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('allows organizer and blocks attendee from organizer-only access', async () => {
  const organizer = await request.post('/api/auth/register').send(demoUser);
  const attendee = await request.post('/api/auth/register').send({
    name: 'Test Attendee',
    email: 'attendee@example.com',
    password: 'Password123!',
    role: 'attendee',
  });

  const organizerToken = organizer.body.token;
  const attendeeToken = attendee.body.token;

  const organizerResponse = await request
    .get('/api/auth/role-check')
    .set('Authorization', `Bearer ${organizerToken}`);
  const attendeeResponse = await request
    .get('/api/auth/role-check')
    .set('Authorization', `Bearer ${attendeeToken}`);

  assert.equal(organizerResponse.status, 200);
  assert.equal(attendeeResponse.status, 403);
});
