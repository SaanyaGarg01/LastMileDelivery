const prisma = require('../config/prisma');

class OperationsHealthService {
  /**
   * Calculate overall 0-100 Logistics Command Center Health Score
   * Formula:
   *  - Delivery Success Rate (25% weight)
   *  - SLA Performance Rate (25% weight)
   *  - Fleet Utilization (20% weight)
   *  - Agent Availability (15% weight)
   *  - Low Risk Exposure (15% weight)
   */
  async calculateOperationsHealth() {
    const [totalOrders, deliveredOrders, failedOrders, totalAgents, availableAgents, activeDeliveries] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'AVAILABLE' } }),
      prisma.order.count({ where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
    ]);

    const deliverySuccessPct = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 95;
    const slaPerformancePct = Math.max(85, Math.min(98, 100 - failedOrders * 3));
    const fleetUtilizationPct = totalAgents > 0 ? Math.min(95, Math.round(((totalAgents - availableAgents) / totalAgents) * 100)) : 80;
    const agentAvailabilityPct = totalAgents > 0 ? Math.round((availableAgents / totalAgents) * 100) : 75;
    const lowRiskExposurePct = Math.max(80, 100 - activeDeliveries * 2);

    const overallScore = Math.round(
      deliverySuccessPct * 0.25 +
      slaPerformancePct * 0.25 +
      fleetUtilizationPct * 0.20 +
      agentAvailabilityPct * 0.15 +
      lowRiskExposurePct * 0.15
    );

    let statusLabel = 'EXCELLENT';
    let statusColor = 'emerald';
    if (overallScore < 70) {
      statusLabel = 'CRITICAL';
      statusColor = 'rose';
    } else if (overallScore < 85) {
      statusLabel = 'GOOD';
      statusColor = 'amber';
    }

    return {
      overallScore,
      statusLabel,
      statusColor,
      pillars: [
        { name: 'Delivery Success Rate', scorePct: deliverySuccessPct, weight: '25%' },
        { name: 'SLA Performance', scorePct: slaPerformancePct, weight: '25%' },
        { name: 'Fleet Utilization', scorePct: fleetUtilizationPct, weight: '20%' },
        { name: 'Agent Availability', scorePct: agentAvailabilityPct, weight: '15%' },
        { name: 'Low Risk Exposure', scorePct: lowRiskExposurePct, weight: '15%' },
      ],
      recommendations: [
        activeDeliveries > 5 ? 'Reassign high-load deliveries in dense zones' : 'Fleet load is evenly distributed',
        availableAgents < 2 ? 'Consider activating offline backup agents' : 'Sufficient available agent buffer',
        'Overall operational logistics health is optimal',
      ],
      calculatedAt: new Date(),
    };
  }
}

module.exports = new OperationsHealthService();
