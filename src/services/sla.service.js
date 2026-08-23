const prisma = require('../config/prisma');

class SLAService {
  /**
   * Calculate SLA status for an order
   */
  calculateSLA(order) {
    if (!order) return { slaStatus: 'ON_TRACK', promisedDeliveryDate: null, deadline: null };

    const createdAt = new Date(order.createdAt);
    // Default SLA: 2 hours for INTRA zone, 6 hours for INTER zone unless promised date set
    const slaHours = order.zoneType === 'INTER' ? 6 : 2;
    const deadline = order.slaDeadline
      ? new Date(order.slaDeadline)
      : new Date(createdAt.getTime() + slaHours * 3600000);

    const now = new Date();

    if (order.status === 'DELIVERED') {
      const deliveredAt = order.actualDeliveryAt ? new Date(order.actualDeliveryAt) : new Date(order.updatedAt);
      const isLate = deliveredAt > deadline;
      return {
        slaStatus: isLate ? 'BREACHED' : 'MET',
        promisedWindow: order.deliverySlotLabel || `${slaHours}h Standard SLA`,
        deadline,
        deliveredAt,
        isBreached: isLate,
        isMet: !isLate,
      };
    }

    if (now > deadline) {
      return {
        slaStatus: 'BREACHED',
        promisedWindow: order.deliverySlotLabel || `${slaHours}h Standard SLA`,
        deadline,
        isBreached: true,
        minutesOverdue: Math.round((now - deadline) / 60000),
      };
    }

    const minutesRemaining = (deadline - now) / 60000;
    const isAtRisk = minutesRemaining < 30 && order.status !== 'OUT_FOR_DELIVERY';

    return {
      slaStatus: isAtRisk ? 'AT_RISK' : 'ON_TRACK',
      promisedWindow: order.deliverySlotLabel || `${slaHours}h Standard SLA`,
      deadline,
      minutesRemaining: Math.round(minutesRemaining),
      isAtRisk,
    };
  }

  /**
   * Get active delivery slots
   */
  async getActiveDeliverySlots() {
    return await prisma.deliverySlot.findMany({
      where: { isActive: true },
      orderBy: { startTime: 'asc' },
    });
  }
}

module.exports = new SLAService();
