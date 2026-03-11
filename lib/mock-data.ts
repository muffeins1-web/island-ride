import type {
  RideHistoryItem,
  PopularDestination,
  EarningsSummary,
  DailyEarning,
  RideRequest,
  ActiveRide,
  Location,
} from "./types";

// ============================================================
// Popular Destinations (Nassau)
// ============================================================
export const POPULAR_DESTINATIONS: PopularDestination[] = [
  {
    id: "1",
    name: "Lynden Pindling Intl Airport",
    address: "Windsor Field Rd, Nassau",
    icon: "paperplane.fill",
    location: { latitude: 25.039, longitude: -77.4662, name: "Nassau Airport" },
    island: "nassau",
  },
  {
    id: "2",
    name: "Atlantis Resort",
    address: "One Casino Drive, Paradise Island",
    icon: "star.fill",
    location: { latitude: 25.0867, longitude: -77.3233, name: "Atlantis" },
    island: "nassau",
  },
  {
    id: "3",
    name: "Downtown Nassau",
    address: "Bay Street, Nassau",
    icon: "map.fill",
    location: { latitude: 25.0781, longitude: -77.3431, name: "Downtown Nassau" },
    island: "nassau",
  },
  {
    id: "4",
    name: "Cable Beach",
    address: "West Bay Street, Nassau",
    icon: "sun.max.fill",
    location: { latitude: 25.0755, longitude: -77.4078, name: "Cable Beach" },
    island: "nassau",
  },
  {
    id: "5",
    name: "Prince George Wharf",
    address: "Woodes Rogers Walk, Nassau",
    icon: "flag.fill",
    location: { latitude: 25.0788, longitude: -77.3458, name: "Cruise Port" },
    island: "nassau",
  },
  {
    id: "6",
    name: "Fish Fry at Arawak Cay",
    address: "Arawak Cay, Nassau",
    icon: "heart.fill",
    location: { latitude: 25.0833, longitude: -77.3583, name: "Fish Fry" },
    island: "nassau",
  },
];

// ============================================================
// Mock Ride History
// ============================================================
export const MOCK_RIDE_HISTORY: RideHistoryItem[] = [
  {
    id: "r1",
    pickup: { latitude: 25.0443, longitude: -77.3504, name: "My Location", address: "Eastern Rd, Nassau" },
    dropoff: { latitude: 25.0867, longitude: -77.3233, name: "Atlantis Resort", address: "Paradise Island" },
    rideType: "standard",
    status: "completed",
    fare: 18.5,
    distance: 8.2,
    duration: 15,
    driverName: "Marcus Thompson",
    driverRating: 4.9,
    riderRating: 5,
    date: "2026-03-10T14:30:00Z",
    tip: 3.0,
  },
  {
    id: "r2",
    pickup: { latitude: 25.0781, longitude: -77.3431, name: "Bay Street", address: "Downtown Nassau" },
    dropoff: { latitude: 25.039, longitude: -77.4662, name: "Nassau Airport", address: "Windsor Field Rd" },
    rideType: "premium",
    status: "completed",
    fare: 35.0,
    distance: 14.5,
    duration: 22,
    driverName: "Sandra Williams",
    driverRating: 4.8,
    riderRating: 5,
    date: "2026-03-09T08:15:00Z",
    tip: 5.0,
  },
  {
    id: "r3",
    pickup: { latitude: 25.0755, longitude: -77.4078, name: "Cable Beach", address: "West Bay St" },
    dropoff: { latitude: 25.0833, longitude: -77.3583, name: "Fish Fry", address: "Arawak Cay" },
    rideType: "shared",
    status: "completed",
    fare: 8.5,
    distance: 4.1,
    duration: 10,
    driverName: "Devon Rolle",
    driverRating: 4.7,
    date: "2026-03-08T19:00:00Z",
  },
  {
    id: "r4",
    pickup: { latitude: 25.0867, longitude: -77.3233, name: "Atlantis", address: "Paradise Island" },
    dropoff: { latitude: 25.0781, longitude: -77.3431, name: "Downtown", address: "Bay Street" },
    rideType: "standard",
    status: "cancelled",
    fare: 0,
    distance: 5.3,
    duration: 0,
    driverName: "James Knowles",
    driverRating: 4.6,
    date: "2026-03-07T12:00:00Z",
  },
];

// ============================================================
// Mock Earnings
// ============================================================
export function getMockEarnings(period: "today" | "week" | "month"): EarningsSummary {
  const breakdowns: Record<string, DailyEarning[]> = {
    today: [
      { date: "2026-03-11", label: "6am", earnings: 22, trips: 2 },
      { date: "2026-03-11", label: "9am", earnings: 45, trips: 3 },
      { date: "2026-03-11", label: "12pm", earnings: 38, trips: 2 },
      { date: "2026-03-11", label: "3pm", earnings: 55, trips: 4 },
      { date: "2026-03-11", label: "6pm", earnings: 30, trips: 2 },
    ],
    week: [
      { date: "2026-03-05", label: "Mon", earnings: 145, trips: 12 },
      { date: "2026-03-06", label: "Tue", earnings: 120, trips: 10 },
      { date: "2026-03-07", label: "Wed", earnings: 165, trips: 14 },
      { date: "2026-03-08", label: "Thu", earnings: 98, trips: 8 },
      { date: "2026-03-09", label: "Fri", earnings: 210, trips: 16 },
      { date: "2026-03-10", label: "Sat", earnings: 185, trips: 15 },
      { date: "2026-03-11", label: "Sun", earnings: 190, trips: 13 },
    ],
    month: [
      { date: "2026-03-01", label: "Wk 1", earnings: 680, trips: 52 },
      { date: "2026-03-08", label: "Wk 2", earnings: 750, trips: 58 },
      { date: "2026-03-15", label: "Wk 3", earnings: 620, trips: 48 },
      { date: "2026-03-22", label: "Wk 4", earnings: 710, trips: 55 },
    ],
  };

  const daily = breakdowns[period] || breakdowns.today;
  const total = daily.reduce((s, d) => s + d.earnings, 0);
  const trips = daily.reduce((s, d) => s + d.trips, 0);

  return {
    period,
    totalEarnings: total,
    totalTrips: trips,
    totalHours: Math.round(trips * 0.4 * 10) / 10,
    averageFare: trips > 0 ? Math.round((total / trips) * 100) / 100 : 0,
    tips: Math.round(total * 0.12 * 100) / 100,
    dailyBreakdown: daily,
  };
}

// ============================================================
// Mock Incoming Ride Request (for driver)
// ============================================================
export const MOCK_RIDE_REQUEST: RideRequest = {
  id: "req1",
  riderId: "rider123",
  riderName: "Sarah Johnson",
  riderRating: 4.8,
  pickup: { latitude: 25.0781, longitude: -77.3431, name: "Bay Street", address: "Downtown Nassau" },
  dropoff: { latitude: 25.0867, longitude: -77.3233, name: "Atlantis Resort", address: "Paradise Island" },
  rideType: "standard",
  estimatedFare: 16.5,
  estimatedDuration: 12,
  estimatedDistance: 6.8,
  island: "nassau",
  createdAt: new Date().toISOString(),
};

// ============================================================
// Mock Active Ride
// ============================================================
export function createMockActiveRide(isRider: boolean): ActiveRide {
  return {
    id: "active1",
    riderId: "rider123",
    driverId: "driver456",
    riderName: isRider ? "You" : "Sarah Johnson",
    driverName: isRider ? "Marcus Thompson" : "You",
    driverRating: 4.9,
    riderRating: 4.8,
    driverPhoto: undefined,
    vehicleInfo: {
      make: "Toyota",
      model: "Camry",
      year: 2024,
      color: "White",
      plateNumber: "NP-4521",
      seats: 4,
    },
    pickup: { latitude: 25.0781, longitude: -77.3431, name: "Bay Street", address: "Downtown Nassau" },
    dropoff: { latitude: 25.0867, longitude: -77.3233, name: "Atlantis Resort", address: "Paradise Island" },
    rideType: "standard",
    status: "driver_en_route",
    fare: 16.5,
    estimatedDuration: 12,
    estimatedDistance: 6.8,
    driverLocation: { latitude: 25.073, longitude: -77.35 },
    eta: 4,
  };
}

// Nearby driver locations for map display (around Nassau)
export const NEARBY_DRIVERS: Location[] = [
  { latitude: 25.048, longitude: -77.345 },
  { latitude: 25.055, longitude: -77.355 },
  { latitude: 25.042, longitude: -77.338 },
  { latitude: 25.065, longitude: -77.36 },
  { latitude: 25.07, longitude: -77.34 },
  { latitude: 25.058, longitude: -77.37 },
];
