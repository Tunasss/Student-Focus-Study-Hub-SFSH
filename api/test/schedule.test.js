const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const { createApp } = require('../src/app');
const { signToken } = require('../src/middleware/auth');
const { createFakePrisma } = require('./helpers');

const SAMPLE = fs.readFileSync(path.join(__dirname, '../prisma/fixtures/sample-timetable.ics'));

let prisma;
let app;
let token;
let otherToken;

beforeEach(async () => {
  prisma = createFakePrisma();
  app = createApp({ prisma });
  token = signToken(await prisma.user.create({ data: { email: 'a@sfsh.dev', passwordHash: 'x' } }));
  otherToken = signToken(await prisma.user.create({ data: { email: 'b@sfsh.dev', passwordHash: 'x' } }));
});

function importIcs(buffer = SAMPLE, filename = 'sample-timetable.ics', auth = token) {
  return request(app).post('/api/schedule/import').set('Authorization', `Bearer ${auth}`).attach('file', buffer, filename);
}

describe('POST /api/schedule/import', () => {
  test('imports courses and weekly slots from an .ics file', async () => {
    const res = await importIcs();

    assert.equal(res.status, 201);
    assert.equal(res.body.data.eventsRead, 6);
    assert.equal(res.body.data.coursesCreated, 5);
    assert.equal(res.body.data.coursesUpdated, 0);
    assert.equal(res.body.data.schedulesImported, 6);
    assert.equal(res.body.data.skipped.length, 1);
    assert.deepEqual(
      res.body.data.courses.map((c) => c.code),
      ['CS101', 'MATH201', 'PHY110', 'ENG102', null],
    );
  });

  test('re-uploading the same file upserts instead of duplicating', async () => {
    await importIcs();
    const again = await importIcs();

    assert.equal(again.status, 201);
    assert.equal(again.body.data.coursesCreated, 0);
    assert.equal(again.body.data.coursesUpdated, 5);
    assert.equal(prisma.courses.length, 5);
    assert.equal(prisma.schedules.length, 6);
  });

  test('upsert keeps manually added schedules and courses not in the file', async () => {
    await importIcs();
    const cs101 = prisma.courses.find((c) => c.code === 'CS101');
    prisma.schedules.push({ id: 999, courseId: cs101.id, icsUid: null, dayOfWeek: 6 });
    prisma.courses.push({ id: 998, userId: cs101.userId, code: 'MAN100', name: 'Manual', courseKey: null });

    await importIcs();

    assert.ok(prisma.schedules.some((s) => s.id === 999));
    assert.ok(prisma.courses.some((c) => c.id === 998));
  });

  test('each user gets their own courses (Rule 06)', async () => {
    await importIcs();
    const res = await importIcs(SAMPLE, 'sample-timetable.ics', otherToken);

    assert.equal(res.body.data.coursesCreated, 5);
    assert.equal(prisma.courses.length, 10);
  });

  test('rejects a non-.ics extension with INVALID_ICS_FORMAT', async () => {
    const res = await importIcs(SAMPLE, 'timetable.txt');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_ICS_FORMAT');
  });

  test('rejects content without BEGIN:VCALENDAR', async () => {
    const res = await importIcs(Buffer.from('not a calendar'), 'fake.ics');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_ICS_FORMAT');
  });

  test('rejects files over 2 MB', async () => {
    const big = Buffer.concat([SAMPLE, Buffer.alloc(2 * 1024 * 1024, 'x')]);
    const res = await importIcs(big, 'big.ics');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_ICS_FORMAT');
    assert.match(res.body.error.message, /2 MB/);
  });

  test('rejects a request without a file', async () => {
    const res = await request(app).post('/api/schedule/import').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_ICS_FORMAT');
  });

  test('rejects a calendar with only unsupported events', async () => {
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:x\r\nDTSTART;VALUE=DATE:20261120\r\nSUMMARY:Holiday\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const res = await importIcs(Buffer.from(ics), 'holiday.ics');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_ICS_FORMAT');
  });

  test('requires authentication', async () => {
    const res = await request(app).post('/api/schedule/import').attach('file', SAMPLE, 'sample-timetable.ics');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});

describe('GET /api/schedule', () => {
  test('returns occurrences for the requested week in Asia/Ho_Chi_Minh', async () => {
    await importIcs();
    const res = await request(app)
      .get('/api/schedule?from=2026-11-09&to=2026-11-16')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.tz, 'Asia/Ho_Chi_Minh');
    const summary = res.body.data.events.map((e) => `${e.start} ${e.courseCode ?? e.courseName}`);
    assert.deepEqual(summary, [
      '2026-11-09T07:30 CS101',
      '2026-11-10T09:45 MATH201',
      // PHY110 is every other week from Tue 8 Sep, so not this week.
      // Wed 11 Nov CS101 is cancelled by EXDATE
      '2026-11-13T15:45 ENG102',
    ]);
  });

  test('INTERVAL=2 classes appear on alternate weeks only', async () => {
    await importIcs();
    const res = await request(app)
      .get('/api/schedule?from=2026-11-16&to=2026-11-23')
      .set('Authorization', `Bearer ${token}`);

    const phy = res.body.data.events.filter((e) => e.courseCode === 'PHY110');
    assert.deepEqual(phy.map((e) => e.start), ['2026-11-17T13:00']); // 06:00 UTC = 13:00 Hanoi
  });

  test('converts to the tz query parameter', async () => {
    await importIcs();
    const res = await request(app)
      .get('/api/schedule?from=2026-11-09&to=2026-11-10&tz=UTC')
      .set('Authorization', `Bearer ${token}`);
    assert.deepEqual(
      res.body.data.events.map((e) => e.start),
      ['2026-11-09T00:30'],
    );
  });

  test('does not return other users\' schedules (Rule 06)', async () => {
    await importIcs();
    const res = await request(app)
      .get('/api/schedule?from=2026-11-09&to=2026-11-16')
      .set('Authorization', `Bearer ${otherToken}`);
    assert.deepEqual(res.body.data.events, []);
  });

  test('validates tz and the date range', async () => {
    const get = (qs) => request(app).get(`/api/schedule?${qs}`).set('Authorization', `Bearer ${token}`);
    assert.equal((await get('tz=Mars/Base')).body.error.code, 'VALIDATION_ERROR');
    assert.equal((await get('from=2026-13-01')).body.error.code, 'VALIDATION_ERROR');
    assert.equal((await get('from=2026-11-10&to=2026-11-09')).body.error.code, 'VALIDATION_ERROR');
    assert.equal((await get('from=2026-01-01&to=2026-06-01')).body.error.code, 'VALIDATION_ERROR');
  });
});

describe('GET /api/courses', () => {
  test('lists the user\'s courses with slots in their original timezone', async () => {
    await importIcs();
    const res = await request(app).get('/api/courses').set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    const eng = res.body.data.courses.find((c) => c.code === 'ENG102');
    assert.equal(eng.schedules[0].tz, 'Asia/Bangkok');
    assert.equal(eng.schedules[0].startTime, '15:45:00');
    assert.equal(eng.schedules[0].source, 'ics');
  });
});
