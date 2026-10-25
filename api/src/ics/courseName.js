// Course recognition from a VEVENT SUMMARY.
//
// If SUMMARY starts with a course code (^([A-Z]{2,4}\s?\d{3,4})), it is split
// into code + name; otherwise code is null and the whole SUMMARY is the name.
// Events with the same SUMMARY share one course key (used for upsert).

const COURSE_CODE_RE = /^([A-Z]{2,4}\s?\d{3,4})/;
// Separators commonly found between code and name: "CS101 - Intro", "CS101: Intro", "CS101 | Intro"
const LEADING_SEPARATORS_RE = /^[\s\-–—:|·.]+/;

function normalizeSummary(summary) {
  return String(summary ?? '').replace(/\s+/g, ' ').trim();
}

function courseKeyOf(summary) {
  return normalizeSummary(summary).toLowerCase();
}

function parseCourseSummary(summary) {
  const text = normalizeSummary(summary);
  const match = COURSE_CODE_RE.exec(text);

  if (!match) {
    return { key: courseKeyOf(text), code: null, name: text };
  }

  const code = match[1].replace(/\s/g, '');
  const rest = text.slice(match[0].length).replace(LEADING_SEPARATORS_RE, '').trim();
  return { key: courseKeyOf(text), code, name: rest || code };
}

module.exports = { parseCourseSummary, normalizeSummary, courseKeyOf, COURSE_CODE_RE };
