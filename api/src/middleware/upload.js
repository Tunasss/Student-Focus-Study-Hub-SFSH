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

module.exports = { singleFileUpload };
