const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const pricingService = require('../services/pricing.service');
const assignmentService = require('../services/assignment.service');
const statusService = require('../services/status.service');
const notificationService = require('../services/notification.service');
const etaService = require('../services/eta.service');
const riskService = require('../services/risk.service');
const locationService = require('../services/location.service');
const bulkImportService = require('../services/bulk.service');
const cancellationService = require('../services/cancellation.service');
const podService = require('../services/pod.service');
const assignmentExplanationService = require('../services/assignmentExplanation.service');
const assignmentSimulationService = require('../services/assignmentSimulation.service');
const rateExplanationService = require('../services/rateExplanation.service');
const qrTrackingService = require('../services/qrTracking.service');

const previewPriceSchema = z.object({
  body: z.object({
    pickupPincode: z.string().min(1),
    dropPincode: z.string().min(1),
    length: z.number().positive(),
    breadth: z.number().positive(),
    height: z.number().positive(),
    actualWeight: z.number().positive(),
    orderType: z.enum(['B2B', 'B2C']),
    paymentType: z.enum(['PREPAID', 'COD']),
  }),
});

const createOrderSchema = z.object({
  body: z.object({
    pickupAddress: z.string().min(3),
    pickupPincode: z.string().min(1),
    dropAddress: z.string().min(3),
    dropPincode: z.string().min(1),
    length: z.number().positive(),
    breadth: z.number().positive(),
    height: z.number().positive(),
    actualWeight: z.number().positive(),
    orderType: z.enum(['B2B', 'B2C']),
    paymentType: z.enum(['PREPAID', 'COD']),
    customerNotes: z.string().optional(),
    scheduledDate: z.string().optional(),
    items: z.array(z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      quantity: z.number().int().positive().optional().nullable(),
      declaredValue: z.number().positive(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      isFragile: z.boolean().optional().nullable(),
      handleWithCare: z.boolean().optional().nullable(),
      keepUpright: z.boolean().optional().nullable(),
    })).optional().nullable(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'CREATED',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'RESCHEDULED',
    ]),
    failureReason: z.string().optional(),
    remarks: z.string().optional(),
  }),
});

const rescheduleSchema = z.object({
  body: z.object({
    newScheduledDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    deliverySlot: z.string().optional(),
    reason: z.string().optional(),
  }),
});

// POST /api/orders/preview-price (Public/Auth preview)
router.post('/preview-price', validate(previewPriceSchema), async (req, res, next) => {
  try {
    const pricing = await pricingService.calculatePrice(req.body);
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders (Create Order)
router.post('/', authenticate, validate(createOrderSchema), async (req, res, next) => {
  try {
    const {
      pickupAddress,
      pickupPincode,
      dropAddress,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
      scheduledDate,
    } = req.body;

    const customerId = req.user.role === 'ADMIN' && req.body.customerId ? req.body.customerId : req.user.id;

    // Calculate dynamic price breakdown from rate cards
    const pricing = await pricingService.calculatePrice({
      pickupPincode,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
    });

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          createdBy: req.user?.id || customerId,
          createdByRole: req.user?.role || 'CUSTOMER',
          pickupAddress,
          pickupPincode,
          pickupZoneId: pricing.pickupZone.id,
          pickupLat: 28.6139 + (Math.random() - 0.5) * 0.1,
          pickupLng: 77.2090 + (Math.random() - 0.5) * 0.1,

          dropAddress,
          dropPincode,
          dropZoneId: pricing.dropZone.id,
          dropLat: 28.6139 + (Math.random() - 0.5) * 0.1,
          dropLng: 77.2090 + (Math.random() - 0.5) * 0.1,

          length,
          breadth,
          height,
          actualWeight,
          volumetricWeight: pricing.volumetricWeight,
          chargeableWeight: pricing.chargeableWeight,

          orderType,
          paymentType,
          zoneType: pricing.zoneType,

          deliveryCharge: pricing.deliveryCharge,
          codSurcharge: pricing.codSurcharge,
          totalAmount: pricing.totalAmount,

          status: 'CREATED',
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          items: req.body.items && req.body.items.length > 0 ? {
            create: req.body.items.map((it) => ({
              name: it.name,
              category: it.category || 'General',
              quantity: it.quantity || 1,
              declaredValue: parseFloat(it.declaredValue || 0),
              description: it.description || null,
              imageUrl: it.imageUrl || null,
              isFragile: Boolean(it.isFragile),
              handleWithCare: Boolean(it.handleWithCare),
              keepUpright: Boolean(it.keepUpright),
            })),
          } : undefined,
        },
        include: {
          pickupZone: true,
          dropZone: true,
          customer: true,
          items: true,
        },
      });

      // Immutable tracking log for CREATED state
      await tx.orderTracking.create({
        data: {
          orderId: order.id,
          status: 'CREATED',
          actorId: req.user.id,
          actorRole: req.user.role,
          remarks: `Order created. Chargeable weight ${pricing.chargeableWeight}kg (${pricing.zoneType}-ZONE ${orderType}).`,
        },
      });

      return order;
    });

    // Notify Customer
    await notificationService.notifyUser({
      userId: customerId,
      recipientEmail: req.user?.email || newOrder.customer?.email,
      orderId: newOrder.id,
      title: 'Order Confirmed',
      message: `Your order #${newOrder.orderNumber} has been successfully created for ₹${newOrder.totalAmount}.`,
      type: 'SUCCESS',
    });

    // Attempt Auto-Assignment immediately
    let assignedOrder = newOrder;
    let assignmentInfo = null;
    try {
      const assignResult = await assignmentService.autoAssignAgent(newOrder.id);
      if (assignResult && assignResult.order) {
        assignedOrder = assignResult.order;
        assignmentInfo = assignResult.assignment;
      } else if (assignResult) {
        assignedOrder = assignResult;
      }
    } catch (err) {
      console.log(`[AUTO-ASSIGN NOTICE] Order ${newOrder.id}: ${err.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: assignedOrder,
      assignment: assignmentInfo,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders (List Orders)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, zoneId, agentId, orderType, paymentType, search, dateFrom, dateTo, limit } = req.query;

    const where = {};

    // Role-based restrictions
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.id;
    } else if (req.user.role === 'AGENT') {
      if (!req.user.agentProfile) {
        return res.json({ success: true, orders: [] });
      }
      where.assignedAgentId = req.user.agentProfile.id;
    }

    // Status filter
    if (status) where.status = status;

    // Zone filter
    if (zoneId) {
      where.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
    }

    if (agentId) where.assignedAgentId = agentId;
    if (orderType) where.orderType = orderType;
    if (paymentType) where.paymentType = paymentType;

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search across order number, addresses, customer name
    if (search) {
      const searchConditions = [
        { orderNumber: { contains: search } },
        { pickupAddress: { contains: search } },
        { dropAddress: { contains: search } },
        { pickupPincode: { contains: search } },
        { dropPincode: { contains: search } },
      ];
      // For admin, also search by customer name/phone
      if (req.user.role === 'ADMIN') {
        searchConditions.push(
          { customer: { name: { contains: search } } },
          { customer: { phone: { contains: search } } },
          { customer: { email: { contains: search } } }
        );
      }
      where.OR = searchConditions;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        pickupZone: true,
        dropZone: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedAgent: { include: { user: { select: { id: true, name: true, phone: true } } } },
        tracking: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id (Order Details)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        pickupZone: true,
        dropZone: true,
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedAgent: { include: { user: { select: { id: true, name: true, phone: true } } } },
        assignments: {
          include: { agent: { include: { user: { select: { name: true, phone: true } } } } },
          orderBy: { assignedAt: 'desc' },
        },
        tracking: { orderBy: { timestamp: 'asc' } },
        reschedules: { orderBy: { createdAt: 'desc' } },
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Access control: ADMIN can view all orders.
    // Allow CUSTOMER / AGENT to view valid order tracking details.

    const eta = etaService.calculateETA(order);
    const risk = riskService.calculateRiskScore(order);

    res.json({ success: true, order, eta, riskScore: risk });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id/eta (Dynamic ETA prediction — Feature 17)
router.get('/:id/eta', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { assignedAgent: true },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const eta = etaService.calculateETA(order);
    res.json({ success: true, eta });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id/risk (Operational Delivery Risk Score — Feature 18)
router.get('/:id/risk', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { assignedAgent: { include: { _count: { select: { assignedOrders: true } } } } },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const risk = riskService.calculateRiskScore(order);
    res.json({ success: true, riskScore: risk });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id/tracking (Tracking Timeline)
router.get('/:id/tracking', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const tracking = await prisma.orderTracking.findMany({
      where: { orderId: id },
      orderBy: { timestamp: 'asc' },
    });
    res.json({ success: true, tracking });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/auto-assign (Auto-assign Agent)
router.post('/:id/auto-assign', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await assignmentService.autoAssignAgent(id);
    res.json({
      success: true,
      message: `Agent auto-assigned: ${result.assignment.agentName} (score: ${result.assignment.score})`,
      order: result.order,
      assignment: result.assignment,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/assign (Manual Assign Agent)
router.post('/:id/assign', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }
    const updatedOrder = await assignmentService.manualAssignAgent(id, agentId, req.user.id);
    res.json({ success: true, message: 'Agent assigned manually', order: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status (Update Order Status)
const handleStatusUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: nextStatus, failureReason, remarks } = req.body;

    const updatedOrder = await statusService.updateOrderStatus({
      orderId: id,
      nextStatus,
      actorId: req.user.id,
      actorRole: req.user.role,
      remarks,
      failureReason,
    });

    res.json({
      success: true,
      message: `Order status updated to ${nextStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    if (error.message.includes('Invalid transition') || error.message.includes('not found')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

router.patch('/:id/status', authenticate, validate(updateStatusSchema), handleStatusUpdate);
router.put('/:id/status', authenticate, validate(updateStatusSchema), handleStatusUpdate);

// POST /api/orders/:id/reschedule (Reschedule Failed Delivery)
router.post('/:id/reschedule', authenticate, validate(rescheduleSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newScheduledDate, deliverySlot, reason } = req.body;

    // Authorization: Customer can only reschedule own orders, Admin can reschedule any
    if (req.user.role === 'CUSTOMER') {
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order || order.customerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this order' });
      }
    }

    const rescheduledOrder = await statusService.rescheduleDelivery({
      orderId: id,
      newScheduledDate,
      deliverySlot,
      reason,
      rescheduledBy: req.user.role,
      actorId: req.user.id,
    });

    res.json({
      success: true,
      message: 'Order rescheduled successfully. A new agent will be assigned shortly.',
      order: rescheduledOrder,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/calculate-price (Alias for preview-price — satisfies spec requirement)
router.post('/calculate-price', validate(previewPriceSchema), async (req, res, next) => {
  try {
    const pricing = await pricingService.calculatePrice(req.body);
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id/route (Route history replay points — Feature 21)
router.get('/:id/route', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const points = await locationService.getRouteHistory({ orderId: id });
    res.json({ success: true, count: points.length, points });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/bulk-validate (CSV Validation — Feature 24)
router.post('/bulk-validate', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: 'rows array is required' });
    }
    const result = await bulkImportService.validateCSV(rows);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/bulk-import (CSV Bulk Import — Feature 24)
router.post('/bulk-import', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { validRows } = req.body;
    if (!Array.isArray(validRows)) {
      return res.status(400).json({ success: false, message: 'validRows array is required' });
    }
    const result = await bulkImportService.importValidOrders(validRows, req.user.id);
    res.json({ success: true, message: `Bulk import completed (${result.importedCount} created)`, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/cancel (Order Cancellation — Feature 25)
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, remarks } = req.body;

    const cancelledOrder = await cancellationService.cancelOrder({
      orderId: id,
      actorId: req.user.id,
      actorRole: req.user.role,
      reason,
      remarks,
    });

    res.json({ success: true, message: 'Order cancelled successfully', order: cancelledOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/pod/otp (Generate Delivery Verification OTP — Feature 26)
router.post('/:id/pod/otp', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await podService.generateDeliveryOTP(id);
    res.json({ success: true, message: 'Delivery OTP generated and sent to customer', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/pod/verify (Verify Delivery OTP & Mark DELIVERED — Feature 26)
router.post('/:id/pod/verify', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipientName, otp, notes } = req.body;
    const agentId = req.user.agentProfile?.id || req.user.id;

    const result = await podService.verifyOTPAndCompleteDelivery({
      orderId: id,
      agentId,
      recipientName,
      otp,
      notes,
    });

    res.json({ success: true, message: 'Delivery verified via OTP and marked DELIVERED', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id/assignment-explanation
router.get('/:id/assignment-explanation', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const explanation = await assignmentExplanationService.explainAssignment(id);
    res.json({ success: true, ...explanation });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/assignment-simulation
router.post('/:id/assignment-simulation', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const simulation = await assignmentSimulationService.simulateCandidates(id);
    res.json({ success: true, ...simulation });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id/rate-explanation
router.get('/:id/rate-explanation', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const explanation = await rateExplanationService.explainRate(id);
    res.json({ success: true, ...explanation });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/tracking-qr
router.post('/:id/tracking-qr', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const qrData = await qrTrackingService.generateTrackingQR(id);
    res.json({ success: true, ...qrData });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/rate — Submit Delivery Rating & Feedback
router.post('/:id/rate', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, fastDelivery, professionalAgent, easyTracking, goodCommunication, feedback } = req.body;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const ratingRecord = await prisma.deliveryRating.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        customerId: req.user.id,
        agentId: order.assignedAgentId || 'SYSTEM',
        rating: Number(rating) || 5,
        fastDelivery: Boolean(fastDelivery),
        professionalAgent: Boolean(professionalAgent),
        easyTracking: Boolean(easyTracking),
        goodCommunication: Boolean(goodCommunication),
        feedback: feedback || '',
      },
      update: {
        rating: Number(rating) || 5,
        fastDelivery: Boolean(fastDelivery),
        professionalAgent: Boolean(professionalAgent),
        easyTracking: Boolean(easyTracking),
        goodCommunication: Boolean(goodCommunication),
        feedback: feedback || '',
      },
    });

    res.json({ success: true, message: 'Rating submitted successfully!', rating: ratingRecord });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

