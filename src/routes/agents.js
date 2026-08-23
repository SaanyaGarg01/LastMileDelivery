const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Agent updates their own availability + live location (used by the
// nearest-agent auto-assignment logic).
router.patch('/me', requireAuth, requireRole('agent'), (req, res) => {
  const { is_available, current_lat, current_lng } = req.body;
  const agent = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  db.prepare(
    `UPDATE users SET
       is_available = COALESCE(?, is_available),
       current_lat = COALESCE(?, current_lat),
       current_lng = COALESCE(?, current_lng)
     WHERE id = ?`
  ).run(
    is_available === undefined ? null : is_available ? 1 : 0,
    current_lat === undefined ? null : current_lat,
    current_lng === undefined ? null : current_lng,
    req.user.id
  );
  res.json(db.prepare('SELECT id,name,email,is_available,current_lat,current_lng,home_zone_id FROM users WHERE id=?').get(req.user.id));
});

router.get('/me/orders', requireAuth, requireRole('agent'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM orders WHERE agent_id = ? ORDER BY created_at DESC`
    )
    .all(req.user.id);
  res.json(rows);
});

module.exports = router;
