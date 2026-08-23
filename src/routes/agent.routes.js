const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const availabilitySchema = z.object({
  body: z.object({
    status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']),
  }),
});

const locationSchema = z.object({
  body: z.object({
    currentLat: z.number(),
    currentLng: z.number(),
  }),
});

// GET /api/agents (List all agents)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        assignedOrders: {
          where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
          select: { id: true, orderNumber: true, status: true },
        },
        _count: {
          select: { assignedOrders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: agents.length, agents });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/agents/:id/availability (Update agent availability)
router.patch('/:id/availability', authenticate, validate(availabilitySchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Role verification: agent themselves or admin
    if (req.user.role === 'AGENT' && req.user.agentProfile?.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ success: true, message: `Availability status set to ${status}`, agent: updatedAgent });
  } catch (error) {
    next(error);
  }
});

const locationService = require('../services/location.service');
const earningsService = require('../services/earnings.service');

// PATCH /api/agents/location (Update agent coordinates & log location history — Feature 21)
router.patch('/location', authenticate, async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, orderId } = req.body;
    const agentId = req.user.agentProfile?.id;
    if (!agentId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Agent profile required' });
    }
    const targetAgentId = agentId || req.body.agentId;
    const result = await locationService.updateAgentLocation({
      agentId: targetAgentId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      orderId,
    });
    res.json({ success: true, message: 'Location updated & history recorded', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/agents/:id/location (By ID update)
router.patch('/:id/location', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentLat, currentLng, latitude, longitude, accuracy, orderId } = req.body;
    const lat = parseFloat(latitude || currentLat);
    const lng = parseFloat(longitude || currentLng);

    if (req.user.role === 'AGENT' && req.user.agentProfile?.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await locationService.updateAgentLocation({
      agentId: id,
      latitude: lat,
      longitude: lng,
      accuracy,
      orderId,
    });

    res.json({ success: true, message: 'Agent location updated', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/agents/earnings (Agent earnings history — Feature 27)
router.get('/earnings', authenticate, async (req, res, next) => {
  try {
    const agentId = req.user.agentProfile?.id || req.query.agentId;
    if (!agentId) return res.status(400).json({ success: false, message: 'Agent ID required' });
    const result = await earningsService.getAgentEarnings(agentId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id/deliveries (Agent deliveries breakdown)
router.get('/:id/deliveries', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'AGENT' && req.user.agentProfile?.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activeOrders = await prisma.order.findMany({
      where: {
        assignedAgentId: id,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: {
        pickupZone: true,
        dropZone: true,
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const todayDeliveries = await prisma.order.findMany({
      where: {
        assignedAgentId: id,
        updatedAt: { gte: startOfToday },
      },
      include: { pickupZone: true, dropZone: true, customer: { select: { name: true, phone: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const failedDeliveries = await prisma.order.findMany({
      where: {
        assignedAgentId: id,
        status: 'FAILED',
      },
      include: { pickupZone: true, dropZone: true, customer: { select: { name: true, phone: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    const completedDeliveries = await prisma.order.findMany({
      where: {
        assignedAgentId: id,
        status: 'DELIVERED',
      },
      include: { pickupZone: true, dropZone: true },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      activeOrders,
      todayDeliveries,
      failedDeliveries,
      completedDeliveries,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/location (Update agent location — Part 3)
router.post('/location', authenticate, async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, currentLat, currentLng, orderId } = req.body;
    const agentId = req.user.agentProfile?.id;
    if (!agentId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only authenticated AGENTS can update location' });
    }
    const targetAgentId = agentId || req.body.agentId;
    const lat = parseFloat(latitude || currentLat);
    const lng = parseFloat(longitude || currentLng);

    const result = await locationService.updateAgentLocation({
      agentId: targetAgentId,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy ? parseFloat(accuracy) : 10.0,
      orderId,
    });
    res.json({ success: true, message: 'Location updated successfully', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
