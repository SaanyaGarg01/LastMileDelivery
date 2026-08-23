const prisma = require('../config/prisma');
const riskService = require('./risk.service');
const analyticsService = require('./insights.service');

/**
 * Logistics Copilot Service
 *
 * Provides structured context for AI-assisted logistics operations.
 * Never returns sensitive data, credentials, or unnecessary customer PII.
 */
class LogisticsCopilotService {
  /**
   * Get summary of delivery delays for today
   */
  async analyzeDeliveryDelays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get orders created today
    const ordersToday = await prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: 'DELIVERED' },
      },
      include: {
        assignedAgent: { include: { _count: { select: { assignedOrders: { where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } } } } } },
        pickupZone: true,
        dropZone: true,
      },
    });

    if (ordersToday.length === 0) {
      return { delayCount: 0, causes: [], recommendations: [] };
    }

    // Analyze risk factors
    const highRiskOrders = ordersToday
      .map((order) => ({ order, risk: riskService.calculateRiskScore(order) }))
      .filter((item) => item.risk.level === 'HIGH');

    // Zone analysis
    const zoneStats = {};
    ordersToday.forEach((order) => {
      if (!zoneStats[order.pickupZoneId]) {
        zoneStats[order.pickupZoneId] = { zone: order.pickupZone, count: 0, highRisk: 0 };
      }
      zoneStats[order.pickupZoneId].count++;
      const risk = riskService.calculateRiskScore(order);
      if (risk.level === 'HIGH') {
        zoneStats[order.pickupZoneId].highRisk++;
      }
    });

    // Agent workload analysis
    const overloadedAgents = [];
    const agentMap = {};
    ordersToday.forEach((order) => {
      if (order.assignedAgent) {
        if (!agentMap[order.assignedAgent.id]) {
          agentMap[order.assignedAgent.id] = { agent: order.assignedAgent, count: 0 };
        }
        agentMap[order.assignedAgent.id].count++;
      }
    });

    Object.values(agentMap).forEach((item) => {
      const utilization = item.count / (item.agent.maxCapacity || 5);
      if (utilization > 0.8) {
        overloadedAgents.push({
          agentId: item.agent.id,
          name: item.agent.user?.name || 'Unknown',
          utilization: Math.round(utilization * 100),
          activeOrders: item.count,
          capacity: item.agent.maxCapacity || 5,
        });
      }
    });

    // SLA risk analysis
    const slaAtRisk = ordersToday.filter(
      (order) => order.slaStatus === 'AT_RISK' || order.slaStatus === 'BREACHED'
    );

    return {
      delayCount: highRiskOrders.length,
      totalOrders: ordersToday.length,
      causes: [
        overloadedAgents.length > 0 && {
          title: 'Agent Capacity',
          description: `${overloadedAgents.length} agent(s) are at high utilization`,
          count: overloadedAgents.length,
          severity: 'HIGH',
          agents: overloadedAgents,
        },
        slaAtRisk.length > 0 && {
          title: 'SLA Risk',
          description: `${slaAtRisk.length} shipment(s) approaching SLA deadline`,
          count: slaAtRisk.length,
          severity: 'MEDIUM',
          orderIds: slaAtRisk.map((o) => o.id),
        },
        Object.values(zoneStats).some((z) => z.count > 30) && {
          title: 'Zone Overload',
          description: 'Some zones have unusually high order volume',
          zones: Object.values(zoneStats)
            .filter((z) => z.count > 30)
            .map((z) => ({
              zoneId: z.zone.id,
              zoneName: z.zone.name,
              orders: z.count,
              percentageAboveNormal: Math.round(((z.count - 20) / 20) * 100),
            })),
        },
      ].filter(Boolean),
      recommendations: [
        overloadedAgents.length > 0 && `Consider distributing orders from overloaded agents or activating reserve fleet`,
        slaAtRisk.length > 0 && `Prioritize reassignment of ${slaAtRisk.length} at-risk shipment(s)`,
        highRiskOrders.length > 0 && `Monitor ${highRiskOrders.length} high-risk delivery(ies) closely`,
      ].filter(Boolean),
      highRiskOrders: highRiskOrders.slice(0, 5).map((item) => ({
        orderId: item.order.id,
        orderNumber: item.order.orderNumber,
        riskScore: item.risk.score,
        riskLevel: item.risk.level,
        factors: item.risk.factors.slice(0, 3),
      })),
    };
  }

  /**
   * Get overall operational metrics
   */
  async getOperationalMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: today } },
      include: {
        assignedAgent: { include: { user: { select: { name: true } } } },
        pod: true,
      },
    });

    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { name: true } },
        _count: {
          select: {
            assignedOrders: {
              where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
            },
          },
        },
      },
    });

    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const failed = orders.filter((o) => o.status === 'FAILED').length;
    const active = orders.filter((o) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
    const created = orders.filter((o) => o.status === 'CREATED').length;

    const avgDeliveryTime = orders
      .filter((o) => o.pod)
      .reduce((sum, o) => {
        const time = (new Date(o.pod.verifiedAt) - new Date(o.createdAt)) / (1000 * 60);
        return sum + time;
      }, 0) / Math.max(1, orders.filter((o) => o.pod).length);

    const availableAgents = agents.filter((a) => a.status === 'AVAILABLE').length;
    const busyAgents = agents.filter((a) => a.status === 'BUSY').length;
    const offlineAgents = agents.filter((a) => a.status === 'OFFLINE').length;

    const avgUtilization =
      agents.length > 0
        ? agents.reduce((sum, a) => sum + (a._count.assignedOrders / (a.maxCapacity || 5)), 0) / agents.length
        : 0;

    return {
      orders: {
        total: orders.length,
        delivered,
        active,
        failed,
        created,
        successRate: orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0,
      },
      agents: {
        total: agents.length,
        available: availableAgents,
        busy: busyAgents,
        offline: offlineAgents,
        avgUtilization: Math.round(avgUtilization * 100),
      },
      performance: {
        avgDeliveryTimeMinutes: Math.round(avgDeliveryTime),
        failureRate: orders.length > 0 ? Math.round((failed / orders.length) * 100) : 0,
      },
    };
  }

  /**
   * Get high-risk orders needing attention
   */
  async getHighRiskOrders(limit = 10) {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
      include: {
        assignedAgent: { include: { user: { select: { name: true } } } },
        pickupZone: true,
        dropZone: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit * 2, // Get more to filter high-risk
    });

    const withRisk = activeOrders
      .map((order) => ({
        order,
        risk: riskService.calculateRiskScore(order),
      }))
      .filter((item) => item.risk.level === 'HIGH')
      .sort((a, b) => b.risk.score - a.risk.score)
      .slice(0, limit);

    return withRisk.map((item) => ({
      orderId: item.order.id,
      orderNumber: item.order.orderNumber,
      agentName: item.order.assignedAgent?.user?.name || 'Unassigned',
      pickupZone: item.order.pickupZone.name,
      dropZone: item.order.dropZone.name,
      status: item.order.status,
      riskScore: item.risk.score,
      factors: item.risk.factors,
      recommendation: item.risk.recommendation,
    }));
  }

  /**
   * Get zone performance summary
   */
  async getZonePerformance() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const zones = await prisma.zone.findMany({
      where: { isActive: true },
      include: {
        pickupOrders: {
          where: { createdAt: { gte: today } },
          include: { pod: true },
        },
      },
    });

    return zones.map((zone) => {
      const totalOrders = zone.pickupOrders.length;
      const delivered = zone.pickupOrders.filter((o) => o.pod).length;
      const successRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        totalOrders,
        delivered,
        successRate,
        performanceLevel: successRate >= 95 ? 'EXCELLENT' : successRate >= 80 ? 'GOOD' : 'NEEDS_ATTENTION',
      };
    });
  }

  /**
   * Get agent performance summary
   */
  async getAgentPerformance(limit = 15) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { name: true, email: true } },
        assignedOrders: {
          where: { createdAt: { gte: today } },
          include: { pod: true },
        },
      },
    });

    const withStats = agents.map((agent) => {
      const total = agent.assignedOrders.length;
      const delivered = agent.assignedOrders.filter((o) => o.pod).length;
      const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

      return {
        agentId: agent.id,
        agentName: agent.user.name,
        todaysDeliveries: total,
        completed: delivered,
        successRate,
        status: agent.status,
      };
    });

    return withStats
      .sort((a, b) => {
        if (a.todaysDeliveries === 0) return 1;
        if (b.todaysDeliveries === 0) return -1;
        return b.successRate - a.successRate;
      })
      .slice(0, limit);
  }

  /**
   * Get SLA summary
   */
  async getSLASummary() {
    const activeOrders = await prisma.order.findMany({
      where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
    });

    const onTrack = activeOrders.filter((o) => o.slaStatus === 'ON_TRACK').length;
    const atRisk = activeOrders.filter((o) => o.slaStatus === 'AT_RISK').length;
    const breached = activeOrders.filter((o) => o.slaStatus === 'BREACHED').length;

    return {
      total: activeOrders.length,
      onTrack,
      atRisk,
      breached,
      complianceRate: activeOrders.length > 0 ? Math.round((onTrack / activeOrders.length) * 100) : 100,
    };
  }
}

module.exports = new LogisticsCopilotService();
