const { timeToDb, dateToDb } = require('./time');

// Upserts parsed courses for one user on (user_id, course_key).
// For every course in the file, its previously imported (ics_uid not null)
// schedule slots are replaced, so re-uploading the same file never duplicates.
// Courses that are not in the file are left untouched.
async function importTimetable(prisma, userId, parsed) {
  return prisma.$transaction(async (tx) => {
    const summary = { coursesCreated: 0, coursesUpdated: 0, schedulesImported: 0, courses: [] };

    for (const course of parsed.courses) {
      const existing = await tx.course.findFirst({ where: { userId, courseKey: course.key } });

      const saved = existing
        ? await tx.course.update({ where: { id: existing.id }, data: { code: course.code, name: course.name } })
        : await tx.course.create({ data: { userId, courseKey: course.key, code: course.code, name: course.name } });
      summary[existing ? 'coursesUpdated' : 'coursesCreated'] += 1;

      await tx.schedule.deleteMany({ where: { courseId: saved.id, icsUid: { not: null }, course: { userId } } });
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

      summary.courses.push({
        id: saved.id,
        code: saved.code,
        name: saved.name,
        schedules: course.schedules.length,
        status: existing ? 'updated' : 'created',
      });
    }

    return summary;
  });
}

module.exports = { importTimetable };
