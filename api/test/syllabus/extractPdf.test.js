// WBS 2.2.1 — upload limits and text-layer extraction.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { makePdf } = require('../fixtures/makePdf');
const {
  PDF_LIMITS,
  readPdfUpload,
  extractPdfText,
  normalizePageText,
  countChars,
} = require('../../src/syllabus/extractPdf');

const upload = (buffer, originalname = 'syllabus.pdf') => ({ originalname, buffer, size: buffer.length });

// ~230 non-whitespace characters: comfortably above the 200-character threshold.
const CHAPTER_TEXT = [
  'CS101 Introduction to Programming - Syllabus',
  'Chapter 1: Variables, types and expressions',
  'Chapter 2: Control flow with if, while and for',
  'Chapter 3: Functions and recursion',
  'Chapter 4: Arrays, lists and dictionaries',
  'Chapter 5: Files, errors and testing',
].join('\n');

function assertApiError(fn, status, code, pattern) {
  return assert.rejects(typeof fn === 'function' ? fn() : fn, (err) => {
    assert.equal(err.status, status, err.message);
    assert.equal(err.code, code);
    if (pattern) assert.match(err.message, pattern);
    return true;
  });
}

describe('readPdfUpload (file limits)', () => {
  test('accepts a .pdf within 5 MB and returns the buffer', () => {
    const buffer = makePdf(['hello']);
    assert.equal(readPdfUpload(upload(buffer, 'HK1.PDF')), buffer);
  });

  test('rejects a missing file', () => {
    assert.throws(() => readPdfUpload(undefined), { status: 400, code: 'INVALID_PDF_FORMAT' });
  });

  test('rejects a wrong extension', () => {
    assert.throws(() => readPdfUpload(upload(makePdf(['x']), 'syllabus.docx')), { code: 'INVALID_PDF_FORMAT' });
  });

  test('rejects files over 5 MB', () => {
    const big = { originalname: 'big.pdf', buffer: Buffer.from('%PDF-1.4'), size: PDF_LIMITS.maxBytes + 1 };
    assert.throws(() => readPdfUpload(big), { code: 'INVALID_PDF_FORMAT', message: /5 MB/ });
    const exact = { originalname: 'ok.pdf', buffer: Buffer.from('%PDF-1.4'), size: PDF_LIMITS.maxBytes };
    assert.ok(readPdfUpload(exact));
  });

  test('rejects content without the %PDF- header, whatever the extension says', () => {
    assert.throws(() => readPdfUpload(upload(Buffer.from('<html>not a pdf</html>'))), {
      code: 'INVALID_PDF_FORMAT',
      message: /%PDF-/,
    });
  });
});

describe('extractPdfText', () => {
  test('reads the text layer of every page', async () => {
    const result = await extractPdfText(makePdf([CHAPTER_TEXT, 'Chapter 6: Final project']));

    assert.equal(result.pageCount, 2);
    assert.deepEqual(
      result.pages.map((p) => p.page),
      [1, 2],
    );
    assert.match(result.pages[0].text, /^CS101 Introduction to Programming - Syllabus\nChapter 1/);
    assert.equal(result.pages[1].text, 'Chapter 6: Final project');
    assert.equal(result.text, `${CHAPTER_TEXT}\n\nChapter 6: Final project`);
    assert.equal(result.charCount, countChars(result.text));
    assert.ok(result.charCount >= PDF_LIMITS.minChars);
    // pdf-parse page separators ("-- 1 of 2 --") must not leak into the text.
    assert.doesNotMatch(result.text, /-- \d+ of \d+ --/);
  });

  test('accepts exactly 30 pages', async () => {
    const pages = Array.from({ length: 30 }, (_, i) => `Page ${i + 1}: ${'topic '.repeat(5)}`);
    const result = await extractPdfText(makePdf(pages));
    assert.equal(result.pageCount, 30);
  });

  test('rejects 31 pages with PDF_TOO_MANY_PAGES before extracting text', async () => {
    const pages = Array.from({ length: 31 }, () => CHAPTER_TEXT);
    await assertApiError(() => extractPdfText(makePdf(pages)), 400, 'PDF_TOO_MANY_PAGES', /31 pages; the limit is 30/);
  });

  describe('scanned PDF fallback: fewer than 200 characters -> PDF_NO_TEXT_LAYER', () => {
    test('pages with no text at all', async () => {
      await assertApiError(() => extractPdfText(makePdf(['', '', ''])), 422, 'PDF_NO_TEXT_LAYER', /manual entry form/);
    });

    test('a little OCR noise (199 characters) is still treated as no text layer', async () => {
      const noise = 'x'.repeat(199);
      await assertApiError(() => extractPdfText(makePdf([noise])), 422, 'PDF_NO_TEXT_LAYER');
    });

    test('200 non-whitespace characters is enough', async () => {
      const text = Array.from({ length: 10 }, () => 'abcdefghij abcdefghij').join('\n'); // 200 letters + spaces
      const result = await extractPdfText(makePdf([text]));
      assert.equal(result.charCount, 200);
    });

    test('whitespace does not count towards the 200 characters', async () => {
      const spaced = `${'a '.repeat(150)}`; // 150 letters, 150 spaces
      await assertApiError(() => extractPdfText(makePdf([spaced])), 422, 'PDF_NO_TEXT_LAYER');
    });
  });

  test('rejects a corrupt PDF with INVALID_PDF_FORMAT', async () => {
    await assertApiError(() => extractPdfText(Buffer.from('%PDF-1.4\n garbage garbage')), 400, 'INVALID_PDF_FORMAT', /corrupt/);
  });
});

describe('normalizePageText', () => {
  test('collapses spaces, trims lines and drops blank lines', () => {
    assert.equal(normalizePageText('  Chapter   1 \r\n\r\n\t Topic\u00A0A  \n\n'), 'Chapter 1\nTopic A');
    assert.equal(normalizePageText(undefined), '');
  });

  test('countChars ignores all whitespace', () => {
    assert.equal(countChars(' a b\nc\t'), 3);
  });
});
