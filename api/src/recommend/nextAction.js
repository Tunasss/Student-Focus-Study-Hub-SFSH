// WBS 3.1.3 — "What should I do next?" for GET /api/recommendation/next-action.
//
//   kind = TASK  : the highest-scored open task (score.js), with the score breakdown that explains it
//   kind = TOPIC : no open task -> a topic of the course with the nearest class (fallback.js)
//   kind = EMPTY : nothing to suggest (no task, no topic, no timetable)
//
// The JSON always has the same keys so the client can switch on `kind` without optional chaining.
// PRD names: due_at, score_breakdown { base_urgency_score, topic_doing_bonus, overdue_bonus }; the JSON uses
// the API's camelCase spelling like every other endpoint.

const { scoreUserTasks } = require('./recommendRepo');
const { loadFallbackTopic } = require('./fallback');
const { serializeTask } = require('../tasks/serialize');
const { DEFAULT_TZ } = require('../ics/time');

const KIND = Object.freeze({ TASK: 'TASK', TOPIC: 'TOPIC', EMPTY: 'EMPTY' });

const EMPTY_REASON = 'Nothing to do yet: add a course, import your timetable or save syllabus topics, then add tasks.';

function describeDeadline(ranked) {
  const { daysLeft, isOverdue } = ranked;
  if (isOverdue) return `overdue by ${Math.abs(daysLeft)} day(s)`;
  if (daysLeft <= 0) return 'due today';
  return `due in ${daysLeft} day(s)`;
}

// One sentence a demo audience can follow: which terms made the score.
function explainTask(ranked, openTaskCount) {
  const { breakdown, topic, topicAutoLinked } = ranked;
  const parts = [`${describeDeadline(ranked)} (+${breakdown.baseUrgencyScore})`];
  if (topic) {
    const link = topicAutoLinked ? 'auto-linked to' : 'on';
    const state = topic.status === 'DOING' ? 'in progress' : topic.status.toLowerCase();
    parts.push(`${link} "${topic.title}", ${state} (+${breakdown.topicDoingBonus})`);
  } else {
    parts.push('no topic to link (+0)');
  }
  if (breakdown.overdueBonus > 0) parts.push(`overdue bonus (+${breakdown.overdueBonus})`);
  return `Top of ${openTaskCount} open task(s): ${parts.join(', ')} = ${ranked.score}.`;
}

// { kind, ranked?, fallback?, openTaskCount }
async function nextAction(prisma, userId, { now = new Date(), tz = DEFAULT_TZ } = {}) {
  const ranked = await scoreUserTasks(prisma, userId, { now });
  if (ranked.length > 0) return { kind: KIND.TASK, ranked: ranked[0], openTaskCount: ranked.length };

  const fallback = await loadFallbackTopic(prisma, userId, { now, tz });
  if (fallback) return { kind: KIND.TOPIC, fallback, openTaskCount: 0 };

  return { kind: KIND.EMPTY, openTaskCount: 0 };
}

const topicJson = (topic) => (topic ? { id: topic.id, title: topic.title, status: topic.status } : null);

function serializeNextAction(result, now = new Date()) {
  const base = {
    kind: result.kind,
    task: null,
    topic: null,
    topicAutoLinked: false,
    course: null,
    score: null,
    scoreBreakdown: null,
    nextClass: null,
    openTaskCount: result.openTaskCount,
    reason: EMPTY_REASON,
  };

  if (result.kind === KIND.TASK) {
    const { ranked } = result;
    return {
      ...base,
      task: serializeTask(ranked.task, now),
      topic: topicJson(ranked.topic),
      topicAutoLinked: ranked.topicAutoLinked,
      course: ranked.task.course ?? null,
      score: ranked.score,
      scoreBreakdown: { ...ranked.breakdown },
      reason: explainTask(ranked, result.openTaskCount),
    };
  }

  if (result.kind === KIND.TOPIC) {
    const { fallback } = result;
    return {
      ...base,
      topic: topicJson(fallback.topic),
      course: fallback.course,
      nextClass: fallback.nextClass,
      reason: fallback.reason,
    };
  }

  return base;
}

module.exports = { KIND, EMPTY_REASON, nextAction, serializeNextAction, explainTask };
