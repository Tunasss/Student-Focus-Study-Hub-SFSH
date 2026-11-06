// WBS 2.2.2 — Gemini structured output: request constraints, zod validation of the reply, error mapping.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { Type } = require('@google/genai');
const { analyzeSyllabusText, buildRequest, normalizeTopics, MAX_INPUT_CHARS } = require('../../src/syllabus/analyzeSyllabus');
const { responseSchema, syllabusOutputSchema } = require('../../src/syllabus/geminiSchema');
const { createFakeGemini } = require('../helpers');

const MODEL = 'gemini-2.5-flash';
const TEXT = 'CS101 Introduction to Programming\nChapter 1: Variables\nChapter 2: Control flow';

const GOOD_REPLY = {
  course_code: 'CS101',
  topics: [
    { order: 1, title: 'Variables and types', description: 'Declaring variables, primitive types.' },
    { order: 2, title: 'Control flow', description: 'if, while, for.' },
  ],
};

const analyze = (reply, text = TEXT) => {
  const gemini = createFakeGemini(reply);
  return analyzeSyllabusText(text, { gemini, model: MODEL }).then((result) => ({ result, gemini }));
};

function expectApiError(promise, status, code, pattern) {
  return assert.rejects(promise, (err) => {
    assert.equal(err.status, status, err.message);
    assert.equal(err.code, code);
    if (pattern) assert.match(err.message, pattern);
    return true;
  });
}

describe('responseSchema (sent to Gemini)', () => {
  test('matches the PRD sample: course_code + topics[order, title, description], topics required', () => {
    assert.equal(responseSchema.type, Type.OBJECT);
    assert.deepEqual(responseSchema.required, ['topics']);
    assert.equal(responseSchema.properties.course_code.type, Type.STRING);
    assert.equal(responseSchema.properties.topics.type, Type.ARRAY);

    const item = responseSchema.properties.topics.items;
    assert.equal(item.type, Type.OBJECT);
    assert.equal(item.properties.order.type, Type.INTEGER);
    assert.equal(item.properties.title.type, Type.STRING);
    assert.equal(item.properties.description.type, Type.STRING);
    assert.deepEqual(item.required, ['order', 'title']);
  });
});

describe('buildRequest', () => {
  test('forces JSON output with the fixed schema on the configured Flash model', () => {
    const req = buildRequest(TEXT, MODEL);
    assert.equal(req.model, MODEL);
    assert.equal(req.config.responseMimeType, 'application/json');
    assert.equal(req.config.responseSchema, responseSchema);
    assert.equal(req.config.temperature, 0);
    assert.match(req.config.systemInstruction, /syllabus/i);
    assert.match(req.contents, /Chapter 1: Variables/);
  });

  test('truncates runaway input instead of sending it whole', () => {
    const req = buildRequest('x'.repeat(MAX_INPUT_CHARS + 5000), MODEL);
    assert.ok(req.contents.length < MAX_INPUT_CHARS + 500);
    assert.match(req.contents, /truncated/);
  });
});

describe('analyzeSyllabusText', () => {
  test('returns the validated, camelCased structure and calls Gemini once with the constraints', async () => {
    const { result, gemini } = await analyze(GOOD_REPLY);

    assert.deepEqual(result, {
      courseCode: 'CS101',
      topics: [
        { order: 1, title: 'Variables and types', description: 'Declaring variables, primitive types.' },
        { order: 2, title: 'Control flow', description: 'if, while, for.' },
      ],
    });
    assert.equal(gemini.calls.length, 1);
    const [req] = gemini.calls;
    assert.equal(req.model, MODEL);
    assert.equal(req.config.responseMimeType, 'application/json');
    assert.equal(req.config.responseSchema, responseSchema);
  });

  test('missing course_code / description become null; whitespace is trimmed', async () => {
    const { result } = await analyze({ topics: [{ order: 1, title: '  Intro  ' }] });
    assert.deepEqual(result, { courseCode: null, topics: [{ order: 1, title: 'Intro', description: null }] });
  });

  test('re-sorts by order, drops duplicate titles and renumbers from 1', async () => {
    const { result } = await analyze({
      topics: [
        { order: 7, title: 'Graphs' },
        { order: 3, title: 'Trees' },
        { order: 5, title: 'trees', description: 'dup' },
        { order: 0, title: 'Arrays' },
      ],
    });
    assert.deepEqual(
      result.topics.map((t) => [t.order, t.title]),
      [
        [1, 'Arrays'],
        [2, 'Trees'],
        [3, 'Graphs'],
      ],
    );
  });

  test('empty topics list -> 422 SYLLABUS_NO_TOPICS pointing to the manual form', async () => {
    await expectApiError(analyze({ course_code: 'X', topics: [] }), 422, 'SYLLABUS_NO_TOPICS', /manual entry form/);
  });

  describe('zod rejects replies that break the schema -> 502 LLM_INVALID_OUTPUT', () => {
    const cases = [
      ['topic without title', { topics: [{ order: 1 }] }, /topics\.0\.title/],
      ['topic with empty title', { topics: [{ order: 1, title: '   ' }] }, /title/],
      ['order is not an integer', { topics: [{ order: 1.5, title: 'A' }] }, /order/],
      ['order is a string', { topics: [{ order: '1', title: 'A' }] }, /order/],
      ['topics is not an array', { topics: { order: 1, title: 'A' } }, /topics/],
      ['topics missing', { course_code: 'CS101' }, /topics/],
      ['too many topics', { topics: Array.from({ length: 101 }, (_, i) => ({ order: i + 1, title: `T${i}` })) }, /topics/],
      ['top level is an array', [{ order: 1, title: 'A' }], /\$/],
    ];
    for (const [name, reply, pattern] of cases) {
      test(name, () => expectApiError(analyze(reply), 502, 'LLM_INVALID_OUTPUT', pattern));
    }
  });

  test('non-JSON or empty replies -> 502 LLM_INVALID_OUTPUT', async () => {
    await expectApiError(analyze('Sure! Here are the topics: ...'), 502, 'LLM_INVALID_OUTPUT', /not valid JSON/);
    await expectApiError(analyze(''), 502, 'LLM_INVALID_OUTPUT', /empty/);
  });

  test('upstream failures map to LLM_UNAVAILABLE (503 for rate limit / bad key, 502 otherwise)', async () => {
    const rateLimited = createFakeGemini(() => {
      throw Object.assign(new Error('quota exceeded'), { status: 429 });
    });
    await expectApiError(analyzeSyllabusText(TEXT, { gemini: rateLimited, model: MODEL }), 503, 'LLM_UNAVAILABLE', /rate limited/);

    const badKey = createFakeGemini(() => {
      throw Object.assign(new Error('API key not valid'), { status: 403 });
    });
    await expectApiError(analyzeSyllabusText(TEXT, { gemini: badKey, model: MODEL }), 503, 'LLM_UNAVAILABLE', /GEMINI_API_KEY/);

    const down = createFakeGemini(() => {
      throw new Error('fetch failed');
    });
    await expectApiError(analyzeSyllabusText(TEXT, { gemini: down, model: MODEL }), 502, 'LLM_UNAVAILABLE');
  });

  test('no client configured -> 503 LLM_NOT_CONFIGURED', async () => {
    await expectApiError(analyzeSyllabusText(TEXT, { gemini: null, model: MODEL }), 503, 'LLM_NOT_CONFIGURED', /GEMINI_API_KEY/);
  });
});

describe('syllabusOutputSchema / normalizeTopics', () => {
  test('accepts the PRD sample shape', () => {
    assert.ok(syllabusOutputSchema.safeParse(GOOD_REPLY).success);
  });

  test('normalizeTopics keeps the first of duplicate titles', () => {
    const out = normalizeTopics([
      { order: 1, title: 'A', description: 'first' },
      { order: 2, title: 'a', description: 'second' },
    ]);
    assert.deepEqual(out, [{ order: 1, title: 'A', description: 'first' }]);
  });
});
