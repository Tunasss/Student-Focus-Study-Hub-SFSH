// WBS 2.2.2 / 2.2.3 — Gemini structured output: request constraints, zod validation, retry, mock mode, error mapping.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { Type } = require('@google/genai');
const { analyzeSyllabusText, buildRequest, normalizeTopics, MAX_INPUT_CHARS, MAX_ATTEMPTS } = require('../../src/syllabus/analyzeSyllabus');
const { createGeminiClient } = require('../../src/llm/gemini');
const { MOCK_SYLLABUS } = require('../../src/llm/mockGemini');
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
      source: 'gemini',
    });
    assert.equal(gemini.calls.length, 1);
    const [req] = gemini.calls;
    assert.equal(req.model, MODEL);
    assert.equal(req.config.responseMimeType, 'application/json');
    assert.equal(req.config.responseSchema, responseSchema);
  });

  test('missing course_code / description become null; whitespace is trimmed', async () => {
    const { result } = await analyze({ topics: [{ order: 1, title: '  Intro  ' }] });
    assert.deepEqual(result, { courseCode: null, topics: [{ order: 1, title: 'Intro', description: null }], source: 'gemini' });
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

  describe('zod rejects replies that break the schema (twice) -> 502 LLM_SCHEMA_INVALID', () => {
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
      test(name, () => expectApiError(analyze(reply), 502, 'LLM_SCHEMA_INVALID', pattern));
    }
  });

  test('non-JSON or empty replies -> 502 LLM_SCHEMA_INVALID', async () => {
    await expectApiError(analyze('Sure! Here are the topics: ...'), 502, 'LLM_SCHEMA_INVALID', /not valid JSON/);
    await expectApiError(analyze(''), 502, 'LLM_SCHEMA_INVALID', /empty/);
  });

  describe('retry on schema errors (WBS 2.2.3)', () => {
    test('a schema-invalid reply is retried once, and the retry prompt names the problem', async () => {
      const replies = ['garbage', GOOD_REPLY];
      const gemini = createFakeGemini(() => replies.shift());

      const result = await analyzeSyllabusText(TEXT, { gemini, model: MODEL });

      assert.equal(result.courseCode, 'CS101');
      assert.equal(gemini.calls.length, 2);
      assert.doesNotMatch(gemini.calls[0].contents, /previous reply was rejected/);
      assert.match(gemini.calls[1].contents, /previous reply was rejected \(not valid JSON\)/);
      assert.match(gemini.calls[1].contents, /Chapter 1: Variables/); // the syllabus text is sent again
      assert.equal(gemini.calls[1].config.responseMimeType, 'application/json');
    });

    test('two bad replies -> LLM_SCHEMA_INVALID, exactly MAX_ATTEMPTS (2) calls', async () => {
      const gemini = createFakeGemini({ topics: [{ order: 1 }] });
      await expectApiError(analyzeSyllabusText(TEXT, { gemini, model: MODEL }), 502, 'LLM_SCHEMA_INVALID', /after 2 attempts/);
      assert.equal(MAX_ATTEMPTS, 2);
      assert.equal(gemini.calls.length, 2);
    });

    test('a valid reply is never retried', async () => {
      const { gemini } = await analyze(GOOD_REPLY);
      assert.equal(gemini.calls.length, 1);
    });
  });

  describe('upstream failures -> 503 LLM_UNAVAILABLE at once, no retry (WBS 2.2.3)', () => {
    const failing = (error) =>
      createFakeGemini(() => {
        throw error;
      });

    test('HTTP 429 (quota exhausted)', async () => {
      const gemini = failing(Object.assign(new Error('quota exceeded'), { status: 429 }));
      await expectApiError(analyzeSyllabusText(TEXT, { gemini, model: MODEL }), 503, 'LLM_UNAVAILABLE', /quota/);
      assert.equal(gemini.calls.length, 1);
    });

    test('connection lost', async () => {
      const gemini = failing(Object.assign(new TypeError('fetch failed'), { code: 'ECONNRESET' }));
      await expectApiError(analyzeSyllabusText(TEXT, { gemini, model: MODEL }), 503, 'LLM_UNAVAILABLE', /could not be reached/);
      assert.equal(gemini.calls.length, 1);
    });

    test('rejected API key', async () => {
      const gemini = failing(Object.assign(new Error('API key not valid'), { status: 403 }));
      await expectApiError(analyzeSyllabusText(TEXT, { gemini, model: MODEL }), 503, 'LLM_UNAVAILABLE', /GEMINI_API_KEY/);
    });

    test('upstream failure on the retry call is also LLM_UNAVAILABLE', async () => {
      let n = 0;
      const gemini = createFakeGemini(() => {
        n += 1;
        if (n === 1) return 'garbage';
        throw Object.assign(new Error('quota'), { status: 429 });
      });
      await expectApiError(analyzeSyllabusText(TEXT, { gemini, model: MODEL }), 503, 'LLM_UNAVAILABLE');
      assert.equal(gemini.calls.length, 2);
    });
  });

  describe('LLM mock mode (LLM_MOCK=true)', () => {
    test('createGeminiClient returns the mock even without an API key', () => {
      const client = createGeminiClient({ llmMock: true, geminiApiKey: '', geminiTimeoutMs: 1 });
      assert.equal(client.isMock, true);
      assert.equal(typeof client.models.generateContent, 'function');
      assert.equal(createGeminiClient({ llmMock: false, geminiApiKey: '', geminiTimeoutMs: 1 }), null);
    });

    test('answers with the fixed 5-chapter sample, validated like a real reply, source = mock', async () => {
      const gemini = createGeminiClient({ llmMock: true });
      const result = await analyzeSyllabusText('anything', { gemini, model: MODEL });

      assert.equal(result.source, 'mock');
      assert.equal(result.courseCode, MOCK_SYLLABUS.course_code);
      assert.equal(result.topics.length, 5);
      assert.deepEqual(
        result.topics.map((t) => t.order),
        [1, 2, 3, 4, 5],
      );
      assert.deepEqual(
        result.topics.map((t) => t.title),
        MOCK_SYLLABUS.topics.map((t) => t.title),
      );
      assert.equal(gemini.calls.length, 1); // no network: the mock recorded the call locally
    });
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
