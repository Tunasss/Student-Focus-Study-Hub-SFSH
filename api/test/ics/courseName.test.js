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

test('parses Vietnamese university course naming formats (e.g. UIT)', () => {
  const lecture = parseCourseSummary('Các hệ cơ sở dữ liệu phân tán (CS5433.R11.CTTT)');
  assert.equal(lecture.code, 'CS5433');
  assert.equal(lecture.name, 'Các hệ cơ sở dữ liệu phân tán');

  const lab = parseCourseSummary('Các hệ cơ sở dữ liệu phân tán (CS5433.R11.CTTT.1)');
  assert.equal(lab.code, 'CS5433');
  assert.equal(lab.name, 'Các hệ cơ sở dữ liệu phân tán');

  // Both lecture and lab share the exact same course key to merge under one course
  assert.equal(lecture.key, lab.key);
  assert.equal(lecture.key, 'cs5433 các hệ cơ sở dữ liệu phân tán');
});

test('parses leading bracketed course code', () => {
  const res = parseCourseSummary('[CS101] Web Application Development');
  assert.equal(res.code, 'CS101');
  assert.equal(res.name, 'Web Application Development');
  assert.equal(res.key, 'cs101 web application development');
});
