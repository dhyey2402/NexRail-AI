import stationMapRaw from "../data/stations_coords.json";

const stationMap = (stationMapRaw as unknown) as Record<string, [number, number, string]>;

export function getStationCoord(code?: string | null): [number, number, string] | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const info = stationMap[clean];
  if (info && info.length >= 2) {
    return [info[0], info[1], info[2] || clean];
  }
  return null;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dlat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dlon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dlon / 2) *
      Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isGeoConsistent(
  lat: number,
  lng: number,
  routeCoords: [number, number][],
  maxKm: number = 150
): { ok: boolean; minDistanceKm: number } {
  if (!lat || !lng || lat === 0 || lng === 0) {
    return { ok: false, minDistanceKm: 0 };
  }
  if (lat < 6.0 || lat > 38.0 || lng < 68.0 || lng > 98.0) {
    return { ok: false, minDistanceKm: 9999 };
  }
  if (!routeCoords || routeCoords.length === 0) {
    return { ok: true, minDistanceKm: 0 };
  }

  let minDist = Infinity;
  for (const [rLat, rLng] of routeCoords) {
    const dist = haversineKm(lat, lng, rLat, rLng);
    if (dist < minDist) {
      minDist = dist;
    }
  }

  return {
    ok: minDist <= maxKm,
    minDistanceKm: minDist,
  };
}
