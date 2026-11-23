// Temporary routes for testing roles before Member B's routes exist.
// Delete this file (and its line in index.js) once real routes use the middleware.
const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/any-role', authenticate, (req, res) => {
  res.json({ message: 'Any logged-in user can see this', user: req.user });
});

router.get('/manager-area', authenticate, requireRole('manager', 'admin'), (req, res) => {
  res.json({ message: 'Managers and admins only', user: req.user });
});

router.get('/admin-area', authenticate, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admins only', user: req.user });
});

module.exports = router;
