// Rule 02: every response body is { success, data, error, timestamp }.
//   success -> { success: true,  data: <payload>, error: null,              timestamp }
//   failure -> { success: false, data: null,      error: { code, message }, timestamp }

function ok(data = null) {
  return { success: true, data, error: null, timestamp: new Date().toISOString() };
}

function fail(code, message) {
  return { success: false, data: null, error: { code, message }, timestamp: new Date().toISOString() };
}

module.exports = { ok, fail };
