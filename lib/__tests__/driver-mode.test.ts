import { describe, it, expect } from "vitest";
import { MOCK_RIDE_REQUESTS, getNextMockRideRequest, getMockEarnings, createMockActiveRide } from "../mock-data";
import { RIDE_TYPE_CONFIG, calculateFare } from "../types";

describe("Driver Mode - Ride Requests", () => {
  it("should have multiple varied ride requests", () => {
    expect(MOCK_RIDE_REQUESTS.length).toBeGreaterThanOrEqual(5);
  });

  it("each request should have all required fields", () => {
    for (const req of MOCK_RIDE_REQUESTS) {
      expect(req.id).toBeTruthy();
      expect(req.riderName).toBeTruthy();
      expect(req.riderRating).toBeGreaterThan(0);
      expect(req.pickup.name).toBeTruthy();
      expect(req.dropoff.name).toBeTruthy();
      expect(req.estimatedFare).toBeGreaterThan(0);
      expect(req.estimatedDuration).toBeGreaterThan(0);
      expect(req.estimatedDistance).toBeGreaterThan(0);
      expect(req.rideType).toBeTruthy();
      expect(req.island).toBeTruthy();
    }
  });

  it("should have different ride types across requests", () => {
    const types = new Set(MOCK_RIDE_REQUESTS.map((r) => r.rideType));
    expect(types.size).toBeGreaterThanOrEqual(2);
  });

  it("should have different riders across requests", () => {
    const names = new Set(MOCK_RIDE_REQUESTS.map((r) => r.riderName));
    expect(names.size).toBe(MOCK_RIDE_REQUESTS.length);
  });

  it("getNextMockRideRequest should rotate through requests", () => {
    const first = getNextMockRideRequest();
    const second = getNextMockRideRequest();
    expect(first.riderName).not.toBe(second.riderName);
  });

  it("getNextMockRideRequest should return request objects with id field", () => {
    const r1 = getNextMockRideRequest();
    expect(r1.id).toBeTruthy();
    expect(r1.id.startsWith("req_")).toBe(true);
  });

  it("getNextMockRideRequest should have fresh timestamps", () => {
    const req = getNextMockRideRequest();
    const now = new Date();
    const created = new Date(req.createdAt);
    expect(now.getTime() - created.getTime()).toBeLessThan(5000);
  });
});

describe("Driver Mode - Trip Data", () => {
  it("createMockActiveRide for driver should set driverName to You", () => {
    const ride = createMockActiveRide(false);
    expect(ride.driverName).toBe("You");
  });

  it("createMockActiveRide should have vehicle info", () => {
    const ride = createMockActiveRide(false);
    expect(ride.vehicleInfo.make).toBeTruthy();
    expect(ride.vehicleInfo.model).toBeTruthy();
    expect(ride.vehicleInfo.plateNumber).toBeTruthy();
  });

  it("ride type configs should have labels and multipliers", () => {
    for (const key of ["standard", "premium", "shared"] as const) {
      const config = RIDE_TYPE_CONFIG[key];
      expect(config.label).toBeTruthy();
      expect(config.multiplier).toBeGreaterThan(0);
    }
  });

  it("premium rides should have higher multiplier than standard", () => {
    expect(RIDE_TYPE_CONFIG.premium.multiplier).toBeGreaterThan(RIDE_TYPE_CONFIG.standard.multiplier);
  });

  it("shared rides should have lower multiplier than standard", () => {
    expect(RIDE_TYPE_CONFIG.shared.multiplier).toBeLessThan(RIDE_TYPE_CONFIG.standard.multiplier);
  });
});

describe("Driver Mode - Earnings", () => {
  it("getMockEarnings should return valid data for all periods", () => {
    for (const period of ["today", "week", "month"] as const) {
      const earnings = getMockEarnings(period);
      expect(earnings.totalEarnings).toBeGreaterThan(0);
      expect(earnings.totalTrips).toBeGreaterThan(0);
      expect(earnings.dailyBreakdown.length).toBeGreaterThan(0);
    }
  });

  it("weekly earnings should be higher than daily", () => {
    const today = getMockEarnings("today");
    const week = getMockEarnings("week");
    expect(week.totalEarnings).toBeGreaterThan(today.totalEarnings);
  });
});
