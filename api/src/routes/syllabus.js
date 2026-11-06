// WBS 2.2 — syllabus PDF -> topics & knowledge tree.
//   POST /api/syllabus/extract   (multipart/form-data, field "files" or "file")
const express = require('express');
const { config } = require('../config');
const { requireAuth } = require('../middleware/auth');
const { multiFileUpload } = require('../middleware/upload');
const { ok } = require('../envelope');
const { ApiError } = require('../errors');
const { extractPdfText, extractMultiplePdfs } = require('../syllabus/extractPdf');
const { analyzeSyllabusText } = require('../syllabus/analyzeSyllabus');

const uploadPdf = multiFileUpload({
  field: 'files',
  maxCount: 20,
  maxBytes: 10 * 1024 * 1024,
  errorCode: 'INVALID_PDF_FORMAT',
  label: '.pdf',
});

function syllabusRouter({ gemini = null } = {}) {
  const router = express.Router();
  router.use(requireAuth);

  router.post('/extract', uploadPdf, async (req, res) => {
    const fileList = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (fileList.length === 0) {
      throw new ApiError(400, 'INVALID_PDF_FORMAT', 'Missing .pdf file (multipart field "files" or "file")');
    }

    const extractedFiles = await extractMultiplePdfs(fileList);
    const { courseCode, chapters, topics, source } = await analyzeSyllabusText(extractedFiles, {
      gemini,
      model: config.geminiModel,
    });

    const totalPages = extractedFiles.reduce((acc, f) => acc + f.pageCount, 0);
    const totalChars = extractedFiles.reduce((acc, f) => acc + f.charCount, 0);
    const combinedText = extractedFiles.map((f) => f.text).join('\n\n');

    let singlePages = [];
    if (fileList.length === 1) {
      try {
        const single = await extractPdfText(fileList[0].buffer);
        singlePages = single.pages;
      } catch {
        // fallback
      }
    }

    res.json(
      ok({
        fileName: fileList.length === 1 ? fileList[0].originalname : fileList.map((f) => f.originalname).join(', '),
        fileNames: fileList.map((f) => f.originalname),
        pageCount: totalPages,
        charCount: totalChars,
        courseCode,
        chapters,
        topics,
        source,
        text: combinedText,
        pages: singlePages,
        files: extractedFiles,
      }),
    );
  });

  return router;
}

module.exports = { syllabusRouter };
