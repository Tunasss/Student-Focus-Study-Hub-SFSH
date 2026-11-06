// WBS 2.2.1 — POST /api/syllabus/extract over HTTP (multer limits + Rule 02 envelope).
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma, createFakeGemini, SAMPLE_ANALYSIS } = require('../helpers');
const { createGeminiClient } = require('../../src/llm/gemini');
const { makePdf } = require('../fixtures/makePdf');
const { PDF_LIMITS } = require('../../src/syllabus/extractPdf');

const SYLLABUS = [
  'MATH201 Calculus II - Course outline',
  'Week 1-2: Techniques of integration (substitution, parts, partial fractions)',
  'Week 3-4: Improper integrals and applications (area, volume, arc length)',
  'Week 5-7: Sequences and series, convergence tests',
  'Week 8-10: Power series and Taylor polynomials',
].join('\n');

let app;
let token;
let gemini;

before(async () => {
  gemini = createFakeGemini(SAMPLE_ANALYSIS);
  app = createApp({ prisma: createFakePrisma(), gemini });
  const res = await request(app).post('/api/auth/register').send({ email: 'pdf@sfsh.dev', password: 'Password123!' });
  token = res.body.data.token;
});

const extractWith = (application, buffer, name = 'syllabus.pdf') =>
  request(application).post('/api/syllabus/extract').set('Authorization', `Bearer ${token}`).attach('file', buffer, name);
const extract = (buffer, name) => extractWith(app, buffer, name);

describe('POST /api/syllabus/extract', () => {
  test('returns the extracted text layer with page and character counts', async () => {
    const res = await extract(makePdf([SYLLABUS, 'Week 11-12: Review and final exam']), 'MATH201.pdf');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const { data } = res.body;
    assert.equal(data.fileName, 'MATH201.pdf');
    assert.equal(data.pageCount, 2);
    assert.equal(data.text, `${SYLLABUS}\n\nWeek 11-12: Review and final exam`);
    assert.equal(data.charCount, data.text.replace(/\s/g, '').length);
    assert.deepEqual(
      data.pages.map((p) => p.page),
      [1, 2],
    );
  });

  test('sends the extracted text to Gemini as JSON-schema output and returns the validated topics', async () => {
    gemini.calls.length = 0;
    const res = await extract(makePdf([SYLLABUS]), 'MATH201.pdf');

    assert.equal(res.status, 200);
    assert.equal(res.body.data.source, 'gemini');
    assert.equal(res.body.data.courseCode, 'MATH201');
    assert.deepEqual(res.body.data.topics, [
      { order: 1, title: 'Techniques of integration', description: 'Substitution, parts, partial fractions.' },
      { order: 2, title: 'Improper integrals and applications', description: 'Area, volume, arc length.' },
      { order: 3, title: 'Sequences and series', description: null },
    ]);

    assert.equal(gemini.calls.length, 1);
    const [req] = gemini.calls;
    assert.equal(req.config.responseMimeType, 'application/json');
    assert.ok(req.config.responseSchema);
    assert.match(req.contents, /Techniques of integration/);
  });

  test('answers 503 LLM_NOT_CONFIGURED when no Gemini key is configured (text is not returned)', async () => {
    const unconfigured = createApp({ prisma: createFakePrisma(), gemini: null });
    const res = await extractWith(unconfigured, makePdf([SYLLABUS]));
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'LLM_NOT_CONFIGURED');
    assert.equal(res.body.data, null);
  });

  test('answers 502 LLM_SCHEMA_INVALID after one retry when the model reply keeps failing zod validation', async () => {
    const fake = createFakeGemini({ topics: [{ order: 1 }] });
    const broken = createApp({ prisma: createFakePrisma(), gemini: fake });
    const res = await extractWith(broken, makePdf([SYLLABUS]));
    assert.equal(res.status, 502);
    assert.equal(res.body.error.code, 'LLM_SCHEMA_INVALID');
    assert.equal(fake.calls.length, 2);
  });

  test('answers 503 LLM_UNAVAILABLE on quota (429) or connection loss so the UI can open the manual form', async () => {
    const quota = createApp({
      prisma: createFakePrisma(),
      gemini: createFakeGemini(() => {
        throw Object.assign(new Error('quota'), { status: 429 });
      }),
    });
    const res = await extractWith(quota, makePdf([SYLLABUS]));
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'LLM_UNAVAILABLE');

    const offline = createApp({
      prisma: createFakePrisma(),
      gemini: createFakeGemini(() => {
        throw new TypeError('fetch failed');
      }),
    });
    const res2 = await extractWith(offline, makePdf([SYLLABUS]));
    assert.equal(res2.status, 503);
    assert.equal(res2.body.error.code, 'LLM_UNAVAILABLE');
  });

  test('LLM_MOCK mode returns the fixed 5-chapter sample without any Gemini call', async () => {
    const mocked = createApp({ prisma: createFakePrisma(), gemini: createGeminiClient({ llmMock: true }) });
    const res = await extractWith(mocked, makePdf([SYLLABUS]));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.source, 'mock');
    assert.equal(res.body.data.chapters.length, 5);
    assert.equal(res.body.data.courseCode, 'CS101');
  });

  test('answers 422 SYLLABUS_NO_TOPICS when the model finds no topics', async () => {
    const empty = createApp({ prisma: createFakePrisma(), gemini: createFakeGemini({ course_code: '', topics: [] }) });
    const res = await extractWith(empty, makePdf([SYLLABUS]));
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'SYLLABUS_NO_TOPICS');
    assert.match(res.body.error.message, /manual entry form/);
  });

  test('answers 422 PDF_NO_TEXT_LAYER for a scanned (image-only) PDF and points to the manual form', async () => {
    const res = await extract(makePdf(['', '']), 'scanned.pdf');

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.data, null);
    assert.equal(res.body.error.code, 'PDF_NO_TEXT_LAYER');
    assert.match(res.body.error.message, /manual entry form/);
  });

  test('answers 400 PDF_TOO_MANY_PAGES above 30 pages', async () => {
    const res = await extract(makePdf(Array.from({ length: 31 }, () => SYLLABUS)));
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'PDF_TOO_MANY_PAGES');
  });

  test('answers 400 INVALID_PDF_FORMAT for a missing file, wrong extension, fake or corrupt PDF', async () => {
    const missing = await request(app).post('/api/syllabus/extract').set('Authorization', `Bearer ${token}`);
    assert.equal(missing.status, 400);
    assert.equal(missing.body.error.code, 'INVALID_PDF_FORMAT');

    const docx = await extract(makePdf([SYLLABUS]), 'syllabus.docx');
    assert.equal(docx.body.error.code, 'INVALID_PDF_FORMAT');

    const fake = await extract(Buffer.from('<html>hi</html>'), 'fake.pdf');
    assert.equal(fake.body.error.code, 'INVALID_PDF_FORMAT');

    const corrupt = await extract(Buffer.from('%PDF-1.7\nnot really'), 'corrupt.pdf');
    assert.equal(corrupt.status, 400);
    assert.equal(corrupt.body.error.code, 'INVALID_PDF_FORMAT');
  });

  test('answers 400 INVALID_PDF_FORMAT when the upload is larger than 5 MB (multer limit)', async () => {
    const big = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(PDF_LIMITS.maxBytes + 1, 0x20)]);
    const res = await extract(big, 'big.pdf');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_PDF_FORMAT');
    assert.match(res.body.error.message, /5 MB/);
  });

  test('rejects an upload in the wrong multipart field', async () => {
    const res = await request(app)
      .post('/api/syllabus/extract')
      .set('Authorization', `Bearer ${token}`)
      .attach('pdf', makePdf([SYLLABUS]), 'syllabus.pdf');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_PDF_FORMAT');
    assert.match(res.body.error.message, /field/);
  });

  test('accepts multiple PDF files uploaded under the "files" field simultaneously', async () => {
    const pdf1 = makePdf([SYLLABUS]);
    const pdf2 = makePdf(['CS102 Data Structures\nTrees and Binary Heaps\n' + SYLLABUS]);

    const res = await request(app)
      .post('/api/syllabus/extract')
      .set('Authorization', `Bearer ${token}`)
      .attach('files', pdf1, 'Chapter1.pdf')
      .attach('files', pdf2, 'Chapter2.pdf');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.chapters));
    assert.deepEqual(res.body.data.fileNames, ['Chapter1.pdf', 'Chapter2.pdf']);
  });

  test('requires a bearer token', async () => {
    const res = await request(app).post('/api/syllabus/extract').attach('file', makePdf([SYLLABUS]), 'syllabus.pdf');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});
