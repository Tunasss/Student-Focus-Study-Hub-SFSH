const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const { isTransientDbError, withDbRetry } = require('../src/db/client');
const { createFakePrisma } = require('./helpers');

function makePrismaError(code, message = `Prisma error ${code}`) {
  return Object.assign(new Error(message), { code });
}

describe('DB transient retry helpers', () => {
  test('isTransientDbError identifies P1001, P1002, P1017, P2024', () => {
    for (const code of ['P1001', 'P1002', 'P1017', 'P2024']) {
      assert.equal(isTransientDbError(makePrismaError(code)), true);
    }
    assert.equal(isTransientDbError(makePrismaError('P2002')), false);
    assert.equal(isTransientDbError(makePrismaError('P2025')), false);
    assert.equal(isTransientDbError(new Error('boom')), false);
    assert.equal(isTransientDbError(null), false);
  });

  test('withDbRetry retries once on transient error and resolves', async () => {
    let attempts = 0;
    const result = await withDbRetry(
      async () => {
        attempts += 1;
        if (attempts === 1) throw makePrismaError('P1001', "Can't reach database server");
        return 'ok';
      },
      { retries: 1, delayMs: 0 },
    );

    assert.equal(result, 'ok');
    assert.equal(attempts, 2);
  });

  test('withDbRetry does not retry non-transient errors', async () => {
    let attempts = 0;
    await assert.rejects(
      withDbRetry(
        async () => {
          attempts += 1;
          throw makePrismaError('P2002', 'Unique constraint failed');
        },
        { retries: 2, delayMs: 0 },
      ),
      { code: 'P2002' },
    );
    assert.equal(attempts, 1);
  });
});

describe('GET /api/health & DB error handling', () => {
  test('pings the database and returns 200 ok', async () => {
    let pinged = 0;
    const prisma = createFakePrisma();
    prisma.$queryRaw = async () => {
      pinged += 1;
      return [{ 1: 1 }];
    };
    const app = createApp({ prisma });

    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, { status: 'ok' });
    assert.equal(pinged, 1);
  });

  test('retries once on transient P1001 during health check and returns 200 ok', async () => {
    let attempts = 0;
    const prisma = createFakePrisma();
    prisma.$queryRaw = async () => {
      attempts += 1;
      if (attempts === 1) throw makePrismaError('P1001', "Can't reach database server");
      return [{ 1: 1 }];
    };
    const app = createApp({ prisma });

    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, { status: 'ok' });
    assert.equal(attempts, 2);
  });

  test('returns 503 SERVICE_UNAVAILABLE when database remains unreachable', async () => {
    const prisma = createFakePrisma();
    prisma.$queryRaw = async () => {
      throw makePrismaError('P1001', "Can't reach database server");
    };
    const app = createApp({ prisma });

    const res = await request(app).get('/api/health');

    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
  });

  test('maps unhandled Prisma P1001 / P1017 errors on API routes to 503 SERVICE_UNAVAILABLE', async () => {
    const prisma = createFakePrisma();
    prisma.user.findUnique = async () => {
      throw makePrismaError('P1001', "Can't reach database server");
    };
    const app = createApp({ prisma });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@sfsh.dev', password: 'Password123!' });

    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'SERVICE_UNAVAILABLE');
  });
});
