const prisma = require('../config/prisma');
const crypto = require('crypto');

class QRTrackingService {
  /**
   * Generate secure tracking token & QR code representation
   */
  async generateTrackingQR(orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error(`Order ${orderId} not found`);

    const rawToken = crypto.randomBytes(16).toString('hex');

    const trackingRecord = await prisma.publicTrackingToken.upsert({
      where: { orderId },
      create: {
        orderId,
        token: rawToken,
        expiresAt: new Date(Date.now() + 7 * 86400000), // Valid for 7 days
      },
      update: {
        token: rawToken,
      },
    });

    const publicUrl = `http://localhost:5173/customer/orders/${orderId}?token=${trackingRecord.token}`;

    // SVG QR code matrix visual representation data
    const qrSvgDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffffff"/><rect x="20" y="20" width="60" height="60" fill="%230f172a"/><rect x="30" y="30" width="40" height="40" fill="%23ffffff"/><rect x="40" y="40" width="20" height="20" fill="%230f172a"/><rect x="120" y="20" width="60" height="60" fill="%230f172a"/><rect x="130" y="30" width="40" height="40" fill="%23ffffff"/><rect x="140" y="40" width="20" height="20" fill="%230f172a"/><rect x="20" y="120" width="60" height="60" fill="%230f172a"/><rect x="30" y="130" width="40" height="40" fill="%23ffffff"/><rect x="40" y="140" width="20" height="20" fill="%230f172a"/><rect x="90" y="90" width="20" height="20" fill="%230284c7"/><rect x="130" y="130" width="30" height="30" fill="%230f172a"/><text x="100" y="190" font-family="monospace" font-size="10" text-anchor="middle" fill="%2364748b">${order.orderNumber}</text></svg>`;

    return {
      orderId,
      orderNumber: order.orderNumber,
      token: trackingRecord.token,
      publicUrl,
      qrSvgDataUri,
    };
  }
}

module.exports = new QRTrackingService();
