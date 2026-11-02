/**
 * Utilities for formatting and normalizing course codes and titles in Syllabus module.
 * University timetable systems (such as UIT / VNU) often generate distinct entries for:
 *   - Theory class (Lý thuyết): e.g. "MSIS4263.R11.CTTT"
 *   - Practice / Lab class (Thực hành): e.g. "MSIS4263.R11.CTTT.1", "MSIS4263.R11.CTTT.2", "CS101.TH"
 *
 * For the Syllabus curriculum and mastery tracking, students learn the unified subject.
 * These helpers normalize and deduplicate course entries so only the primary theory course is presented.
 */

const PRACTICE_CODE_SUFFIX_RE = /[._](?:\d+|TH\d*|th\d*)$/i;
const PRACTICE_TITLE_TAG_RE = /\s*(?:[-–]\s*|\(\s*|\[\s*)(?:Thực hành|thực hành|TH\d*|Lab)\s*[)\]]?\s*$/i;

/**
 * Strips practice group suffix (.1, .2, .TH) to get the base theory course code.
 * Example:
 *   "MSIS4263.R11.CTTT.1" -> "MSIS4263.R11.CTTT"
 *   "CS101.N11.2"         -> "CS101.N11"
 *   "IT001.TH"            -> "IT001"
 *   "MSIS4263.R11.CTTT"   -> "MSIS4263.R11.CTTT"
 */
export function getBaseTheoryCourseCode(rawCode) {
  if (!rawCode) return '';
  return String(rawCode).replace(PRACTICE_CODE_SUFFIX_RE, '').trim();
}

/**
 * Checks whether a course represents a lab/practice class.
 */
export function isPracticeCourse(course) {
  if (!course) return false;
  const rawCode = String(course.code || '');
  const rawName = String(course.name || '');

  if (PRACTICE_CODE_SUFFIX_RE.test(rawCode)) return true;

  const parenMatch = rawName.match(/\(([^()]+)\)$/);
  if (parenMatch && PRACTICE_CODE_SUFFIX_RE.test(parenMatch[1])) return true;

  if (PRACTICE_TITLE_TAG_RE.test(rawName)) return true;

  return false;
}

/**
 * Cleans practice keywords from course title:
 * e.g. "Các ứng dụng thông minh (Thực hành)" -> "Các ứng dụng thông minh"
 */
export function cleanTheoryCourseName(rawName) {
  if (!rawName) return '';
  return String(rawName).replace(PRACTICE_TITLE_TAG_RE, '').trim();
}

/**
 * Formats a course into a clean code and name, normalizing lab codes to theory base codes.
 */
export function formatCourseInfo(course) {
  if (!course) return { code: 'COURSE', name: 'Course' };

  let rawCode = course.code || '';
  let cleanName = course.name || '';

  if (!rawCode && course.name) {
    const parenMatch = course.name.match(/\(([^()]+)\)$/);
    if (parenMatch) {
      rawCode = parenMatch[1];
      cleanName = course.name.replace(/\s*\([^()]+\)$/, '').trim();
    }
  }

  const baseCode = getBaseTheoryCourseCode(rawCode);
  const normalizedName = cleanTheoryCourseName(cleanName);

  return {
    code: baseCode || rawCode || 'COURSE',
    name: normalizedName || cleanName || 'Course',
  };
}

/**
 * Deduplicates enrolled courses for the Syllabus module:
 * When both theory (e.g. MSIS4263.R11.CTTT) and practice (.1, .2) classes exist,
 * only the theory class is kept. If only a practice class exists, its code/title
 * is normalized to the base theory course.
 */
export function deduplicateSyllabusCourses(courses = []) {
  if (!Array.isArray(courses)) return [];

  const courseMap = new Map();

  for (const course of courses) {
    const info = formatCourseInfo(course);
    const key = (info.code ? info.code : info.name).toLowerCase();
    const isPractice = isPracticeCourse(course);

    if (!courseMap.has(key)) {
      courseMap.set(key, {
        ...course,
        code: info.code,
        name: info.name,
        _isPractice: isPractice,
      });
    } else {
      // If we already have an entry and the current one is the genuine theory class, prefer it
      const existing = courseMap.get(key);
      if (existing._isPractice && !isPractice) {
        courseMap.set(key, {
          ...course,
          code: info.code,
          name: info.name,
          _isPractice: false,
        });
      }
    }
  }

  return Array.from(courseMap.values()).map(({ _isPractice, ...course }) => course);
}
