const prisma = require('../config/prisma');

class LocationService {
  /**
   * Update agent location and log history point
   */
  async updateAgentLocation({ agentId, latitude, longitude, accuracy = null, orderId = null }) {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid GPS latitude or longitude coordinates');
    }

    const [updatedAgent, locationRecord] = await prisma.$transaction([
      prisma.agent.update({
        where: { id: agentId },
        data: {
          currentLat: latitude,
          currentLng: longitude,
          lastLocationUpdatedAt: new Date(),
          gpsAccuracy: accuracy ? parseFloat(accuracy) : 10.0,
          updatedAt: new Date(),
        },
      }),
      prisma.agentLocation.create({
        data: {
          agentId,
          orderId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date(),
        },
      }),
    ]);

    return {
      agent: updatedAgent,
      location: locationRecord,
    };
  }

  /**
   * Get location history points for route replay
   */
  async getRouteHistory({ agentId, orderId, limit = 200 }) {
    const where = {};
    if (agentId) where.agentId = agentId;
    if (orderId) where.orderId = orderId;

    const points = await prisma.agentLocation.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: Number(limit),
    });

    return points;
  }
}

module.exports = new LocationService();
