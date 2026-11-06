// WBS 2.2.2 / 2.2.3 — turns extracted syllabus text into { courseCode, topics } with Gemini.
//
//   const result = await analyzeSyllabusText(text, { gemini, model });
//
// `gemini` is a @google/genai GoogleGenAI client, the LLM_MOCK stand-in, or a test fake exposing
// models.generateContent; it is injected so tests never call the network. Every request carries
// responseMimeType = "application/json" and the fixed responseSchema; the reply is parsed and validated
// with zod before it is returned.
//
// Resilience (2.2.3):
//   - reply not JSON / fails the schema  -> one automatic retry (the retry prompt names the problem),
//                                           then 502 LLM_SCHEMA_INVALID
//   - HTTP 429, bad key, network loss    -> 503 LLM_UNAVAILABLE at once, no retry, so the UI can open
//                                           the manual entry form immediately
//   - no client (no key, no mock)        -> 503 LLM_NOT_CONFIGURED
//   - no topics in a valid reply         -> 422 SYLLABUS_NO_TOPICS

const { ApiError } = require('../errors');
const { responseSchema, syllabusOutputSchema, LIMITS } = require('./geminiSchema');

// Gemini Flash has a very large context window; this cap only protects against runaway input (30 pages ≈ 100k chars).
const MAX_INPUT_CHARS = 200_000;
// Total attempts when the reply does not match the schema: the first call + 1 retry.
const MAX_ATTEMPTS = 2;

const SYSTEM_INSTRUCTION = [
  'You extract the learning content structure from a university course syllabus.',
  'Return the course code (as printed, e.g. "CS101", "MATH 201"; empty string if there is none) and the ordered list',
  'of chapters / units / weekly topics that students must study.',
  'Rules:',
  '- Keep the order used in the syllabus; number topics from 1.',
  '- One topic per chapter/unit/week block. Merge sub-bullets into that topic\'s description instead of listing them separately.',
  '- Ignore grading, attendance policies, instructor contacts, textbooks, exam dates and administrative text.',
  '- Keep titles short (under 100 characters) and in the same language as the syllabus (Vietnamese or English).',
  '- Never invent topics that are not in the text. If the text contains no study topics, return an empty topics list.',
].join('\n');

function buildPrompt(text, previousProblem) {
  const body = text.length > MAX_INPUT_CHARS ? `${text.slice(0, MAX_INPUT_CHARS)}\n[... truncated ...]` : text;
  const retryNote = previousProblem
    ? `\n\nYour previous reply was rejected (${previousProblem}). Reply again with JSON that matches the schema exactly: ` +
      'an object with "course_code" (string) and "topics" (array of { "order": integer, "title": string, "description": string }).'
    : '';
  return `Syllabus text (extracted from a PDF, page breaks are blank lines):\n\n"""\n${body}\n"""${retryNote}`;
}

// The exact generateContent request. Exported so tests (and the docs) can assert the constraints.
function buildRequest(text, model, previousProblem = null) {
  return {
    model,
    contents: buildPrompt(text, previousProblem),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0,
      candidateCount: 1,
    },
  };
}

class SchemaMismatch extends Error {}

function mapUpstreamError(err) {
  const status = err?.status ?? err?.code;
  if (status === 429) {
    return new ApiError(503, 'LLM_UNAVAILABLE', 'The AI service is out of quota or rate limited; please add the topics manually or try again later');
  }
  if (status === 401 || status === 403) {
    return new ApiError(503, 'LLM_UNAVAILABLE', 'The AI service rejected the API key (check GEMINI_API_KEY); please add the topics manually');
  }
  return new ApiError(503, 'LLM_UNAVAILABLE', 'The AI service could not be reached; please add the topics manually or try again later');
}

// Parses + validates one reply. Throws SchemaMismatch (retryable) when it does not fit the contract.
function parseReply(response) {
  const raw = typeof response?.text === 'string' ? response.text : '';
  if (!raw.trim()) throw new SchemaMismatch('empty reply');

  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new SchemaMismatch('not valid JSON');
  }

  const parsed = syllabusOutputSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue.path.map(String).join('.') || '$';
    throw new SchemaMismatch(`${path}: ${issue.message}`);
  }
  return parsed.data;
}

// Sort by the model's order, drop duplicates (same title, case-insensitive) and renumber 1..n so the
// result can be stored as topics.sort_order later without unique-key clashes.
function normalizeTopics(topics) {
  const seen = new Set();
  const ordered = [...topics].sort((a, b) => a.order - b.order);
  const out = [];
  for (const topic of ordered) {
    const key = topic.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ order: out.length + 1, title: topic.title, description: topic.description || null });
  }
  return out;
}

async function analyzeSyllabusText(text, { gemini, model }) {
  if (!gemini) {
    throw new ApiError(503, 'LLM_NOT_CONFIGURED', 'Syllabus analysis is not configured on this server (GEMINI_API_KEY is missing)');
  }

  let data;
  let problem = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await gemini.models.generateContent(buildRequest(text, model, problem));
    } catch (err) {
      throw mapUpstreamError(err); // never retried: the UI should fall back to manual entry at once
    }

    try {
      data = parseReply(response);
      break;
    } catch (err) {
      if (!(err instanceof SchemaMismatch)) throw err;
      problem = err.message;
      if (attempt === MAX_ATTEMPTS) {
        throw new ApiError(
          502,
          'LLM_SCHEMA_INVALID',
          `The AI reply did not match the expected syllabus structure after ${MAX_ATTEMPTS} attempts (${problem}); please add the topics manually`,
        );
      }
    }
  }

  const topics = normalizeTopics(data.topics);
  if (topics.length === 0) {
    throw new ApiError(
      422,
      'SYLLABUS_NO_TOPICS',
      'No course topics were found in this syllabus. Please add the topics with the manual entry form instead.',
    );
  }

  return { courseCode: data.course_code || null, topics, source: gemini.isMock ? 'mock' : 'gemini' };
}

module.exports = { analyzeSyllabusText, buildRequest, normalizeTopics, SYSTEM_INSTRUCTION, MAX_INPUT_CHARS, MAX_ATTEMPTS, LIMITS };
