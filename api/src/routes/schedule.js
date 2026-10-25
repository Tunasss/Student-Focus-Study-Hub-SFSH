const express = require('express');
const multer = require('multer');
const { ApiError } = require('../errors');
const { requireAuth } = require('../middleware/auth');
const { byCourseOwner } = require('../db/scope');
const { ICS_LIMITS, readIcsUpload, parseTimetable } = require('../ics/parseTimetable');
const { importTimetable } = require('../ics/importTimetable');
const { expandSchedules } = require('../ics/expandSchedule');
const { Temporal, DEFAULT_TZ, isValidTimeZone, zonedToDate } = require('../ics/time');

const MAX_RANGE_DAYS = 62;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ICS_LIMITS.maxBytes, files: 1 },
}).single('file');

// Runs multer and maps its errors to the API error format.
function uploadIcs(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'INVALID_ICS_FORMAT', 'File is larger than 2 MB'));
    }
    return next(new ApiError(400, 'INVALID_ICS_FORMAT', 'Upload a single .ics file in the "file" field'));
  });
}

function parseDisplayTz(value) {
  if (value === undefined) return DEFAULT_TZ;
  if (!isValidTimeZone(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'tz must be an IANA timezone, e.g. Asia/Ho_Chi_Minh');
  }
  return value;
}

function parsePlainDate(value, name) {
  try {
    return Temporal.PlainDate.from(String(value), { overflow: 'reject' });
  } catch {
    throw new ApiError(400, 'VALIDATION_ERROR', `${name} must be a date in YYYY-MM-DD format`);
  }
}

// [from, to) as local dates in tz. Defaults to the current Monday–Sunday week.
function parseRange(query, tz) {
  const today = Temporal.Now.plainDateISO(tz);
  const fromDate = query.from ? parsePlainDate(query.from, 'from') : today.subtract({ days: today.dayOfWeek - 1 });
  const toDate = query.to ? parsePlainDate(query.to, 'to') : fromDate.add({ days: 7 });

  const days = fromDate.until(toDate, { largestUnit: 'day' }).days;
  if (days <= 0) throw new ApiError(400, 'VALIDATION_ERROR', 'to must be after from');
  if (days > MAX_RANGE_DAYS) throw new ApiError(400, 'VALIDATION_ERROR', `Range is limited to ${MAX_RANGE_DAYS} days`);

  return {
    fromDate,
    toDate,
    from: zonedToDate(fromDate, '00:00:00', tz),
    to: zonedToDate(toDate, '00:00:00', tz),
  };
}

function scheduleRouter({ prisma }) {
  const router = express.Router();
  router.use(requireAuth);

  // POST /api/schedule/import  (multipart/form-data, field "file")
  router.post('/import', uploadIcs, async (req, res) => {
    const text = readIcsUpload(req.file);
    const parsed = parseTimetable(text);

    if (parsed.courses.length === 0) {
      throw new ApiError(400, 'INVALID_ICS_FORMAT', 'No importable class events found in the calendar');
    }

    const result = await importTimetable(prisma, req.userId, parsed);
    res.status(201).json({
      eventsRead: parsed.eventCount,
      coursesCreated: result.coursesCreated,
      coursesUpdated: result.coursesUpdated,
      schedulesImported: result.schedulesImported,
      courses: result.courses,
      skipped: parsed.skipped,
    });
  });

  // GET /api/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=Asia/Ho_Chi_Minh
  router.get('/', async (req, res) => {
    const tz = parseDisplayTz(req.query.tz);
    const range = parseRange(req.query, tz);

    const schedules = await prisma.schedule.findMany({
      where: byCourseOwner(req.userId),
      include: { course: { select: { id: true, code: true, name: true } } },
    });

    res.json({
      tz,
      from: range.fromDate.toString(),
      to: range.toDate.toString(),
      events: expandSchedules(schedules, range.from, range.to, tz),
    });
  });

  return router;
}

module.exports = { scheduleRouter };
