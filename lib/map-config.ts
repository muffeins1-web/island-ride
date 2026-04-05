/**
 * Map configuration for IslandRide
 *
 * Centralizes all map-related config: Mapbox access token,
 * default camera positions per island, map style, etc.
 *
 * Mapbox will render real tiles when EXPO_PUBLIC_MAPBOX_KEY is set.
 * Without it, the app falls back to the existing animated mock map.
 */

import { ISLAND_COORDS, type Island } from "@/lib/islands";

// ─────────────────────────────────────────────
// Mapbox access token (public key)
// ─────────────────────────────────────────────

export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_KEY ?? "";

export const isMapboxAvailable = MAPBOX_ACCESS_TOKEN.length > 0;

// ─────────────────────────────────────────────
// Map style — dark theme matching the app design
// ─────────────────────────────────────────────

// Mapbox dark style that matches the IslandRide design system
export const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

// ─────────────────────────────────────────────
// Default camera settings per island
// ─────────────────────────────────────────────

export interface CameraPosition {
  latitude: number;
  longitude: number;
  zoom: number;
}

const DEFAULT_ZOOM_LEVEL = 13;

export function getIslandCamera(island: Island): CameraPosition {
  const coords = ISLAND_COORDS[island];
  return {
    latitude: coords.lat,
    longitude: coords.lng,
    zoom: DEFAULT_ZOOM_LEVEL,
  };
}

// ─────────────────────────────────────────────
// Zoom levels for different contexts
// ─────────────────────────────────────────────

export const ZOOM = {
  /** Overview of island area */
  island: 11,
  /** Default city-level view */
  city: 13,
  /** When showing pickup/dropoff route */
  route: 14,
  /** Close-up during trip tracking */
  tracking: 15,
  /** Very close when driver is at pickup */
  arrived: 16,
} as const;

// ─────────────────────────────────────────────
// Marker colors (matching design system)
// ─────────────────────────────────────────────

export const MAP_COLORS = {
  primary: "#00D4E4",
  gold: "#D4A853",
  success: "#34D399",
  error: "#F87171",
  driverMarker: "#F0F4F8",
  route: "#00D4E4",
  routeBackground: "rgba(0, 212, 228, 0.2)",
  pickupPin: "#34D399",
  dropoffPin: "#D4A853",
} as const;

// ─────────────────────────────────────────────
// Bahamas bounding box (for search/geofencing)
// ─────────────────────────────────────────────

export const BAHAMAS_BOUNDS = {
  north: 27.3,
  south: 20.9,
  east: -72.7,
  west: -80.6,
} as const;

/** Check if coordinates are within the Bahamas */
export function isInBahamas(lat: number, lng: number): boolean {
  return (
    lat >= BAHAMAS_BOUNDS.south &&
    lat <= BAHAMAS_BOUNDS.north &&
    lng >= BAHAMAS_BOUNDS.west &&
    lng <= BAHAMAS_BOUNDS.east
  );
}

// ─────────────────────────────────────────────
// Island service areas (rough bounding boxes)
// Used to prevent booking rides across islands
// ─────────────────────────────────────────────

export const ISLAND_SERVICE_AREAS: Record<
  Island,
  { minLat: number; maxLat: number; minLng: number; maxLng: number; radiusKm: number }
> = {
  nassau: {
    minLat: 24.95, maxLat: 25.12,
    minLng: -77.55, maxLng: -77.25,
    radiusKm: 20,
  },
  grand_bahama: {
    minLat: 26.45, maxLat: 26.75,
    minLng: -79.0, maxLng: -78.3,
    radiusKm: 40,
  },
  exumas: {
    minLat: 23.4, maxLat: 23.7,
    minLng: -76.2, maxLng: -75.6,
    radiusKm: 25,
  },
  eleuthera: {
    minLat: 24.8, maxLat: 25.55,
    minLng: -76.7, maxLng: -76.0,
    radiusKm: 50,
  },
  abaco: {
    minLat: 26.0, maxLat: 26.7,
    minLng: -77.3, maxLng: -76.8,
    radiusKm: 35,
  },
  bimini: {
    minLat: 25.65, maxLat: 25.8,
    minLng: -79.35, maxLng: -79.2,
    radiusKm: 10,
  },
  andros: {
    minLat: 24.0, maxLat: 25.2,
    minLng: -78.5, maxLng: -77.6,
    radiusKm: 50,
  },
  long_island: {
    minLat: 22.8, maxLat: 23.7,
    minLng: -75.4, maxLng: -75.0,
    radiusKm: 40,
  },
};

/** Check if coordinates fall within an island's service area */
export function isInIslandServiceArea(
  lat: number,
  lng: number,
  island: Island
): boolean {
  const area = ISLAND_SERVICE_AREAS[island];
  return (
    lat >= area.minLat &&
    lat <= area.maxLat &&
    lng >= area.minLng &&
    lng <= area.maxLng
  );
}
