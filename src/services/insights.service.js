const prisma = require('../config/prisma');

class OperationalInsightsService {
  /**
   * Generate rule-based operational insights from real database metrics
   */
  async generateOperationalInsights() {
    const insights = [];

    const [
      totalOrders,
      deliveredCount,
      failedCount,
      activeCount,
      agents,
      zoneGroup,
      paymentGroup,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
      prisma.order.count({ where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.agent.findMany({
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
      }),
      prisma.order.groupBy({
        by: ['pickupZoneId'],
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ['paymentType'],
        _count: { _all: true },
      }),
    ]);

    // 1. Fleet Utilization Insight
    const totalAgents = agents.length;
    const availableAgents = agents.filter((a) => a.status === 'AVAILABLE').length;
    const busyAgents = agents.filter((a) => a.status === 'BUSY').length;
    const fleetUtilPct = totalAgents > 0 ? Math.round((busyAgents / totalAgents) * 100) : 0;

    if (fleetUtilPct >= 80) {
      insights.push({
        id: 'util-high',
        type: 'WARNING',
        severity: 'HIGH',
        title: 'High Fleet Utilization',
        description: `Fleet utilization is currently at ${fleetUtilPct}% (${busyAgents}/${totalAgents} agents busy). Consider activating additional agents to avoid delivery bottlenecks.`,
        metric: `${fleetUtilPct}% Utilized`,
        actionUrl: '/admin/agents',
        actionLabel: 'Manage Fleet',
      });
    } else if (fleetUtilPct > 0) {
      insights.push({
        id: 'util-good',
        type: 'SUCCESS',
        severity: 'LOW',
        title: 'Fleet Operating Efficiently',
        description: `Fleet utilization is healthy at ${fleetUtilPct}% with ${availableAgents} available agents ready for new assignments.`,
        metric: `${availableAgents} Available`,
        actionUrl: '/admin/agents',
        actionLabel: 'View Agents',
      });
    }

    // 2. Failure Rate Insight
    const networkSuccessRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100;
    const failureRatePct = totalOrders > 0 ? Math.round((failedCount / totalOrders) * 100) : 0;

    if (failedCount > 0 && failureRatePct >= 10) {
      insights.push({
        id: 'fail-alert',
        type: 'ALERT',
        severity: 'HIGH',
        title: 'Elevated Delivery Failures',
        description: `${failedCount} deliveries (${failureRatePct}% of total orders) failed. Review customer addresses and reschedule requests.`,
        metric: `${failedCount} Failed Orders`,
        actionUrl: '/admin/orders?status=FAILED',
        actionLabel: 'Review Failed Orders',
      });
    }

    // 3. Top Performing Agent Insight
    if (agents.length > 0) {
      const topAgent = agents.reduce((prev, curr) => (curr._count.assignedOrders < prev._count.assignedOrders ? curr : prev), agents[0]);
      if (topAgent && topAgent.user) {
        insights.push({
          id: 'top-agent',
          type: 'SUCCESS',
          severity: 'LOW',
          title: 'Top Agent Performance',
          description: `Agent ${topAgent.user.name} is performing strongly with balanced workload and zero backlog.`,
          metric: topAgent.user.name,
          actionUrl: '/admin/agents',
          actionLabel: 'View Agent Performance',
        });
      }
    }

    // 4. COD Surcharge Volume Insight
    const codCount = paymentGroup.find((g) => g.paymentType === 'COD')?._count._all || 0;
    const codPct = totalOrders > 0 ? Math.round((codCount / totalOrders) * 100) : 0;

    if (codPct >= 50) {
      insights.push({
        id: 'cod-high',
        type: 'INFO',
        severity: 'MEDIUM',
        title: 'High COD Cash Volume',
        description: `COD payment orders represent ${codPct}% of current shipments (${codCount} orders). Ensure delivery agents carry cash collection pouches.`,
        metric: `${codPct}% COD Orders`,
        actionUrl: '/admin/orders?paymentType=COD',
        actionLabel: 'View COD Shipments',
      });
    }

    // 5. Zone Demand Distribution Insight
    if (zoneGroup.length > 0) {
      const maxZoneGroup = zoneGroup.reduce((max, curr) => (curr._count._all > max._count._all ? curr : max), zoneGroup[0]);
      const zone = await prisma.zone.findUnique({ where: { id: maxZoneGroup.pickupZoneId }, select: { name: true } });
      const zoneName = zone?.name || 'Primary Zone';
      const zonePct = totalOrders > 0 ? Math.round((maxZoneGroup._count._all / totalOrders) * 100) : 0;

      if (zonePct >= 35) {
        insights.push({
          id: 'zone-demand',
          type: 'INFO',
          severity: 'MEDIUM',
          title: `High Demand in ${zoneName}`,
          description: `${zoneName} represents ${zonePct}% (${maxZoneGroup._count._all} shipments) of all pickup volume.`,
          metric: `${zonePct}% Zone Share`,
          actionUrl: `/admin/zones`,
          actionLabel: 'View Zone Config',
        });
      }
    }

    return insights;
  }
}

module.exports = new OperationalInsightsService();
