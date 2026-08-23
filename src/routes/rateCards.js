const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM rate_cards ORDER BY order_type, rate_type').all());
});

// Upsert a rate card for (order_type, rate_type). Admin only.
router.put('/', requireAuth, requireRole('admin'), (req, res) => {
  const { order_type, rate_type, base_price, rate_per_kg, min_charge } = req.body;
  if (!['B2B', 'B2C'].includes(order_type) || !['intra', 'inter'].includes(rate_type)) {
    return res.status(400).json({ error: 'order_type must be B2B/B2C and rate_type must be intra/inter' });
  }
  const existing = db
    .prepare('SELECT id FROM rate_cards WHERE order_type = ? AND rate_type = ?')
    .get(order_type, rate_type);

  if (existing) {
    db.prepare(
      `UPDATE rate_cards SET base_price=?, rate_per_kg=?, min_charge=?, updated_at=datetime('now') WHERE id=?`
    ).run(base_price, rate_per_kg, min_charge, existing.id);
  } else {
    db.prepare(
      `INSERT INTO rate_cards (order_type, rate_type, base_price, rate_per_kg, min_charge) VALUES (?,?,?,?,?)`
    ).run(order_type, rate_type, base_price, rate_per_kg, min_charge);
  }
  res.json(db.prepare('SELECT * FROM rate_cards WHERE order_type=? AND rate_type=?').get(order_type, rate_type));
});

router.get('/cod', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM cod_surcharge_config').all());
});

router.put('/cod', requireAuth, requireRole('admin'), (req, res) => {
  const { order_type, flat_fee, percent_fee } = req.body;
  if (!['B2B', 'B2C'].includes(order_type)) return res.status(400).json({ error: 'order_type must be B2B or B2C' });
  const existing = db.prepare('SELECT id FROM cod_surcharge_config WHERE order_type = ?').get(order_type);
  if (existing) {
    db.prepare(`UPDATE cod_surcharge_config SET flat_fee=?, percent_fee=?, updated_at=datetime('now') WHERE id=?`).run(
      flat_fee,
      percent_fee,
      existing.id
    );
  } else {
    db.prepare(`INSERT INTO cod_surcharge_config (order_type, flat_fee, percent_fee) VALUES (?,?,?)`).run(
      order_type,
      flat_fee,
      percent_fee
    );
  }
  res.json(db.prepare('SELECT * FROM cod_surcharge_config WHERE order_type = ?').get(order_type));
});

module.exports = router;
