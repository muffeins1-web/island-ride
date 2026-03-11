// ============================================================
// IslandRide — Core Data Types
// ============================================================

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

export type Island =
  | "nassau"
  | "grand_bahama"
  | "exumas"
  | "abaco"
  | "eleuthera"
  | "andros"
  | "bimini"
  | "long_island";

export const ISLAND_LABELS: Record<Island, string> = {
  nassau: "Nassau / Paradise Island",
  grand_bahama: "Grand Bahama",
  exumas: "The Exumas",
  abaco: "Abaco",
  eleuthera: "Eleuthera",
  andros: "Andros",
  bimini: "Bimini",
  long_island: "Long Island",
};

export const ISLAND_COORDS: Record<Island, { lat: number; lng: number }> = {
  nassau: { lat: 25.0443, lng: -77.3504 },
  grand_bahama: { lat: 26.6593, lng: -78.5201 },
  exumas: { lat: 23.6203, lng: -75.9699 },
  abaco: { lat: 26.3454, lng: -77.1565 },
  eleuthera: { lat: 25.1372, lng: -76.1494 },
  andros: { lat: 24.7, lng: -77.8 },
  bimini: { lat: 25.7267, lng: -79.2667 },
  long_island: { lat: 23.1, lng: -75.1 },
};

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
  estimatedDuration: number; // minutes
  estimatedDistance: number; // km
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
  eta: number; // minutes
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
    label: "Island Standard",
    description: "Affordable everyday rides",
    icon: "car.fill",
    multiplier: 1.0,
  },
  premium: {
    label: "Island Premium",
    description: "Luxury comfort rides",
    icon: "star.fill",
    multiplier: 1.8,
  },
  shared: {
    label: "Island Share",
    description: "Split the fare, share the ride",
    icon: "person.fill",
    multiplier: 0.65,
  },
};

// Base fare in BSD (Bahamian Dollar, pegged 1:1 to USD)
export const BASE_FARE = 3.5;
export const PER_KM_RATE = 2.0;
export const PER_MIN_RATE = 0.35;
export const BOOKING_FEE = 1.5;
export const MIN_FARE = 7.0;

export function calculateFare(
  distanceKm: number,
  durationMin: number,
  rideType: RideType
): number {
  const config = RIDE_TYPE_CONFIG[rideType];
  const raw =
    (BASE_FARE + distanceKm * PER_KM_RATE + durationMin * PER_MIN_RATE + BOOKING_FEE) *
    config.multiplier;
  return Math.max(raw, MIN_FARE);
}
