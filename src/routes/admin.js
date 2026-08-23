const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

// Admin provisions agent / admin accounts (customers self-register via /api/auth/register).
router.post('/users', (req, res) => {
  const { name, email, password, role, phone, home_zone_id } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role are required' });
  }
  if (!['agent', 'admin', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'invalid role' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, phone, home_zone_id) VALUES (?,?,?,?,?,?)`
    )
    .run(name, email.toLowerCase(), hash, role, phone || null, home_zone_id || null);
  res.status(201).json(db.prepare('SELECT id,name,email,role,phone,home_zone_id FROM users WHERE id=?').get(info.lastInsertRowid));
});

router.get('/users', (req, res) => {
  const { role } = req.query;
  let rows;
  if (role) {
    rows = db.prepare('SELECT id,name,email,role,phone,is_available,home_zone_id,current_lat,current_lng FROM users WHERE role=?').all(role);
  } else {
    rows = db.prepare('SELECT id,name,email,role,phone,is_available,home_zone_id,current_lat,current_lng FROM users').all();
  }
  res.json(rows);
});

module.exports = router;
