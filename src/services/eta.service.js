class ETAService {
  /**
   * Calculate deterministic ETA for an order
   *
   * Assumptions:
   *   Speed: Bike = 25 km/h, Car/Van = 20 km/h, Truck = 15 km/h
   *   Status considerations:
   *     ASSIGNED        : agent → pickup + pickup → drop + 10m handling
   *     PICKED_UP / IN_TRANSIT : agent/pickup → drop + 5m handling
   *     OUT_FOR_DELIVERY: remaining dist → drop + 3m doorstep
   *     DELIVERED       : 0 min (delivered)
   */
  calculateETA(order) {
    if (!order) return { formattedRange: 'ETA unavailable', minMinutes: 0, maxMinutes: 0 };

    if (order.status === 'DELIVERED') {
      return {
        formattedRange: 'Delivered',
        minMinutes: 0,
        maxMinutes: 0,
        status: 'DELIVERED',
        isDelivered: true,
      };
    }

    if (order.status === 'FAILED') {
      return {
        formattedRange: 'Delivery Failed',
        minMinutes: 0,
        maxMinutes: 0,
        status: 'FAILED',
        isFailed: true,
      };
    }

    const agent = order.assignedAgent;
    const vehicleType = agent?.vehicleType || 'BIKE';
    const speedKmh = vehicleType === 'TRUCK' ? 15 : vehicleType === 'VAN' || vehicleType === 'CAR' ? 20 : 25;

    // Approximate distance from lat/lng or default estimates
    const pickupLat = order.pickupLat || 28.6139;
    const pickupLng = order.pickupLng || 77.209;
    const dropLat = order.dropLat || 28.5708;
    const dropLng = order.dropLng || 77.326;

    const agentLat = agent?.currentLat || pickupLat;
    const agentLng = agent?.currentLng || pickupLng;

    // Distance calculations (Haversine)
    const distAgentToPickup = this._haversine(agentLat, agentLng, pickupLat, pickupLng);
    const distPickupToDrop = this._haversine(pickupLat, pickupLng, dropLat, dropLng);
    const distAgentToDrop = this._haversine(agentLat, agentLng, dropLat, dropLng);

    let remainingDist = distPickupToDrop;
    let bufferMinutes = 5;

    if (order.status === 'ASSIGNED' || order.status === 'CREATED' || order.status === 'RESCHEDULED') {
      remainingDist = distAgentToPickup + distPickupToDrop;
      bufferMinutes = 10;
    } else if (order.status === 'PICKED_UP' || order.status === 'IN_TRANSIT') {
      remainingDist = distAgentToDrop;
      bufferMinutes = 7;
    } else if (order.status === 'OUT_FOR_DELIVERY') {
      remainingDist = Math.min(distAgentToDrop, 3.0);
      bufferMinutes = 3;
    }

    const travelMinutes = (remainingDist / speedKmh) * 60;
    const minMin = Math.max(3, Math.round(travelMinutes + bufferMinutes * 0.8));
    const maxMin = Math.max(minMin + 5, Math.round(travelMinutes + bufferMinutes * 1.4));

    return {
      minMinutes: minMin,
      maxMinutes: maxMin,
      formattedRange: `${minMin}–${maxMin} min`,
      remainingDistanceKm: Math.round(remainingDist * 10) / 10,
      estimatedSpeedKmh: speedKmh,
      vehicleType,
      status: order.status,
    };
  }

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}

module.exports = new ETAService();
