const prisma = require('../config/prisma');

class AssignmentSimulationService {
  /**
   * Compare candidate agents side-by-side without mutating the order
   */
  async simulateCandidates(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupZone: true, dropZone: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    const availableAgents = await prisma.agent.findMany({
      where: { status: { in: ['AVAILABLE', 'BUSY'] } },
      include: {
        user: { select: { name: true, phone: true } },
        assignedOrders: true,
      },
    });

    const candidateComparisons = availableAgents.map((agent) => {
      const activeCount = agent.assignedOrders.length;
      const isMaxedOut = activeCount >= agent.maxCapacity;

      // Simulated Distance to pickup
      const simulatedDistKm = Math.round((1.2 + (agent.id.charCodeAt(0) % 5) * 0.8) * 10) / 10;
      const etaMinutes = Math.round(10 + simulatedDistKm * 3.5);

      // Score calculation
      const distScore = Math.max(0, 30 - Math.round(simulatedDistKm * 2));
      const loadScore = Math.max(0, 25 - activeCount * 5);
      const zoneScore = 20;
      const totalScore = isMaxedOut ? 35 : distScore + loadScore + zoneScore + 15;

      let riskCategory = '🟢 LOW';
      if (isMaxedOut) riskCategory = '🔴 CRITICAL (Capacity Limit)';
      else if (activeCount >= agent.maxCapacity - 1) riskCategory = '🟡 MEDIUM';

      return {
        agentId: agent.id,
        agentName: agent.user.name,
        phone: agent.user.phone,
        vehicleType: agent.vehicleType,
        distanceKm: simulatedDistKm,
        workload: `${activeCount} / ${agent.maxCapacity}`,
        predictedETA: `${etaMinutes} min`,
        riskCategory,
        totalScore,
        isEligible: !isMaxedOut,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);

    const recommended = candidateComparisons.find((c) => c.isEligible) || candidateComparisons[0];

    return {
      orderId,
      orderNumber: order.orderNumber,
      candidates: candidateComparisons,
      recommendedCandidate: recommended,
      recommendationReason: recommended
        ? `${recommended.agentName} offers the best balance of proximity (${recommended.distanceKm} km), active capacity (${recommended.workload}), and low SLA risk.`
        : 'All agents are currently operating at maximum load capacity.',
    };
  }
}

module.exports = new AssignmentSimulationService();
