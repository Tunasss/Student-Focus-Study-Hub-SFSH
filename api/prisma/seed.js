// Base seed for development / demo (WBS 1.1).
//
// Creates one demo student with:
//   - 4 courses + weekly schedules (as if imported from an ICS timetable)
//   - 1 course with a 5-chapter syllabus
//   - 2 upcoming deadlines (one within 24h, one within 5 days)
//   - 1 OVERDUE task
//   - 10 Pomodoro sessions spread over the last 7 days
//
// Idempotent: re-running removes the demo user (cascade) and recreates it.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const EMAIL = process.env.SEED_USER_EMAIL || 'student@sfsh.dev';
const PASSWORD = process.env.SEED_USER_PASSWORD || 'Password123!';
const TZ = 'Asia/Ho_Chi_Minh';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Prisma maps @db.Time to a DateTime on 1970-01-01 (UTC).
function time(hhmm) {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

// Courses as they would come out of the ICS import.
const COURSES = [
  {
    code: 'CS101',
    name: 'Introduction to Programming',
    schedules: [
      { dayOfWeek: 1, start: '07:30', end: '09:30', location: 'Room A101' },
      { dayOfWeek: 3, start: '07:30', end: '09:30', location: 'Lab B204' },
    ],
  },
  {
    code: 'MATH201',
    name: 'Calculus II',
    schedules: [
      { dayOfWeek: 2, start: '09:45', end: '11:45', location: 'Room C302' },
      { dayOfWeek: 4, start: '09:45', end: '11:45', location: 'Room C302' },
    ],
  },
  {
    code: 'PHY110',
    name: 'General Physics I',
    schedules: [{ dayOfWeek: 2, start: '13:00', end: '15:30', location: 'Room D105' }],
  },
  {
    code: 'ENG102',
    name: 'Academic English',
    schedules: [{ dayOfWeek: 5, start: '15:45', end: '17:45', location: 'Room E201' }],
  },
];

// Syllabus for CS101, read into a chapter list.
const CS101_SYLLABUS = [
  { title: 'Chapter 1: Variables & Data Types', description: 'Primitive types, operators, input/output.', status: 'DONE' },
  { title: 'Chapter 2: Control Flow', description: 'Conditionals, loops, and boolean logic.', status: 'DONE' },
  { title: 'Chapter 3: Functions', description: 'Parameters, return values, scope, recursion.', status: 'DOING' },
  { title: 'Chapter 4: Arrays & Strings', description: 'Indexing, iteration, common string operations.', status: 'TODO' },
  { title: 'Chapter 5: Intro to Object-Oriented Programming', description: 'Classes, objects, encapsulation.', status: 'TODO' },
];

async function main() {
  const now = new Date();
  // Semester end: ~15 weeks from now.
  const recurrenceUntil = new Date(now.getTime() + 15 * 7 * DAY);

  await prisma.user.deleteMany({ where: { email: EMAIL } });

  const user = await prisma.user.create({
    data: { email: EMAIL, passwordHash: await bcrypt.hash(PASSWORD, 10) },
  });

  const courses = {};
  for (const c of COURSES) {
    courses[c.code] = await prisma.course.create({
      data: {
        userId: user.id,
        code: c.code,
        name: c.name,
        schedules: {
          create: c.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: time(s.start),
            endTime: time(s.end),
            location: s.location,
            tz: TZ,
            recurrenceUntil,
          })),
        },
      },
    });
  }

  const cs101 = courses.CS101;
  await prisma.topic.createMany({
    data: CS101_SYLLABUS.map((t, i) => ({ courseId: cs101.id, sortOrder: i + 1, ...t })),
  });
  const topics = await prisma.topic.findMany({
    where: { courseId: cs101.id, course: { userId: user.id } },
    orderBy: { sortOrder: 'asc' },
  });
  const [ch1, ch2, ch3] = topics;

  const [dueSoon, dueThisWeek, overdue] = await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        courseId: cs101.id,
        topicId: ch3.id,
        title: 'CS101 Lab 3: Functions exercises',
        dueAt: new Date(now.getTime() + 20 * HOUR), // within 24h
        status: 'DOING',
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        courseId: courses.MATH201.id,
        title: 'MATH201 Problem Set 4: Integration techniques',
        dueAt: new Date(now.getTime() + 4 * DAY + 6 * HOUR), // within 5 days
        status: 'TODO',
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        courseId: courses.ENG102.id,
        title: 'ENG102 Essay draft: Argumentative outline',
        dueAt: new Date(now.getTime() - 2 * DAY), // already past
        status: 'OVERDUE',
        createdAt: new Date(now.getTime() - 9 * DAY),
      },
    }),
  ]);

  // 10 Pomodoro sessions across the last 7 days: [daysAgo, hour, minutes, course, topic, task, status]
  const SESSIONS = [
    [6, 20, 25, 'CS101', ch1, null, 'COMPLETED'],
    [6, 21, 25, 'CS101', ch1, null, 'COMPLETED'],
    [5, 19, 25, 'MATH201', null, null, 'COMPLETED'],
    [4, 20, 25, 'CS101', ch2, null, 'COMPLETED'],
    [4, 21, 10, 'PHY110', null, null, 'ABANDONED'],
    [3, 9, 50, 'MATH201', null, dueThisWeek, 'COMPLETED'],
    [2, 15, 25, 'ENG102', null, overdue, 'COMPLETED'],
    [1, 20, 25, 'CS101', ch3, dueSoon, 'COMPLETED'],
    [1, 21, 15, 'CS101', ch3, dueSoon, 'ABANDONED'],
    [0, 8, 25, null, null, null, 'COMPLETED'], // free focus, no course
  ];

  await prisma.studySession.createMany({
    data: SESSIONS.map(([daysAgo, hour, minutes, code, topic, task, status]) => {
      const startedAt = new Date(now.getTime() - daysAgo * DAY);
      startedAt.setHours(hour, 0, 0, 0);
      // Keep "today" sessions in the past.
      if (startedAt > now) startedAt.setTime(now.getTime() - (minutes + 5) * 60 * 1000);
      return {
        userId: user.id,
        courseId: code ? courses[code].id : null,
        topicId: topic ? topic.id : null,
        taskId: task ? task.id : null,
        startedAt,
        minutes,
        status,
      };
    }),
  });

  const counts = {
    courses: await prisma.course.count({ where: { userId: user.id } }),
    schedules: await prisma.schedule.count({ where: { course: { userId: user.id } } }),
    topics: await prisma.topic.count({ where: { course: { userId: user.id } } }),
    tasks: await prisma.task.count({ where: { userId: user.id } }),
    sessions: await prisma.studySession.count({ where: { userId: user.id } }),
  };

  console.log(`Seeded demo user ${EMAIL} / ${PASSWORD}`);
  console.table(counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
