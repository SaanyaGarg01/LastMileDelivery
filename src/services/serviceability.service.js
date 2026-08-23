const prisma = require('../config/prisma');

class ServiceabilityService {
  /**
   * Check serviceability for pickup & drop pincodes
   */
  async checkServiceability({ pickupPincode, dropPincode }) {
    if (!pickupPincode || !dropPincode) {
      throw new Error('Both pickupPincode and dropPincode are required');
    }

    const pricingService = require('./pricing.service');
    const [pickupZone, dropZone] = await Promise.all([
      pricingService.getZoneByPincode(pickupPincode),
      pricingService.getZoneByPincode(dropPincode),
    ]);

    const isSameZone = pickupZone.id === dropZone.id;
    const routeType = isSameZone ? 'INTRA' : 'INTER';
    const estimatedHours = isSameZone ? '12–18 min' : '1–2 Days';
    const estimatedPriceRange = isSameZone ? '₹120 – ₹180' : '₹180 – ₹350';

    return {
      isServiceable: true,
      pickupServiceable: true,
      dropServiceable: true,
      routeType,
      pickupZone: {
        id: pickupZone.id,
        name: pickupZone.name,
        code: pickupZone.code,
        areaName: `Area ${pickupPincode}`,
      },
      dropZone: {
        id: dropZone.id,
        name: dropZone.name,
        code: dropZone.code,
        areaName: `Area ${dropPincode}`,
      },
      estimatedDeliveryTime: estimatedHours,
      estimatedPriceRange,
      message: `✓ Supported ${routeType}-Zone route between ${pickupZone.name} and ${dropZone.name}`,
    };
  }
}

module.exports = new ServiceabilityService();
