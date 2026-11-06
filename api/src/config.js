require('dotenv').config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  jwtExpiresIn: '24h',
  bcryptRounds: 10,
  passwordMinLength: 8,
  // Comma-separated list of allowed origins, e.g. "http://localhost:5173,https://sfsh.vercel.app"
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Google Gen AI (syllabus analysis, WBS 2.2.2). Without a key the endpoint answers 503 LLM_NOT_CONFIGURED.
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 60_000,
};

module.exports = { config };
