/**
 * Calculate Cross-Track Error (XTE) in meters
 * between vessel position and a planned survey line.
 */
export function calcXTE(vesselLat, vesselLon, startLat, startLon, endLat, endLon) {
  const R = 6371000 // Earth radius in meters

  const toRad = (d) => (d * Math.PI) / 180

  const lat1 = toRad(startLat), lon1 = toRad(startLon)
  const lat2 = toRad(endLat),   lon2 = toRad(endLon)
  const lat3 = toRad(vesselLat),lon3 = toRad(vesselLon)

  // Angular distance from start to vessel
  const d13 = Math.acos(
    Math.sin(lat1) * Math.sin(lat3) +
    Math.cos(lat1) * Math.cos(lat3) * Math.cos(lon3 - lon1)
  )

  // Bearing from start to vessel
  const brg13 = Math.atan2(
    Math.sin(lon3 - lon1) * Math.cos(lat3),
    Math.cos(lat1) * Math.sin(lat3) - Math.sin(lat1) * Math.cos(lat3) * Math.cos(lon3 - lon1)
  )

  // Bearing from start to end
  const brg12 = Math.atan2(
    Math.sin(lon2 - lon1) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  )

  const xte = Math.asin(Math.sin(d13) * Math.sin(brg13 - brg12)) * R
  return Math.abs(xte)
}

/**
 * Format decimal degrees to DMS string
 */
export function toDMS(deg, isLat) {
  const abs = Math.abs(deg)
  const d = Math.floor(abs)
  const m = Math.floor((abs - d) * 60)
  const s = ((abs - d - m / 60) * 3600).toFixed(2)
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  return `${d}° ${String(m).padStart(2, '0')}' ${String(s).padStart(5, '0')}" ${dir}`
}
