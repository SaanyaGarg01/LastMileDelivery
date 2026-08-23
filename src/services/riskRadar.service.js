const prisma = require('../config/prisma');
const riskService = require('./risk.service');

class RiskRadarService {
  /**
   * Aggregate delivery risk metrics into 🟢 ON_TRACK, 🟡 AT_RISK, 🔴 CRITICAL radar categories
   */
  async getRiskRadarData() {
    try {
      const activeOrders = await prisma.order.findMany({
        where: {
          status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'FAILED', 'RESCHEDULED'] },
        },
        include: {
          assignedAgent: { include: { user: { select: { name: true } }, orders: true } },
          customer: { select: { name: true, phone: true } },
          pickupZone: true,
          dropZone: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      const evaluatedOrders = activeOrders.map((order) => {
        const risk = riskService.calculateRiskScore(order);
        let radarCategory = 'ON_TRACK';
        if (risk.level === 'HIGH' || order.status === 'FAILED') radarCategory = 'CRITICAL';
        else if (risk.level === 'MEDIUM' || order.slaStatus === 'AT_RISK') radarCategory = 'AT_RISK';

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          slaStatus: order.slaStatus,
          customerName: order.customer?.name,
          assignedAgentName: order.assignedAgent?.user?.name || 'Unassigned',
          pickupZone: order.pickupZone?.name,
          dropZone: order.dropZone?.name,
          zoneType: order.zoneType,
          totalAmount: order.totalAmount,
          riskScore: risk.score,
          riskLevel: risk.level,
          radarCategory,
          factors: risk.factors,
          recommendation: risk.recommendation,
          updatedAt: order.updatedAt,
        };
      });

      const critical = evaluatedOrders.filter((o) => o.radarCategory === 'CRITICAL');
      const atRisk = evaluatedOrders.filter((o) => o.radarCategory === 'AT_RISK');
      const onTrack = evaluatedOrders.filter((o) => o.radarCategory === 'ON_TRACK');

      return {
        summary: {
          totalActive: evaluatedOrders.length,
          criticalCount: critical.length,
          atRiskCount: atRisk.length,
          onTrackCount: onTrack.length,
        },
        criticalOrders: critical,
        atRiskOrders: atRisk,
        onTrackOrders: onTrack,
        allOrders: evaluatedOrders,
      };
    } catch (err) {
      console.error('[RISK RADAR ERROR]', err.message);
      return {
        summary: { totalActive: 0, criticalCount: 0, atRiskCount: 0, onTrackCount: 0 },
        criticalOrders: [],
        atRiskOrders: [],
        onTrackOrders: [],
        allOrders: [],
      };
    }
  }
}

module.exports = new RiskRadarService();
