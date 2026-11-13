// Minimal in-memory stand-in for the Prisma models used by the routes under test.
// Supports only the query shapes the API actually uses.
function createFakePrisma() {
  const users = [];
  const courses = [];
  const schedules = [];
  const topics = [];
  const tasks = [];
  const sessions = [];
  const ids = { user: 1, course: 1, schedule: 1, topic: 1, task: 1, session: 1 };

  const courseOwnedBy = (courseId, userId) => courses.some((c) => c.id === courseId && c.userId === userId);

  // Prisma's "record not found" error for update/delete, and the unique-constraint error for create.
  const recordNotFound = () => Object.assign(new Error('Record to update/delete does not exist.'), { code: 'P2025' });
  const uniqueViolation = () => Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

  const comparable = (v) => (v instanceof Date ? v.getTime() : v);
  // MySQL utf8mb4_unicode_ci compares case- and accent-insensitively.
  const fold = (v) => String(v ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();

  // Matches a row against a where clause of equality filters, range / in / not /
  // contains operators, OR, plus the nested `course: { userId }` scope used by byCourseOwner().
  function matchesWhere(row, where = {}) {
    for (const [key, value] of Object.entries(where)) {
      if (key === 'OR') {
        if (!value.some((w) => matchesWhere(row, w))) return false;
      } else if (key === 'course') {
        if (value.userId !== undefined && !courseOwnedBy(row.courseId, value.userId)) return false;
      } else if (value instanceof Date) {
        if (comparable(row[key]) !== value.getTime()) return false;
      } else if (value !== null && typeof value === 'object') {
        const v = comparable(row[key]);
        if (value.not !== undefined && row[key] === value.not) return false;
        if (value.in !== undefined && !value.in.includes(row[key])) return false;
        if (value.contains !== undefined && (row[key] == null || !fold(row[key]).includes(fold(value.contains)))) return false;
        for (const [op, test] of [['gte', (a, b) => a >= b], ['gt', (a, b) => a > b], ['lte', (a, b) => a <= b], ['lt', (a, b) => a < b]]) {
          if (value[op] !== undefined && (row[key] == null || !test(v, comparable(value[op])))) return false;
        }
      } else if (row[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // findMany options shared by every model: where, orderBy, take, select.
  function query(rows, { where, orderBy, take, select } = {}) {
    let out = sortBy(rows.filter((r) => matchesWhere(r, where)), orderBy ?? []);
    if (take !== undefined) out = out.slice(0, take);
    return select ? out.map((r) => pick(r, select)) : out;
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

  // Prisma groupBy: one group per distinct `by` tuple among the matching rows (null is a group of its own).
  // _sum.<field> is null when the group has no non-null values, like SQL SUM; _count._all counts rows.
  function groupBy(rows, { by, where, _sum, _count }) {
    const groups = new Map();
    for (const row of rows.filter((r) => matchesWhere(r, where))) {
      const key = JSON.stringify(by.map((f) => row[f] ?? null));
      if (!groups.has(key)) groups.set(key, { keys: Object.fromEntries(by.map((f) => [f, row[f] ?? null])), rows: [] });
      groups.get(key).rows.push(row);
    }
    return [...groups.values()].map(({ keys, rows: members }) => {
      const out = { ...keys };
      if (_sum) {
        out._sum = Object.fromEntries(
          Object.keys(_sum).map((f) => {
            const values = members.map((r) => r[f]).filter((v) => v !== null && v !== undefined);
            return [f, values.length ? values.reduce((a, b) => a + b, 0) : null];
          }),
        );
      }
      if (_count) out._count = { _all: members.length };
      return out;
    });
  }

  const count = (rows, { where } = {}) => rows.filter((r) => matchesWhere(r, where)).length;

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
    sessions,
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
      async findMany({ where, include, orderBy, take, select }) {
        return query(courses, { where, orderBy, take, select }).map((c) =>
          include?.schedules ? { ...c, schedules: schedules.filter((s) => s.courseId === c.id) } : c,
        );
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
      async findMany({ where, orderBy, take, select }) {
        return query(topics, { where, orderBy, take, select });
      },
      async findFirst({ where, select, orderBy }) {
        const rows = sortBy(topics.filter((t) => matchesWhere(t, where)), orderBy ?? []);
        return pick(rows[0] ?? null, select);
      },
      async create({ data }) {
        const topic = { id: ids.topic++, description: null, status: 'TODO', parentId: null, sourceFile: null, ...data };
        if (
          topics.some(
            (t) =>
              t.courseId === topic.courseId &&
              (t.parentId ?? null) === (topic.parentId ?? null) &&
              t.sortOrder === topic.sortOrder,
          )
        )
          throw uniqueViolation();
        topics.push(topic);
        return topic;
      },
      async createMany({ data }) {
        for (const row of data) await prisma.topic.create({ data: row });
        return { count: data.length };
      },
      async update({ where, data }) {
        const topic = topics.find((t) => matchesWhere(t, where));
        if (!topic) throw recordNotFound();
        Object.assign(topic, data);
        return topic;
      },
      async delete({ where }) {
        const index = topics.findIndex((t) => matchesWhere(t, where));
        if (index === -1) throw recordNotFound();
        return topics.splice(index, 1)[0];
      },
      async deleteMany({ where }) {
        const before = topics.length;
        for (let i = topics.length - 1; i >= 0; i--) {
          if (matchesWhere(topics[i], where)) topics.splice(i, 1);
        }
        return { count: before - topics.length };
      },
      async groupBy(args) {
        return groupBy(topics, args);
      },
    },
    task: {
      async findMany({ where, include, orderBy, take, select }) {
        if (select) return query(tasks, { where, orderBy, take, select });
        return query(tasks, { where, orderBy, take }).map((t) => withTaskInclude(t, include));
      },
      async findFirst({ where, include }) {
        return withTaskInclude(tasks.find((t) => matchesWhere(t, where)) ?? null, include);
      },
      async create({ data, include }) {
        const task = { id: ids.task++, topicId: null, status: 'TODO', createdAt: new Date(), completedAt: null, ...data };
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
      async groupBy(args) {
        return groupBy(tasks, args);
      },
      async count(args) {
        return count(tasks, args);
      },
    },
    studySession: {
      async findMany({ where, orderBy, take, select }) {
        return query(sessions, { where, orderBy, take, select });
      },
      async groupBy(args) {
        return groupBy(sessions, args);
      },
      async count(args) {
        return count(sessions, args);
      },
      async create({ data }) {
        const session = { id: ids.session++, courseId: null, topicId: null, taskId: null, ...data };
        sessions.push(session);
        return session;
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
