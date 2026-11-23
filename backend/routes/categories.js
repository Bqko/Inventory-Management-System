const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { HttpError } = require('../utils/errors');
const { parseId, validateCategory } = require('../utils/validate');

const router = express.Router();
const canEdit = requireRole('manager', 'admin');

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all());
});

router.post('/', requireAuth, canEdit, (req, res) => {
  const c = validateCategory(req.body);
  const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(c.name);
  res.status(201).json({ id: info.lastInsertRowid, name: c.name });
});

router.put('/:id', requireAuth, canEdit, (req, res) => {
  const id = parseId(req.params.id);
  const c = validateCategory(req.body);
  const info = db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(c.name, id);
  if (info.changes === 0) throw new HttpError(404, 'Category not found');
  res.json({ id, name: c.name });
});

router.delete('/:id', requireAuth, canEdit, (req, res) => {
  const info = db.prepare('DELETE FROM categories WHERE id = ?').run(parseId(req.params.id));
  if (info.changes === 0) throw new HttpError(404, 'Category not found');
  res.status(204).end();
});

module.exports = router;