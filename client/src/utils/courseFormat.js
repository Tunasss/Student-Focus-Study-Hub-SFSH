export function formatCourseInfo(course) {
  if (!course) return { code: 'COURSE', name: 'Course' };
  if (course.code) return { code: course.code, name: course.name };
  const parenMatch = course.name?.match(/\(([^()]+)\)$/);
  const code = parenMatch ? parenMatch[1] : '';
  const cleanName = parenMatch ? course.name.replace(/\s*\([^()]+\)$/, '').trim() : course.name;
  return { code: code || 'COURSE', name: cleanName };
}
