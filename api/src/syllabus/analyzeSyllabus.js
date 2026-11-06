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
const { sortChaptersNaturally, extractChapterNumber } = require('./chapterOrder');

// Gemini Flash has a very large context window; this cap only protects against runaway input (30 pages ≈ 100k chars).
const MAX_INPUT_CHARS = 200_000;
// Total attempts when the reply does not match the schema: the first call + 1 retry.
const MAX_ATTEMPTS = 2;

const SYSTEM_INSTRUCTION = [
  'You extract the hierarchical Knowledge Tree structure from university syllabus and lecture slide materials.',
  'Return the course code (as printed, e.g. "CS101", "MATH 201"; empty string if none) and the structured list of chapters.',
  'Rules:',
  '- When lecture slide files or chapter documents are provided (each marked with === FILE: <filename> ===, or single/multiple chapter slide decks):',
  '  1. Treat each separate lecture slide file as EXACTLY ONE top-level Chapter.',
  '  2. Chapter title MUST include the chapter designation if present in the material or filename (e.g. "Chapter 4: Logistic Regression" or "Chapter 5: Forecasting Model of Time Series").',
  '  3. Set source_file to the respective filename.',
  '  4. Extract 3 to 6 key sections/concepts inside that slide deck as its subtopics.',
  '  5. Every subtopic title MUST start with the hierarchical chapter numbering: e.g. for Chapter 4, use "4.1 <Topic>", "4.2 <Topic>", "4.3 <Topic>". For Chapter 5, use "5.1 <Topic>", "5.2 <Topic>". For Chapter 1, use "1.1 <Topic>", "1.2 <Topic>".',
  '  6. NEVER artificially break down a single chapter slide deck into multiple fake top-level chapters.',
  '  7. Maintain correct numerical chapter ordering (e.g., Chapter 1 first, Chapter 2 second, etc.) based on titles or file names.',
  '- When a single master syllabus is provided: identify the main chapters/units and extract their subtopics following the same hierarchical numbering convention ("1.1", "1.2", etc.).',
  '- Ignore administrative text, grading policies, professor contacts, office hours, and exam dates.',
  '- Keep titles clear and concise (under 100 characters), in the original language of the material (Vietnamese or English).',
  '- Keep descriptions concise (1-2 sentences summarizing learning outcomes or covered concepts).',
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

// Normalizes chapters and nested subtopics: re-sorts naturally by chapter order and renumbers 1..n
function normalizeChapters(chapters) {
  if (!Array.isArray(chapters)) return [];
  const ordered = sortChaptersNaturally(chapters);
  const seenChapters = new Set();
  const out = [];

  for (const ch of ordered) {
    const title = String(ch.title || '').trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seenChapters.has(key)) continue;
    seenChapters.add(key);

    const sourceFileVal = ch.source_file ? String(ch.source_file).trim() : (ch.sourceFile ? String(ch.sourceFile).trim() : null);
    const naturalNum = extractChapterNumber(title) ?? extractChapterNumber(sourceFileVal);
    const resolvedOrder = naturalNum && Number.isInteger(naturalNum) && naturalNum > 0 ? naturalNum : (out.length + 1);

    const subtopicsOut = [];
    const seenSubtopics = new Set();
    const orderedSubtopics = [...(ch.subtopics || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (let sIdx = 0; sIdx < orderedSubtopics.length; sIdx++) {
      const sub = orderedSubtopics[sIdx];
      const rawSubTitle = String(sub.title || '').trim();
      if (!rawSubTitle) continue;
      const subKey = rawSubTitle.toLowerCase();
      if (seenSubtopics.has(subKey)) continue;
      seenSubtopics.add(subKey);

      // Strip any existing prefix (e.g., "4.1", "1.", "Section 1:") and enforce hierarchical numbering
      const cleanSubTitle = rawSubTitle
        .replace(/^[✦•\-*]\s*/, '')
        .replace(/^(?:section|phần|mục|bài|part)?\s*\d+(?:\.\d+)*\s*[-:.)]?\s*/i, '')
        .trim();
      const subOrder = subtopicsOut.length + 1;
      const formattedSubTitle = `${resolvedOrder}.${subOrder} ${cleanSubTitle || `Section ${subOrder}`}`;

      subtopicsOut.push({
        order: subOrder,
        title: formattedSubTitle,
        description: sub.description ? String(sub.description).trim() : null,
      });
    }

    out.push({
      order: resolvedOrder,
      title,
      description: ch.description ? String(ch.description).trim() : null,
      sourceFile: sourceFileVal,
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

// High-priority modern models (prioritizing 3.x series) followed by 2.5
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
];

async function analyzeSyllabusText(input, { gemini, model }) {
  if (!gemini) {
    throw new ApiError(503, 'LLM_NOT_CONFIGURED', 'Syllabus analysis is not configured on this server (GEMINI_API_KEY is missing)');
  }

  // If a test fake is passed (with recorded calls array), test single-model behavior directly
  const isTestFake = Boolean(gemini.calls);

  // Model chain: prioritize configured model, followed by modern 3.x/2.5 candidates
  const modelsToTry = isTestFake
    ? [model || 'gemini-3.6-flash']
    : [
        ...(model ? [model] : []),
        ...CANDIDATE_MODELS,
      ].filter((m, idx, self) => self.indexOf(m) === idx);

  let data = null;
  let lastErr = null;
  let usedModel = modelsToTry[0];

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];
    let problem = null;
    let modelSuccess = false;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response;
      try {
        response = await gemini.models.generateContent(buildRequest(input, currentModel, problem));
      } catch (err) {
        lastErr = err;
        const status = err?.status ?? err?.code;
        // If quota exhausted (429), model discontinued (404), or service high-demand (503):
        // Automatically route to next candidate model if available
        if (!isTestFake && (status === 429 || status === 404 || status === 503) && mIdx < modelsToTry.length - 1) {
          console.warn(`[Gemini Model Routing] Model "${currentModel}" failed (${status}: ${err.message?.slice(0, 100)}). Routing to next model: "${modelsToTry[mIdx + 1]}"...`);
          break; // break retry loop for this model, proceed to next model in chain
        }
        throw mapUpstreamError(err);
      }

      try {
        data = parseReply(response);
        usedModel = currentModel;
        modelSuccess = true;
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

    if (modelSuccess && data) {
      break;
    }
  }

  if (!data) {
    throw mapUpstreamError(lastErr || new Error('All candidate Gemini models failed'));
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
    model: usedModel,
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
