const db = require('../db');

// Haversine distance in km between two lat/lng points.
function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined)) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the best available agent for an order.
 *
 * Strategy (in order of preference):
 *  1. Consider only agents with role='agent' and is_available=1.
 *  2. Prefer agents whose home_zone_id matches the order's pickup zone
 *     (they know the area / are already positioned to collect the package).
 *  3. Within that pool, if agents have live lat/lng, rank by Haversine
 *     distance to a reference point (pickup zone's average agent location,
 *     or the agent's own last known location vs zone centroid proxy).
 *     If no coordinates are available, fall back to "least currently
 *     assigned active orders" as a simple load-balancing tie-breaker.
 *  4. If no agent in the pickup zone is available, fall back to any
 *     available agent system-wide (still ranked by current load), so an
 *     order is never stuck unassigned when the exact zone is short-staffed.
 */
function findBestAgent(orderId, pickupZoneId, refLat = null, refLng = null) {
  const activeCounts = db
    .prepare(
      `SELECT agent_id, COUNT(*) as cnt FROM orders
       WHERE agent_id IS NOT NULL AND status NOT IN ('Delivered','Cancelled','Failed')
       GROUP BY agent_id`
    )
    .all();
  const loadMap = new Map(activeCounts.map((r) => [r.agent_id, r.cnt]));

  const rank = (agents) =>
    agents
      .map((a) => {
        const dist = refLat != null && refLng != null ? distanceKm(refLat, refLng, a.current_lat, a.current_lng) : null;
        return { ...a, distanceKm: dist, activeLoad: loadMap.get(a.id) || 0 };
      })
      .sort((a, b) => {
        // rank by distance if we have it for both, else by current active load
        if (a.distanceKm != null && b.distanceKm != null && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return a.activeLoad - b.activeLoad;
      });

  let zoneAgents = [];
  if (pickupZoneId) {
    zoneAgents = db
      .prepare(`SELECT * FROM users WHERE role='agent' AND is_available=1 AND home_zone_id = ?`)
      .all(pickupZoneId);
  }
  let ranked = rank(zoneAgents);
  if (ranked.length > 0) return { agent: ranked[0], fallback: false };

  // fallback: any available agent, system-wide
  const anyAgents = db.prepare(`SELECT * FROM users WHERE role='agent' AND is_available=1`).all();
  ranked = rank(anyAgents);
  if (ranked.length > 0) return { agent: ranked[0], fallback: true };

  return { agent: null, fallback: false };
}

module.exports = { findBestAgent, distanceKm };
