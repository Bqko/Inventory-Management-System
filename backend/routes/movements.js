const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { HttpError } = require('../utils/errors');
const { parseId, validateMovement } = require('../utils/validate');

const router = express.Router();

const BASE_SELECT = `
  SELECT m.id, m.product_id, p.sku, p.name AS product_name,
         m.user_id, u.name AS user_name,
         m.type, m.amount, m.note, m.created_at
  FROM stock_movements m
  JOIN products p ON p.id = m.product_id
  JOIN users    u ON u.id = m.user_id`;

// Movement + quantity update happen together or not at all.
const recordMovement = db.transaction((userId, m) => {
  const product = db.prepare('SELECT id, quantity FROM products WHERE id = ?').get(m.product_id);
  if (!product) throw new HttpError(404, 'Product not found');

  const delta = m.type === 'IN' ? m.amount : -m.amount;
  if (product.quantity + delta < 0) {
    throw new HttpError(409, `Not enough stock. Available: ${product.quantity}`);
  }

  db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(delta, m.product_id);
  const info = db.prepare(
    'INSERT INTO stock_movements (product_id, user_id, type, amount, note) VALUES (?, ?, ?, ?, ?)'
  ).run(m.product_id, userId, m.type, m.amount, m.note);
  return info.lastInsertRowid;
});

// Any logged-in user (staff, manager, admin) can record stock in/out
router.post('/', requireAuth, (req, res) => {
  const m = validateMovement(req.body);
  const id = recordMovement(req.user.id, m);
  const movement = db.prepare(`${BASE_SELECT} WHERE m.id = ?`).get(id);
  const product = db.prepare('SELECT id, quantity, min_level FROM products WHERE id = ?').get(m.product_id);
  res.status(201).json({ movement, product });
});

// Full history with filters: admin only
// GET /api/movements?product_id=&user_id=&type=IN|OUT&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=&offset=
router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const { product_id, user_id, type, from, to } = req.query;
  const where = [];
  const params = [];

  if (product_id) { where.push('m.product_id = ?'); params.push(parseId(product_id)); }
  if (user_id)    { where.push('m.user_id = ?');    params.push(parseId(user_id)); }
  if (type) {
    if (type !== 'IN' && type !== 'OUT') throw new HttpError(400, 'type must be IN or OUT');
    where.push('m.type = ?'); params.push(type);
  }
  if (from) { where.push('date(m.created_at) >= date(?)'); params.push(from); }
  if (to)   { where.push('date(m.created_at) <= date(?)'); params.push(to); }

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const sql = `${BASE_SELECT}
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT ? OFFSET ?`;
  res.json(db.prepare(sql).all(...params, limit, offset));
});

// Recent activity for one product: visible to every logged-in user
router.get('/product/:id', requireAuth, (req, res) => {
  const rows = db.prepare(
    `${BASE_SELECT} WHERE m.product_id = ? ORDER BY m.created_at DESC, m.id DESC LIMIT 20`
  ).all(parseId(req.params.id));
  res.json(rows);
});

module.exports = router;