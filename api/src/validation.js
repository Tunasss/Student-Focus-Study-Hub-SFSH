// zod helpers: parse input or throw a Rule 02 VALIDATION_ERROR (400).
//
//   const body = parseOrThrow(createTaskSchema, req.body);
//
// The message names the first offending field, e.g. "dueAt: Invalid ISO datetime".

const { ApiError } = require('./errors');

function formatIssue(issue) {
  const path = issue.path?.map(String).join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

function parseOrThrow(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new ApiError(400, 'VALIDATION_ERROR', result.error.issues.map(formatIssue).join('; '));
}

module.exports = { parseOrThrow };
