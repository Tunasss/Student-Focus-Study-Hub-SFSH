const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseCourseSummary } = require('../../src/ics/courseName');

test('splits a leading course code from the name', () => {
  assert.deepEqual(parseCourseSummary('CS101 Introduction to Programming'), {
    key: 'cs101 introduction to programming',
    code: 'CS101',
    name: 'Introduction to Programming',
  });
});

test('accepts a space inside the code and strips separators', () => {
  assert.equal(parseCourseSummary('MATH 201 - Calculus II').code, 'MATH201');
  assert.equal(parseCourseSummary('MATH 201 - Calculus II').name, 'Calculus II');
  assert.equal(parseCourseSummary('ENG102: Academic English').name, 'Academic English');
  assert.equal(parseCourseSummary('IT3090 | Database').code, 'IT3090');
});

test('uses the code as name when SUMMARY is only a code', () => {
  assert.deepEqual(parseCourseSummary('PHY110'), { key: 'phy110', code: 'PHY110', name: 'PHY110' });
});

test('code is null when SUMMARY does not start with a course code', () => {
  assert.deepEqual(parseCourseSummary('Câu lạc bộ Robotics'), {
    key: 'câu lạc bộ robotics',
    code: null,
    name: 'Câu lạc bộ Robotics',
  });
  assert.equal(parseCourseSummary('cs101 lower case').code, null);
  assert.equal(parseCourseSummary('A101 one letter').code, null);
  assert.equal(parseCourseSummary('ABCDE101 five letters').code, null);
});

test('identical SUMMARY values share one course key', () => {
  assert.equal(
    parseCourseSummary('  CS101   Introduction to Programming ').key,
    parseCourseSummary('CS101 Introduction to Programming').key,
  );
});
