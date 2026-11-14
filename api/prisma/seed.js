// Base seed for development / demo (WBS 1.1).
//
// Creates one demo student with:
//   - 4 courses + weekly schedules, imported from an .ics timetable through the
//     real ICS ingestion code (prisma/fixtures/demoTimetable.js)
//   - Hierarchical syllabus topics with sub-chapters for courses
//   - 2 upcoming deadlines (one within 24h, one within 5 days)
//   - 1 OVERDUE task
//   - 2 DONE tasks with completed_at (analytics, WBS 3.4)
//   - 10 Pomodoro sessions spread over the last 7 days
//
// Idempotent: re-running removes the demo user (cascade) and recreates it.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { parseTimetable } = require('../src/ics/parseTimetable');
const { importTimetable } = require('../src/ics/importTimetable');
const { buildDemoIcs } = require('./fixtures/demoTimetable');

const EMAIL = process.env.SEED_USER_EMAIL || 'student@sfsh.dev';
const PASSWORD = process.env.SEED_USER_PASSWORD || 'Password123!';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Syllabus for CS101, structured with chapters and subtopics
const CS101_SYLLABUS = [
  {
    title: 'Chapter 1: Variables & Data Types',
    description: 'Primitive types, operators, input/output.',
    status: 'DONE',
    subtopics: [
      { title: '1.1 Primitive Types & Memory Allocation', description: 'Integers, floating-point numbers, characters, and boolean representation.', status: 'DONE' },
      { title: '1.2 Arithmetic & Relational Operators', description: 'Operator precedence, integer division, and logical expressions.', status: 'DONE' },
      { title: '1.3 Standard Input/Output Streams', description: 'Console stream reading, formatted output, and escape sequences.', status: 'DONE' },
      { title: '1.4 Type Casting & Variable Scope', description: 'Implicit/explicit casting, block scope, and lifetime of identifiers.', status: 'DONE' },
    ],
  },
  {
    title: 'Chapter 2: Control Flow',
    description: 'Conditionals, loops, and boolean logic.',
    status: 'DONE',
    subtopics: [
      { title: '2.1 Conditional Branching (if, else-if, switch)', description: 'Multi-branch decision logic and fall-through switch cases.', status: 'DONE' },
      { title: '2.2 Iteration Loops (for, while, do-while)', description: 'Loop counters, condition checking, and indefinite iteration.', status: 'DONE' },
      { title: '2.3 Jump Statements (break, continue, return)', description: 'Early loop termination, skipping iterations, and structured exits.', status: 'DONE' },
      { title: '2.4 Nested Loops & Algorithmic Patterns', description: '2D matrix traversal and tabular display generation.', status: 'DONE' },
    ],
  },
  {
    title: 'Chapter 3: Functions',
    description: 'Parameters, return values, scope, recursion.',
    status: 'DOING',
    subtopics: [
      { title: '3.1 Function Declarations & Signatures', description: 'Prototypes, parameter lists, return types, and invocation.', status: 'DONE' },
      { title: '3.2 Pass-by-Value vs Pass-by-Reference', description: 'Parameter copying, reference variables, and memory mutations.', status: 'DONE' },
      { title: '3.3 Call Stack & Recursion Basics', description: 'Activation stack frames, base cases, and recursive formulation.', status: 'DOING' },
      { title: '3.4 Function Overloading & Default Arguments', description: 'Signatures matching and optional parameter handling.', status: 'TODO' },
    ],
  },
  {
    title: 'Chapter 4: Arrays & Strings',
    description: 'Indexing, iteration, common string operations.',
    status: 'TODO',
    subtopics: [
      { title: '4.1 Fixed-size Arrays & Memory Layout', description: 'Contiguous element storage, zero-based indexing, and bounds checking.', status: 'TODO' },
      { title: '4.2 Array Traversal & Linear Search', description: 'Iterative element inspection, finding min/max, and accumulation.', status: 'TODO' },
      { title: '4.3 C-Strings & String Manipulation', description: 'Null-terminated character arrays, length, copying, and comparison.', status: 'TODO' },
      { title: '4.4 Multi-dimensional Arrays & Matrices', description: 'Row-major storage, grid manipulation, and coordinate traversal.', status: 'TODO' },
    ],
  },
  {
    title: 'Chapter 5: Intro to Object-Oriented Programming',
    description: 'Classes, objects, encapsulation.',
    status: 'TODO',
    subtopics: [
      { title: '5.1 Classes, Objects & Member Variables', description: 'Defining data attributes, instantiating objects, and member access.', status: 'TODO' },
      { title: '5.2 Constructors & Destructors', description: 'Object initialization, parameter assignment, and memory release.', status: 'TODO' },
      { title: '5.3 Encapsulation & Access Modifiers', description: 'Public, private, and protected visibility with getter/setter methods.', status: 'TODO' },
      { title: '5.4 Member Methods & Class Abstraction', description: 'Separating interface specifications from concrete implementation.', status: 'TODO' },
    ],
  },
];

const MATH201_SYLLABUS = [
  {
    title: 'Chapter 1: Limits & Continuity',
    description: 'Definition of limits, one-sided limits, continuity, and intermediate value theorem.',
    status: 'DONE',
    subtopics: [
      { title: '1.1 Intuitive & Formal Definition of Limits', description: 'Epsilon-delta definition and graphical interpretations.', status: 'DONE' },
      { title: '1.2 Limit Laws & Algebraic Techniques', description: 'Evaluating indeterminate forms, rationalization, and factoring.', status: 'DONE' },
      { title: '1.3 Continuity & Asymptotes', description: 'Continuity over intervals and vertical/horizontal asymptotes.', status: 'DONE' },
    ],
  },
  {
    title: 'Chapter 2: Differentiation & Derivative Rules',
    description: 'Definition of derivatives, product rule, quotient rule, and chain rule.',
    status: 'DONE',
    subtopics: [
      { title: '2.1 Tangent Lines & Rate of Change', description: 'Difference quotients and instantaneous velocity.', status: 'DONE' },
      { title: '2.2 Product, Quotient & Chain Rules', description: 'Differentiating composite and rational functions.', status: 'DONE' },
      { title: '2.3 Implicit Differentiation & Related Rates', description: 'Differentiating equations with mixed variables.', status: 'DONE' },
    ],
  },
  {
    title: 'Chapter 3: Integration Techniques',
    description: 'Definite integrals, substitution, integration by parts, and trigonometric substitution.',
    status: 'DOING',
    subtopics: [
      { title: '3.1 Antiderivatives & Substitution Rule', description: 'U-substitution and fundamental theorem of calculus.', status: 'DONE' },
      { title: '3.2 Integration by Parts', description: 'Tabular integration and algebraic-trigonometric products.', status: 'DOING' },
      { title: '3.3 Partial Fraction Decomposition', description: 'Integrating rational functions and repeated linear factors.', status: 'TODO' },
    ],
  },
  {
    title: 'Chapter 4: Applications of Integrals',
    description: 'Area between curves, volumes of revolution, and arc length.',
    status: 'TODO',
    subtopics: [
      { title: '4.1 Area Between Curves', description: 'Horizontal and vertical slicing techniques.', status: 'TODO' },
      { title: '4.2 Volumes of Revolution (Disk & Washer)', description: 'Rotating regions about coordinate axes.', status: 'TODO' },
      { title: '4.3 Cylindrical Shells Method', description: 'Alternative integration for rotated volumes.', status: 'TODO' },
    ],
  },
];

async function seedCourseSyllabus(prismaClient, courseId, syllabus) {
  const createdChapters = [];
  for (let i = 0; i < syllabus.length; i++) {
    const ch = syllabus[i];
    const createdChapter = await prismaClient.topic.create({
      data: {
        courseId,
        parentId: null,
        sortOrder: i + 1,
        title: ch.title,
        description: ch.description ?? null,
        status: ch.status ?? 'TODO',
      },
    });
    createdChapters.push(createdChapter);

    if (Array.isArray(ch.subtopics) && ch.subtopics.length > 0) {
      await prismaClient.topic.createMany({
        data: ch.subtopics.map((sub, j) => ({
          courseId,
          parentId: createdChapter.id,
          sortOrder: j + 1,
          title: sub.title,
          description: sub.description ?? null,
          status: sub.status ?? 'TODO',
        })),
      });
    }
  }
  return createdChapters;
}

async function seedDemoUser(prismaClient, { email = EMAIL, password = PASSWORD } = {}) {
  const now = new Date();

  await prismaClient.user.deleteMany({ where: { email } });

  const user = await prismaClient.user.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10) },
  });

  await importTimetable(prismaClient, user.id, parseTimetable(buildDemoIcs(now)));
  const courses = Object.fromEntries(
    (await prismaClient.course.findMany({ where: { userId: user.id } })).map((c) => [c.code, c]),
  );

  const cs101 = courses.CS101;
  const cs101Chapters = await seedCourseSyllabus(prismaClient, cs101.id, CS101_SYLLABUS);
  const [ch1, ch2, ch3] = cs101Chapters;

  if (courses.MATH201) {
    await seedCourseSyllabus(prismaClient, courses.MATH201.id, MATH201_SYLLABUS);
  }

  const [dueSoon, dueThisWeek, overdue] = await Promise.all([
    prismaClient.task.create({
      data: {
        userId: user.id,
        courseId: cs101.id,
        topicId: ch3.id,
        title: 'CS101 Lab 3: Functions exercises',
        dueAt: new Date(now.getTime() + 20 * HOUR), // within 24h
        status: 'DOING',
      },
    }),
    prismaClient.task.create({
      data: {
        userId: user.id,
        courseId: courses.MATH201.id,
        title: 'MATH201 Problem Set 4: Integration techniques',
        dueAt: new Date(now.getTime() + 4 * DAY + 6 * HOUR), // within 5 days
        status: 'TODO',
      },
    }),
    prismaClient.task.create({
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

  // 2 finished tasks with a completion time, for the WBS 3.4 analytics (completed tasks per day).
  await prismaClient.task.createMany({
    data: [
      {
        userId: user.id,
        courseId: cs101.id,
        topicId: ch1.id,
        title: 'CS101 Lab 1: Hello, variables',
        dueAt: new Date(now.getTime() - 5 * DAY),
        status: 'DONE',
        createdAt: new Date(now.getTime() - 12 * DAY),
        completedAt: new Date(now.getTime() - 6 * DAY),
      },
      {
        userId: user.id,
        courseId: cs101.id,
        topicId: ch2.id,
        title: 'CS101 Lab 2: Loops',
        dueAt: new Date(now.getTime() - 1 * DAY),
        status: 'DONE',
        createdAt: new Date(now.getTime() - 8 * DAY),
        completedAt: new Date(now.getTime() - 2 * DAY),
      },
    ],
  });

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

  await prismaClient.studySession.createMany({
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
    courses: await prismaClient.course.count({ where: { userId: user.id } }),
    schedules: await prismaClient.schedule.count({ where: { course: { userId: user.id } } }),
    topics: await prismaClient.topic.count({ where: { course: { userId: user.id } } }),
    subtopics: await prismaClient.topic.count({ where: { course: { userId: user.id }, parentId: { not: null } } }),
    tasks: await prismaClient.task.count({ where: { userId: user.id } }),
    sessions: await prismaClient.studySession.count({ where: { userId: user.id } }),
  };

  return { user, counts };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const { counts } = await seedDemoUser(prisma);
    console.log(`Seeded demo user ${EMAIL} / ${PASSWORD}`);
    console.table(counts);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { seedDemoUser, CS101_SYLLABUS, MATH201_SYLLABUS };
