const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { HttpError } = require('../utils/errors');
const { parseId, validateProduct } = require('../utils/validate');

const router = express.Router();
const canEdit = requireRole('manager', 'admin');

// SQLite returns is_low as 1/0, so convert it to a real true/false
const shape = (r) => (r ? { ...r, is_low: !!r.is_low } : r);

const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, s.name AS supplier_name,
         (p.quantity <= p.min_level) AS is_low
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers  s ON s.id = p.supplier_id`;

// GET /api/products?search=&category_id=&supplier_id=&low_stock=1
router.get('/', requireAuth, (req, res) => {
  const { search, category_id, supplier_id, low_stock } = req.query;
  const where = [];
  const params = [];

  if (search) {
    where.push('(p.name LIKE ? OR p.sku LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) { where.push('p.category_id = ?'); params.push(parseId(category_id)); }
  if (supplier_id) { where.push('p.supplier_id = ?'); params.push(parseId(supplier_id)); }
  if (low_stock === '1') where.push('p.quantity <= p.min_level');

  const sql = `${BASE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.name`;
  res.json(db.prepare(sql).all(...params).map(shape));
});

router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare(`${BASE_SELECT} WHERE p.id = ?`).get(parseId(req.params.id));
  if (!row) throw new HttpError(404, 'Product not found');
  res.json(shape(row));
});

router.post('/', requireAuth, canEdit, (req, res) => {
  const p = validateProduct(req.body);
  const info = db.prepare(`
    INSERT INTO products (sku, name, quantity, min_level, price, category_id, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(p.sku, p.name, p.quantity, p.min_level, p.price, p.category_id, p.supplier_id);
  const row = db.prepare(`${BASE_SELECT} WHERE p.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(shape(row));
});

// Note: quantity is editable here for corrections, but normal changes
// should go through /api/movements so there is a history.
router.put('/:id', requireAuth, canEdit, (req, res) => {
  const id = parseId(req.params.id);
  const p = validateProduct(req.body);
  const info = db.prepare(`
    UPDATE products
    SET sku = ?, name = ?, quantity = ?, min_level = ?, price = ?, category_id = ?, supplier_id = ?
    WHERE id = ?`
  ).run(p.sku, p.name, p.quantity, p.min_level, p.price, p.category_id, p.supplier_id, id);
  if (info.changes === 0) throw new HttpError(404, 'Product not found');
  const row = db.prepare(`${BASE_SELECT} WHERE p.id = ?`).get(id);
  res.json(shape(row));
});

router.delete('/:id', requireAuth, canEdit, (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(parseId(req.params.id));
  if (info.changes === 0) throw new HttpError(404, 'Product not found');
  res.status(204).end();
});

module.exports = router;