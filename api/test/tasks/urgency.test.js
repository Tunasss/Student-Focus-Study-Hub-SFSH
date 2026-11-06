// WBS 2.4a.4 — days_left and urgency_badge at the PRD milestones: 0, 2, 3, 7, 8 days and overdue.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { daysLeft, urgencyBadge, urgencyOf, DAY_MS } = require('../../src/tasks/urgency');
const { serializeTask } = require('../../src/tasks/serialize');

// Fixed clock so the tests never depend on when they run.
const NOW = new Date('2026-11-09T09:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const at = (ms) => new Date(NOW.getTime() + ms);
const badge = (ms, status = 'TODO') => urgencyBadge({ dueAt: at(ms), status }, NOW);

describe('daysLeft = ceil((dueAt - now) / 24h)', () => {
  const cases = [
    ['due exactly now', 0, 0],
    ['due in 1 hour (same day)', 1 * HOUR, 1],
    ['due in exactly 2 days', 2 * DAY_MS, 2],
    ['due in 2 days + 1 hour rounds up to 3', 2 * DAY_MS + HOUR, 3],
    ['due in exactly 3 days', 3 * DAY_MS, 3],
    ['due in exactly 7 days', 7 * DAY_MS, 7],
    ['due in 7 days + 1 minute rounds up to 8', 7 * DAY_MS + 60_000, 8],
    ['due in exactly 8 days', 8 * DAY_MS, 8],
    ['overdue by 1 hour is 0, not -0', -1 * HOUR, 0],
    ['overdue by 36 hours is -1', -36 * HOUR, -1],
    ['overdue by exactly 2 days is -2', -2 * DAY_MS, -2],
  ];

  for (const [name, offset, expected] of cases) {
    test(name, () => {
      const result = daysLeft(at(offset), NOW);
      assert.equal(result, expected);
      assert.ok(!Object.is(result, -0), 'must never return -0');
    });
  }

  test('accepts ISO strings as well as Date objects', () => {
    assert.equal(daysLeft('2026-11-11T09:00:00.000Z', '2026-11-09T09:00:00.000Z'), 2);
  });

  test('throws on an invalid date instead of returning NaN', () => {
    assert.throws(() => daysLeft('not-a-date', NOW), TypeError);
  });
});

describe('urgencyBadge', () => {
  describe('OVERDUE: dueAt < now and status != DONE', () => {
    test('overdue by 1 minute', () => assert.equal(badge(-60_000), 'OVERDUE'));
    test('overdue by 2 days', () => assert.equal(badge(-2 * DAY_MS), 'OVERDUE'));
    test('overdue DOING task is still OVERDUE', () => assert.equal(badge(-DAY_MS, 'DOING'), 'OVERDUE'));
    test('overdue task already marked OVERDUE in the DB', () => assert.equal(badge(-DAY_MS, 'OVERDUE'), 'OVERDUE'));
    test('overdue but DONE is not flagged', () => assert.equal(badge(-DAY_MS, 'DONE'), null));
    test('due exactly now is not overdue (dueAt is not < now)', () => assert.equal(badge(0), 'URGENT'));
  });

  describe('URGENT: daysLeft < 3', () => {
    test('0 days (due later today)', () => assert.equal(badge(0), 'URGENT'));
    test('1 day', () => assert.equal(badge(1 * DAY_MS), 'URGENT'));
    test('2 days', () => assert.equal(badge(2 * DAY_MS), 'URGENT'));
    test('2 days 23 hours rounds up to 3 -> SOON, not URGENT', () => assert.equal(badge(2 * DAY_MS + 23 * HOUR), 'SOON'));
  });

  describe('SOON: 3 <= daysLeft <= 7', () => {
    test('3 days (lower bound, inclusive)', () => assert.equal(badge(3 * DAY_MS), 'SOON'));
    test('5 days', () => assert.equal(badge(5 * DAY_MS), 'SOON'));
    test('7 days (upper bound, inclusive)', () => assert.equal(badge(7 * DAY_MS), 'SOON'));
  });

  describe('LATER: daysLeft > 7', () => {
    test('7 days + 1 hour rounds up to 8', () => assert.equal(badge(7 * DAY_MS + HOUR), 'LATER'));
    test('8 days', () => assert.equal(badge(8 * DAY_MS), 'LATER'));
    test('30 days', () => assert.equal(badge(30 * DAY_MS), 'LATER'));
  });

  test('DONE tasks never get a badge, whatever the deadline', () => {
    for (const offset of [-DAY_MS, 0, 2 * DAY_MS, 5 * DAY_MS, 10 * DAY_MS]) {
      assert.equal(badge(offset, 'DONE'), null);
    }
  });

  test('defaults `now` to the current time', () => {
    assert.equal(urgencyBadge({ dueAt: new Date(Date.now() + 30 * DAY_MS), status: 'TODO' }), 'LATER');
    assert.equal(urgencyBadge({ dueAt: new Date(Date.now() - DAY_MS), status: 'TODO' }), 'OVERDUE');
  });
});

describe('urgencyOf / serializeTask', () => {
  test('urgencyOf returns both computed fields', () => {
    assert.deepEqual(urgencyOf({ dueAt: at(2 * DAY_MS), status: 'TODO' }, NOW), { daysLeft: 2, urgencyBadge: 'URGENT' });
    assert.deepEqual(urgencyOf({ dueAt: at(-DAY_MS), status: 'DONE' }, NOW), { daysLeft: -1, urgencyBadge: null });
  });

  test('serializeTask adds daysLeft and urgencyBadge to the task JSON', () => {
    const task = {
      id: 1,
      title: 'Lab',
      dueAt: at(8 * DAY_MS),
      status: 'TODO',
      courseId: 2,
      topicId: null,
      course: { id: 2, code: 'CS101', name: 'Programming' },
      topic: null,
      createdAt: NOW,
      userId: 99, // must not be exposed
    };
    const json = serializeTask(task, NOW);
    assert.equal(json.daysLeft, 8);
    assert.equal(json.urgencyBadge, 'LATER');
    assert.equal(json.userId, undefined);
  });
});
