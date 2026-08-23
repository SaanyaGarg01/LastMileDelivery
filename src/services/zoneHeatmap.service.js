const prisma = require('../config/prisma');

class ZoneHeatmapService {
  /**
   * Calculate operational intensity heatmap per zone
   */
  async getZoneHeatmap() {
    const zones = await prisma.zone.findMany({
      where: { isActive: true },
      include: {
        areas: true,
        pickupOrders: {
          include: { assignedAgent: true },
        },
      },
    });

    const heatmap = zones.map((zone) => {
      const activeOrders = zone.pickupOrders.filter((o) =>
        ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status)
      );
      const failedOrders = zone.pickupOrders.filter((o) => o.status === 'FAILED');
      const deliveredOrders = zone.pickupOrders.filter((o) => o.status === 'DELIVERED');
      const totalOrders = zone.pickupOrders.length;

      const fleetUtilizationPct = Math.min(100, Math.round((activeOrders.length / 5) * 100));

      let intensity = '🟢 LOW';
      let intensityColor = 'emerald';
      if (activeOrders.length >= 10 || failedOrders.length >= 3) {
        intensity = '🔴 CRITICAL';
        intensityColor = 'rose';
      } else if (activeOrders.length >= 5) {
        intensity = '🟠 HIGH';
        intensityColor = 'amber';
      } else if (activeOrders.length >= 2) {
        intensity = '🟡 MEDIUM';
        intensityColor = 'yellow';
      }

      const successRatePct = totalOrders > 0 ? Math.round((deliveredOrders.length / totalOrders) * 100) : 100;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        code: zone.code,
        intensity,
        intensityColor,
        activeOrdersCount: activeOrders.length,
        failedOrdersCount: failedOrders.length,
        totalOrdersToday: totalOrders,
        successRatePct,
        fleetUtilizationPct,
        areasCount: zone.areas.length,
      };
    });

    return {
      zones: heatmap,
      timestamp: new Date(),
    };
  }
}

module.exports = new ZoneHeatmapService();
