// WBS 2.2.1 — syllabus PDF text extraction.
//   POST /api/syllabus/extract   (multipart/form-data, field "file": .pdf ≤ 5 MB, ≤ 30 pages)
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { singleFileUpload } = require('../middleware/upload');
const { ok } = require('../envelope');
const { PDF_LIMITS, readPdfUpload, extractPdfText } = require('../syllabus/extractPdf');

const uploadPdf = singleFileUpload({
  field: 'file',
  maxBytes: PDF_LIMITS.maxBytes,
  errorCode: 'INVALID_PDF_FORMAT',
  label: '.pdf',
});

function syllabusRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.post('/extract', uploadPdf, async (req, res) => {
    const buffer = readPdfUpload(req.file);
    const { pageCount, charCount, text, pages } = await extractPdfText(buffer);
    res.json(ok({ fileName: req.file.originalname, pageCount, charCount, text, pages }));
  });

  return router;
}

module.exports = { syllabusRouter };
