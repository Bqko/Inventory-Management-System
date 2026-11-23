// CONTRACT WITH MEMBER A
// Member A owns login/register and may replace the internals of this file,
// but these two exports and req.user = { id, role } must stay the same,
// because every route below depends on them.
const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/errors');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Not logged in'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

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

module.exports = { requireAuth, requireRole };