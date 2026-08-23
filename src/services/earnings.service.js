const prisma = require('../config/prisma');

class EarningsService {
  /**
   * Calculate and record agent payout for a delivered order
   * Configurable rule: Base payout ₹40 + distance incentive (₹8/km) + bonus ₹10 for fast SLA
   */
  async calculateAndRecordEarning(order) {
    if (!order || !order.assignedAgentId) return null;

    const basePayout = 40; // ₹40 base payout per delivery
    const distanceKm = order.zoneType === 'INTER' ? 12 : 5;
    const distanceIncentive = Math.round(distanceKm * 8); // ₹8 per km
    const deliveryBonus = order.slaStatus === 'MET' ? 10 : 0;
    const totalEarning = basePayout + distanceIncentive + deliveryBonus;

    const earning = await prisma.agentEarning.create({
      data: {
        agentId: order.assignedAgentId,
        orderId: order.id,
        basePayout,
        distanceIncentive,
        deliveryBonus,
        totalEarning,
        settlementStatus: 'PENDING',
      },
    });

    return earning;
  }

  /**
   * Get agent earnings history and totals
   */
  async getAgentEarnings(agentId) {
    const earnings = await prisma.agentEarning.findMany({
      where: { agentId },
      include: {
        order: { select: { orderNumber: true, status: true, createdAt: true, totalAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = earnings.reduce((sum, e) => sum + e.totalEarning, 0);
    const pendingSettlement = earnings.filter((e) => e.settlementStatus === 'PENDING').reduce((sum, e) => sum + e.totalEarning, 0);
    const paidSettlement = earnings.filter((e) => e.settlementStatus === 'PAID').reduce((sum, e) => sum + e.totalEarning, 0);

    return {
      earnings,
      summary: {
        totalEarned: Math.round(totalEarned * 100) / 100,
        pendingSettlement: Math.round(pendingSettlement * 100) / 100,
        paidSettlement: Math.round(paidSettlement * 100) / 100,
        completedDeliveriesCount: earnings.length,
      },
    };
  }

  /**
   * Admin settlement status update (PENDING -> APPROVED -> PAID)
   */
  async updateSettlementStatus(earningIds, status) {
    if (!['PENDING', 'APPROVED', 'PAID'].includes(status)) {
      throw new Error('Invalid settlement status');
    }

    const updated = await prisma.agentEarning.updateMany({
      where: { id: { in: earningIds } },
      data: { settlementStatus: status },
    });

    return updated;
  }
}

module.exports = new EarningsService();
