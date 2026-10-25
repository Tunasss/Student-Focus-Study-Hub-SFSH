const { test } = require('node:test');
const assert = require('node:assert/strict');
const { byUser, byCourseOwner } = require('../src/db/scope');

test('byUser adds userId to the where clause', () => {
  assert.deepEqual(byUser(7, { status: 'TODO' }), { status: 'TODO', userId: 7 });
});

test('byCourseOwner scopes through the parent course', () => {
  assert.deepEqual(byCourseOwner(7, { courseId: 3 }), { courseId: 3, course: { userId: 7 } });
});

test('scope helpers throw without a valid userId (Rule 06)', () => {
  assert.throws(() => byUser(undefined), /Rule 06/);
  assert.throws(() => byCourseOwner(0), /Rule 06/);
});
