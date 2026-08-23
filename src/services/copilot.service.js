const prisma = require('../config/prisma');

class CopilotService {
  /**
   * Process natural language operations queries over real DB metrics
   */
  async processQuery(userQuery) {
    const q = (userQuery || '').toLowerCase();

    const [orders, agents, zones] = await Promise.all([
      prisma.order.findMany({
        include: { pickupZone: true, dropZone: true, assignedAgent: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agent.findMany({
        include: { user: { select: { name: true, phone: true } }, assignedOrders: true },
      }),
      prisma.zone.findMany({
        include: { pickupOrders: true },
      }),
    ]);

    const activeOrders = orders.filter((o) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status));
    const failedOrders = orders.filter((o) => o.status === 'FAILED');
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
    const overloadedAgents = agents.filter((a) => a.assignedOrders.length >= a.maxCapacity);

    // 1. Why are deliveries delayed today?
    if (q.includes('delayed') || q.includes('delay') || q.includes('why')) {
      const topPickupZone = zones.reduce((prev, curr) => (prev.pickupOrders.length > curr.pickupOrders.length ? prev : curr), zones[0] || { name: 'Primary Zone' });

      return {
        title: '⚠ DELIVERY DELAY ANALYSIS',
        summary: `${activeOrders.length} active shipments currently in progress. 3 primary operational delay factors identified:`,
        factors: [
          { title: `${topPickupZone.name} Zone Volume`, detail: `High active shipment concentration in ${topPickupZone.name}` },
          { title: 'Fleet Capacity Exposure', detail: `${overloadedAgents.length} delivery agents operating at maximum capacity (${overloadedAgents.map((a) => a.user.name).join(', ') || 'None'})` },
          { title: 'SLA Window Risk', detail: `${failedOrders.length} failed delivery attempts requiring customer rescheduling` },
        ],
        recommendations: [
          'Reassign high-risk deliveries in over-capacity zones',
          'Activate available offline agents in high-density areas',
        ],
        actionLink: '/admin/orders',
        actionText: 'View High-Risk Deliveries',
      };
    }

    // 2. Which zone is performing worst?
    if (q.includes('zone') || q.includes('performing') || q.includes('worst')) {
      const zoneStats = zones.map((z) => {
        const zoneOrders = orders.filter((o) => o.pickupZoneId === z.id || o.dropZoneId === z.id);
        const failed = zoneOrders.filter((o) => o.status === 'FAILED').length;
        const total = zoneOrders.length;
        const failureRate = total > 0 ? (failed / total) * 100 : 0;
        return { name: z.name, total, failed, failureRate };
      }).sort((a, b) => b.failureRate - a.failureRate);

      const worstZone = zoneStats[0] || { name: 'Intra-Zone Route', failureRate: 0 };

      return {
        title: '📍 ZONE PERFORMANCE INSIGHT',
        summary: `Analysis of delivery completion rates across active operational zones:`,
        factors: [
          { title: `Highest Exception Rate: ${worstZone.name}`, detail: `${Math.round(worstZone.failureRate)}% exception rate (${worstZone.failed} failed out of ${worstZone.total} shipments)` },
          { title: 'Zone Density', detail: `${activeOrders.length} shipments active across network` },
        ],
        recommendations: [
          `Review agent coverage in ${worstZone.name}`,
          'Adjust rate cards or SLA delivery windows if needed',
        ],
        actionLink: '/admin/zones',
        actionText: 'Manage Zones & Coverage',
      };
    }

    // 3. Which agents are overloaded?
    if (q.includes('agent') || q.includes('overloaded') || q.includes('capacity')) {
      return {
        title: '👨‍✈️ FLEET CAPACITY & WORKLOAD ANALYSIS',
        summary: `${agents.length} registered agents. ${overloadedAgents.length} agents currently at max workload capacity:`,
        factors: overloadedAgents.map((a) => ({
          title: a.user.name,
          detail: `Workload: ${a.assignedOrders.length}/${a.maxCapacity} (${Math.round((a.assignedOrders.length / a.maxCapacity) * 100)}% load)`,
        })),
        recommendations: [
          'Increase agent max capacity cap if appropriate',
          'Trigger auto-assignment rebalancing to available agents',
        ],
        actionLink: '/admin/agents',
        actionText: 'Inspect Agent Workload',
      };
    }

    // 4. Default Operations Summary
    const codTotal = orders.filter((o) => o.paymentType === 'COD').reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      title: '🤖 OPERATIONS COPILOT SUMMARY',
      summary: `Current fleet status across ${orders.length} total orders:`,
      factors: [
        { title: 'Active Shipments', detail: `${activeOrders.length} shipments currently in transit / out for delivery` },
        { title: 'Delivered Success', detail: `${deliveredOrders.length} completed shipments (${orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 100}% success rate)` },
        { title: 'COD Revenue Collected', detail: `₹${codTotal.toFixed(2)} in Cash-on-Delivery collections` },
      ],
      recommendations: [
        'Monitor live map for active agent movements',
        'Review risk radar for SLA-sensitive shipments',
      ],
      actionLink: '/admin/live',
      actionText: 'Open Live Operations Map',
    };
  }
}

module.exports = new CopilotService();
