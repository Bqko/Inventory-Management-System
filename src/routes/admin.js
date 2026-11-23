const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const ROLES = ['admin', 'manager', 'staff'];

// Everything in this file is admin only.
router.use(authenticate, requireRole('admin'));

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db
    .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id')
    .all();
  res.json({ users });
});

// PATCH /api/admin/users/:id/role   body: { "role": "manager" }
router.patch('/users/:id/role', (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body || {};

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be admin, manager or staff' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  const info = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'Role updated', id, role });
});

module.exports = router;
