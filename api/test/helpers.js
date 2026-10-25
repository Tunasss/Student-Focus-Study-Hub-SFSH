// Minimal in-memory stand-in for the Prisma models used by the routes under test.
// Supports only the query shapes the API actually uses.
function createFakePrisma() {
  const users = [];
  const courses = [];
  const schedules = [];
  const ids = { user: 1, course: 1, schedule: 1 };

  const courseOwnedBy = (courseId, userId) => courses.some((c) => c.id === courseId && c.userId === userId);

  function matchSchedule(s, where = {}) {
    if (where.courseId !== undefined && s.courseId !== where.courseId) return false;
    if (where.icsUid?.not === null && s.icsUid === null) return false;
    if (where.course?.userId !== undefined && !courseOwnedBy(s.courseId, where.course.userId)) return false;
    return true;
  }

  const prisma = {
    users,
    courses,
    schedules,
    async $transaction(fn) {
      return fn(prisma);
    },
    user: {
      async findUnique({ where }) {
        return users.find((u) => (where.id !== undefined ? u.id === where.id : u.email === where.email)) ?? null;
      },
      async create({ data }) {
        const user = { id: ids.user++, createdAt: new Date(), ...data };
        users.push(user);
        return user;
      },
    },
    course: {
      async findFirst({ where }) {
        return courses.find((c) => c.userId === where.userId && c.courseKey === where.courseKey) ?? null;
      },
      async create({ data }) {
        const course = { id: ids.course++, code: null, courseKey: null, ...data };
        courses.push(course);
        return course;
      },
      async update({ where, data }) {
        const course = courses.find((c) => c.id === where.id);
        Object.assign(course, data);
        return course;
      },
      async findMany({ where, include }) {
        return courses
          .filter((c) => c.userId === where.userId)
          .map((c) => (include?.schedules ? { ...c, schedules: schedules.filter((s) => s.courseId === c.id) } : c));
      },
    },
    schedule: {
      async deleteMany({ where }) {
        const before = schedules.length;
        for (let i = schedules.length - 1; i >= 0; i--) {
          if (matchSchedule(schedules[i], where)) schedules.splice(i, 1);
        }
        return { count: before - schedules.length };
      },
      async createMany({ data }) {
        for (const row of data) {
          schedules.push({ id: ids.schedule++, location: null, recurrenceUntil: null, exdates: null, ...row });
        }
        return { count: data.length };
      },
      async findMany({ where, include }) {
        return schedules
          .filter((s) => matchSchedule(s, where))
          .map((s) => (include?.course ? { ...s, course: courses.find((c) => c.id === s.courseId) } : s));
      },
    },
  };

  return prisma;
}

module.exports = { createFakePrisma };
