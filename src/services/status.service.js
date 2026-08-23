const prisma = require('../config/prisma');
const notificationService = require('./notification.service');
const smsService = require('./sms.service');
const assignmentService = require('./assignment.service');
const auditService = require('./audit.service');

class StatusService {
  /**
   * Valid status transition matrix
   * DELIVERED is terminal — no transitions allowed
   */
  static VALID_TRANSITIONS = {
    CREATED: ['ASSIGNED'],
    ASSIGNED: ['PICKED_UP', 'ASSIGNED', 'FAILED'],
    PICKED_UP: ['IN_TRANSIT', 'FAILED'],
    IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
    FAILED: ['RESCHEDULED'],
    RESCHEDULED: ['ASSIGNED'],
    DELIVERED: [],
  };

  static STATUS_LABELS = {
    CREATED: 'Order Created',
    ASSIGNED: 'Agent Assigned',
    PICKED_UP: 'Package Picked Up',
    IN_TRANSIT: 'In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    FAILED: 'Delivery Failed',
    RESCHEDULED: 'Rescheduled',
  };

  static FAILURE_REASONS = [
    'Customer unavailable / door locked',
    'Wrong / incomplete address',
    'Customer refused package',
    'Customer refused to pay (COD)',
    'Vehicle breakdown',
    'Unable to reach location',
    'Other',
  ];

  /**
   * Check if a status transition is valid
   * Admin override bypasses the matrix but still logs
   */
  isValidTransition(currentStatus, nextStatus, isOverride = false) {
    if (isOverride) return true;
    const allowed = StatusService.VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Update Order Status with full audit trail
   */
  async updateOrderStatus({ orderId, nextStatus, actorId, actorRole, remarks = '', failureReason = '' }) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { assignedAgent: { include: { user: true } }, customer: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status === 'DELIVERED') {
      throw new Error('This order has already been delivered and cannot be modified.');
    }

    const isOverride = actorRole === 'ADMIN' && !StatusService.VALID_TRANSITIONS[order.status]?.includes(nextStatus);

    if (!this.isValidTransition(order.status, nextStatus, isOverride)) {
      throw new Error(
        `Invalid status transition from '${order.status}' to '${nextStatus}'. Workflow rules prevent this change.`
      );
    }

    if (nextStatus === 'FAILED') {
      if (!failureReason && !remarks) {
        throw new Error('Failure reason is required when marking order as FAILED');
      }
    }

    // AGENT authorization: can only update their assigned orders
    if (actorRole === 'AGENT') {
      const agent = await prisma.agent.findFirst({ where: { userId: actorId } });
      if (!agent || order.assignedAgentId !== agent.id) {
        throw new Error('You can only update status for your assigned orders');
      }
    }

    const trackingRemarks = failureReason
      ? `Failed: ${failureReason}${remarks ? '. ' + remarks : ''}`
      : isOverride
      ? `[ADMIN OVERRIDE] Status set to ${nextStatus}. ${remarks}`
      : remarks || `Order status updated to ${StatusService.STATUS_LABELS[nextStatus] || nextStatus}`;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: {
          assignedAgent: { include: { user: true } },
          customer: true,
          pickupZone: true,
          dropZone: true,
        },
      });

      // 2. Handle agent on terminal states
      if ((nextStatus === 'DELIVERED' || nextStatus === 'FAILED') && order.assignedAgentId) {
        // Mark current assignment as completed/failed
        await tx.orderAssignment.updateMany({
          where: { orderId, agentId: order.assignedAgentId, status: 'ACTIVE' },
          data: {
            status: nextStatus === 'DELIVERED' ? 'COMPLETED' : 'FAILED',
            unassignedAt: new Date(),
          },
        });

        // Check if agent has any OTHER active orders before releasing
        const otherActiveOrders = await tx.order.count({
          where: {
            assignedAgentId: order.assignedAgentId,
            status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
            id: { not: orderId },
          },
        });

        if (otherActiveOrders === 0) {
          await tx.agent.update({
            where: { id: order.assignedAgentId },
            data: { status: 'AVAILABLE', activeOrderId: null },
          });
        }
      }

      // 3. Create immutable tracking log
      await tx.orderTracking.create({
        data: {
          orderId,
          status: nextStatus,
          actorId: actorId || 'SYSTEM',
          actorRole: actorRole || 'SYSTEM',
          remarks: trackingRemarks,
        },
      });

      return updated;
    });

    // 4. Record Audit Log Event
    auditService.logEvent({
      actorId: actorId || 'SYSTEM',
      actorRole: actorRole || 'SYSTEM',
      action: isOverride ? 'OVERRIDE_STATUS' : 'STATUS_CHANGE',
      entityType: 'Order',
      entityId: orderId,
      previousValue: { status: order.status },
      newValue: { status: nextStatus, failureReason },
      details: trackingRemarks,
    }).catch(() => {});

    // 5. Send notifications (non-blocking)
    this._sendStatusNotification(order, nextStatus, failureReason).catch(() => {});

    return updatedOrder;
  }

  /**
   * Send status-based Email & SMS notification to customer
   */
  async _sendStatusNotification(order, nextStatus, failureReason) {
    const messageMap = {
      ASSIGNED: `Agent ${order.assignedAgent?.user?.name || 'Assigned'} has been assigned to shipment #${order.orderNumber}.`,
      PICKED_UP: `Your package for order #${order.orderNumber} has been picked up from ${order.pickupAddress}.`,
      IN_TRANSIT: `Your order #${order.orderNumber} is in transit and on its way to ${order.dropAddress}.`,
      OUT_FOR_DELIVERY: `Great news! Your order #${order.orderNumber} is out for delivery and will arrive soon.`,
      DELIVERED: `Your order #${order.orderNumber} has been successfully delivered. Thank you for using Last-Mile Tracker!`,
      FAILED: `Delivery attempt for order #${order.orderNumber} failed. Reason: ${failureReason || 'Customer unavailable'}. You can reschedule from your order page.`,
      RESCHEDULED: `Your order #${order.orderNumber} has been rescheduled.`,
    };

    const titleMap = {
      ASSIGNED: 'Agent Assigned',
      PICKED_UP: 'Order Picked Up',
      IN_TRANSIT: 'In Transit',
      OUT_FOR_DELIVERY: '🚴 Out for Delivery!',
      DELIVERED: '✅ Order Delivered!',
      FAILED: '❌ Delivery Failed',
      RESCHEDULED: '🗓️ Delivery Rescheduled',
    };

    if (!messageMap[nextStatus]) return;

    // 1. Send HTML Email & In-App Notification
    await notificationService.notifyUser({
      userId: order.customerId,
      recipientEmail: order.customer?.email,
      orderId: order.id,
      title: titleMap[nextStatus],
      message: messageMap[nextStatus],
      type: nextStatus === 'DELIVERED' ? 'SUCCESS' : nextStatus === 'FAILED' ? 'ALERT' : 'INFO',
    }).catch(() => {});

    // 2. Send SMS Notification
    await smsService.sendOrderStatusSMS({
      order,
      type: nextStatus,
      status: nextStatus,
      message: messageMap[nextStatus],
    }).catch(() => {});
  }

  /**
   * Reschedule a failed delivery
   * Creates reschedule record, updates to RESCHEDULED, triggers auto-assign
   */
  async rescheduleDelivery({ orderId, newScheduledDate, deliverySlot, reason = '', rescheduledBy, actorId }) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { customer: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.status !== 'FAILED') throw new Error('Only orders in FAILED status can be rescheduled');

    const scheduledDateTime = new Date(newScheduledDate);
    if (isNaN(scheduledDateTime.getTime())) throw new Error('Invalid scheduled date provided');
    if (scheduledDateTime < new Date()) throw new Error('Scheduled date must be in the future');

    const previousAgentId = order.assignedAgentId;

    const rescheduledOrder = await prisma.$transaction(async (tx) => {
      // 1. Create reschedule record
      await tx.reschedule.create({
        data: {
          orderId,
          previousAgentId,
          newScheduledDate: scheduledDateTime,
          reason: reason || 'Customer requested rescheduling',
          rescheduledBy,
        },
      });

      // 2. Update order to RESCHEDULED, clear agent
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'RESCHEDULED',
          assignedAgentId: null,
          scheduledDate: scheduledDateTime,
          rescheduleCount: (order.rescheduleCount || 0) + 1,
        },
      });

      // 3. Release previous agent if set
      if (previousAgentId) {
        const otherActive = await tx.order.count({
          where: {
            assignedAgentId: previousAgentId,
            status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
            id: { not: orderId },
          },
        });
        if (otherActive === 0) {
          await tx.agent.update({
            where: { id: previousAgentId },
            data: { status: 'AVAILABLE', activeOrderId: null },
          });
        }
      }

      // 4. Immutable tracking entry
      await tx.orderTracking.create({
        data: {
          orderId,
          status: 'RESCHEDULED',
          actorId,
          actorRole: rescheduledBy,
          remarks: `Order rescheduled for ${scheduledDateTime.toLocaleDateString()}${deliverySlot ? ' ' + deliverySlot : ''}. Reason: ${reason || 'Customer request'}`,
        },
      });

      return updated;
    });

    // Notify customer
    notificationService.notifyUser({
      userId: order.customerId,
      orderId,
      title: 'Delivery Rescheduled',
      message: `Your order #${order.orderNumber} has been rescheduled for ${scheduledDateTime.toLocaleDateString()}. A new agent will be assigned shortly.`,
      type: 'SUCCESS',
    }).catch(() => {});

    // Auto-assign new agent (non-blocking)
    assignmentService.autoAssignAgent(orderId).catch((err) => {
      console.log(`[RESCHEDULE AUTO-ASSIGN QUEUED] Order ${orderId}: ${err.message}`);
    });

    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignedAgent: { include: { user: true } },
        customer: true,
        pickupZone: true,
        dropZone: true,
        tracking: { orderBy: { timestamp: 'asc' } },
      },
    });
  }
}

module.exports = new StatusService();
