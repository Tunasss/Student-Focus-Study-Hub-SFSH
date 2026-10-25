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
};

module.exports = { config };
