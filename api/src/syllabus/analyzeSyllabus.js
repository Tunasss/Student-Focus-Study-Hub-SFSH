// WBS 2.2.2 / 2.2.3 — turns extracted syllabus text into { courseCode, chapters, topics } with Gemini.
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
  'You extract the hierarchical Knowledge Tree structure from university syllabus and lecture slide materials.',
  'Return the course code (as printed, e.g. "CS101", "MATH 201"; empty string if none) and the structured list of chapters.',
  'Rules:',
  '- When multiple slide decks or chapter files are provided (each marked with === FILE: <filename> ===):',
  '  1. Treat each separate lecture slide file as ONE top-level Chapter.',
  '  2. Set source_file to the respective filename.',
  '  3. Extract 3 to 6 key sections/concepts inside that slide deck as its subtopics.',
  '  4. NEVER artificially break down a single chapter slide deck into multiple fake top-level chapters.',
  '- When a single master syllabus is provided: identify the main chapters/units and extract their subtopics.',
  '- Ignore administrative text, grading policies, professor contacts, office hours, and exam dates.',
  '- Keep titles clear and concise (under 100 characters), in the original language of the material (Vietnamese or English).',
  '- If the text contains no learning material or study topics, return an empty chapters list.',
].join('\n');

function formatInput(input) {
  if (Array.isArray(input)) {
    return input.map((f) => `=== FILE: ${f.fileName} ===\n${f.text}`).join('\n\n');
  }
  return String(input || '');
}

function buildPrompt(input, previousProblem) {
  const raw = formatInput(input);
  const body = raw.length > MAX_INPUT_CHARS ? `${raw.slice(0, MAX_INPUT_CHARS)}\n[... truncated ...]` : raw;
  const retryNote = previousProblem
    ? `\n\nYour previous reply was rejected (${previousProblem}). Reply again with JSON that matches the schema exactly: ` +
      'an object with "course_code" (string) and "chapters" (array of { "order": integer, "title": string, "description": string, "source_file": string, "subtopics": array of { "order": integer, "title": string, "description": string } }).'
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

// Normalizes chapters and nested subtopics: re-sorts by order and renumbers 1..n
function normalizeChapters(chapters) {
  if (!Array.isArray(chapters)) return [];
  const ordered = [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const seenChapters = new Set();
  const out = [];

  for (const ch of ordered) {
    const title = String(ch.title || '').trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seenChapters.has(key)) continue;
    seenChapters.add(key);

    const subtopicsOut = [];
    const seenSubtopics = new Set();
    const orderedSubtopics = [...(ch.subtopics || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const sub of orderedSubtopics) {
      const subTitle = String(sub.title || '').trim();
      if (!subTitle) continue;
      const subKey = subTitle.toLowerCase();
      if (seenSubtopics.has(subKey)) continue;
      seenSubtopics.add(subKey);

      subtopicsOut.push({
        order: subtopicsOut.length + 1,
        title: subTitle,
        description: sub.description ? String(sub.description).trim() : null,
      });
    }

    out.push({
      order: out.length + 1,
      title,
      description: ch.description ? String(ch.description).trim() : null,
      sourceFile: ch.source_file ? String(ch.source_file).trim() : (ch.sourceFile ? String(ch.sourceFile).trim() : null),
      subtopics: subtopicsOut,
    });
  }

  return out;
}

// Flat normalize topics for legacy compatibility
function normalizeTopics(topics) {
  if (!Array.isArray(topics)) return [];
  const seen = new Set();
  const ordered = [...topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const out = [];
  for (const topic of ordered) {
    const key = String(topic.title || '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ order: out.length + 1, title: topic.title, description: topic.description || null });
  }
  return out;
}

async function analyzeSyllabusText(input, { gemini, model }) {
  if (!gemini) {
    throw new ApiError(503, 'LLM_NOT_CONFIGURED', 'Syllabus analysis is not configured on this server (GEMINI_API_KEY is missing)');
  }

  let data;
  let problem = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response;
    try {
      response = await gemini.models.generateContent(buildRequest(input, model, problem));
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

  const chapters = normalizeChapters(data.chapters);
  if (chapters.length === 0) {
    throw new ApiError(
      422,
      'SYLLABUS_NO_TOPICS',
      'No course topics were found in this syllabus. Please add the topics with the manual entry form instead.',
    );
  }

  // Flattened topics list for backward compatibility
  const flattenedTopics = [];
  for (const ch of chapters) {
    const chTopic = {
      order: flattenedTopics.length + 1,
      title: ch.title,
      description: ch.description,
    };
    if (ch.sourceFile) chTopic.sourceFile = ch.sourceFile;
    flattenedTopics.push(chTopic);

    for (const sub of ch.subtopics) {
      const subTopic = {
        order: flattenedTopics.length + 1,
        title: sub.title,
        description: sub.description,
      };
      if (ch.sourceFile) subTopic.sourceFile = ch.sourceFile;
      flattenedTopics.push(subTopic);
    }
  }

  return {
    courseCode: data.course_code || null,
    chapters,
    topics: flattenedTopics,
    source: gemini.isMock ? 'mock' : 'gemini',
  };
}

module.exports = {
  analyzeSyllabusText,
  buildRequest,
  normalizeChapters,
  normalizeTopics,
  SYSTEM_INSTRUCTION,
  MAX_INPUT_CHARS,
  MAX_ATTEMPTS,
  LIMITS,
};
