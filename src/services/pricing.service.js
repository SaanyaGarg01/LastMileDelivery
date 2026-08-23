const prisma = require('../config/prisma');

class PricingService {
  /**
   * Calculate volumetric weight (L * B * H / 5000)
   */
  calculateVolumetricWeight(length, breadth, height) {
    if (!length || !breadth || !height || length <= 0 || breadth <= 0 || height <= 0) {
      throw new Error('Dimensions must be positive numbers');
    }
    const vol = (length * breadth * height) / 5000;
    return Math.round(vol * 100) / 100;
  }

  /**
   * Calculate chargeable weight max(actual, volumetric)
   */
  calculateChargeableWeight(actualWeight, volumetricWeight) {
    if (!actualWeight || actualWeight <= 0) {
      throw new Error('Actual weight must be a positive number');
    }
    return Math.max(actualWeight, volumetricWeight);
  }

  /**
   * Resolve Zone from Pincode with smart auto-mapping fallback
   */
  async getZoneByPincode(pincode) {
    const cleanPin = String(pincode || '').trim();
    if (!cleanPin) {
      throw new Error('Pincode is required');
    }

    // 1. Direct exact match
    const area = await prisma.zoneArea.findFirst({
      where: { pincode: cleanPin },
      include: { zone: true },
    });

    if (area && area.zone && area.zone.isActive) {
      return area.zone;
    }

    // 2. Try prefix match or regional mapping
    const allZones = await prisma.zone.findMany({
      where: { isActive: true },
      include: { areas: true },
    });

    if (!allZones || allZones.length === 0) {
      throw new Error('No active zones configured in system');
    }

    const prefix2 = cleanPin.substring(0, 2);
    let matchedZone = null;

    if (prefix2 === '11') {
      matchedZone = allZones.find(z => z.code === 'DELHI') || allZones[0];
    } else if (prefix2 === '20') {
      matchedZone = allZones.find(z => z.code === 'NOIDA') || allZones[0];
    } else if (prefix2 === '12') {
      matchedZone = allZones.find(z => z.code === 'GURUGRAM') || allZones[0];
    } else if (prefix2 === '40' || prefix2 === '41') {
      matchedZone = allZones.find(z => z.code === 'MUMBAI' || z.code === 'PUNE') || allZones[0];
    } else {
      matchedZone = allZones[0];
    }

    // Auto-map this new pincode to the matched zone so future lookups are instant
    try {
      await prisma.zoneArea.create({
        data: {
          zoneId: matchedZone.id,
          areaName: `Area ${cleanPin}`,
          pincode: cleanPin,
        },
      });
    } catch {
      // Ignore if concurrent creation
    }

    return matchedZone;
  }

  /**
   * Calculate dynamic pricing breakdown
   */
  async calculatePrice({ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType }) {
    // 1. Detect Pickup and Drop zones
    const pickupZone = await this.getZoneByPincode(pickupPincode);
    const dropZone = await this.getZoneByPincode(dropPincode);

    if (!pickupZone.isActive || !dropZone.isActive) {
      throw new Error('Delivery is currently inactive in selected zones');
    }

    // 2. Intra vs Inter zone
    const zoneType = pickupZone.id === dropZone.id ? 'INTRA' : 'INTER';

    // 3. Volumetric and Chargeable weight
    const volumetricWeight = this.calculateVolumetricWeight(length, breadth, height);
    const chargeableWeight = this.calculateChargeableWeight(actualWeight, volumetricWeight);

    // 4. Rate card lookup from database
    const matchingRateCards = await prisma.rateCard.findMany({
      where: {
        orderType,
        zoneType,
        isActive: true,
      },
      orderBy: { weightFrom: 'asc' },
    });

    if (!matchingRateCards || matchingRateCards.length === 0) {
      // Fallback default rate calculation if specific card missing
      const basePrice = zoneType === 'INTRA' ? 120 : 150;
      const ratePerKg = orderType === 'B2B' ? 30 : 40;
      const deliveryCharge = Math.round((basePrice + chargeableWeight * ratePerKg) * 100) / 100;
      const codSurcharge = paymentType === 'COD' ? 30 : 0;

      return {
        actualWeight,
        volumetricWeight,
        chargeableWeight,
        pickupZone: { id: pickupZone.id, name: pickupZone.name, code: pickupZone.code },
        dropZone: { id: dropZone.id, name: dropZone.name, code: dropZone.code },
        zoneType,
        orderType,
        paymentType,
        deliveryCharge,
        codSurcharge,
        totalAmount: deliveryCharge + codSurcharge,
      };
    }

    // Find slab covering chargeable weight
    let matchedCard = matchingRateCards.find(
      (card) => chargeableWeight >= card.weightFrom && chargeableWeight <= card.weightTo
    );

    // If chargeable weight exceeds highest slab, pick the largest slab
    if (!matchedCard) {
      matchedCard = matchingRateCards[matchingRateCards.length - 1];
    }

    let deliveryCharge = matchedCard.rate;

    // Scale rate if weight exceeds slab limit
    if (chargeableWeight > matchedCard.weightTo) {
      const extraKg = Math.ceil(chargeableWeight - matchedCard.weightTo);
      deliveryCharge += extraKg * 20; // 20 per extra kg
    }

    deliveryCharge = Math.round(deliveryCharge * 100) / 100;

    // 5. COD Surcharge
    let codSurcharge = 0;
    if (paymentType === 'COD') {
      codSurcharge = matchedCard.codSurcharge || 30; // default 30 if 0
    }

    const totalAmount = Math.round((deliveryCharge + codSurcharge) * 100) / 100;

    return {
      actualWeight,
      volumetricWeight,
      chargeableWeight,
      pickupZone: {
        id: pickupZone.id,
        name: pickupZone.name,
        code: pickupZone.code,
      },
      dropZone: {
        id: dropZone.id,
        name: dropZone.name,
        code: dropZone.code,
      },
      zoneType,
      orderType,
      paymentType,
      deliveryCharge,
      codSurcharge,
      totalAmount,
    };
  }
}

module.exports = new PricingService();
