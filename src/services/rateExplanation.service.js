const prisma = require('../config/prisma');

class RateExplanationService {
  /**
   * Explain step-by-step rate calculation formula for an order
   */
  async explainRate(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupZone: true, dropZone: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    const volumetricFormula = `(${order.length} cm × ${order.breadth} cm × ${order.height} cm) ÷ 5000`;
    const volumetricComparison = `${order.volumetricWeight} kg (volumetric) ${
      order.volumetricWeight > order.actualWeight ? '>' : '<='
    } ${order.actualWeight} kg (actual)`;

    return {
      orderId,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      packageDimensions: {
        length: order.length,
        breadth: order.breadth,
        height: order.height,
        actualWeight: order.actualWeight,
        volumetricWeight: order.volumetricWeight,
        volumetricFormula,
        chargeableWeight: order.chargeableWeight,
        comparisonExplanation: `Billable weight selected as ${order.chargeableWeight} kg because ${volumetricComparison}`,
      },
      zoneRoute: {
        pickupZoneName: order.pickupZone?.name || 'Pickup Zone',
        dropZoneName: order.dropZone?.name || 'Drop Zone',
        routeType: order.zoneType, // INTRA or INTER
      },
      pricingBreakdown: {
        orderType: order.orderType,
        paymentType: order.paymentType,
        baseDeliveryCharge: order.deliveryCharge,
        codSurcharge: order.codSurcharge,
        totalAmount: order.totalAmount,
      },
      explanationSteps: [
        `1. Dimensions (${order.length}×${order.breadth}×${order.height} cm) yields ${order.volumetricWeight} kg volumetric weight via (L*B*H)/5000 formula.`,
        `2. Chargeable weight determined as max(${order.actualWeight} kg actual, ${order.volumetricWeight} kg volumetric) = ${order.chargeableWeight} kg.`,
        `3. Route identified as ${order.zoneType}-Zone from ${order.pickupZone?.name} to ${order.dropZone?.name}.`,
        `4. Rate card applied for ${order.orderType} • ${order.zoneType} @ ₹${order.deliveryCharge}.`,
        order.paymentType === 'COD' ? `5. Cash-On-Delivery surcharge added (+₹${order.codSurcharge}).` : '5. Prepaid shipment (₹0 COD surcharge).',
      ],
    };
  }
}

module.exports = new RateExplanationService();
