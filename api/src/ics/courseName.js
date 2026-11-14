// Course recognition from a VEVENT SUMMARY.
//
// Recognizes common university calendar naming conventions:
// 1. Leading code: "CS101 Introduction to Programming", "MATH 201 - Calculus II", "PHY110"
// 2. Bracketed code: "[CS101] Web Dev", "(CS101) Web Dev"
// 3. Trailing parenthesized code (e.g. UIT / VN portals):
//    "Các hệ cơ sở dữ liệu phân tán (CS5433.R11.CTTT)" -> code: CS5433, name: Các hệ cơ sở dữ liệu phân tán
//    "Các hệ cơ sở dữ liệu phân tán (CS5433.R11.CTTT.1)" -> same code & name (merges theory & lab into one course)
//
// If no code is matched, code is null and the whole SUMMARY is the name.

const COURSE_CODE_RE = /^([A-Z]{2,4}\s?\d{3,4})/;
const LEADING_BRACKET_RE = /^[[()]([A-Z]{2,4}\s?\d{3,4})[\])]\s*[:\-–—|·.]?\s*(.+)$/;
const TRAILING_PAREN_RE = /^(.+?)\s*[[(](([A-Z]{2,4}\s?\d{3,4})(?:[.\-_/][^\])]*)?)[\])]$/;
const LEADING_SEPARATORS_RE = /^[\s\-–—:|·.]+/;

function normalizeSummary(summary) {
  return String(summary ?? '').replace(/\s+/g, ' ').trim();
}

function courseKeyOf(summary) {
  return normalizeSummary(summary).toLowerCase();
}

function parseCourseSummary(summary) {
  const text = normalizeSummary(summary);

  // 1. Check bracketed/parenthesized code at the start: [CS101] Web Dev or (CS101) Web Dev
  const bracketMatch = LEADING_BRACKET_RE.exec(text);
  if (bracketMatch) {
    const code = bracketMatch[1].replace(/\s/g, '');
    const name = bracketMatch[2].trim();
    const key = courseKeyOf(`${code} ${name}`);
    return { key, code, name: name || code };
  }

  // 2. Check course code in parentheses/brackets at the end: Web Dev (CS101.N11.1)
  const trailingMatch = TRAILING_PAREN_RE.exec(text);
  if (trailingMatch) {
    const name = trailingMatch[1].trim();
    const code = trailingMatch[3].replace(/\s/g, '');
    const key = courseKeyOf(`${code} ${name}`);
    return { key, code, name: name || code };
  }

  // 3. Check leading course code: CS101 - Web Dev, CS101 Web Dev, PHY110
  const match = COURSE_CODE_RE.exec(text);
  if (!match) {
    return { key: courseKeyOf(text), code: null, name: text };
  }

  const code = match[1].replace(/\s/g, '');
  const rest = text.slice(match[0].length).replace(LEADING_SEPARATORS_RE, '').trim();
  const name = rest || code;
  const key = name === code ? courseKeyOf(code) : courseKeyOf(text);
  return { key, code, name };
}

module.exports = { parseCourseSummary, normalizeSummary, courseKeyOf, COURSE_CODE_RE };
