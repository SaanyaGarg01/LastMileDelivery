const statusService = require('./status.service');
const auditService = require('./audit.service');
const prisma = require('../config/prisma');

class SimulationService {
  /**
   * Execute a controlled demo status transition
   * Calls the exact same statusService underlying logic so real tracking, notifications, and workload updates occur!
   */
  async simulateStatusTransition({ orderId, nextStatus, failureReason = '', remarks = '', adminUserId, adminName }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, assignedAgent: { include: { user: true } } },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    const prevStatus = order.status;

    // Use actual statusService to update status — triggers real tracking, notifications, agent workload release
    const updatedOrder = await statusService.updateOrderStatus({
      orderId,
      nextStatus,
      actorId: adminUserId || 'SYSTEM-SIMULATOR',
      actorRole: 'ADMIN',
      remarks: remarks ? `[DEMO SIMULATION] ${remarks}` : `[DEMO SIMULATION] Simulated transition from ${prevStatus} to ${nextStatus}`,
      failureReason,
    });

    // Record audit log event for demo simulation
    await auditService.logEvent({
      actorId: adminUserId || 'SYSTEM-SIMULATOR',
      actorName: adminName || 'Admin Simulator',
      actorRole: 'ADMIN',
      action: 'SIMULATE_STEP',
      entityType: 'Order',
      entityId: orderId,
      previousValue: { status: prevStatus },
      newValue: { status: nextStatus, failureReason },
      details: `Simulated order ${order.orderNumber} status change from ${prevStatus} to ${nextStatus}`,
    });

    return {
      order: updatedOrder,
      simulation: {
        prevStatus,
        nextStatus,
        orderNumber: order.orderNumber,
        timestamp: new Date(),
        isSimulated: true,
      },
    };
  }
}

module.exports = new SimulationService();
