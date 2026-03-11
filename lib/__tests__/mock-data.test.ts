import { describe, it, expect } from "vitest";
import {
  POPULAR_DESTINATIONS,
  MOCK_RIDE_HISTORY,
  getMockEarnings,
  MOCK_RIDE_REQUEST,
  createMockActiveRide,
  NEARBY_DRIVERS,
} from "../mock-data";

describe("POPULAR_DESTINATIONS", () => {
  it("has at least 5 destinations", () => {
    expect(POPULAR_DESTINATIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("all destinations have required fields", () => {
    for (const dest of POPULAR_DESTINATIONS) {
      expect(dest.id).toBeTruthy();
      expect(dest.name).toBeTruthy();
      expect(dest.address).toBeTruthy();
      expect(dest.location.latitude).toBeDefined();
      expect(dest.location.longitude).toBeDefined();
      expect(dest.island).toBeTruthy();
    }
  });
});

describe("MOCK_RIDE_HISTORY", () => {
  it("has ride history items", () => {
    expect(MOCK_RIDE_HISTORY.length).toBeGreaterThan(0);
  });

  it("items have correct status values", () => {
    for (const ride of MOCK_RIDE_HISTORY) {
      expect(["completed", "cancelled"]).toContain(ride.status);
    }
  });

  it("completed rides have positive fares", () => {
    const completed = MOCK_RIDE_HISTORY.filter((r) => r.status === "completed");
    for (const ride of completed) {
      expect(ride.fare).toBeGreaterThan(0);
    }
  });
});

describe("getMockEarnings", () => {
  it("returns earnings for all periods", () => {
    for (const period of ["today", "week", "month"] as const) {
      const earnings = getMockEarnings(period);
      expect(earnings.period).toBe(period);
      expect(earnings.totalEarnings).toBeGreaterThanOrEqual(0);
      expect(earnings.totalTrips).toBeGreaterThanOrEqual(0);
      expect(earnings.dailyBreakdown.length).toBeGreaterThan(0);
    }
  });

  it("total matches sum of breakdown", () => {
    const earnings = getMockEarnings("week");
    const sum = earnings.dailyBreakdown.reduce((s, d) => s + d.earnings, 0);
    expect(earnings.totalEarnings).toBe(sum);
  });
});

describe("MOCK_RIDE_REQUEST", () => {
  it("has all required fields", () => {
    expect(MOCK_RIDE_REQUEST.riderName).toBeTruthy();
    expect(MOCK_RIDE_REQUEST.pickup.name).toBeTruthy();
    expect(MOCK_RIDE_REQUEST.dropoff.name).toBeTruthy();
    expect(MOCK_RIDE_REQUEST.estimatedFare).toBeGreaterThan(0);
  });
});

describe("createMockActiveRide", () => {
  it("creates rider perspective ride", () => {
    const ride = createMockActiveRide(true);
    expect(ride.riderName).toBe("You");
    expect(ride.driverName).toBeTruthy();
    expect(ride.vehicleInfo.plateNumber).toBeTruthy();
  });

  it("creates driver perspective ride", () => {
    const ride = createMockActiveRide(false);
    expect(ride.driverName).toBe("You");
    expect(ride.riderName).toBeTruthy();
  });
});

describe("NEARBY_DRIVERS", () => {
  it("has multiple driver locations", () => {
    expect(NEARBY_DRIVERS.length).toBeGreaterThan(3);
  });

  it("all locations have coordinates", () => {
    for (const loc of NEARBY_DRIVERS) {
      expect(loc.latitude).toBeDefined();
      expect(loc.longitude).toBeDefined();
    }
  });
});
