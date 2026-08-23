const etaService = require('./eta.service');

class RiskService {
  /**
   * Calculate 5-factor delivery risk score for an order
   *
   * Risk Factors:
   *   1. Delay Risk         : >30m since creation without pickup or late vs scheduled date (max 30 pts)
   *   2. Agent Workload Risk: Agent near max capacity (active orders >= 4) (max 20 pts)
   *   3. Route/Distance Risk: INTER-ZONE + long distance (>12 km) (max 20 pts)
   *   4. Reschedule/Failure : Previous failed attempt / rescheduled (max 20 pts)
   *   5. Inactivity Risk    : >45 min since last tracking update (max 10 pts)
   *
   * Level:
   *   Score >= 60 : HIGH   🔴
   *   Score >= 35 : MEDIUM 🟡
   *   Score < 35  : LOW    🟢
   */
  calculateRiskScore(order) {
    if (!order || order.status === 'DELIVERED') {
      return { score: 0, level: 'LOW', factors: [], recommendation: 'Delivered successfully' };
    }

    let score = 0;
    const factors = [];

    const now = new Date();
    const createdAt = new Date(order.createdAt);
    const elapsedMinutes = (now - createdAt) / (1000 * 60);

    // Factor 1: Delay Risk
    if (order.status === 'CREATED' && elapsedMinutes > 30) {
      score += 25;
      factors.push(`Unassigned for ${Math.round(elapsedMinutes)} minutes`);
    } else if (order.scheduledDate && new Date(order.scheduledDate) < now && order.status !== 'DELIVERED') {
      score += 30;
      factors.push('Past scheduled delivery time');
    } else if (elapsedMinutes > 120 && order.status !== 'OUT_FOR_DELIVERY') {
      score += 20;
      factors.push(`Total order duration ${Math.round(elapsedMinutes / 60)}h ${Math.round(elapsedMinutes % 60)}m`);
    }

    // Factor 2: Agent Workload Risk
    const agent = order.assignedAgent;
    if (agent) {
      const activeCount = agent._count?.assignedOrders || (agent.status === 'BUSY' ? 3 : 1);
      const capacity = agent.maxCapacity || 5;
      if (activeCount >= capacity) {
        score += 20;
        factors.push(`Agent is at full capacity (${activeCount}/${capacity} active orders)`);
      } else if (activeCount >= 3) {
        score += 10;
        factors.push(`Agent high workload (${activeCount}/${capacity} active orders)`);
      }
    } else if (order.status !== 'CREATED') {
      score += 20;
      factors.push('No assigned agent');
    }

    // Factor 3: Route/Distance Risk
    if (order.zoneType === 'INTER') {
      score += 10;
      factors.push('Inter-zone cross-city shipment');
    }
    const eta = etaService.calculateETA(order);
    if (eta.remainingDistanceKm > 15) {
      score += 10;
      factors.push(`Long distance route (${eta.remainingDistanceKm} km)`);
    }

    // Factor 4: Reschedule / Failed attempt history
    if (order.status === 'FAILED') {
      score += 30;
      factors.push('Current status is FAILED — requires rescheduling');
    } else if (order.rescheduleCount > 0) {
      score += 20;
      factors.push(`Previously rescheduled (${order.rescheduleCount} attempt${order.rescheduleCount > 1 ? 's' : ''})`);
    }

    // Factor 5: Inactivity Risk
    const lastUpdate = order.updatedAt ? new Date(order.updatedAt) : createdAt;
    const inactiveMinutes = (now - lastUpdate) / (1000 * 60);
    if (inactiveMinutes > 45 && order.status !== 'CREATED' && order.status !== 'RESCHEDULED') {
      score += 10;
      factors.push(`Inactivity for ${Math.round(inactiveMinutes)} minutes without status change`);
    }

    // Determine Level
    score = Math.min(100, Math.max(0, score));
    const level = score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';

    let recommendation = 'On track — normal monitoring';
    if (level === 'HIGH') {
      recommendation = '⚠ Action Required: Consider manual agent reassignment or priority dispatching.';
    } else if (level === 'MEDIUM') {
      recommendation = 'Monitor progress — potential delay risks identified.';
    }

    return {
      score,
      level,
      factors,
      recommendation,
      eta,
    };
  }
}

module.exports = new RiskService();
