import { describe, it, expect } from "vitest";
import { MOCK_FAVORITE_DRIVERS } from "../mock-data";
import type { FavoriteDriver } from "../types";

describe("FavoriteDriver type", () => {
  it("mock favorite drivers have all required fields", () => {
    for (const driver of MOCK_FAVORITE_DRIVERS) {
      expect(driver.id).toBeTruthy();
      expect(driver.name).toBeTruthy();
      expect(driver.rating).toBeGreaterThan(0);
      expect(driver.rating).toBeLessThanOrEqual(5);
      expect(driver.vehicleInfo).toBeDefined();
      expect(driver.vehicleInfo.make).toBeTruthy();
      expect(driver.vehicleInfo.model).toBeTruthy();
      expect(driver.vehicleInfo.plateNumber).toBeTruthy();
      expect(["taxi", "rideshare"]).toContain(driver.driverType);
      expect(driver.totalRidesWithYou).toBeGreaterThan(0);
      expect(driver.lastRideDate).toBeTruthy();
      expect(driver.island).toBeTruthy();
      expect(driver.avatarColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("has at least 2 mock favorite drivers", () => {
    expect(MOCK_FAVORITE_DRIVERS.length).toBeGreaterThanOrEqual(2);
  });

  it("mock drivers have unique IDs", () => {
    const ids = MOCK_FAVORITE_DRIVERS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mock drivers have valid date strings", () => {
    for (const driver of MOCK_FAVORITE_DRIVERS) {
      const date = new Date(driver.lastRideDate);
      expect(date.getTime()).not.toBeNaN();
    }
  });

  it("mock drivers reference valid islands", () => {
    const validIslands = ["nassau", "grand_bahama", "exumas", "abaco", "eleuthera", "andros", "bimini", "long_island"];
    for (const driver of MOCK_FAVORITE_DRIVERS) {
      expect(validIslands).toContain(driver.island);
    }
  });
});

describe("Favorite driver add/remove logic (unit)", () => {
  it("can create a FavoriteDriver from ride data", () => {
    const driver: FavoriteDriver = {
      id: "test-driver-1",
      name: "Test Driver",
      rating: 4.5,
      vehicleInfo: {
        make: "Toyota",
        model: "Corolla",
        year: 2023,
        color: "Blue",
        plateNumber: "NP-1234",
        seats: 4,
      },
      driverType: "rideshare",
      totalRidesWithYou: 1,
      lastRideDate: new Date().toISOString(),
      island: "nassau",
      avatarColor: "#0A9396",
    };

    expect(driver.id).toBe("test-driver-1");
    expect(driver.totalRidesWithYou).toBe(1);
  });

  it("can simulate add and remove from a list", () => {
    const favorites: FavoriteDriver[] = [];
    const driver = MOCK_FAVORITE_DRIVERS[0];

    // Add
    const afterAdd = [...favorites, driver];
    expect(afterAdd).toHaveLength(1);
    expect(afterAdd[0].id).toBe(driver.id);

    // Duplicate check
    const isDuplicate = afterAdd.some((d) => d.id === driver.id);
    expect(isDuplicate).toBe(true);

    // Remove
    const afterRemove = afterAdd.filter((d) => d.id !== driver.id);
    expect(afterRemove).toHaveLength(0);
  });

  it("isFavorite check works correctly", () => {
    const favorites = [MOCK_FAVORITE_DRIVERS[0]];
    const isFav = (id: string) => favorites.some((d) => d.id === id);

    expect(isFav(MOCK_FAVORITE_DRIVERS[0].id)).toBe(true);
    expect(isFav("nonexistent-id")).toBe(false);
  });
});
