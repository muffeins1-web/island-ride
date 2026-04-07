import { describe, it, expect } from "vitest";
import {
  isGoogleMapsAvailable,
  getIslandCamera,
  isInBahamas,
  isInIslandServiceArea,
  BAHAMAS_BOUNDS,
  ISLAND_SERVICE_AREAS,
  ZOOM,
  MAP_COLORS,
} from "../map-config";
import { ISLANDS } from "../islands";

// ─────────────────────────────────────────────
// Haversine distance (inline for test isolation)
// ─────────────────────────────────────────────

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

describe("distanceKm (Haversine)", () => {
  it("returns 0 for same point", () => {
    expect(distanceKm(25.0443, -77.3504, 25.0443, -77.3504)).toBe(0);
  });

  it("calculates Nassau Airport to Atlantis (~15 km)", () => {
    const d = distanceKm(25.039, -77.4662, 25.0867, -77.3233);
    expect(d).toBeGreaterThan(14);
    expect(d).toBeLessThan(18);
  });

  it("calculates short Nassau route (~1.7 km)", () => {
    // Downtown Nassau to Fish Fry
    const d = distanceKm(25.0781, -77.3431, 25.0833, -77.3583);
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(3);
  });
});

// ─────────────────────────────────────────────
// Map config
// ─────────────────────────────────────────────

describe("map-config", () => {
  it("isGoogleMapsAvailable reflects env var", () => {
    // In test env, EXPO_PUBLIC_GOOGLE_MAPS_KEY is not set
    expect(isGoogleMapsAvailable).toBe(false);
  });

  it("provides camera positions for every island", () => {
    for (const island of ISLANDS) {
      const camera = getIslandCamera(island.id);
      expect(typeof camera.latitude).toBe("number");
      expect(typeof camera.longitude).toBe("number");
      expect(camera.zoom).toBe(13);
    }
  });

  it("has zoom levels for all contexts", () => {
    expect(ZOOM.island).toBe(11);
    expect(ZOOM.city).toBe(13);
    expect(ZOOM.route).toBe(14);
    expect(ZOOM.tracking).toBe(15);
    expect(ZOOM.arrived).toBe(16);
  });

  it("has marker colors matching design system", () => {
    expect(MAP_COLORS.primary).toBe("#00D4E4");
    expect(MAP_COLORS.gold).toBe("#D4A853");
    expect(MAP_COLORS.success).toBe("#34D399");
    expect(MAP_COLORS.pickupPin).toBe("#34D399");
    expect(MAP_COLORS.dropoffPin).toBe("#D4A853");
  });
});

// ─────────────────────────────────────────────
// Geofencing
// ─────────────────────────────────────────────

describe("geofencing", () => {
  describe("isInBahamas", () => {
    it("returns true for Nassau coordinates", () => {
      expect(isInBahamas(25.0443, -77.3504)).toBe(true);
    });

    it("returns true for Grand Bahama coordinates", () => {
      expect(isInBahamas(26.6593, -78.5201)).toBe(true);
    });

    it("returns false for Miami", () => {
      expect(isInBahamas(25.7617, -80.1918)).toBe(false);
    });

    it("returns false for London", () => {
      expect(isInBahamas(51.5074, -0.1278)).toBe(false);
    });
  });

  describe("isInIslandServiceArea", () => {
    it("returns true for Nassau city center", () => {
      expect(isInIslandServiceArea(25.0443, -77.3504, "nassau")).toBe(true);
    });

    it("returns true for Nassau Airport", () => {
      expect(isInIslandServiceArea(25.039, -77.4662, "nassau")).toBe(true);
    });

    it("returns false for Nassau coords in Grand Bahama", () => {
      expect(isInIslandServiceArea(25.0443, -77.3504, "grand_bahama")).toBe(false);
    });

    it("returns true for Freeport in Grand Bahama", () => {
      expect(isInIslandServiceArea(26.528, -78.6567, "grand_bahama")).toBe(true);
    });

    it("returns false for cross-island check (Exumas coords in Nassau)", () => {
      expect(isInIslandServiceArea(23.5167, -75.7833, "nassau")).toBe(false);
    });

    it("has service areas defined for all 8 islands", () => {
      expect(Object.keys(ISLAND_SERVICE_AREAS)).toHaveLength(8);
      for (const island of ISLANDS) {
        const area = ISLAND_SERVICE_AREAS[island.id];
        expect(area).toBeDefined();
        expect(area.radiusKm).toBeGreaterThan(0);
        expect(area.maxLat).toBeGreaterThan(area.minLat);
        expect(area.maxLng).toBeGreaterThan(area.minLng);
      }
    });
  });
});
