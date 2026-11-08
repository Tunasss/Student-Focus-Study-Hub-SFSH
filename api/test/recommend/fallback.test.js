// WBS 3.1.2 — empty-state rules: with no open task, suggest a topic of the course with the nearest class.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { timeToDb } = require('../../src/ics/time');
const { nextClassByCourse, pickTopicOfCourse, pickFallbackTopic } = require('../../src/recommend/fallback');

// Monday 2026-11-09 16:00 in Asia/Ho_Chi_Minh.
const NOW = new Date('2026-11-09T09:00:00.000Z');
const TZ = 'Asia/Ho_Chi_Minh';

const courses = [
  { id: 1, code: 'CS101', name: 'Programming' },
  { id: 2, code: 'MATH201', name: 'Calculus' },
  { id: 3, code: 'PHY110', name: 'Physics' },
];

// dayOfWeek: ISO weekday. Start 09:00 local.
function slot(id, courseId, dayOfWeek, extra = {}) {
  return {
    id,
    courseId,
    dayOfWeek,
    startTime: timeToDb('09:00:00'),
    endTime: timeToDb('11:00:00'),
    location: null,
    tz: TZ,
    recurrenceUntil: null,
    intervalWeeks: 1,
    startsAtUtc: null,
    endsAtUtc: null,
    exdates: null,
    course: courses.find((c) => c.id === courseId),
    ...extra,
  };
}

const topic = (id, courseId, sortOrder, status, title = `T${id}`, parentId = null) => ({
  id,
  courseId,
  sortOrder,
  status,
  title,
  parentId,
});

describe('nextClassByCourse', () => {
  test('returns the first upcoming occurrence of each course, skipping classes that already started', () => {
    // CS101 Monday 09:00 already happened today -> next Monday. MATH201 Tuesday -> tomorrow.
    const next = nextClassByCourse([slot(1, 1, 1), slot(2, 2, 2)], NOW, { tz: TZ });
    assert.equal(next.get(1).startUtc, '2026-11-16T02:00:00.000Z');
    assert.equal(next.get(2).startUtc, '2026-11-10T02:00:00.000Z');
    assert.equal(next.get(2).start, '2026-11-10T09:00');
  });

  test('a course with two slots gets its soonest one', () => {
    const next = nextClassByCourse([slot(1, 1, 5), slot(2, 1, 3)], NOW, { tz: TZ });
    assert.equal(next.get(1).startUtc, '2026-11-11T02:00:00.000Z'); // Wednesday
  });

  test('a slot whose recurrence ended is ignored', () => {
    const next = nextClassByCourse([slot(1, 1, 2, { recurrenceUntil: new Date('2026-11-01T00:00:00Z') })], NOW);
    assert.equal(next.size, 0);
  });
});

describe('pickTopicOfCourse: DOING first, else the first TODO, in syllabus order', () => {
  test('prefers a DOING topic even when a TODO one comes earlier', () => {
    const t = pickTopicOfCourse([topic(1, 1, 1, 'TODO'), topic(2, 1, 2, 'DOING'), topic(3, 1, 3, 'DOING')]);
    assert.equal(t.id, 2);
  });

  test('falls back to the first TODO topic in syllabus order', () => {
    const t = pickTopicOfCourse([topic(1, 1, 1, 'DONE'), topic(3, 1, 3, 'TODO'), topic(2, 1, 2, 'TODO')]);
    assert.equal(t.id, 2);
  });

  test('a DOING subtopic under a DONE chapter still wins', () => {
    const t = pickTopicOfCourse([topic(1, 1, 1, 'DONE'), topic(2, 1, 1, 'DOING', '1.1', 1), topic(3, 1, 2, 'TODO')]);
    assert.equal(t.id, 2);
  });

  test('null when every topic is DONE or there is none', () => {
    assert.equal(pickTopicOfCourse([topic(1, 1, 1, 'DONE')]), null);
    assert.equal(pickTopicOfCourse([]), null);
  });
});

describe('pickFallbackTopic', () => {
  const topics = [
    topic(10, 1, 1, 'DOING', 'CS chapter 1'),
    topic(20, 2, 1, 'DONE', 'Calc chapter 1'),
    topic(21, 2, 2, 'TODO', 'Calc chapter 2'),
    topic(30, 3, 1, 'TODO', 'Phy chapter 1'),
  ];

  test('suggests a topic of the course with the nearest class', () => {
    // MATH201 tomorrow (Tuesday), CS101 next Monday, PHY110 Thursday.
    const schedules = [slot(1, 1, 1), slot(2, 2, 2), slot(3, 3, 4)];
    const pick = pickFallbackTopic({ courses, topics, schedules }, { now: NOW, tz: TZ });

    assert.equal(pick.course.id, 2);
    assert.equal(pick.topic.id, 21); // Calc chapter 1 is DONE -> first TODO
    assert.equal(pick.nextClass.startUtc, '2026-11-10T02:00:00.000Z');
    assert.match(pick.reason, /No open task/);
    assert.match(pick.reason, /first TODO topic of Calculus/);
    assert.match(pick.reason, /next class 2026-11-10T09:00/);
  });

  test('skips the nearest course when it has no open topic and takes the next one', () => {
    const schedules = [slot(1, 1, 1), slot(2, 2, 2), slot(3, 3, 4)];
    const onlyDone = topics.map((t) => (t.courseId === 2 ? { ...t, status: 'DONE' } : t));
    const pick = pickFallbackTopic({ courses, topics: onlyDone, schedules }, { now: NOW, tz: TZ });
    assert.equal(pick.course.id, 3); // Thursday beats next Monday
    assert.equal(pick.topic.id, 30);
  });

  test('courses without an upcoming class come after those with one', () => {
    const schedules = [slot(3, 3, 4)]; // only PHY110 is on the timetable
    const pick = pickFallbackTopic({ courses, topics, schedules }, { now: NOW, tz: TZ });
    assert.equal(pick.course.id, 3);
  });

  test('with no timetable at all the lowest course id with an open topic is used, nextClass is null', () => {
    const pick = pickFallbackTopic({ courses, topics, schedules: [] }, { now: NOW, tz: TZ });
    assert.equal(pick.course.id, 1);
    assert.equal(pick.topic.id, 10);
    assert.equal(pick.nextClass, null);
    assert.match(pick.reason, /the topic in progress of Programming, no upcoming class/);
  });

  test('null (empty state) when no course has an open topic, even with a timetable', () => {
    const schedules = [slot(1, 1, 1)];
    assert.equal(pickFallbackTopic({ courses, topics: [], schedules }, { now: NOW, tz: TZ }), null);
    assert.equal(pickFallbackTopic({ courses: [], topics: [], schedules: [] }, { now: NOW }), null);
    const allDone = topics.map((t) => ({ ...t, status: 'DONE' }));
    assert.equal(pickFallbackTopic({ courses, topics: allDone, schedules }, { now: NOW, tz: TZ }), null);
  });
});
