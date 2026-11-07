// WBS 3.1.1 — the recommendation score formula, term by term, with a fixed clock.
//
//   score = 10 / (max(days_left, 0) + 0.5) + (topic DOING ? 5 : 2 | none 0) + (overdue ? 3 : 0)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { DAY_MS } = require('../../src/tasks/urgency');
const {
  WEIGHTS,
  effectiveDays,
  deadlineScore,
  topicScore,
  isOverdue,
  overdueScore,
  defaultTopic,
  resolveTopic,
  scoreTask,
  rankTasks,
} = require('../../src/recommend/score');

const NOW = new Date('2026-11-09T09:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const at = (ms) => new Date(NOW.getTime() + ms);

const DOING = { id: 11, title: 'Chapter 1', status: 'DOING', sortOrder: 1, parentId: null };
const TODO = { id: 12, title: 'Chapter 2', status: 'TODO', sortOrder: 2, parentId: null };
const DONE = { id: 13, title: 'Chapter 0', status: 'DONE', sortOrder: 0, parentId: null };

let nextId = 1;
const task = (offsetMs, extra = {}) => ({
  id: nextId++,
  courseId: 1,
  topicId: null,
  dueAt: at(offsetMs),
  status: 'TODO',
  ...extra,
});

describe('eff_days = max(days_left, 0)', () => {
  test('keeps non-negative values', () => {
    assert.equal(effectiveDays(0), 0);
    assert.equal(effectiveDays(1), 1);
    assert.equal(effectiveDays(30), 30);
  });

  test('clamps overdue (negative) days to 0', () => {
    assert.equal(effectiveDays(-1), 0);
    assert.equal(effectiveDays(-30), 0);
  });
});

describe('deadline term = 10 / (eff_days + 0.5)', () => {
  const cases = [
    [0, 20],
    [1, 10 / 1.5],
    [2, 4],
    [4.5, 2],
    [9.5, 1],
  ];
  for (const [days, expected] of cases) {
    test(`eff_days ${days} -> ${expected}`, () => assert.equal(deadlineScore(days), expected));
  }

  test('strictly decreases as the deadline moves away', () => {
    for (let d = 0; d < 60; d++) assert.ok(deadlineScore(d) > deadlineScore(d + 1));
  });
});

describe("topic term = topic.status == 'DOING' ? 5 : 2", () => {
  test('DOING topic -> 5', () => assert.equal(topicScore(DOING), WEIGHTS.TOPIC_DOING));
  test('TODO topic -> 2', () => assert.equal(topicScore(TODO), WEIGHTS.TOPIC_OTHER));
  test('an explicitly linked DONE topic is still a link -> 2', () => assert.equal(topicScore(DONE), 2));
  test('no topic -> 0', () => {
    assert.equal(topicScore(null), 0);
    assert.equal(topicScore(undefined), 0);
  });
});

describe('overdue term = is_overdue ? 3 : 0', () => {
  test('due 1 minute ago is overdue', () => assert.equal(isOverdue(task(-60_000), NOW), true));
  test('due exactly now is not overdue', () => assert.equal(isOverdue(task(0), NOW), false));
  test('due tomorrow is not overdue', () => assert.equal(isOverdue(task(DAY_MS), NOW), false));
  test('a DONE task is never overdue', () => assert.equal(isOverdue(task(-DAY_MS, { status: 'DONE' }), NOW), false));
  test('maps to 3 / 0', () => {
    assert.equal(overdueScore(true), WEIGHTS.OVERDUE_BONUS);
    assert.equal(overdueScore(false), 0);
  });
});

describe('scoreTask', () => {
  test('overdue by 1 day with a DOING topic: 20 + 5 + 3 = 28', () => {
    const result = scoreTask(task(-DAY_MS), { topic: DOING, now: NOW });
    assert.equal(result.score, 28);
    assert.equal(result.daysLeft, -1);
    assert.equal(result.effDays, 0);
    assert.equal(result.isOverdue, true);
    assert.deepEqual(result.breakdown, { baseUrgencyScore: 20, topicDoingBonus: 5, overdueBonus: 3 });
  });

  test('due right now (days_left 0), no topic: 20 + 0 + 0 = 20', () => {
    const result = scoreTask(task(0), { topic: null, now: NOW });
    assert.equal(result.score, 20);
    assert.deepEqual(result.breakdown, { baseUrgencyScore: 20, topicDoingBonus: 0, overdueBonus: 0 });
  });

  test('due in 1 hour already counts as 1 day (ceil): 10 / 1.5 = 6.667', () => {
    assert.equal(scoreTask(task(HOUR), { topic: null, now: NOW }).score, 6.667);
  });

  test('due in 2 days with a TODO topic: 4 + 2 = 6', () => {
    assert.equal(scoreTask(task(2 * DAY_MS), { topic: TODO, now: NOW }).score, 6);
  });

  test('due in 7 days with a DOING topic: 10/7.5 + 5 = 6.333', () => {
    const result = scoreTask(task(7 * DAY_MS), { topic: DOING, now: NOW });
    assert.equal(result.score, 6.333);
    assert.equal(result.breakdown.baseUrgencyScore, 1.333);
  });

  test('due in 30 days, no topic, is worth less than any overdue task', () => {
    const far = scoreTask(task(30 * DAY_MS), { now: NOW }).score;
    const overdue = scoreTask(task(-10 * DAY_MS), { now: NOW }).score;
    assert.ok(far < 1);
    assert.equal(overdue, 23);
  });

  test('an hour into the next day counts as the next day (ceil), like daysLeft', () => {
    // 2 days + 1 hour -> days_left 3 -> 10 / 3.5
    assert.equal(scoreTask(task(2 * DAY_MS + HOUR), { now: NOW }).breakdown.baseUrgencyScore, 2.857);
  });

  test('defaults `now` to the current clock', () => {
    const result = scoreTask({ id: 1, dueAt: new Date(Date.now() - DAY_MS), status: 'TODO' }, { topic: TODO });
    assert.equal(result.score, 25);
  });

  test('throws on an invalid due date instead of scoring NaN', () => {
    assert.throws(() => scoreTask({ id: 1, dueAt: 'nope', status: 'TODO' }, { now: NOW }), TypeError);
  });
});

describe('defaultTopic: smallest sort_order among topics that are not DONE', () => {
  test('skips DONE topics', () => {
    assert.equal(defaultTopic([TODO, DONE, DOING]), DOING);
  });

  test('null when the course has no topics', () => {
    assert.equal(defaultTopic([]), null);
    assert.equal(defaultTopic(), null);
  });

  test('null when every topic is DONE', () => {
    assert.equal(defaultTopic([DONE, { ...TODO, status: 'DONE' }]), null);
  });

  describe('syllabus order: a subtopic sits under its chapter, whatever its own sort_order', () => {
    const ch1 = { id: 1, title: 'Chapter 1', status: 'DONE', sortOrder: 1, parentId: null };
    const ch2 = { id: 2, title: 'Chapter 2', status: 'TODO', sortOrder: 2, parentId: null };
    const sub21 = { id: 3, title: '2.1', status: 'DOING', sortOrder: 1, parentId: 2 };
    const sub22 = { id: 4, title: '2.2', status: 'TODO', sortOrder: 2, parentId: 2 };
    const ch3 = { id: 5, title: 'Chapter 3', status: 'DOING', sortOrder: 3, parentId: null };

    test('chapter 2 (sort_order 2) comes before its subtopic 2.1 (sort_order 1)', () => {
      assert.equal(defaultTopic([sub22, sub21, ch3, ch2, ch1]), ch2);
    });

    test('when chapter 2 is DONE its open subtopic 2.1 is next, before chapter 3', () => {
      assert.equal(defaultTopic([ch1, { ...ch2, status: 'DONE' }, sub21, sub22, ch3]), sub21);
    });

    test('a subtopic whose chapter is not in the list is placed by its own sort_order', () => {
      const orphan = { id: 9, title: 'x', status: 'TODO', sortOrder: 1, parentId: 999 };
      assert.equal(defaultTopic([ch2, orphan]), orphan);
    });

    test('the lower id wins on an identical position', () => {
      const dupB = { id: 30, title: 'B', status: 'TODO', sortOrder: 1, parentId: null };
      const dupA = { id: 25, title: 'A', status: 'TODO', sortOrder: 1, parentId: null };
      assert.equal(defaultTopic([dupB, dupA]), dupA);
    });
  });

  test('does not mutate the input order', () => {
    const list = [TODO, DOING];
    defaultTopic(list);
    assert.deepEqual(list, [TODO, DOING]);
  });
});

describe('resolveTopic', () => {
  test('keeps the task topic when it is loaded on the row', () => {
    assert.deepEqual(resolveTopic(task(0, { topicId: TODO.id, topic: TODO }), [DOING]), { topic: TODO, autoLinked: false });
  });

  test('finds the task topic by id in the course list when the row carries only topicId', () => {
    assert.deepEqual(resolveTopic(task(0, { topicId: TODO.id }), [DOING, TODO]), { topic: TODO, autoLinked: false });
  });

  test('auto-links a task without topic to the course default', () => {
    assert.deepEqual(resolveTopic(task(0), [DONE, TODO, DOING]), { topic: DOING, autoLinked: true });
  });

  test('no candidate -> null and not linked', () => {
    assert.deepEqual(resolveTopic(task(0), []), { topic: null, autoLinked: false });
    assert.deepEqual(resolveTopic(task(0), [DONE]), { topic: null, autoLinked: false });
  });
});

describe('rankTasks', () => {
  test('drops DONE tasks and sorts the rest by score, highest first', () => {
    const done = task(-DAY_MS, { status: 'DONE' });
    const later = task(10 * DAY_MS, { topic: TODO, topicId: TODO.id });
    const overdue = task(-DAY_MS, { topic: TODO, topicId: TODO.id });
    const soon = task(2 * DAY_MS, { topic: DOING, topicId: DOING.id });

    const ranked = rankTasks([done, later, overdue, soon], { now: NOW });

    assert.deepEqual(
      ranked.map((r) => [r.task.id, r.score]),
      [
        [overdue.id, 25],
        [soon.id, 9],
        [later.id, 2.952],
      ],
    );
    assert.ok(ranked.every((r) => r.task.status !== 'DONE'));
  });

  test('auto-links tasks without a topic from topicsByCourse and flags them', () => {
    const linked = task(DAY_MS, { courseId: 1 });
    const noTopics = task(DAY_MS, { courseId: 2 });
    const topicsByCourse = new Map([[1, [DONE, TODO]]]);

    const [first, second] = rankTasks([linked, noTopics], { topicsByCourse, now: NOW });

    assert.equal(first.task, linked);
    assert.equal(first.topic, TODO);
    assert.equal(first.topicAutoLinked, true);
    assert.equal(first.score, 8.667); // 10 / 1.5 + 2

    assert.equal(second.task, noTopics);
    assert.equal(second.topic, null);
    assert.equal(second.topicAutoLinked, false);
    assert.equal(second.score, 6.667); // 10 / 1.5 + 0
  });

  test('accepts a plain object for topicsByCourse', () => {
    const [r] = rankTasks([task(0, { courseId: 7 })], { topicsByCourse: { 7: [DOING] }, now: NOW });
    assert.equal(r.topic, DOING);
    assert.equal(r.score, 25);
  });

  describe('tie-break (WBS 3.1.2): same score -> sooner due_at -> older created_at', () => {
    test('the sooner due_at wins on an equal score', () => {
      const later = task(-DAY_MS, { id: 60, topic: TODO, createdAt: at(-10 * DAY_MS) });
      const sooner = task(-3 * DAY_MS, { id: 50, topic: TODO, createdAt: at(-DAY_MS) });
      const ranked = rankTasks([later, sooner], { now: NOW });
      assert.deepEqual(
        ranked.map((r) => r.task.id),
        [50, 60],
      );
      assert.ok(ranked.every((r) => r.score === 25));
    });

    test('on an equal due_at the task created first wins, whatever its id', () => {
      const newer = task(-DAY_MS, { id: 40, topic: TODO, createdAt: at(-2 * DAY_MS) });
      const older = task(-DAY_MS, { id: 60, topic: TODO, createdAt: at(-9 * DAY_MS) });
      assert.deepEqual(
        rankTasks([newer, older], { now: NOW }).map((r) => r.task.id),
        [60, 40],
      );
    });

    test('identical due_at and created_at fall back to the lower id', () => {
      const a = task(-DAY_MS, { id: 60, topic: TODO, createdAt: NOW });
      const c = task(-DAY_MS, { id: 40, topic: TODO, createdAt: NOW });
      assert.deepEqual(
        rankTasks([a, c], { now: NOW }).map((r) => r.task.id),
        [40, 60],
      );
    });

    test('rows without created_at fall back to the lower id', () => {
      const a = task(-DAY_MS, { id: 60, topic: TODO });
      const c = task(-DAY_MS, { id: 40, topic: TODO });
      assert.deepEqual(
        rankTasks([a, c], { now: NOW }).map((r) => r.task.id),
        [40, 60],
      );
    });
  });

  test('syllabusOrder walks chapters and their subtopics depth-first', () => {
    const { syllabusOrder } = require('../../src/recommend/score');
    const ch1 = { id: 1, sortOrder: 1, parentId: null };
    const ch2 = { id: 2, sortOrder: 2, parentId: null };
    const s11 = { id: 3, sortOrder: 1, parentId: 1 };
    const s12 = { id: 4, sortOrder: 2, parentId: 1 };
    const s21 = { id: 5, sortOrder: 1, parentId: 2 };
    assert.deepEqual(
      syllabusOrder([s21, s12, ch2, s11, ch1]).map((t) => t.id),
      [1, 3, 4, 2, 5],
    );
  });

  test('empty input -> empty ranking', () => {
    assert.deepEqual(rankTasks([], { now: NOW }), []);
  });
});
