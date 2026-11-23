const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { HttpError } = require('../utils/errors');
const { parseId, validateSupplier } = require('../utils/validate');

const router = express.Router();
const canEdit = requireRole('manager', 'admin');

const BASE_SELECT = `
  SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) AS product_count
  FROM suppliers s`;

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare(`${BASE_SELECT} ORDER BY s.name`).all());
});

router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare(`${BASE_SELECT} WHERE s.id = ?`).get(parseId(req.params.id));
  if (!row) throw new HttpError(404, 'Supplier not found');
  res.json(row);
});

router.post('/', requireAuth, canEdit, (req, res) => {
  const s = validateSupplier(req.body);
  const info = db.prepare(
    'INSERT INTO suppliers (name, email, phone, address) VALUES (?, ?, ?, ?)'
  ).run(s.name, s.email, s.phone, s.address);
  res.status(201).json(db.prepare(`${BASE_SELECT} WHERE s.id = ?`).get(info.lastInsertRowid));
});

router.put('/:id', requireAuth, canEdit, (req, res) => {
  const id = parseId(req.params.id);
  const s = validateSupplier(req.body);
  const info = db.prepare(
    'UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?'
  ).run(s.name, s.email, s.phone, s.address, id);
  if (info.changes === 0) throw new HttpError(404, 'Supplier not found');
  res.json(db.prepare(`${BASE_SELECT} WHERE s.id = ?`).get(id));
});

// Fails with 409 (handled in server.js) if products still reference this supplier
router.delete('/:id', requireAuth, canEdit, (req, res) => {
  const info = db.prepare('DELETE FROM suppliers WHERE id = ?').run(parseId(req.params.id));
  if (info.changes === 0) throw new HttpError(404, 'Supplier not found');
  res.status(204).end();
});

module.exports = router;