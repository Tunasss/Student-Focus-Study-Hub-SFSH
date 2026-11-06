const multer = require('multer');
const { ApiError } = require('../errors');

// Express middleware that reads one uploaded file (multipart/form-data) into memory as req.file,
// mapping multer's errors to the Rule 02 error format.
//
//   singleFileUpload({ field: 'file', maxBytes: 5 * 1024 * 1024, errorCode: 'INVALID_PDF_FORMAT', label: '.pdf' })
function singleFileUpload({ field = 'file', maxBytes, errorCode, label }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1 },
  }).single(field);

  const maxMb = Math.round(maxBytes / (1024 * 1024));

  return function uploadMiddleware(req, res, next) {
    upload(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, errorCode, `File is larger than ${maxMb} MB`));
      }
      return next(new ApiError(400, errorCode, `Upload a single ${label} file in the "${field}" field`));
    });
  };
}

// Express middleware that reads up to maxCount uploaded files into memory,
// accepting both the plural field name ('files') and legacy singular field ('file').
// Populates req.files as an array of file objects, and req.file as the first file.
function multiFileUpload({ field = 'files', maxCount = 20, maxBytes = 10 * 1024 * 1024, errorCode = 'INVALID_PDF_FORMAT', label = '.pdf' }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: maxCount },
  }).fields([
    { name: field, maxCount },
    { name: 'file', maxCount: 1 },
  ]);

  const maxMb = Math.round(maxBytes / (1024 * 1024));

  return function multiUploadMiddleware(req, res, next) {
    upload(req, res, (err) => {
      if (!err) {
        const fileList = [
          ...(req.files?.[field] || []),
          ...(req.files?.['file'] || []),
        ];
        req.files = fileList;
        req.file = fileList[0];
        return next();
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, errorCode, `A file exceeds the ${maxMb} MB limit`));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, 'FILE_LIMIT_EXCEEDED', `Cannot upload more than ${maxCount} files at once`));
      }
      return next(new ApiError(400, errorCode, `Upload ${label} files in the "${field}" field`));
    });
  };
}

module.exports = { singleFileUpload, multiFileUpload };
