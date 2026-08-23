const prisma = require('../config/prisma');
const notificationService = require('./notification.service');
const auditService = require('./audit.service');

class CancellationService {
  /**
   * Allowed cancellation statuses: CREATED, ASSIGNED, RESCHEDULED, FAILED
   * Restricted: PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
   */
  static ALLOWED_CANCELLATION_STATUSES = ['CREATED', 'ASSIGNED', 'RESCHEDULED', 'FAILED'];

  async cancelOrder({ orderId, actorId, actorRole, reason = 'Changed my mind', remarks = '' }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, assignedAgent: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status === 'CANCELLED') {
      throw new Error('Order is already cancelled');
    }

    if (order.status === 'DELIVERED') {
      throw new Error('Delivered orders cannot be cancelled');
    }

    if (!CancellationService.ALLOWED_CANCELLATION_STATUSES.includes(order.status) && actorRole !== 'ADMIN') {
      throw new Error(`Order in status '${order.status}' cannot be cancelled once package is picked up/in transit`);
    }

    const nextPaymentStatus = order.paymentType === 'PREPAID' ? 'REFUND_PENDING' : 'NOT_APPLICABLE';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: actorRole,
          paymentStatus: nextPaymentStatus,
        },
      });

      // Release agent if assigned
      if (order.assignedAgentId) {
        await tx.orderAssignment.updateMany({
          where: { orderId, agentId: order.assignedAgentId, status: 'ACTIVE' },
          data: { status: 'FAILED', unassignedAt: new Date() },
        });

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

      // Add tracking log
      await tx.orderTracking.create({
        data: {
          orderId,
          status: 'CANCELLED',
          actorId: actorId || 'SYSTEM',
          actorRole,
          remarks: `Cancelled by ${actorRole}. Reason: ${reason}${remarks ? '. ' + remarks : ''}`,
        },
      });

      return updated;
    });

    // Record audit event
    auditService.logEvent({
      actorId: actorId || 'SYSTEM',
      actorRole,
      action: 'CANCEL_ORDER',
      entityType: 'Order',
      entityId: orderId,
      previousValue: { status: order.status },
      newValue: { status: 'CANCELLED', reason, paymentStatus: nextPaymentStatus },
      details: `Order #${order.orderNumber} cancelled by ${actorRole}`,
    }).catch(() => {});

    // Notify customer
    notificationService.notifyUser({
      userId: order.customerId,
      orderId,
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled. Reason: ${reason}.${order.paymentType === 'PREPAID' ? ' Refund process initiated.' : ''}`,
      type: 'WARNING',
    }).catch(() => {});

    return updatedOrder;
  }
}

module.exports = new CancellationService();
