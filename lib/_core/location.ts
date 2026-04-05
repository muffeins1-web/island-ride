/**
 * IslandRide Location Service
 *
 * Wraps expo-location for native GPS and the browser Geolocation API for web.
 * All app code should go through this service — never call expo-location directly.
 */

import { Platform } from "react-native";
import type { Location } from "@/lib/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LocationPermissionStatus =
  | "undetermined"
  | "granted"
  | "denied"
  | "unavailable";

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeocodeResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

// ─────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve("unavailable");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => resolve("granted"),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) resolve("denied");
          else resolve("unavailable");
        },
        { timeout: 5000 }
      );
    });
  }

  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch {
    return "unavailable";
  }
}

export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  if (Platform.OS === "web") {
    // Browser permissions API (async, returns "granted" | "denied" | "prompt")
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") return "granted";
      if (result.state === "denied") return "denied";
      return "undetermined";
    } catch {
      return "undetermined";
    }
  }

  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch {
    return "unavailable";
  }
}

// ─────────────────────────────────────────────
// One-shot position fetch
// ─────────────────────────────────────────────

export async function getCurrentPosition(): Promise<LocationUpdate | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? undefined,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
            timestamp: pos.timestamp,
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  }

  try {
    const ExpoLocation = await import("expo-location");
    const pos = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? undefined,
      heading: pos.coords.heading ?? undefined,
      speed: pos.coords.speed ?? undefined,
      timestamp: pos.timestamp,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Continuous tracking (returns an unsubscribe fn)
// ─────────────────────────────────────────────

export async function watchPosition(
  callback: (update: LocationUpdate) => void
): Promise<() => void> {
  if (Platform.OS === "web") {
    if (!navigator.geolocation) return () => {};
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        callback({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          timestamp: pos.timestamp,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }

  try {
    const ExpoLocation = await import("expo-location");
    const sub = await ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.BestForNavigation,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (pos) => {
        callback({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          timestamp: pos.timestamp,
        });
      }
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

// ─────────────────────────────────────────────
// Reverse geocoding (coordinates → address)
// Uses Google Maps Geocoding API with the project key.
// ─────────────────────────────────────────────

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  try {
    if (GOOGLE_KEY) {
      // Google Maps Geocoding API
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== "OK" || !data.results?.length) return null;
      const result = data.results[0];
      const components = result.address_components || [];
      const name =
        components.find((c: any) => c.types?.includes("point_of_interest"))
          ?.long_name ||
        components.find((c: any) => c.types?.includes("premise"))
          ?.long_name ||
        components.find((c: any) => c.types?.includes("route"))
          ?.long_name ||
        result.formatted_address?.split(",")[0] ||
        "Current Location";
      return {
        name,
        address: result.formatted_address || "",
        latitude,
        longitude,
        placeId: result.place_id,
      };
    }

    // Fallback: Nominatim (no key needed)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "IslandRide/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const name =
      addr.amenity ||
      addr.shop ||
      addr.tourism ||
      addr.road ||
      data.display_name?.split(",")[0] ||
      "Current Location";
    const address = [
      addr.road,
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.village,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      name,
      address: address || data.display_name || "",
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Forward geocoding (address → coordinates)
// Uses Google Maps Geocoding API, bounded to the Bahamas.
// ─────────────────────────────────────────────

export async function geocodeAddress(
  query: string,
  island?: string
): Promise<GeocodeResult[]> {
  try {
    if (GOOGLE_KEY) {
      // Google Maps Geocoding API with Bahamas bias
      const bounds = "20.9,-79.6|27.3,-72.7"; // south,west|north,east
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&bounds=${bounds}&components=country:BS&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      if (data.status !== "OK") return [];
      return (data.results || []).slice(0, 5).map((item: any) => ({
        name: item.formatted_address?.split(",")[0] || query,
        address: item.formatted_address || "",
        latitude: item.geometry.location.lat,
        longitude: item.geometry.location.lng,
        placeId: item.place_id,
      }));
    }

    // Fallback: Nominatim
    const viewbox = "-79.6,27.3,-72.7,20.9";
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${viewbox}&bounded=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "IslandRide/1.0" },
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((item) => ({
      name: item.display_name?.split(",")[0] || query,
      address: item.display_name || "",
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      placeId: item.place_id?.toString(),
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Google Directions API — route, ETA, distance
// ─────────────────────────────────────────────

export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  distanceKmFormatted: string;
  durationFormatted: string;
  polyline: string; // encoded polyline for map rendering
}

export async function getDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<DirectionsResult | null> {
  if (!GOOGLE_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.length) return null;
    const leg = data.routes[0].legs[0];
    return {
      distanceMeters: leg.distance.value,
      durationSeconds: leg.duration.value,
      distanceKmFormatted: leg.distance.text,
      durationFormatted: leg.duration.text,
      polyline: data.routes[0].overview_polyline.points,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Haversine distance (km)
// ─────────────────────────────────────────────

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// ─────────────────────────────────────────────
// Convert LocationUpdate → app Location type
// ─────────────────────────────────────────────

export function toAppLocation(
  update: LocationUpdate,
  name?: string,
  address?: string
): Location {
  return {
    latitude: update.latitude,
    longitude: update.longitude,
    name: name ?? "Current Location",
    address,
  };
}
