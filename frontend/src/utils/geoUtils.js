import { haversineDistance } from './priceEngine';

let searchController = null;
const searchCache = {};

/**
 * Searches for a location using Photon API, with geographical bias towards the campus area.
 * Uses AbortController to cancel previous requests and a simple cache for repeated queries.
 */
export async function searchLocation(query) {
  if (!query || query.trim() === '') return [];

  const trimmedQuery = query.trim();
  if (searchCache[trimmedQuery]) {
    return searchCache[trimmedQuery];
  }

  if (searchController) {
    searchController.abort();
  }
  searchController = new AbortController();

  try {
    // Bias towards campus area (IIT Ropar: 30.9687, 76.4731)
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&lat=30.9687&lon=76.4731&zoom=14&limit=5`,
      { signal: searchController.signal }
    );

    if (!res.ok) throw new Error("Search API failed");

    const data = await res.json();
    const results = data.features.map(f => ({
      name: f.properties.name,
      address: [f.properties.street, f.properties.district, f.properties.city].filter(Boolean).join(', '),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));

    // Save to cache
    searchCache[trimmedQuery] = results;
    return results;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Search request aborted');
      return []; // Intentionally silent for aborts
    }
    console.error("Location search error:", err);
    throw err;
  }
}

/**
 * Reverse geocodes a lat/lng to a place name using Nominatim API.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    if (!res.ok) throw new Error("Reverse geocode API failed");

    const data = await res.json();
    return {
      name: data.name || data.display_name.split(',')[0],
      lat,
      lng
    };
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return { name: "Dropped Pin", lat, lng };
  }
}

/**
 * Smart location resolver.
 *
 * Given GPS coordinates and a list of preset locations (each with a `radius`
 * in metres), returns:
 *   - The closest preset's name if it falls within its configured radius, OR
 *   - A reverse-geocoded name (Nominatim) as fallback.
 *
 * This avoids unnecessary API calls when the user is clearly at a known campus
 * location (hostel, gate, etc.).
 *
 * @param {number} lat        - User's current latitude
 * @param {number} lng        - User's current longitude
 * @param {Array}  presets    - Array of { name, lat, lng, radius } objects
 * @returns {Promise<{ name: string, lat: number, lng: number }>}
 */
export async function getSmartLocation(lat, lng, presets) {
  let closestPreset = null;
  let minDistance = Infinity;

  for (const preset of presets) {
    // haversineDistance returns km — convert to metres
    const distanceM = haversineDistance(lat, lng, preset.lat, preset.lng) * 1000;
    const radius = preset.radius ?? 250; // default 250 m if not specified

    if (distanceM <= radius && distanceM < minDistance) {
      closestPreset = preset;
      minDistance = distanceM;
    }
  }

  if (closestPreset) {
    console.log(`[SmartLocation] Matched "${closestPreset.name}" at ${Math.round(minDistance)}m`);
    return { name: closestPreset.name, lat, lng };
  }

  // No nearby preset → fall back to reverse geocoding (one API call max)
  console.log('[SmartLocation] No preset match, falling back to reverse geocode');
  return reverseGeocode(lat, lng);
}

/**
 * Opens Google Maps navigation to the specified latitude and longitude from the user's current location.
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 */
export function openNavigation(lat, lng) {
  if (!lat || !lng) return;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, "_blank");
}

export const navigateToPickup = openNavigation;

/**
 * Opens Google Maps navigation from pickup to destination.
 */
export function navigateRide(pickupLat, pickupLng, destLat, destLng) {
  if (!pickupLat || !pickupLng || !destLat || !destLng) return;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${destLat},${destLng}&travelmode=driving`;
  window.open(url, "_blank");
}

/**
 * Gets a driving route between two points using OSRM API.
 * Falls back to haversine distance if the API fails.
 */
export async function getRoute(pickup, destination) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    );

    if (!res.ok) throw new Error("Routing API failed");

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    return {
      geometry: route.geometry,
      distance: route.distance / 1000, // meters to km
      duration: route.duration / 60, // seconds to minutes
      isFallback: false
    };

  } catch (err) {
    console.warn("OSRM routing failed, falling back to straight-line distance:", err);

    const distanceKm = haversineDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const avgSpeedKmh = 30; // 30 km/h average local speed
    const durationMins = (distanceKm / avgSpeedKmh) * 60;

    return {
      geometry: null, // No road geometry available
      distance: distanceKm,
      duration: durationMins,
      isFallback: true
    };
  }
}
