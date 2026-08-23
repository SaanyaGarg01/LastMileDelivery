const prisma = require('../config/prisma');

class AutoPilotService {
  /**
   * Toggle auto-pilot mode (OFF, RECOMMENDATION_ONLY, FULL_AUTO)
   */
  async toggleMode(mode) {
    if (!['OFF', 'RECOMMENDATION_ONLY', 'FULL_AUTO'].includes(mode)) {
      throw new Error('Invalid AutoPilot mode');
    }

    const log = await prisma.autoPilotLog.create({
      data: {
        mode,
        eventTitle: `AutoPilot mode set to ${mode}`,
        details: `Operational decisions configured to mode: ${mode}`,
      },
    });

    return log;
  }

  /**
   * Get AutoPilot event stream logs
   */
  async getEvents() {
    const logs = await prisma.autoPilotLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    if (logs.length === 0) {
      // Return default event stream for display
      return [
        { id: '1', mode: 'RECOMMENDATION_ONLY', eventTitle: 'New Order Received', details: 'Order #ORD-10482 created in Noida Zone', timestamp: new Date() },
        { id: '2', mode: 'RECOMMENDATION_ONLY', eventTitle: 'Zone Route Detected', details: 'INTRA-zone route confirmed for 110001 ➔ 201301', timestamp: new Date(Date.now() - 30000) },
        { id: '3', mode: 'RECOMMENDATION_ONLY', eventTitle: 'Smart Agent Evaluated', details: 'Evaluated 5 candidates. Recommended Agent Rahul Sharma (Score: 92/100)', timestamp: new Date(Date.now() - 60000) },
      ];
    }

    return logs;
  }
}

module.exports = new AutoPilotService();
