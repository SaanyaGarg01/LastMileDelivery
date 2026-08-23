const db = require('../db');

const VOLUMETRIC_DIVISOR = 5000; // industry-standard divisor, (L x B x H in cm) / 5000 = kg

/**
 * Detect the zone for a free-text address by matching a normalized
 * area/pincode token against zone_areas. Falls back to null (unzoned)
 * if nothing matches -- callers should surface this to the user rather
 * than silently guessing.
 *
 * Matching strategy: we split the address on commas/spaces and try each
 * token (and the full lowercased string) against zone_areas.area_name.
 * This keeps zone detection admin-configurable and free of hardcoded
 * city lists.
 */
function detectZone(address) {
  if (!address) return null;
  const normalized = address.trim().toLowerCase();

  // 1) exact full-string match (handles a pincode or single area typed directly)
  let row = db.prepare('SELECT zone_id FROM zone_areas WHERE area_name = ?').get(normalized);
  if (row) return row.zone_id;

  // 2) try comma/space separated tokens, longest first, and substring containment
  const tokens = normalized
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const allAreas = db.prepare('SELECT zone_id, area_name FROM zone_areas').all();

  for (const token of tokens) {
    const exact = allAreas.find((a) => a.area_name === token);
    if (exact) return exact.zone_id;
  }
  // 3) substring containment: does the address contain a known area name, or vice versa
  for (const a of allAreas) {
    if (normalized.includes(a.area_name)) return a.zone_id;
  }
  return null;
}

function computeVolumetricWeight(lengthCm, breadthCm, heightCm) {
  const vol = (Number(lengthCm) * Number(breadthCm) * Number(heightCm)) / VOLUMETRIC_DIVISOR;
  return Math.round(vol * 100) / 100;
}

function getRateCard(orderType, rateType) {
  const card = db
    .prepare('SELECT * FROM rate_cards WHERE order_type = ? AND rate_type = ?')
    .get(orderType, rateType);
  if (!card) {
    throw new Error(
      `No rate card configured for order_type=${orderType}, rate_type=${rateType}. Admin must configure it first.`
    );
  }
  return card;
}

function getCodConfig(orderType) {
  return db.prepare('SELECT * FROM cod_surcharge_config WHERE order_type = ?').get(orderType) || {
    flat_fee: 0,
    percent_fee: 0,
  };
}

/**
 * Full charge calculation. Pure function over inputs + current admin config
 * (rate cards / COD config / zones) -- no hardcoded numbers.
 *
 * @returns breakdown object shown to the customer before they confirm the order.
 */
function calculateCharge({
  pickupAddress,
  dropAddress,
  lengthCm,
  breadthCm,
  heightCm,
  actualWeightKg,
  orderType,
  paymentType,
}) {
  const pickupZoneId = detectZone(pickupAddress);
  const dropZoneId = detectZone(dropAddress);

  if (!pickupZoneId || !dropZoneId) {
    const err = new Error(
      'Could not detect a serviceable zone for the pickup and/or drop address. Please check the address or ask admin to map this area to a zone.'
    );
    err.code = 'ZONE_NOT_FOUND';
    err.details = { pickupZoneId, dropZoneId };
    throw err;
  }

  const volumetricWeightKg = computeVolumetricWeight(lengthCm, breadthCm, heightCm);
  const billedWeightKg = Math.max(Number(actualWeightKg), volumetricWeightKg);

  const rateType = pickupZoneId === dropZoneId ? 'intra' : 'inter';
  const rateCard = getRateCard(orderType, rateType);

  let freightCharge = rateCard.base_price + billedWeightKg * rateCard.rate_per_kg;
  freightCharge = Math.max(freightCharge, rateCard.min_charge);
  freightCharge = Math.round(freightCharge * 100) / 100;

  let codSurcharge = 0;
  if (paymentType === 'COD') {
    const cod = getCodConfig(orderType);
    codSurcharge = cod.flat_fee + (freightCharge * cod.percent_fee) / 100;
    codSurcharge = Math.round(codSurcharge * 100) / 100;
  }

  const totalCharge = Math.round((freightCharge + codSurcharge) * 100) / 100;

  return {
    pickupZoneId,
    dropZoneId,
    rateType,
    volumetricWeightKg,
    billedWeightKg,
    rateCard: {
      base_price: rateCard.base_price,
      rate_per_kg: rateCard.rate_per_kg,
      min_charge: rateCard.min_charge,
    },
    freightCharge,
    codSurcharge,
    totalCharge,
  };
}

module.exports = {
  VOLUMETRIC_DIVISOR,
  detectZone,
  computeVolumetricWeight,
  getRateCard,
  getCodConfig,
  calculateCharge,
};
