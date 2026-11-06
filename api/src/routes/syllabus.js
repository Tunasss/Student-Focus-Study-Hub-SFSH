// WBS 2.2 — syllabus PDF -> topics.
//   POST /api/syllabus/extract   (multipart/form-data, field "file": .pdf ≤ 5 MB, ≤ 30 pages)
//   2.2.1 reads the text layer, 2.2.2 asks Gemini for { courseCode, topics } (JSON schema + zod).
const express = require('express');
const { config } = require('../config');
const { requireAuth } = require('../middleware/auth');
const { singleFileUpload } = require('../middleware/upload');
const { ok } = require('../envelope');
const { PDF_LIMITS, readPdfUpload, extractPdfText } = require('../syllabus/extractPdf');
const { analyzeSyllabusText } = require('../syllabus/analyzeSyllabus');

const uploadPdf = singleFileUpload({
  field: 'file',
  maxBytes: PDF_LIMITS.maxBytes,
  errorCode: 'INVALID_PDF_FORMAT',
  label: '.pdf',
});

function syllabusRouter({ gemini = null } = {}) {
  const router = express.Router();
  router.use(requireAuth);

  router.post('/extract', uploadPdf, async (req, res) => {
    const buffer = readPdfUpload(req.file);
    const { pageCount, charCount, text, pages } = await extractPdfText(buffer);
    const { courseCode, topics } = await analyzeSyllabusText(text, { gemini, model: config.geminiModel });
    res.json(ok({ fileName: req.file.originalname, pageCount, charCount, courseCode, topics, text, pages }));
  });

  return router;
}

module.exports = { syllabusRouter };
