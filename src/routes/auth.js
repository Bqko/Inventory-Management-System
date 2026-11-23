const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compared against when the email is unknown, so login takes similar time either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function signToken(user) {
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

function validateRegister({ name, email, password }) {
  const errors = {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.name = 'Name must be 2 to 100 characters';
  }
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  // bcrypt only uses the first 72 bytes, so cap the length at 72.
  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 72 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password = 'Password must be 8 to 72 characters with at least one letter and one number';
  }
  return errors;
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const body = req.body || {};
    const errors = validateRegister(body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'That email is already registered' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    // The role is never taken from the request: new accounts are always "staff".
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, passwordHash, 'staff');

    const user = { id: Number(info.lastInsertRowid), name, email, role: 'staff' };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (/UNIQUE constraint failed/.test(err.message || '')) {
      return res.status(409).json({ error: 'That email is already registered' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const row = db
      .prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?')
      .get(email.trim().toLowerCase());

    const matches = await bcrypt.compare(password, row ? row.password_hash : DUMMY_HASH);

    // Same message for unknown email and wrong password.
    if (!row || !matches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout  (the client deletes its token; this confirms the action)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me  (who am I? used by React on page refresh)
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
