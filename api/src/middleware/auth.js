const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { ApiError } = require('../errors');

function signToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

// Requires "Authorization: Bearer <jwt>". Sets req.userId (Rule 06: use it to scope every query).
function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing bearer token'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new jwt.JsonWebTokenError('invalid subject');
    }
    req.userId = userId;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Token has expired, please log in again'));
    }
    return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid token'));
  }
}

module.exports = { signToken, requireAuth };
