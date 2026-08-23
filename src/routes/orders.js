const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { calculateCharge } = require('../services/rateEngine');
const { findBestAgent } = require('../services/assignmentEngine');
const { notifyStatusChange, notifySms } = require('../services/notifyService');

const router = express.Router();

const VALID_TRANSITIONS = {
  Created: ['Assigned', 'Cancelled'],
  Assigned: ['Picked Up', 'Cancelled'],
  'Picked Up': ['In Transit', 'Failed'],
  'In Transit': ['Out for Delivery', 'Failed'],
  'Out for Delivery': ['Delivered', 'Failed'],
  Delivered: [],
  Failed: ['Rescheduled'],
  Rescheduled: ['Assigned'],
  Cancelled: [],
};

function logHistory(orderId, status, actor, notes = null) {
  db.prepare(
    `INSERT INTO order_status_history (order_id, status, actor_id, actor_role, notes) VALUES (?,?,?,?,?)`
  ).run(orderId, status, actor?.id || null, actor?.role || 'system', notes);
}

function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function getCustomerEmail(customerId) {
  const u = db.prepare('SELECT email, phone FROM users WHERE id = ?').get(customerId);
  return u;
}

async function pushNotification(order, status) {
  const customer = getCustomerEmail(order.customer_id);
  if (!customer) return;
  await notifyStatusChange(order, customer.email, status);
  if (customer.phone) await notifySms(order, customer.phone, status);
}

// ---------------------------------------------------------------------
// Preview charge before the customer confirms the order. Same engine the
// real order creation uses, so the quoted number is guaranteed accurate.
// ---------------------------------------------------------------------
router.post('/calculate-charge', requireAuth, (req, res) => {
  try {
    const breakdown = calculateCharge(req.body);
    res.json(breakdown);
  } catch (err) {
    res.status(err.code === 'ZONE_NOT_FOUND' ? 422 : 400).json({ error: err.message, details: err.details });
  }
});

// ---------------------------------------------------------------------
// Create order. Customers create for themselves; admin can create on
// behalf of a customer by passing customer_email (existing customer) --
// the created_by_id always records who actually submitted the order.
// ---------------------------------------------------------------------
router.post('/', requireAuth, requireRole('customer', 'admin'), async (req, res) => {
  const body = req.body;
  let customerId = req.user.id;

  if (req.user.role === 'admin') {
    if (!body.customer_email) {
      return res.status(400).json({ error: 'admin must supply customer_email to place an order on behalf of a customer' });
    }
    const customer = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(body.customer_email.toLowerCase(), 'customer');
    if (!customer) return res.status(404).json({ error: 'No customer found with that email. Ask them to register first.' });
    customerId = customer.id;
  }

  let breakdown;
  try {
    breakdown = calculateCharge(body);
  } catch (err) {
    return res.status(err.code === 'ZONE_NOT_FOUND' ? 422 : 400).json({ error: err.message, details: err.details });
  }

  const orderCode = 'ORD-' + uuidv4().split('-')[0].toUpperCase();

  const info = db
    .prepare(
      `INSERT INTO orders (
        order_code, customer_id, created_by_id, pickup_address, pickup_area, pickup_zone_id,
        drop_address, drop_area, drop_zone_id, length_cm, breadth_cm, height_cm,
        actual_weight_kg, volumetric_weight_kg, billed_weight_kg, order_type, payment_type,
        rate_type, freight_charge, cod_surcharge, total_charge, status, scheduled_date
      ) VALUES (
        @order_code, @customer_id, @created_by_id, @pickup_address, @pickup_area, @pickup_zone_id,
        @drop_address, @drop_area, @drop_zone_id, @length_cm, @breadth_cm, @height_cm,
        @actual_weight_kg, @volumetric_weight_kg, @billed_weight_kg, @order_type, @payment_type,
        @rate_type, @freight_charge, @cod_surcharge, @total_charge, 'Created', @scheduled_date
      )`
    )
    .run({
      order_code: orderCode,
      customer_id: customerId,
      created_by_id: req.user.id,
      pickup_address: body.pickupAddress,
      pickup_area: body.pickupAddress,
      pickup_zone_id: breakdown.pickupZoneId,
      drop_address: body.dropAddress,
      drop_area: body.dropAddress,
      drop_zone_id: breakdown.dropZoneId,
      length_cm: body.lengthCm,
      breadth_cm: body.breadthCm,
      height_cm: body.heightCm,
      actual_weight_kg: body.actualWeightKg,
      volumetric_weight_kg: breakdown.volumetricWeightKg,
      billed_weight_kg: breakdown.billedWeightKg,
      order_type: body.orderType,
      payment_type: body.paymentType,
      rate_type: breakdown.rateType,
      freight_charge: breakdown.freightCharge,
      cod_surcharge: breakdown.codSurcharge,
      total_charge: breakdown.totalCharge,
      scheduled_date: body.scheduledDate || null,
    });

  const order = getOrder(info.lastInsertRowid);
  logHistory(order.id, 'Created', req.user, 'Order placed');
  await pushNotification(order, 'Created');

  res.status(201).json(order);
});

// ---------------------------------------------------------------------
// List orders (role-scoped) with admin filters.
// ---------------------------------------------------------------------
router.get('/', requireAuth, (req, res) => {
  const { status, zone_id, agent_id } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (req.user.role === 'customer') {
    sql += ' AND customer_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'agent') {
    sql += ' AND agent_id = ?';
    params.push(req.user.id);
  }
  // admin: no scoping, but supports filters below

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (zone_id) {
    sql += ' AND (pickup_zone_id = ? OR drop_zone_id = ?)';
    params.push(zone_id, zone_id);
  }
  if (agent_id && req.user.role === 'admin') {
    sql += ' AND agent_id = ?';
    params.push(agent_id);
  }
  sql += ' ORDER BY created_at DESC';

  res.json(db.prepare(sql).all(...params));
});

function assertCanView(order, user) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer' && order.customer_id === user.id) return true;
  if (user.role === 'agent' && order.agent_id === user.id) return true;
  return false;
}

router.get('/:id', requireAuth, (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!assertCanView(order, req.user)) return res.status(403).json({ error: 'Not authorized to view this order' });
  const history = db
    .prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC, id ASC')
    .all(order.id);
  const reschedules = db.prepare('SELECT * FROM reschedules WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
  res.json({ ...order, history, reschedules });
});

// ---------------------------------------------------------------------
// Assign an agent: manual (admin passes agent_id) or auto (nearest
// available agent to the pickup zone).
// ---------------------------------------------------------------------
router.post('/:id/assign', requireAuth, requireRole('admin'), async (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['Created', 'Failed', 'Rescheduled'].includes(order.status)) {
    return res.status(409).json({ error: `Cannot assign an agent while order is in status '${order.status}'` });
  }

  let agentId = req.body.agent_id;
  let note;

  if (!agentId) {
    // auto-assign to nearest available agent
    const { agent, fallback } = findBestAgent(order.id, order.pickup_zone_id);
    if (!agent) return res.status(409).json({ error: 'No available agents at this time' });
    agentId = agent.id;
    note = fallback
      ? `Auto-assigned (no agent in pickup zone was free; assigned nearest available agent system-wide)`
      : `Auto-assigned nearest available agent in pickup zone`;
  } else {
    const agent = db.prepare(`SELECT * FROM users WHERE id = ? AND role='agent'`).get(agentId);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    if (!agent.is_available) return res.status(409).json({ error: 'Selected agent is not currently available' });
    note = 'Manually assigned by admin';
  }

  db.prepare(`UPDATE orders SET agent_id = ?, status = 'Assigned' WHERE id = ?`).run(agentId, order.id);
  const updated = getOrder(order.id);
  logHistory(order.id, 'Assigned', req.user, note);
  await pushNotification(updated, 'Assigned');

  res.json(updated);
});

// ---------------------------------------------------------------------
// Status update: agent updates status of their own assigned order
// following the lifecycle; admin can override to ANY status directly.
// ---------------------------------------------------------------------
router.patch('/:id/status', requireAuth, requireRole('agent', 'admin'), async (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { status, notes } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  if (req.user.role === 'agent') {
    if (order.agent_id !== req.user.id) {
      return res.status(403).json({ error: 'This order is not assigned to you' });
    }
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({ error: `Invalid transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}` });
    }
  }
  // admin: override to any status, bypassing the lifecycle check (per spec: "override any order status")

  const deliveredAt = status === 'Delivered' ? `datetime('now')` : 'delivered_at';
  db.prepare(`UPDATE orders SET status = ?, delivered_at = ${status === 'Delivered' ? "datetime('now')" : 'delivered_at'} WHERE id = ?`).run(
    status,
    order.id
  );

  const updated = getOrder(order.id);
  logHistory(
    order.id,
    status,
    req.user,
    notes || (req.user.role === 'admin' ? 'Status overridden by admin' : null)
  );
  await pushNotification(updated, status);

  res.json(updated);
});

// ---------------------------------------------------------------------
// Reschedule after a failed delivery: customer (or admin) picks a new
// date; order re-enters the assignment pool so it can be (re)assigned,
// possibly to a different agent, for the new attempt.
// ---------------------------------------------------------------------
router.post('/:id/reschedule', requireAuth, requireRole('customer', 'admin'), async (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your order' });
  }
  if (order.status !== 'Failed') {
    return res.status(409).json({ error: `Can only reschedule an order in 'Failed' status (current: '${order.status}')` });
  }
  const { new_date } = req.body;
  if (!new_date) return res.status(400).json({ error: 'new_date is required' });

  db.prepare(`INSERT INTO reschedules (order_id, old_date, new_date, requested_by) VALUES (?,?,?,?)`).run(
    order.id,
    order.scheduled_date,
    new_date,
    req.user.id
  );
  db.prepare(`UPDATE orders SET status = 'Rescheduled', scheduled_date = ?, agent_id = NULL WHERE id = ?`).run(
    new_date,
    order.id
  );

  const updated = getOrder(order.id);
  logHistory(order.id, 'Rescheduled', req.user, `Rescheduled to ${new_date}; agent unassigned pending reassignment`);
  await pushNotification(updated, 'Rescheduled');

  res.json(updated);
});

module.exports = router;
