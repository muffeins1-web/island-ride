/**
 * Location Service for IslandRide
 * Uses expo-location for real device GPS and OpenStreetMap Nominatim for address search.
 * No API key required.
 */
import * as Location from "expo-location";
import { Platform } from "react-native";

export interface GeocodedAddress {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
}

// Bahamas bounding box for biased search results
const BAHAMAS_BOUNDS = {
  minLat: 20.9,
  maxLat: 27.3,
  minLon: -80.5,
  maxLon: -72.7,
};

/**
 * Request location permissions and get current device position.
 * Returns null if permission denied or location unavailable.
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    if (Platform.OS === "web") {
      // Web fallback using browser geolocation
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => resolve(null),
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.warn("Location error:", error);
    return null;
  }
}

/**
 * Watch device location with updates.
 * Returns a subscription that can be removed.
 */
export async function watchLocation(
  callback: (coords: { latitude: number; longitude: number }) => void
): Promise<{ remove: () => void } | null> {
  try {
    if (Platform.OS === "web") {
      if (!navigator.geolocation) return null;
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
      return { remove: () => navigator.geolocation.clearWatch(watchId) };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 20,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.warn("Watch location error:", error);
    return null;
  }
}

/**
 * Search for real addresses using OpenStreetMap Nominatim API.
 * Biased toward the Bahamas but returns results worldwide.
 */
export async function searchAddresses(
  query: string,
  limit: number = 8
): Promise<GeocodedAddress[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const viewbox = `${BAHAMAS_BOUNDS.minLon},${BAHAMAS_BOUNDS.maxLat},${BAHAMAS_BOUNDS.maxLon},${BAHAMAS_BOUNDS.minLat}`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `q=${encodedQuery}+bahamas&format=json&addressdetails=1&limit=${limit}` +
        `&viewbox=${viewbox}&bounded=0` +
        `&countrycodes=bs`,
      {
        headers: {
          "User-Agent": "IslandRide/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return data.map((item: any, index: number) => ({
      id: `nominatim-${item.place_id || index}`,
      name: formatPlaceName(item),
      address: formatAddress(item),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type || "place",
    }));
  } catch (error) {
    console.warn("Search error:", error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get an address.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "IslandRide/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const item = await response.json();

    return {
      id: `reverse-${item.place_id}`,
      name: formatPlaceName(item),
      address: formatAddress(item),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type || "place",
    };
  } catch (error) {
    console.warn("Reverse geocode error:", error);
    return null;
  }
}

/**
 * Format a place name from Nominatim response.
 */
function formatPlaceName(item: any): string {
  const addr = item.address || {};
  // Prefer specific name, then road, then general display
  if (item.name && item.name !== item.display_name) {
    return item.name;
  }
  if (addr.amenity) return addr.amenity;
  if (addr.tourism) return addr.tourism;
  if (addr.shop) return addr.shop;
  if (addr.building) return addr.building;
  if (addr.road) {
    const number = addr.house_number ? `${addr.house_number} ` : "";
    return `${number}${addr.road}`;
  }
  // Fallback: first part of display_name
  return (item.display_name || "Unknown").split(",")[0].trim();
}

/**
 * Format a readable address from Nominatim response.
 */
function formatAddress(item: any): string {
  const addr = item.address || {};
  const parts: string[] = [];

  if (addr.road) {
    const number = addr.house_number ? `${addr.house_number} ` : "";
    parts.push(`${number}${addr.road}`);
  }
  if (addr.suburb || addr.neighbourhood) {
    parts.push(addr.suburb || addr.neighbourhood);
  }
  if (addr.city || addr.town || addr.village) {
    parts.push(addr.city || addr.town || addr.village);
  }
  if (addr.state_district || addr.county) {
    parts.push(addr.state_district || addr.county);
  }

  if (parts.length === 0) {
    // Fallback to display_name parts
    const displayParts = (item.display_name || "").split(",");
    return displayParts.slice(0, 3).map((p: string) => p.trim()).join(", ");
  }

  return parts.join(", ");
}

/**
 * Calculate distance between two coordinates in km.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time based on distance (rough estimate for island driving).
 * Assumes average speed of 35 km/h for island roads.
 */
export function estimateTravelTime(distanceKm: number): number {
  const avgSpeedKmh = 35;
  return Math.max(3, Math.round((distanceKm / avgSpeedKmh) * 60));
}
