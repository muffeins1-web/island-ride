// ============================================================
// IslandRide - Core Data Types
// ============================================================

import {
  ISLAND_COORDS,
  ISLAND_LABELS,
  ISLAND_OPTIONS,
  getIslandShortLabel,
  type Island,
} from "./islands";

export {
  ISLAND_COORDS,
  ISLAND_LABELS,
  ISLAND_OPTIONS,
  getIslandShortLabel,
  type Island,
};

export type UserRole = "rider" | "driver";

export type RideType = "standard" | "premium" | "shared";

export type RideStatus =
  | "searching"
  | "matched"
  | "driver_en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type DriverStatus = "offline" | "online" | "on_trip";

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  rating: number;
  totalRides: number;
  island: Island;
  createdAt: string;
}

export interface DriverProfile extends UserProfile {
  role: "driver";
  vehicleInfo: VehicleInfo;
  licenseNumber: string;
  isVerified: boolean;
  driverType: "taxi" | "rideshare";
  status: DriverStatus;
  totalEarnings: number;
  completedTrips: number;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  seats: number;
  photoUrl?: string;
}

export interface RideRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderRating: number;
  pickup: Location;
  dropoff: Location;
  rideType: RideType;
  estimatedFare: number;
  estimatedDuration: number;
  estimatedDistance: number;
  island: Island;
  createdAt: string;
}

export interface ActiveRide {
  id: string;
  riderId: string;
  driverId: string;
  riderName: string;
  driverName: string;
  driverRating: number;
  riderRating: number;
  driverPhoto?: string;
  vehicleInfo: VehicleInfo;
  pickup: Location;
  dropoff: Location;
  rideType: RideType;
  status: RideStatus;
  fare: number;
  estimatedDuration: number;
  estimatedDistance: number;
  driverLocation: Location;
  eta: number;
  startedAt?: string;
  completedAt?: string;
}

export interface RideHistoryItem {
  id: string;
  pickup: Location;
  dropoff: Location;
  rideType: RideType;
  status: "completed" | "cancelled";
  fare: number;
  distance: number;
  duration: number;
  driverName: string;
  driverRating: number;
  riderRating?: number;
  date: string;
  tip?: number;
}

export interface EarningsSummary {
  period: "today" | "week" | "month";
  totalEarnings: number;
  totalTrips: number;
  totalHours: number;
  averageFare: number;
  tips: number;
  dailyBreakdown: DailyEarning[];
}

export interface DailyEarning {
  date: string;
  label: string;
  earnings: number;
  trips: number;
}

export interface FavoriteDriver {
  id: string;
  name: string;
  rating: number;
  vehicleInfo: VehicleInfo;
  driverType: "taxi" | "rideshare";
  totalRidesWithYou: number;
  lastRideDate: string;
  island: Island;
  avatarColor: string;
}

export interface PopularDestination {
  id: string;
  name: string;
  address: string;
  icon: string;
  location: Location;
  island: Island;
}

export const RIDE_TYPE_CONFIG: Record<
  RideType,
  { label: string; description: string; icon: string; multiplier: number }
> = {
  standard: {
    label: "Island Ride",
    description: "Reliable local transport",
    icon: "car.fill",
    multiplier: 1.0,
  },
  premium: {
    label: "Island Select",
    description: "Premium comfort, top-rated drivers",
    icon: "star.fill",
    multiplier: 1.8,
  },
  shared: {
    label: "Island Share",
    description: "Share the route, split the cost",
    icon: "person.fill",
    multiplier: 0.65,
  },
};

export const BASE_FARE = 3.5;
export const PER_KM_RATE = 2.0;
export const PER_MIN_RATE = 0.35;
export const BOOKING_FEE = 1.5;
export const MIN_FARE = 7.0;

export function calculateFare(
  distanceKm: number,
  durationMin: number,
  rideType: RideType,
): number {
  const config = RIDE_TYPE_CONFIG[rideType];
  const raw =
    (BASE_FARE + distanceKm * PER_KM_RATE + durationMin * PER_MIN_RATE + BOOKING_FEE) *
    config.multiplier;
  return Math.max(raw, MIN_FARE);
}
