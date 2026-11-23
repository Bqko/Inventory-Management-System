const jwt = require('jsonwebtoken');
const db = require('../db');

// 1) Who are you? Verifies the token and loads the user. Fails with 401.
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Read the user (and current role) from the database on every request,
  // so a role change by an admin takes effect immediately.
  const user = db
    .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
    .get(Number(payload.sub));

  if (!user) {
    return res.status(401).json({ error: 'Account no longer exists' });
  }

  req.user = user;
  next();
}

// 2) What may you do? Use after authenticate. Fails with 403.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: your role cannot do this' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
