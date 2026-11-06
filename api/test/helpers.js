// Minimal in-memory stand-in for the Prisma models used by the routes under test.
// Supports only the query shapes the API actually uses.
function createFakePrisma() {
  const users = [];
  const courses = [];
  const schedules = [];
  const topics = [];
  const tasks = [];
  const ids = { user: 1, course: 1, schedule: 1, topic: 1, task: 1 };

  const courseOwnedBy = (courseId, userId) => courses.some((c) => c.id === courseId && c.userId === userId);

  // Prisma's "record not found" error for update/delete.
  const recordNotFound = () => Object.assign(new Error('Record to update/delete does not exist.'), { code: 'P2025' });

  // Matches a row against a flat where clause of equality filters, plus the
  // nested `course: { userId }` scope used by byCourseOwner().
  function matchesWhere(row, where = {}) {
    for (const [key, value] of Object.entries(where)) {
      if (key === 'course') {
        if (value.userId !== undefined && !courseOwnedBy(row.courseId, value.userId)) return false;
      } else if (value !== null && typeof value === 'object') {
        if (value.not !== undefined && row[key] === value.not) return false;
      } else if (row[key] !== value) {
        return false;
      }
    }
    return true;
  }

  function pick(row, select) {
    if (!row || !select) return row;
    return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]));
  }

  function withTaskInclude(task, include) {
    if (!task || !include) return task;
    const out = { ...task };
    if (include.course) out.course = pick(courses.find((c) => c.id === task.courseId) ?? null, include.course.select);
    if (include.topic) {
      const topic = task.topicId === null ? null : (topics.find((t) => t.id === task.topicId) ?? null);
      out.topic = pick(topic, include.topic.select);
    }
    return out;
  }

  function sortBy(rows, orderBy = []) {
    const keys = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const k of keys) {
        const [field, dir] = Object.entries(k)[0];
        const av = a[field] instanceof Date ? a[field].getTime() : a[field];
        const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
        if (av === bv) continue;
        return (av < bv ? -1 : 1) * (dir === 'desc' ? -1 : 1);
      }
      return 0;
    });
  }

  const prisma = {
    users,
    courses,
    schedules,
    topics,
    tasks,
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
      async findFirst({ where, select }) {
        return pick(courses.find((c) => matchesWhere(c, where)) ?? null, select);
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
          if (matchesWhere(schedules[i], where)) schedules.splice(i, 1);
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
          .filter((s) => matchesWhere(s, where))
          .map((s) => (include?.course ? { ...s, course: courses.find((c) => c.id === s.courseId) } : s));
      },
    },
    topic: {
      async findFirst({ where, select }) {
        return pick(topics.find((t) => matchesWhere(t, where)) ?? null, select);
      },
      async create({ data }) {
        const topic = { id: ids.topic++, description: null, status: 'TODO', ...data };
        topics.push(topic);
        return topic;
      },
    },
    task: {
      async findMany({ where, include, orderBy }) {
        return sortBy(tasks.filter((t) => matchesWhere(t, where)), orderBy).map((t) => withTaskInclude(t, include));
      },
      async findFirst({ where, include }) {
        return withTaskInclude(tasks.find((t) => matchesWhere(t, where)) ?? null, include);
      },
      async create({ data, include }) {
        const task = { id: ids.task++, topicId: null, status: 'TODO', createdAt: new Date(), ...data };
        tasks.push(task);
        return withTaskInclude(task, include);
      },
      async update({ where, data, include }) {
        const task = tasks.find((t) => matchesWhere(t, where));
        if (!task) throw recordNotFound();
        Object.assign(task, data);
        return withTaskInclude(task, include);
      },
      async delete({ where }) {
        const index = tasks.findIndex((t) => matchesWhere(t, where));
        if (index === -1) throw recordNotFound();
        return tasks.splice(index, 1)[0];
      },
    },
  };

  return prisma;
}

// Stand-in for the @google/genai client used by src/syllabus/analyzeSyllabus.js.
//   createFakeGemini({ course_code: 'CS101', topics: [...] })  -> replies with that JSON
//   createFakeGemini('not json')                                -> replies with raw text
//   createFakeGemini((request) => reply | throw)                -> custom per call
// Every generateContent request is recorded in `calls`.
function createFakeGemini(reply) {
  const calls = [];
  return {
    calls,
    models: {
      async generateContent(request) {
        calls.push(request);
        const value = typeof reply === 'function' ? reply(request) : reply;
        return { text: typeof value === 'string' ? value : JSON.stringify(value) };
      },
    },
  };
}

// A plausible Gemini reply for route tests.
const SAMPLE_ANALYSIS = {
  course_code: 'MATH201',
  topics: [
    { order: 1, title: 'Techniques of integration', description: 'Substitution, parts, partial fractions.' },
    { order: 2, title: 'Improper integrals and applications', description: 'Area, volume, arc length.' },
    { order: 3, title: 'Sequences and series' },
  ],
};

module.exports = { createFakePrisma, createFakeGemini, SAMPLE_ANALYSIS };
