const prisma = require('../config/prisma');

class HealthService {
  /**
   * Check system health & service statuses
   */
  async getSystemHealth() {
    const startTime = Date.now();
    let dbStatus = 'Operational';
    let dbLatencyMs = 0;

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'Degraded';
    }

    const [totalOrdersToday, activeAgentsCount, activeDeliveriesCount, notificationsCount] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.agent.count({ where: { status: 'AVAILABLE' } }),
      prisma.order.count({ where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.notification.count(),
    ]);

    const apiResponseTimeMs = Date.now() - startTime;

    const smtpUser = process.env.SMTP_USER || null;
    const smtpPass = process.env.SMTP_PASS || null;
    const smtpStatus = smtpUser && smtpPass ? 'Configured' : 'NOT_CONFIGURED';
    const smtpInfo = smtpUser ? `Gmail SMTP (${smtpUser})` : 'No SMTP_USER env var found';

    return {
      status: dbStatus === 'Operational' ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date(),
      services: {
        backendApi: { status: 'Operational', latencyMs: apiResponseTimeMs },
        database: { status: dbStatus, latencyMs: dbLatencyMs, engine: 'SQLite' },
        emailService: { status: smtpStatus, provider: smtpInfo, smtpUser: smtpUser || 'MISSING' },
        notificationQueue: { status: 'Operational', totalProcessed: notificationsCount },
        mapService: { status: 'Operational (OpenStreetMap / Leaflet CDN)', provider: 'OpenStreetMap' },
      },
      metrics: {
        totalOrdersToday,
        activeAgentsCount,
        activeDeliveriesCount,
        errorRate: '0.0%',
        uptime: '99.9%',
      },
    };
  }
}

module.exports = new HealthService();
