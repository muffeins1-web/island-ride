import { describe, it, expect } from "vitest";
import {
  calculateFare,
  RIDE_TYPE_CONFIG,
  BASE_FARE,
  PER_KM_RATE,
  PER_MIN_RATE,
  BOOKING_FEE,
  MIN_FARE,
  ISLAND_LABELS,
  ISLAND_COORDS,
} from "../types";

describe("calculateFare", () => {
  it("calculates standard fare correctly", () => {
    const fare = calculateFare(10, 15, "standard");
    const expected = (BASE_FARE + 10 * PER_KM_RATE + 15 * PER_MIN_RATE + BOOKING_FEE) * 1.0;
    expect(fare).toBeCloseTo(expected, 2);
  });

  it("calculates premium fare with multiplier", () => {
    const fare = calculateFare(10, 15, "premium");
    const baseFare = BASE_FARE + 10 * PER_KM_RATE + 15 * PER_MIN_RATE + BOOKING_FEE;
    const expected = baseFare * 1.8;
    expect(fare).toBeCloseTo(expected, 2);
  });

  it("calculates shared fare with discount", () => {
    const fare = calculateFare(10, 15, "shared");
    const baseFare = BASE_FARE + 10 * PER_KM_RATE + 15 * PER_MIN_RATE + BOOKING_FEE;
    const expected = baseFare * 0.65;
    expect(fare).toBeCloseTo(expected, 2);
  });

  it("enforces minimum fare", () => {
    const fare = calculateFare(0.5, 2, "shared");
    expect(fare).toBeGreaterThanOrEqual(MIN_FARE);
  });

  it("returns positive values for all ride types", () => {
    for (const type of ["standard", "premium", "shared"] as const) {
      const fare = calculateFare(5, 10, type);
      expect(fare).toBeGreaterThan(0);
    }
  });
});

describe("RIDE_TYPE_CONFIG", () => {
  it("has all three ride types", () => {
    expect(RIDE_TYPE_CONFIG).toHaveProperty("standard");
    expect(RIDE_TYPE_CONFIG).toHaveProperty("premium");
    expect(RIDE_TYPE_CONFIG).toHaveProperty("shared");
  });

  it("standard multiplier is 1.0", () => {
    expect(RIDE_TYPE_CONFIG.standard.multiplier).toBe(1.0);
  });

  it("premium multiplier is greater than standard", () => {
    expect(RIDE_TYPE_CONFIG.premium.multiplier).toBeGreaterThan(RIDE_TYPE_CONFIG.standard.multiplier);
  });

  it("shared multiplier is less than standard", () => {
    expect(RIDE_TYPE_CONFIG.shared.multiplier).toBeLessThan(RIDE_TYPE_CONFIG.standard.multiplier);
  });
});

describe("ISLAND_LABELS", () => {
  it("has all 8 islands", () => {
    expect(Object.keys(ISLAND_LABELS)).toHaveLength(8);
  });

  it("nassau label includes Paradise Island", () => {
    expect(ISLAND_LABELS.nassau).toContain("Paradise Island");
  });
});

describe("ISLAND_COORDS", () => {
  it("has coordinates for all islands", () => {
    for (const key of Object.keys(ISLAND_LABELS)) {
      expect(ISLAND_COORDS).toHaveProperty(key);
      expect(ISLAND_COORDS[key as keyof typeof ISLAND_COORDS].lat).toBeGreaterThan(20);
      expect(ISLAND_COORDS[key as keyof typeof ISLAND_COORDS].lng).toBeLessThan(-70);
    }
  });
});
