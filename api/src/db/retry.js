const TRANSIENT_DB_ERROR_CODES = new Set(['P1001', 'P1002', 'P1017', 'P2024']);
const SAFE_RETRY_DB_ERROR_CODES = new Set(['P1001', 'P1017', 'P2024']);

function isTransientDbError(err) {
  return Boolean(err && typeof err.code === 'string' && TRANSIENT_DB_ERROR_CODES.has(err.code));
}

function isRetryableDbError(err) {
  return Boolean(err && typeof err.code === 'string' && SAFE_RETRY_DB_ERROR_CODES.has(err.code));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries a Prisma operation on transient serverless connection drops / wake-up timeouts
// (e.g., TiDB Cloud Serverless P1001 / P1017 / P2024) before letting the error surface.
async function withDbRetry(fn, { retries = 1, delayMs = 400 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryableDbError(err)) {
        throw err;
      }
      attempt += 1;
      if (delayMs > 0) {
        await sleep(delayMs * attempt);
      }
    }
  }
}

module.exports = {
  TRANSIENT_DB_ERROR_CODES,
  isTransientDbError,
  isRetryableDbError,
  withDbRetry,
};
