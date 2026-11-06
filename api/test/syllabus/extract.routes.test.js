// WBS 2.2.1 — POST /api/syllabus/extract over HTTP (multer limits + Rule 02 envelope).
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { createFakePrisma } = require('../helpers');
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

before(async () => {
  app = createApp({ prisma: createFakePrisma() });
  const res = await request(app).post('/api/auth/register').send({ email: 'pdf@sfsh.dev', password: 'Password123!' });
  token = res.body.data.token;
});

const extract = (buffer, name = 'syllabus.pdf') =>
  request(app).post('/api/syllabus/extract').set('Authorization', `Bearer ${token}`).attach('file', buffer, name);

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
    assert.match(res.body.error.message, /"file" field/);
  });

  test('requires a bearer token', async () => {
    const res = await request(app).post('/api/syllabus/extract').attach('file', makePdf([SYLLABUS]), 'syllabus.pdf');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });
});
