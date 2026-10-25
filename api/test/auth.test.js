const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { config } = require('../src/config');
const { createFakePrisma } = require('./helpers');

let prisma;
let app;

beforeEach(() => {
  prisma = createFakePrisma();
  app = createApp({ prisma });
});

async function register(email = 'student@sfsh.dev', password = 'Password123!') {
  return request(app).post('/api/auth/register').send({ email, password });
}

describe('POST /api/auth/register', () => {
  test('creates a user, hashes the password and returns a 24h token', async () => {
    const res = await register('Student@SFSH.dev');

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'student@sfsh.dev');
    assert.equal(res.body.user.passwordHash, undefined);
    assert.notEqual(prisma.users[0].passwordHash, 'Password123!');
    assert.match(prisma.users[0].passwordHash, /^\$2[aby]\$/);

    const payload = jwt.verify(res.body.token, config.jwtSecret);
    assert.equal(payload.exp - payload.iat, 24 * 60 * 60);
  });

  test('rejects passwords shorter than 8 characters', async () => {
    const res = await register('a@b.co', 'short12');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  test('rejects invalid email', async () => {
    const res = await register('not-an-email');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  test('rejects duplicate email', async () => {
    await register();
    const res = await register();
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, 'EMAIL_TAKEN');
  });
});

describe('POST /api/auth/login', () => {
  test('returns a token for valid credentials', async () => {
    await register();
    const res = await request(app).post('/api/auth/login').send({ email: 'student@sfsh.dev', password: 'Password123!' });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  test('rejects a wrong password', async () => {
    await register();
    const res = await request(app).post('/api/auth/login').send({ email: 'student@sfsh.dev', password: 'WrongPass1!' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  test('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@sfsh.dev', password: 'Password123!' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });
});

describe('requireAuth middleware (GET /api/auth/me)', () => {
  test('returns the current user with a valid token', async () => {
    const { body } = await register();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'student@sfsh.dev');
  });

  test('401 UNAUTHORIZED without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  test('401 UNAUTHORIZED with a token signed by another secret', async () => {
    const token = jwt.sign({ sub: '1' }, 'some-other-secret', { expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  test('401 TOKEN_EXPIRED with an expired token', async () => {
    await register();
    const token = jwt.sign({ sub: '1', exp: Math.floor(Date.now() / 1000) - 60 }, config.jwtSecret);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'TOKEN_EXPIRED');
  });
});

test('GET /api/health is public', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});
