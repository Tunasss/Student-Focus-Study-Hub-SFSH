// WBS 3.4 — search-as-you-type suggestions over the user's courses, tasks and topics.
//
// The database does the filtering (`contains`; MySQL utf8mb4_unicode_ci is case- and accent-insensitive,
// so "cau truc" finds "Cấu trúc"). Ranking happens here on folded text, in this order:
//   exact match, label starts with the query, a word starts with the query, contains it anywhere;
// then shorter labels, then courses before tasks before topics, then id.
// Every query is scoped with byUser() / byCourseOwner() (Rule 06).

const { byUser, byCourseOwner } = require('../db/scope');

const SUGGEST_LIMIT = Object.freeze({ default: 8, max: 20 });
// Rows fetched per type before ranking: enough to find good prefix matches, still cheap.
const CANDIDATES_PER_TYPE = 50;
const TYPE_ORDER = { COURSE: 0, TASK: 1, TOPIC: 2 };

// Lower-case, strip Vietnamese / Latin diacritics, collapse spaces.
function fold(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// 0 exact, 1 prefix, 2 word prefix, 3 substring, null no match.
function matchRank(label, foldedQuery) {
  const text = fold(label);
  if (!foldedQuery || !text.includes(foldedQuery)) return null;
  if (text === foldedQuery) return 0;
  if (text.startsWith(foldedQuery)) return 1;
  if (text.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(foldedQuery))) return 2;
  return 3;
}

// Best rank over several labels (a course matches on its name or its code).
function bestRank(labels, foldedQuery) {
  const ranks = labels.map((l) => matchRank(l, foldedQuery)).filter((r) => r !== null);
  return ranks.length ? Math.min(...ranks) : null;
}

function compareSuggestions(a, b) {
  return (
    a.rank - b.rank ||
    a.label.length - b.label.length ||
    TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
    a.id - b.id
  );
}

async function suggest(prisma, userId, { q, limit = SUGGEST_LIMIT.default }) {
  const term = q.trim();
  const foldedQuery = fold(term);
  const contains = { contains: term };

  const [courses, tasks, topics] = await Promise.all([
    prisma.course.findMany({
      where: byUser(userId),
      select: { id: true, code: true, name: true },
    }),
    prisma.task.findMany({
      where: byUser(userId, { title: contains }),
      select: { id: true, title: true, status: true, dueAt: true, courseId: true },
      orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
      take: CANDIDATES_PER_TYPE,
    }),
    prisma.topic.findMany({
      where: byCourseOwner(userId, { title: contains }),
      select: { id: true, title: true, status: true, courseId: true },
      orderBy: [{ courseId: 'asc' }, { id: 'asc' }],
      take: CANDIDATES_PER_TYPE,
    }),
  ]);

  // All courses are loaded (a student has a handful) to label tasks and topics with their course.
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const courseRef = (courseId) => {
    const c = courseById.get(courseId);
    return { courseId, courseCode: c?.code ?? null, courseName: c?.name ?? null };
  };

  const candidates = [
    ...courses.map((c) => ({
      type: 'COURSE',
      id: c.id,
      label: c.name,
      rank: bestRank([c.name, c.code], foldedQuery),
      ...courseRef(c.id),
      status: null,
      dueAt: null,
    })),
    ...tasks.map((t) => ({
      type: 'TASK',
      id: t.id,
      label: t.title,
      rank: matchRank(t.title, foldedQuery),
      ...courseRef(t.courseId),
      status: t.status,
      dueAt: t.dueAt,
    })),
    ...topics.map((t) => ({
      type: 'TOPIC',
      id: t.id,
      label: t.title,
      rank: matchRank(t.title, foldedQuery),
      ...courseRef(t.courseId),
      status: t.status,
      dueAt: null,
    })),
  ];

  return candidates
    .filter((c) => c.rank !== null)
    .sort(compareSuggestions)
    .slice(0, limit)
    // eslint-disable-next-line no-unused-vars
    .map(({ rank, ...suggestion }) => suggestion);
}

module.exports = { SUGGEST_LIMIT, fold, matchRank, suggest };
