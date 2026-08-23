const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const auditService = require('../services/audit.service');
const insightsService = require('../services/insights.service');
const simulationService = require('../services/simulation.service');
const etaService = require('../services/eta.service');
const riskService = require('../services/risk.service');
const serviceabilityService = require('../services/serviceability.service');
const slaService = require('../services/sla.service');
const earningsService = require('../services/earnings.service');
const supportService = require('../services/support.service');
const healthService = require('../services/health.service');
const settingsService = require('../services/settings.service');
const copilotService = require('../services/copilot.service');
const riskRadarService = require('../services/riskRadar.service');
const zoneHeatmapService = require('../services/zoneHeatmap.service');
const optimizationSimulationService = require('../services/optimizationSimulation.service');
const autoPilotService = require('../services/autoPilot.service');
const operationsHealthService = require('../services/operationsHealth.service');
const demandForecastService = require('../services/demandForecast.service');

// All routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/orders/:orderId/eligible-agents — Map-based eligible agent ranking
router.get('/orders/:orderId/eligible-agents', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupZone: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    const pickupLat = order.pickupLat || 28.6139;
    const pickupLng = order.pickupLng || 77.2090;

    const R = 6371; // km
    const rankedAgents = await Promise.all(
      agents.map(async (ag) => {
        const lat = ag.currentLat || 28.6139;
        const lng = ag.currentLng || 77.2090;

        const dLat = (lat - pickupLat) * (Math.PI / 180);
        const dLng = (lng - pickupLng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(pickupLat * (Math.PI / 180)) *
            Math.cos(lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = R * c;

        const activeCount = await prisma.order.count({
          where: {
            assignedAgentId: ag.id,
            status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
          },
        });

        const isStale = ag.lastLocationUpdatedAt
          ? (Date.now() - new Date(ag.lastLocationUpdatedAt).getTime()) > 5 * 60 * 1000
          : false;

        return {
          id: ag.id,
          name: ag.user.name,
          email: ag.user.email,
          phone: ag.user.phone,
          status: ag.status,
          vehicleType: ag.vehicleType,
          maxCapacity: ag.maxCapacity,
          currentLat: ag.currentLat,
          currentLng: ag.currentLng,
          lastLocationUpdatedAt: ag.lastLocationUpdatedAt,
          isStale,
          distKm,
          activeOrderCount: activeCount,
          user: ag.user,
        };
      })
    );

    rankedAgents.sort((a, b) => {
      if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
      if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1;
      return a.distKm - b.distKm;
    });

    res.json({ success: true, agents: rankedAgents, order });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/notification-logs — Communication / Notification Log Monitoring (Part 25)
router.get('/notification-logs', async (req, res, next) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/customers/search — Search customer by name, email, phone, or ID
router.get('/customers/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const queryStr = (q || '').trim();

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        ...(queryStr
          ? {
              OR: [
                { name: { contains: queryStr } },
                { email: { contains: queryStr } },
                { phone: { contains: queryStr } },
                { id: { contains: queryStr } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      take: 15,
    });

    res.json({ success: true, customers });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/customers — Admin register new customer on the fly
router.post('/customers', async (req, res, next) => {
  try {
    const { name, email, phone, password = 'Password@123' } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer email already exists', user: existing });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'CUSTOMER',
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    res.status(201).json({ success: true, message: 'Customer registered successfully', user });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;

    let dateGte = null;
    const now = new Date();
    if (timeRange === 'today') {
      dateGte = new Date(); dateGte.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      dateGte = new Date(Date.now() - 7 * 86400000);
    } else {
      dateGte = new Date(Date.now() - 30 * 86400000);
    }

    const whereTime = dateGte ? { createdAt: { gte: dateGte } } : {};

    const [
      totalOrders,
      pendingOrders,
      inTransitOrders,
      outForDeliveryOrders,
      deliveredOrders,
      failedOrders,
      availableAgents,
      busyAgents,
      totalAgents,
      revenueAggregate,
      codRevenueAggregate,
      agentsList,
      zonesList,
      insights,
    ] = await Promise.all([
      prisma.order.count({ where: whereTime }),
      prisma.order.count({ where: { ...whereTime, status: { in: ['CREATED', 'ASSIGNED', 'RESCHEDULED'] } } }),
      prisma.order.count({ where: { ...whereTime, status: { in: ['PICKED_UP', 'IN_TRANSIT'] } } }),
      prisma.order.count({ where: { ...whereTime, status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { ...whereTime, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...whereTime, status: 'FAILED' } }),
      prisma.agent.count({ where: { status: 'AVAILABLE' } }),
      prisma.agent.count({ where: { status: 'BUSY' } }),
      prisma.agent.count(),
      prisma.order.aggregate({
        where: { ...whereTime, status: { not: 'FAILED' } },
        _sum: { totalAmount: true, deliveryCharge: true, codSurcharge: true },
      }),
      prisma.order.aggregate({
        where: { ...whereTime, paymentType: 'COD', status: { not: 'FAILED' } },
        _sum: { totalAmount: true },
      }),
      prisma.agent.findMany({
        include: {
          user: { select: { id: true, name: true, phone: true } },
          _count: {
            select: {
              assignedOrders: {
                where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
              },
            },
          },
        },
      }),
      prisma.zone.findMany({
        include: {
          pickupOrders: { where: whereTime, select: { status: true } },
        },
      }),
      insightsService.generateOperationalInsights(),
    ]);

    // Group by status
    const statusGroup = await prisma.order.groupBy({
      by: ['status'],
      where: whereTime,
      _count: { _all: true },
    });

    const ordersByStatus = statusGroup.map((item) => ({
      name: item.status.replace('_', ' '),
      status: item.status,
      count: item._count._all,
    }));

    // Group by orderType
    const typeGroup = await prisma.order.groupBy({
      by: ['orderType'],
      where: whereTime,
      _count: { _all: true },
    });
    const orderTypeBreakdown = typeGroup.map((t) => ({ name: t.orderType, count: t._count._all }));

    // Group by paymentType
    const paymentGroup = await prisma.order.groupBy({
      by: ['paymentType'],
      where: whereTime,
      _count: { _all: true },
    });
    const paymentTypeBreakdown = paymentGroup.map((p) => ({ name: p.paymentType, count: p._count._all }));

    // Zone performance calculations
    const zonePerformance = zonesList.map((z) => {
      const orders = z.pickupOrders.length;
      const delivered = z.pickupOrders.filter((o) => o.status === 'DELIVERED').length;
      const failed = z.pickupOrders.filter((o) => o.status === 'FAILED').length;
      const successRate = orders > 0 ? Math.round((delivered / orders) * 100) : 100;
      return {
        id: z.id,
        name: z.name,
        code: z.code,
        orders,
        delivered,
        failed,
        successRate,
        avgDeliveryTime: '1h 24m',
      };
    });

    // Agent performance leaderboard
    const agentPerformance = await Promise.all(
      agentsList.map(async (a) => {
        const [completed, failed] = await Promise.all([
          prisma.orderAssignment.count({ where: { agentId: a.id, status: 'COMPLETED' } }),
          prisma.orderAssignment.count({ where: { agentId: a.id, status: 'FAILED' } }),
        ]);
        const totalDone = completed + failed;
        const successRate = totalDone > 0 ? Math.round((completed / totalDone) * 100) : 100;
        const activeCount = a._count?.assignedOrders || 0;
        const capacity = a.maxCapacity || 5;
        const workloadPct = Math.round((activeCount / capacity) * 100);

        return {
          id: a.id,
          name: a.user?.name || 'Agent',
          status: a.status,
          vehicleType: a.vehicleType,
          activeOrders: activeCount,
          maxCapacity: capacity,
          workloadPct,
          completed,
          failed,
          successRate,
          avgDeliveryTime: '1h 38m',
        };
      })
    );

    const totalRevenue = Math.round((revenueAggregate._sum.totalAmount || 0) * 100) / 100;
    const codRevenue = Math.round((codRevenueAggregate._sum.totalAmount || 0) * 100) / 100;
    const deliveryChargeRevenue = Math.round((revenueAggregate._sum.deliveryCharge || 0) * 100) / 100;
    const codSurchargeRevenue = Math.round((revenueAggregate._sum.codSurcharge || 0) * 100) / 100;
    const fleetUtilPct = totalAgents > 0 ? Math.round((busyAgents / totalAgents) * 100) : 0;

    res.json({
      success: true,
      timeRange,
      metrics: {
        totalOrders,
        pendingOrders,
        inTransitOrders,
        outForDeliveryOrders,
        deliveredOrders,
        failedOrders,
        availableAgents,
        busyAgents,
        totalAgents,
        fleetUtilization: fleetUtilPct,
        successRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 100,
        onTimeRate: totalOrders > 0 ? Math.min(98, Math.round(((deliveredOrders + inTransitOrders) / totalOrders) * 100)) : 95,
        avgDeliveryMinutes: 48,
        totalRevenue,
        codRevenue,
        deliveryChargeRevenue,
        codSurchargeRevenue,
      },
      ordersByStatus,
      ordersByZone: zonePerformance.map((z) => ({ zone: z.name, count: z.orders })),
      orderTypeBreakdown,
      paymentTypeBreakdown,
      zonePerformance,
      agentPerformance,
      insights,
      charts: {
        ordersByStatus,
        ordersByZone: zonePerformance.map((z) => ({ zone: z.name, count: z.orders })),
        orderTypeBreakdown,
        paymentTypeBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
});

// --- ZONE MANAGEMENT ---
router.get('/zones', async (req, res, next) => {
  try {
    const zones = await prisma.zone.findMany({
      include: { areas: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, zones });
  } catch (error) {
    next(error);
  }
});

router.post('/zones', async (req, res, next) => {
  try {
    const { name, code, description, isActive } = req.body;
    const newZone = await prisma.zone.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json({ success: true, message: 'Zone created', zone: newZone });
  } catch (error) {
    next(error);
  }
});

router.patch('/zones/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;
    const updatedZone = await prisma.zone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase().trim() }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ success: true, message: 'Zone updated', zone: updatedZone });
  } catch (error) {
    next(error);
  }
});

router.delete('/zones/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if zone is referenced by any orders
    const orderCount = await prisma.order.count({
      where: { OR: [{ pickupZoneId: id }, { dropZoneId: id }] },
    });
    if (orderCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete zone: ${orderCount} order(s) reference this zone. Deactivate it instead.`,
      });
    }
    await prisma.zone.delete({ where: { id } });
    res.json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// --- ZONE AREA MANAGEMENT ---
router.get('/zone-areas', async (req, res, next) => {
  try {
    const areas = await prisma.zoneArea.findMany({
      include: { zone: true },
      orderBy: { pincode: 'asc' },
    });
    res.json({ success: true, areas });
  } catch (error) {
    next(error);
  }
});

router.post('/zone-areas', async (req, res, next) => {
  try {
    const { zoneId, areaName, pincode } = req.body;
    const area = await prisma.zoneArea.create({
      data: {
        zoneId,
        areaName,
        pincode: String(pincode).trim(),
      },
      include: { zone: true },
    });
    res.status(201).json({ success: true, message: 'Zone area created', area });
  } catch (error) {
    next(error);
  }
});

router.delete('/zone-areas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.zoneArea.delete({ where: { id } });
    res.json({ success: true, message: 'Zone area deleted' });
  } catch (error) {
    next(error);
  }
});

// --- RATE CARD MANAGEMENT ---
router.get('/rate-cards', async (req, res, next) => {
  try {
    const rateCards = await prisma.rateCard.findMany({
      orderBy: [{ orderType: 'asc' }, { zoneType: 'asc' }, { weightFrom: 'asc' }],
    });
    res.json({ success: true, rateCards });
  } catch (error) {
    next(error);
  }
});

router.post('/rate-cards', async (req, res, next) => {
  try {
    const { orderType, zoneType, weightFrom, weightTo, rate, codSurcharge, isActive } = req.body;
    const newCard = await prisma.rateCard.create({
      data: {
        orderType,
        zoneType,
        weightFrom: Number(weightFrom),
        weightTo: Number(weightTo),
        rate: Number(rate),
        codSurcharge: codSurcharge ? Number(codSurcharge) : 30,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json({ success: true, message: 'Rate card created', rateCard: newCard });
  } catch (error) {
    next(error);
  }
});

router.patch('/rate-cards/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderType, zoneType, weightFrom, weightTo, rate, codSurcharge, isActive } = req.body;
    const prevCard = await prisma.rateCard.findUnique({ where: { id } });

    const updated = await prisma.rateCard.update({
      where: { id },
      data: {
        ...(orderType && { orderType }),
        ...(zoneType && { zoneType }),
        ...(weightFrom !== undefined && { weightFrom: Number(weightFrom) }),
        ...(weightTo !== undefined && { weightTo: Number(weightTo) }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(codSurcharge !== undefined && { codSurcharge: Number(codSurcharge) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    auditService.logEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'ADMIN',
      action: 'UPDATE_RATE_CARD',
      entityType: 'RateCard',
      entityId: id,
      previousValue: prevCard,
      newValue: updated,
      details: `Updated Rate Card ${updated.orderType} ${updated.zoneType} (${updated.weightFrom}–${updated.weightTo}kg): ₹${prevCard?.rate || 0} → ₹${updated.rate}, COD surcharge: ₹${prevCard?.codSurcharge || 0} → ₹${updated.codSurcharge}`,
    }).catch(() => {});

    res.json({ success: true, message: 'Rate card updated', rateCard: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/customers
router.get('/customers', async (req, res, next) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        _count: { select: { customerOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, customers });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/audit-logs — System Audit Log endpoint (Feature 14)
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { actorId, actorRole, action, entityType, dateFrom, dateTo, search, limit = 50, offset = 0 } = req.query;
    const result = await auditService.getAuditLogs({
      actorId, actorRole, action, entityType, dateFrom, dateTo, search, limit, offset,
    });
    res.json({ success: true, count: result.logs.length, total: result.total, logs: result.logs });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/insights — Operational Insights (Feature 19)
router.get('/insights', async (req, res, next) => {
  try {
    const insights = await insightsService.generateOperationalInsights();
    res.json({ success: true, count: insights.length, insights });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/simulation/step — Delivery Simulation (Feature 16)
router.post('/simulation/step', async (req, res, next) => {
  try {
    const { orderId, nextStatus, failureReason, remarks } = req.body;
    if (!orderId || !nextStatus) {
      return res.status(400).json({ success: false, message: 'orderId and nextStatus are required' });
    }
    const result = await simulationService.simulateStatusTransition({
      orderId,
      nextStatus,
      failureReason,
      remarks,
      adminUserId: req.user.id,
      adminName: req.user.name,
    });
    res.json({ success: true, message: `Simulated status transition to ${nextStatus}`, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/agents/:id/capacity — Update Agent Max Capacity (Feature 11)
router.patch('/agents/:id/capacity', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { maxCapacity } = req.body;

    const cap = parseInt(maxCapacity);
    if (isNaN(cap) || cap < 1 || cap > 20) {
      return res.status(400).json({ success: false, message: 'maxCapacity must be between 1 and 20' });
    }

    const prevAgent = await prisma.agent.findUnique({ where: { id }, include: { user: true } });
    if (!prevAgent) return res.status(404).json({ success: false, message: 'Agent not found' });

    const updated = await prisma.agent.update({
      where: { id },
      data: { maxCapacity: cap },
      include: { user: { select: { name: true, phone: true } } },
    });

    auditService.logEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'ADMIN',
      action: 'SET_CAPACITY',
      entityType: 'Agent',
      entityId: id,
      previousValue: { maxCapacity: prevAgent.maxCapacity },
      newValue: { maxCapacity: cap },
      details: `Updated max delivery capacity for agent ${prevAgent.user.name} from ${prevAgent.maxCapacity} to ${cap}`,
    }).catch(() => {});

    res.json({ success: true, message: `Agent max capacity updated to ${cap}`, agent: updated });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/settlements (Feature 27 — Agent Settlements)
router.get('/settlements', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.settlementStatus = status;

    const earnings = await prisma.agentEarning.findMany({
      where,
      include: {
        agent: { include: { user: { select: { name: true, email: true, phone: true } } } },
        order: { select: { orderNumber: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingTotal = earnings.filter((e) => e.settlementStatus === 'PENDING').reduce((s, e) => s + e.totalEarning, 0);
    const paidTotal = earnings.filter((e) => e.settlementStatus === 'PAID').reduce((s, e) => s + e.totalEarning, 0);

    res.json({
      success: true,
      count: earnings.length,
      earnings,
      summary: { pendingTotal, paidTotal },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/settlements (Feature 27 — Update Settlement Status)
router.patch('/settlements', async (req, res, next) => {
  try {
    const { earningIds, status } = req.body;
    if (!Array.isArray(earningIds) || earningIds.length === 0) {
      return res.status(400).json({ success: false, message: 'earningIds array is required' });
    }
    const result = await earningsService.updateSettlementStatus(earningIds, status);

    auditService.logEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: 'ADMIN',
      action: 'UPDATE_SETTLEMENT',
      entityType: 'AgentEarning',
      details: `Updated ${earningIds.length} agent settlement records to status ${status}`,
    }).catch(() => {});

    res.json({ success: true, message: `Updated ${result.count} settlements to ${status}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/admin/support/tickets (Feature 28 — Admin Support Desk)
router.get('/support/tickets', async (req, res, next) => {
  try {
    const { status, category, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        order: { select: { orderNumber: true, status: true } },
        responses: {
          include: { sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/support/tickets/:id (Feature 28 — Respond & Resolve Ticket)
router.patch('/support/tickets/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, status: nextStatus, priority } = req.body;

    let result = null;
    if (message) {
      result = await supportService.addTicketResponse({
        ticketId: id,
        senderId: req.user.id,
        senderRole: 'ADMIN',
        message,
        nextStatus,
      });
    } else if (nextStatus || priority) {
      const updated = await prisma.supportTicket.update({
        where: { id },
        data: {
          ...(nextStatus && { status: nextStatus }),
          ...(priority && { priority }),
        },
      });
      result = { ticket: updated };
    }

    res.json({ success: true, message: 'Support ticket updated', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/admin/system-health (Feature 29 — System Health Monitoring)
router.get('/system-health', async (req, res, next) => {
  try {
    const health = await healthService.getSystemHealth();
    res.json({ success: true, ...health });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/settings (Feature 30 — Global Logistics Settings)
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/settings (Feature 30 — Update Setting)
router.patch('/settings', async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'key and value are required' });
    }
    const updated = await settingsService.updateSetting(key, value, req.user);
    res.json({ success: true, message: `Setting ${key} updated successfully`, setting: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========== NEW FEATURES: WOW FACTOR ==========

// FEATURE 1 — Logistics Copilot Service
const logisticsCopilotService = require('../services/logisticsCopilot.service');

// POST /api/admin/copilot/query — Query AI Copilot with logistics context
router.post('/copilot/query', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Query cannot be empty' });
    }

    // Analyze query intent
    const lowerQuery = query.toLowerCase();
    let response = {};

    if (
      lowerQuery.includes('delay') ||
      lowerQuery.includes('slow') ||
      lowerQuery.includes('late') ||
      lowerQuery.includes('why')
    ) {
      response = await logisticsCopilotService.analyzeDeliveryDelays();
    } else if (lowerQuery.includes('high-risk') || lowerQuery.includes('risk') || lowerQuery.includes('danger')) {
      response = { highRiskOrders: await logisticsCopilotService.getHighRiskOrders() };
    } else if (lowerQuery.includes('zone') || lowerQuery.includes('performance')) {
      response = { zones: await logisticsCopilotService.getZonePerformance() };
    } else if (lowerQuery.includes('agent') || lowerQuery.includes('delivery')) {
      response = { agents: await logisticsCopilotService.getAgentPerformance() };
    } else if (lowerQuery.includes('sla') || lowerQuery.includes('deadline')) {
      response = { sla: await logisticsCopilotService.getSLASummary() };
    } else {
      // Default: operational metrics
      response = await logisticsCopilotService.getOperationalMetrics();
    }

    res.json({
      success: true,
      query,
      response,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// FEATURE 2 — Assignment Explanation Service
const assignmentExplanationService = require('../services/assignmentExplanation.service');

// GET /api/orders/:id/assignment-explanation
router.get('/orders/:id/assignment-explanation', async (req, res, next) => {
  try {
    const { id } = req.params;
    const explanation = await assignmentExplanationService.getAssignmentExplanation(id);
    res.json({ success: true, explanation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/assignment-simulation — Compare agents
router.post('/orders/:id/assignment-simulation', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentIds } = req.body; // optional: specific agents to compare
    const comparison = await assignmentExplanationService.compareAgents(id, agentIds);
    res.json({ success: true, comparison });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// FEATURE 3 — Risk Radar
// GET /api/admin/risk-radar
router.get('/risk-radar', async (req, res, next) => {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: {
        assignedAgent: { include: { _count: { select: { assignedOrders: { where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } } } } } },
        pickupZone: true,
        dropZone: true,
      },
    });

    const riskBreakdown = { ON_TRACK: 0, AT_RISK: 0, CRITICAL: 0 };
    const riskOrders = [];

    activeOrders.forEach((order) => {
      const risk = riskService.calculateRiskScore(order);
      if (risk.level === 'HIGH') {
        riskBreakdown.CRITICAL++;
        riskOrders.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          riskScore: risk.score,
          riskLevel: 'CRITICAL',
          reasons: risk.factors.slice(0, 3),
        });
      } else if (risk.level === 'MEDIUM') {
        riskBreakdown.AT_RISK++;
      } else {
        riskBreakdown.ON_TRACK++;
      }
    });

    res.json({
      success: true,
      summary: riskBreakdown,
      totalActive: activeOrders.length,
      criticalOrders: riskOrders.slice(0, 10),
      riskPercentage: {
        onTrack: Math.round((riskBreakdown.ON_TRACK / activeOrders.length) * 100),
        atRisk: Math.round((riskBreakdown.AT_RISK / activeOrders.length) * 100),
        critical: Math.round((riskBreakdown.CRITICAL / activeOrders.length) * 100),
      },
    });
  } catch (error) {
    next(error);
  }
});

// FEATURE 5 — Zone Heatmap

// GET /api/admin/zones/heatmap
router.get('/zones/heatmap', async (req, res, next) => {
  try {
    const heatmapData = await zoneHeatmapService.getZoneHeatmap();
    res.json({
      success: true,
      zones: heatmapData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/zones/:id/performance
router.get('/zones/:id/performance', async (req, res, next) => {
  try {
    const { id } = req.params;
    const performance = await zoneHeatmapService.getZonePerformanceReport(id);
    const peakHours = await zoneHeatmapService.getZonePeakHours(id);
    res.json({
      success: true,
      performance,
      peakHours,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// FEATURE 10 — Operations Health Service

// GET /api/admin/operations-health
router.get('/operations-health', async (req, res, next) => {
  try {
    const health = await operationsHealthService.calculateOperationsHealth();
    const trend = await operationsHealthService.getHealthTrend(7);
    res.json({
      success: true,
      health,
      trend,
    });
  } catch (error) {
    next(error);
  }
});

// FEATURE 12 — Rate Explanation Service

// GET /api/orders/:id/rate-explanation
router.get('/orders/:id/rate-explanation', async (req, res, next) => {
  try {
    const { id } = req.params;
    const explanation = await rateExplanationService.explainRate(id);
    res.json({ success: true, explanation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/rate-scenarios — What-if pricing
router.post('/orders/:id/rate-scenarios', async (req, res, next) => {
  try {
    const { id } = req.params;
    const scenarios = await rateExplanationService.explainRate(id);
    res.json({ success: true, scenarios });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// FEATURE 14 — Demand Forecast

// GET /api/admin/demand-forecast
router.get('/demand-forecast', async (req, res, next) => {
  try {
    const forecast = await demandForecastService.getDemandForecast();
    res.json({
      success: true,
      ...forecast,
    });
  } catch (error) {
    next(error);
  }
});

// FEATURE 8 — Optimization Simulation

// POST /api/admin/optimization/simulate
router.post('/optimization/simulate', async (req, res, next) => {
  try {
    const simulation = await optimizationSimulationService.runOptimizationSimulation();
    res.json({ success: true, simulation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/admin/optimization/scaling-scenario
router.post('/optimization/scaling-scenario', async (req, res, next) => {
  try {
    const { additionalAgents = 1 } = req.body;
    const scenario = await optimizationSimulationService.simulateAgentScaling(parseInt(additionalAgents));
    res.json({ success: true, scenario });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// FEATURE 15 — QR Shipment Tracking
// POST /api/orders/:id/tracking-qr
router.post('/orders/:id/tracking-qr', async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Generate safe tracking token (use order ID + a hash for security)
    const crypto = require('crypto');
    const trackingToken = crypto.createHash('sha256').update(`${id}-${order.orderNumber}-public`).digest('hex');

    // In production, store this token in DB for validation
    const trackingUrl = `${req.protocol}://${req.get('host')}/track/${trackingToken}`;

    res.json({
      success: true,
      orderId: id,
      orderNumber: order.orderNumber,
      trackingToken,
      trackingUrl,
      qrData: trackingUrl,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// FEATURE 9 — AutoPilot Mode
// POST /api/admin/autopilot/toggle
router.post('/autopilot/toggle', async (req, res, next) => {
  try {
    const { mode } = req.body; // OFF, RECOMMENDATION_ONLY, FULL_AUTO
    if (!['OFF', 'RECOMMENDATION_ONLY', 'FULL_AUTO'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }

    // Store in SystemSetting
    await settingsService.updateSetting('AUTOPILOT_MODE', mode, req.user);

    res.json({
      success: true,
      message: `AutoPilot mode set to ${mode}`,
      mode,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/admin/copilot/query
router.post('/copilot/query', async (req, res, next) => {
  try {
    const { query } = req.body;
    const response = await copilotService.processQuery(query);
    res.json({ success: true, response });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/risk-radar
router.get('/risk-radar', async (req, res, next) => {
  try {
    const radarData = await riskRadarService.getRiskRadarData();
    res.json({ success: true, ...radarData });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/zones/heatmap
router.get('/zones/heatmap', async (req, res, next) => {
  try {
    const heatmap = await zoneHeatmapService.getZoneHeatmap();
    res.json({ success: true, ...heatmap });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/optimization/simulation
router.post('/optimization/simulation', async (req, res, next) => {
  try {
    const result = await optimizationSimulationService.runOptimizationSimulation();
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/autopilot/toggle
router.post('/autopilot/toggle', async (req, res, next) => {
  try {
    const { mode } = req.body;
    const log = await autoPilotService.toggleMode(mode);
    res.json({ success: true, log });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/autopilot/events
router.get('/autopilot/events', async (req, res, next) => {
  try {
    const events = await autoPilotService.getEvents();
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/operations-health
router.get('/operations-health', async (req, res, next) => {
  try {
    const health = await operationsHealthService.calculateOperationsHealth();
    res.json({ success: true, health });
  } catch (error) {
    next(error);
  }
});

// Rate Cards Management
router.get('/rate-cards', async (req, res, next) => {
  try {
    const rateCards = await prisma.rateCard.findMany({
      orderBy: [{ orderType: 'asc' }, { zoneType: 'asc' }],
    });
    res.json({ success: true, count: rateCards.length, rateCards });
  } catch (error) {
    next(error);
  }
});

router.post('/rate-cards', async (req, res, next) => {
  try {
    const { orderType, zoneType, weightFrom, weightTo, rate, codSurcharge } = req.body;
    const rateCard = await prisma.rateCard.create({
      data: {
        orderType,
        zoneType,
        weightFrom: Number(weightFrom),
        weightTo: Number(weightTo),
        rate: Number(rate),
        codSurcharge: Number(codSurcharge || 0),
      },
    });
    res.status(201).json({ success: true, message: 'Rate card created', rateCard });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/rate-cards/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderType, zoneType, weightFrom, weightTo, rate, codSurcharge, isActive } = req.body;
    const rateCard = await prisma.rateCard.update({
      where: { id },
      data: {
        ...(orderType && { orderType }),
        ...(zoneType && { zoneType }),
        ...(weightFrom !== undefined && { weightFrom: Number(weightFrom) }),
        ...(weightTo !== undefined && { weightTo: Number(weightTo) }),
        ...(rate !== undefined && { rate: Number(rate) }),
        ...(codSurcharge !== undefined && { codSurcharge: Number(codSurcharge) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ success: true, message: 'Rate card updated', rateCard });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/rate-cards/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.rateCard.delete({ where: { id } });
    res.json({ success: true, message: 'Rate card deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Zone & Pincode Area Management
router.get('/zones', async (req, res, next) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        areas: { orderBy: { areaName: 'asc' } },
        _count: { select: { pickupOrders: true, dropOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, count: zones.length, zones });
  } catch (error) {
    next(error);
  }
});

router.post('/zones', async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const zone = await prisma.zone.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
      },
      include: { areas: true },
    });
    res.status(201).json({ success: true, message: 'Zone created', zone });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/zones/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;
    const zone = await prisma.zone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { areas: true },
    });
    res.json({ success: true, message: 'Zone updated', zone });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/zones/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.zone.delete({ where: { id } });
    res.json({ success: true, message: 'Zone deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/zone-areas', async (req, res, next) => {
  try {
    const { zoneId, areaName, pincode } = req.body;
    const area = await prisma.zoneArea.create({
      data: {
        zoneId,
        areaName,
        pincode,
      },
    });
    res.status(201).json({ success: true, message: 'Area mapped', area });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/zone-areas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.zoneArea.delete({ where: { id } });
    res.json({ success: true, message: 'Area unmapped' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Admin System Health Endpoint
router.get('/system-health', async (req, res, next) => {
  try {
    const health = await healthService.getSystemHealth();
    res.json({ success: true, ...health });
  } catch (error) {
    next(error);
  }
});

// Admin Support Tickets Management
router.get('/support/tickets', async (req, res, next) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { id: true, orderNumber: true, status: true } },
        responses: { include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    next(error);
  }
});

router.patch('/support/tickets/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;

    if (responseMessage) {
      await prisma.supportResponse.create({
        data: {
          ticketId: id,
          senderId: req.user.id,
          senderRole: 'ADMIN',
          message: responseMessage,
        },
      });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        assignedAdminId: req.user.id,
      },
      include: {
        customer: { select: { name: true } },
        responses: { include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });

    res.json({ success: true, message: 'Ticket updated', ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;



