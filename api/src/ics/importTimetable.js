const { timeToDb, dateToDb } = require('./time');

// Upserts parsed courses for one user on (user_id, course_key).
// For every course in the file, its previously imported (ics_uid not null)
// schedule slots are replaced, so re-uploading the same file never duplicates.
// If options.replace is true, all existing schedules for this user are cleared first.
// Courses that are not in the file are left untouched.
async function importTimetable(prisma, userId, parsed, options = {}) {
  return prisma.$transaction(
    async (tx) => {
      if (options.replace) {
        await tx.schedule.deleteMany({
          where: { course: { userId } },
        });
      }

      const summary = { coursesCreated: 0, coursesUpdated: 0, schedulesImported: 0, courses: [] };

      // Batch pre-fetch all existing courses for this user matching keys in the file (1 query instead of N).
      const courseKeys = parsed.courses.map((c) => c.key);
      const existingCourses = await tx.course.findMany({
        where: { userId, courseKey: { in: courseKeys } },
      });
      const existingMap = new Map(existingCourses.map((c) => [c.courseKey, c]));

      for (const course of parsed.courses) {
        const existing = existingMap.get(course.key);

        const saved = existing
          ? await tx.course.update({ where: { id: existing.id }, data: { code: course.code, name: course.name } })
          : await tx.course.create({ data: { userId, courseKey: course.key, code: course.code, name: course.name } });
        summary[existing ? 'coursesUpdated' : 'coursesCreated'] += 1;

        // If replace was set, all schedules were already cleared at the top.
        // Otherwise, only delete existing ICS slots for courses that already existed.
        if (!options.replace && existing) {
          await tx.schedule.deleteMany({ where: { courseId: saved.id, icsUid: { not: null }, course: { userId } } });
        }

        if (course.schedules.length > 0) {
          await tx.schedule.createMany({
            data: course.schedules.map((s) => ({
              courseId: saved.id,
              // Non-null marks the slot as ICS-imported, even for a VEVENT without UID.
              icsUid: s.icsUid ?? '',
              dayOfWeek: s.dayOfWeek,
              startTime: timeToDb(s.startTime),
              endTime: timeToDb(s.endTime),
              location: s.location,
              tz: s.tz,
              recurrenceUntil: s.recurrenceUntil ? dateToDb(s.recurrenceUntil) : null,
              intervalWeeks: s.intervalWeeks,
              startsAtUtc: s.startsAtUtc,
              endsAtUtc: s.endsAtUtc,
              exdates: s.exdates,
            })),
          });
          summary.schedulesImported += course.schedules.length;
        }

        summary.courses.push({
          id: saved.id,
          code: saved.code,
          name: saved.name,
          schedules: course.schedules.length,
          status: existing ? 'updated' : 'created',
        });
      }

      return summary;
    },
    { maxWait: 10000, timeout: 30000 },
  );
}

module.exports = { importTimetable };
