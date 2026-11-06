// WBS 2.2.1 — syllabus PDF upload checks and text-layer extraction (pdf-parse).
//
// Limits: .pdf extension, at most 5 MB, at most 30 pages.
// Scanned PDFs (image only) have no text layer. When fewer than 200 non-whitespace
// characters can be read from the whole file the pipeline stops with
// PDF_NO_TEXT_LAYER (422) and the user is told to use the manual entry form instead.

const { PDFParse, VerbosityLevel } = require('pdf-parse');
const { ApiError } = require('../errors');

const PDF_LIMITS = Object.freeze({
  maxBytes: 5 * 1024 * 1024,
  maxPages: 30,
  minChars: 200,
  extension: '.pdf',
});

const NO_TEXT_LAYER_MESSAGE =
  'This PDF has no readable text layer (it looks like a scanned image). ' +
  'Please add the syllabus topics with the manual entry form instead.';

const invalidPdf = (message) => new ApiError(400, 'INVALID_PDF_FORMAT', message);

// Checks that a multer file is a .pdf within the size limit. Returns its Buffer.
function readPdfUpload(file) {
  if (!file) {
    throw invalidPdf('Missing .pdf file (multipart field "file")');
  }
  if (!String(file.originalname || '').toLowerCase().endsWith(PDF_LIMITS.extension)) {
    throw invalidPdf('File must have the .pdf extension');
  }
  if (file.size > PDF_LIMITS.maxBytes) {
    throw invalidPdf('File is larger than 5 MB');
  }
  // The PDF header must appear within the first 1024 bytes (PDF 1.7, §7.5.2).
  if (!file.buffer.subarray(0, 1024).includes('%PDF-')) {
    throw invalidPdf('File is not a PDF (missing %PDF- header)');
  }
  return file.buffer;
}

// Collapses runs of spaces, trims every line and drops blank lines.
function normalizePageText(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t\f\v\u00A0]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

const countChars = (text) => text.replace(/\s/g, '').length;

function mapParserError(err) {
  const name = err?.name || err?.constructor?.name || '';
  if (name === 'PasswordException') {
    return invalidPdf('PDF is password protected; remove the password and upload it again');
  }
  if (name === 'InvalidPDFException' || name === 'FormatError' || name === 'UnknownErrorException') {
    return invalidPdf('PDF file is corrupt or could not be read');
  }
  return err;
}

// Reads the text layer of a PDF buffer.
// Returns { pageCount, charCount, text, pages: [{ page, text }] }.
async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
  try {
    const info = await parser.getInfo();
    const pageCount = info.total;
    if (pageCount > PDF_LIMITS.maxPages) {
      throw new ApiError(400, 'PDF_TOO_MANY_PAGES', `PDF has ${pageCount} pages; the limit is ${PDF_LIMITS.maxPages}`);
    }

    const result = await parser.getText();
    const pages = result.pages.map((p) => ({ page: p.num, text: normalizePageText(p.text) }));
    const text = pages
      .map((p) => p.text)
      .filter(Boolean)
      .join('\n\n');
    const charCount = countChars(text);

    if (charCount < PDF_LIMITS.minChars) {
      throw new ApiError(422, 'PDF_NO_TEXT_LAYER', NO_TEXT_LAYER_MESSAGE);
    }

    return { pageCount, charCount, text, pages };
  } catch (err) {
    throw err instanceof ApiError ? err : mapParserError(err);
  } finally {
    await parser.destroy().catch(() => {});
  }
}

// Extracts text and metadata across an array of uploaded PDF files.
// Enforces a 20-file count limit, 50 MB batch size limit, and per-file validation.
async function extractMultiplePdfs(files) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw invalidPdf('Missing .pdf file (multipart field "files")');
  }
  if (files.length > 20) {
    throw new ApiError(400, 'FILE_LIMIT_EXCEEDED', 'Cannot upload more than 20 files at once');
  }

  const totalBytes = files.reduce((sum, f) => sum + (f?.size || f?.buffer?.length || 0), 0);
  if (totalBytes > 50 * 1024 * 1024) {
    throw new ApiError(400, 'FILE_LIMIT_EXCEEDED', 'Total upload size exceeds 50 MB');
  }

  const results = [];
  for (const file of files) {
    const buffer = readPdfUpload(file);
    try {
      const extracted = await extractPdfText(buffer);
      results.push({
        fileName: file.originalname || 'syllabus.pdf',
        text: extracted.text,
        pageCount: extracted.pageCount,
        charCount: extracted.charCount,
      });
    } catch (err) {
      if (err.code === 'PDF_NO_TEXT_LAYER') {
        throw new ApiError(
          422,
          'PDF_NO_TEXT_LAYER',
          `File "${file.originalname || 'syllabus.pdf'}" has no readable text layer (it looks like a scanned image).`,
        );
      }
      throw err;
    }
  }

  return results;
}

module.exports = {
  PDF_LIMITS,
  NO_TEXT_LAYER_MESSAGE,
  readPdfUpload,
  extractPdfText,
  extractMultiplePdfs,
  normalizePageText,
  countChars,
};
