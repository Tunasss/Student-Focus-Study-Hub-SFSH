const express = require('express');
const bcrypt = require('bcryptjs');
const { config } = require('../config');
const { ApiError } = require('../errors');
const { signToken, requireAuth } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

function readCredentials(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  return { email, password };
}

function authRouter({ prisma }) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const { email, password } = readCredentials(req.body);

    if (!EMAIL_RE.test(email)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'A valid email is required');
    }
    if (password.length < config.passwordMinLength) {
      throw new ApiError(400, 'VALIDATION_ERROR', `Password must be at least ${config.passwordMinLength} characters`);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = readCredentials(req.body);

    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  });

  router.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User no longer exists');
    }
    res.json({ user: publicUser(user) });
  });

  return router;
}

module.exports = { authRouter };
