// All API errors are returned in the Rule 02 envelope:
//   { success: false, data: null, error: { code, message }, timestamp }

const { fail } = require('./envelope');

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json(fail(err.code, err.message));
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(fail('INVALID_JSON', 'Request body is not valid JSON'));
  }
  console.error(err);
  return res.status(500).json(fail('INTERNAL_ERROR', 'Something went wrong'));
}

function notFound(req, res) {
  res.status(404).json(fail('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}

module.exports = { ApiError, errorHandler, notFound };
