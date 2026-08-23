const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Anyone authenticated can list zones (needed by customer order form to
// show serviceable areas); only admin can create/edit.
router.get('/', requireAuth, (req, res) => {
  const zones = db.prepare('SELECT * FROM zones ORDER BY name').all();
  const areas = db.prepare('SELECT * FROM zone_areas').all();
  const withAreas = zones.map((z) => ({
    ...z,
    areas: areas.filter((a) => a.zone_id === z.id).map((a) => a.area_name),
  }));
  res.json(withAreas);
});

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const info = db.prepare('INSERT INTO zones (name, description) VALUES (?,?)').run(name, description || null);
    res.status(201).json(db.prepare('SELECT * FROM zones WHERE id = ?').get(info.lastInsertRowid));
  } catch (err) {
    res.status(409).json({ error: 'Zone name must be unique' });
  }
});

router.put('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });
  db.prepare('UPDATE zones SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?').run(
    name || null,
    description || null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM zones WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM zone_areas WHERE zone_id = ?').run(req.params.id);
  db.prepare('DELETE FROM zones WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Assign an area (locality name or pincode) to a zone. Admin-configurable
// mapping used by the zone-detection step of the rate engine.
router.post('/:id/areas', requireAuth, requireRole('admin'), (req, res) => {
  const { area_name } = req.body;
  if (!area_name) return res.status(400).json({ error: 'area_name is required' });
  const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Zone not found' });

  const norm = area_name.trim().toLowerCase();
  try {
    db.prepare('INSERT INTO zone_areas (zone_id, area_name) VALUES (?,?)').run(req.params.id, norm);
  } catch (err) {
    return res.status(409).json({ error: 'This area is already mapped to a zone' });
  }
  res.status(201).json({ zone_id: Number(req.params.id), area_name: norm });
});

router.delete('/:id/areas/:areaId', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM zone_areas WHERE id = ? AND zone_id = ?').run(req.params.areaId, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
