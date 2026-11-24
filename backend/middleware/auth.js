const jwt = require('jsonwebtoken');
const db = require('../db');
const { HttpError } = require('../utils/errors');

// 1) Who are you? Verifies the token and loads the user from the database.
//    The role is read from the DB on every request, so a role change by an
//    admin takes effect immediately. Fails with 401.
function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Not logged in'));

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }

  const user = db
    .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
    .get(Number(payload.sub));
  if (!user) return next(new HttpError(401, 'Account no longer exists'));

  req.user = user; // { id, name, email, role }
  next();
}

// 2) What may you do? Use after requireAuth. Fails with 403.
// Usage: requireRole('manager', 'admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Not logged in'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to do this'));
    }
    next();
  };
}

// "authenticate" is the name used in Member A's original code
module.exports = { requireAuth, authenticate: requireAuth, requireRole };