// Shared setup for the WBS 3.4 analytics tests: an app on the in-memory fake Prisma and
// helpers that insert rows for a signed-up user.
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function setup() {
  const prisma = createFakePrisma();
  const app = createApp({ prisma });

  async function signUp(email) {
    const res = await request(app).post('/api/auth/register').send({ email, password: 'Password123!' });
    const user = prisma.users.find((u) => u.email === email);
    const token = res.body.data.token;
    const as = (req) => req.set('Authorization', `Bearer ${token}`);

    return {
      user,
      app,
      as,
      get: (path) => as(request(app).get(path)),
      course: (name, code = null) => prisma.course.create({ data: { userId: user.id, name, code } }),
      async topics(course, statuses) {
        const offset = prisma.topics.filter((t) => t.courseId === course.id).length;
        for (const [i, status] of statuses.entries()) {
          await prisma.topic.create({ data: { courseId: course.id, sortOrder: offset + i + 1, title: `Topic ${offset + i + 1}`, status } });
        }
      },
      task: (course, data = {}) =>
        prisma.task.create({
          data: { userId: user.id, courseId: course.id, title: 'Task', dueAt: new Date(Date.now() + 3 * DAY), ...data },
        }),
      // startedAt defaults to "now"; daysAgo shifts it by whole days (no DST in the test timezones).
      session: ({ course = null, minutes = 25, status = 'COMPLETED', daysAgo = 0, startedAt } = {}) =>
        prisma.studySession.create({
          data: {
            userId: user.id,
            courseId: course ? course.id : null,
            startedAt: startedAt ?? new Date(Date.now() - daysAgo * DAY),
            minutes,
            status,
          },
        }),
    };
  }

  return { prisma, app, signUp };
}

module.exports = { setup, MINUTE, DAY };
