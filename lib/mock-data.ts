import type {
  RideHistoryItem,
  PopularDestination,
  EarningsSummary,
  DailyEarning,
  RideRequest,
  ActiveRide,
  Location,
  FavoriteDriver,
} from "./types";

// ============================================================
// Popular Destinations (Nassau)
// ============================================================
export const POPULAR_DESTINATIONS: PopularDestination[] = [
  // ── Nassau / Paradise Island ──
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
  {
    id: "7",
    name: "Bay Street Shopping",
    address: "Bay Street, Downtown Nassau",
    icon: "map.fill",
    location: { latitude: 25.0785, longitude: -77.3425, name: "Bay Street" },
    island: "nassau",
  },
  {
    id: "8",
    name: "Baha Mar Resort",
    address: "Baha Mar Blvd, Cable Beach",
    icon: "star.fill",
    location: { latitude: 25.0762, longitude: -77.4102, name: "Baha Mar" },
    island: "nassau",
  },
  {
    id: "9",
    name: "Junkanoo Beach",
    address: "West Bay Street, Nassau",
    icon: "sun.max.fill",
    location: { latitude: 25.0778, longitude: -77.3502, name: "Junkanoo Beach" },
    island: "nassau",
  },
  {
    id: "10",
    name: "Queen's Staircase",
    address: "Elizabeth Ave, Nassau",
    icon: "map.fill",
    location: { latitude: 25.0753, longitude: -77.3395, name: "Queen's Staircase" },
    island: "nassau",
  },
  {
    id: "11",
    name: "Fort Charlotte",
    address: "West Bay Street, Nassau",
    icon: "flag.fill",
    location: { latitude: 25.0822, longitude: -77.3611, name: "Fort Charlotte" },
    island: "nassau",
  },
  {
    id: "12",
    name: "Nassau Straw Market",
    address: "Bay Street, Downtown Nassau",
    icon: "map.fill",
    location: { latitude: 25.0789, longitude: -77.3445, name: "Straw Market" },
    island: "nassau",
  },
  {
    id: "13",
    name: "Comfort Suites Paradise Island",
    address: "Paradise Island Dr, Paradise Island",
    icon: "star.fill",
    location: { latitude: 25.0855, longitude: -77.3260, name: "Comfort Suites" },
    island: "nassau",
  },
  {
    id: "14",
    name: "Potter's Cay Dock",
    address: "East Bay Street, Nassau",
    icon: "flag.fill",
    location: { latitude: 25.0815, longitude: -77.3350, name: "Potter's Cay" },
    island: "nassau",
  },
  {
    id: "15",
    name: "Princess Margaret Hospital",
    address: "Shirley Street, Nassau",
    icon: "heart.fill",
    location: { latitude: 25.0720, longitude: -77.3380, name: "PMH" },
    island: "nassau",
  },
  {
    id: "16",
    name: "University of The Bahamas",
    address: "University Dr, Oakes Field",
    icon: "building.2.fill",
    location: { latitude: 25.0600, longitude: -77.3550, name: "UB" },
    island: "nassau",
  },
  // ── Grand Bahama ──
  {
    id: "gb1",
    name: "Port Lucaya Marketplace",
    address: "Sea Horse Rd, Freeport",
    icon: "map.fill",
    location: { latitude: 26.5280, longitude: -78.6567, name: "Port Lucaya" },
    island: "grand_bahama",
  },
  {
    id: "gb2",
    name: "Grand Bahama Intl Airport",
    address: "Airport Rd, Freeport",
    icon: "paperplane.fill",
    location: { latitude: 26.5587, longitude: -78.6956, name: "Grand Bahama Airport" },
    island: "grand_bahama",
  },
  {
    id: "gb3",
    name: "Lucayan National Park",
    address: "Grand Bahama Highway",
    icon: "sun.max.fill",
    location: { latitude: 26.5833, longitude: -78.4333, name: "Lucayan Park" },
    island: "grand_bahama",
  },
  {
    id: "gb4",
    name: "Taino Beach",
    address: "Jolly Roger Dr, Freeport",
    icon: "sun.max.fill",
    location: { latitude: 26.5100, longitude: -78.6700, name: "Taino Beach" },
    island: "grand_bahama",
  },
  {
    id: "gb5",
    name: "International Bazaar",
    address: "East Mall Dr, Freeport",
    icon: "map.fill",
    location: { latitude: 26.5350, longitude: -78.6900, name: "Intl Bazaar" },
    island: "grand_bahama",
  },
  {
    id: "gb6",
    name: "Freeport Harbour",
    address: "Freeport Harbour, Grand Bahama",
    icon: "flag.fill",
    location: { latitude: 26.5200, longitude: -78.7500, name: "Freeport Harbour" },
    island: "grand_bahama",
  },
  // ── Exumas ──
  {
    id: "ex1",
    name: "George Town",
    address: "Queen's Highway, Great Exuma",
    icon: "map.fill",
    location: { latitude: 23.5167, longitude: -75.7833, name: "George Town" },
    island: "exumas",
  },
  {
    id: "ex2",
    name: "Exuma Intl Airport",
    address: "Queen's Highway, Moss Town",
    icon: "paperplane.fill",
    location: { latitude: 23.5625, longitude: -75.8780, name: "Exuma Airport" },
    island: "exumas",
  },
  {
    id: "ex3",
    name: "Stocking Island Beach",
    address: "Stocking Island, Exuma",
    icon: "sun.max.fill",
    location: { latitude: 23.5250, longitude: -75.7600, name: "Stocking Island" },
    island: "exumas",
  },
  // ── Eleuthera ──
  {
    id: "el1",
    name: "Governor's Harbour Airport",
    address: "Queen's Highway, Governor's Harbour",
    icon: "paperplane.fill",
    location: { latitude: 25.2847, longitude: -76.3310, name: "GHB Airport" },
    island: "eleuthera",
  },
  {
    id: "el2",
    name: "Harbour Island",
    address: "Pink Sands Beach, Harbour Island",
    icon: "sun.max.fill",
    location: { latitude: 25.5000, longitude: -76.6333, name: "Harbour Island" },
    island: "eleuthera",
  },
  {
    id: "el3",
    name: "Glass Window Bridge",
    address: "Queen's Highway, Eleuthera",
    icon: "map.fill",
    location: { latitude: 25.3500, longitude: -76.2000, name: "Glass Window" },
    island: "eleuthera",
  },
  // ── Abaco ──
  {
    id: "ab1",
    name: "Marsh Harbour Airport",
    address: "Ernest Dean Highway, Marsh Harbour",
    icon: "paperplane.fill",
    location: { latitude: 26.5114, longitude: -77.0836, name: "Marsh Harbour Airport" },
    island: "abaco",
  },
  {
    id: "ab2",
    name: "Hope Town",
    address: "Elbow Cay, Abaco",
    icon: "map.fill",
    location: { latitude: 26.5400, longitude: -76.9667, name: "Hope Town" },
    island: "abaco",
  },
  // ── Bimini ──
  {
    id: "bi1",
    name: "Resorts World Bimini",
    address: "North Bimini, Bimini",
    icon: "star.fill",
    location: { latitude: 25.7300, longitude: -79.2700, name: "Resorts World" },
    island: "bimini",
  },
  {
    id: "bi2",
    name: "South Bimini Airport",
    address: "South Bimini, Bimini",
    icon: "paperplane.fill",
    location: { latitude: 25.6998, longitude: -79.2647, name: "Bimini Airport" },
    island: "bimini",
  },
  // ── Andros ──
  {
    id: "an1",
    name: "Andros Town Airport",
    address: "Andros Town, Andros",
    icon: "paperplane.fill",
    location: { latitude: 24.6978, longitude: -77.7956, name: "Andros Airport" },
    island: "andros",
  },
  {
    id: "an2",
    name: "Small Hope Bay Lodge",
    address: "Fresh Creek, Andros",
    icon: "star.fill",
    location: { latitude: 24.7500, longitude: -77.7833, name: "Small Hope Bay" },
    island: "andros",
  },
  // ── Long Island ──
  {
    id: "li1",
    name: "Stella Maris Airport",
    address: "Stella Maris, Long Island",
    icon: "paperplane.fill",
    location: { latitude: 23.5822, longitude: -75.2686, name: "Stella Maris Airport" },
    island: "long_island",
  },
  {
    id: "li2",
    name: "Dean's Blue Hole",
    address: "Clarence Town, Long Island",
    icon: "sun.max.fill",
    location: { latitude: 23.1050, longitude: -75.0967, name: "Dean's Blue Hole" },
    island: "long_island",
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
// Mock Incoming Ride Requests (for driver — rotates through varied requests)
// ============================================================
export const MOCK_RIDE_REQUESTS: RideRequest[] = [
  {
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
  },
  {
    id: "req2",
    riderId: "rider456",
    riderName: "David Chen",
    riderRating: 4.6,
    pickup: { latitude: 25.0755, longitude: -77.4078, name: "Cable Beach", address: "West Bay St, Nassau" },
    dropoff: { latitude: 25.039, longitude: -77.4662, name: "Nassau Airport", address: "Windsor Field Rd" },
    rideType: "premium",
    estimatedFare: 28.0,
    estimatedDuration: 18,
    estimatedDistance: 9.4,
    island: "nassau",
    createdAt: new Date().toISOString(),
  },
  {
    id: "req3",
    riderId: "rider789",
    riderName: "Maria Santos",
    riderRating: 4.9,
    pickup: { latitude: 25.0788, longitude: -77.3458, name: "Prince George Wharf", address: "Woodes Rogers Walk" },
    dropoff: { latitude: 25.0833, longitude: -77.3583, name: "Fish Fry", address: "Arawak Cay, Nassau" },
    rideType: "standard",
    estimatedFare: 9.5,
    estimatedDuration: 8,
    estimatedDistance: 3.2,
    island: "nassau",
    createdAt: new Date().toISOString(),
  },
  {
    id: "req4",
    riderId: "rider321",
    riderName: "James Mitchell",
    riderRating: 4.5,
    pickup: { latitude: 25.0867, longitude: -77.3233, name: "Atlantis Resort", address: "Paradise Island" },
    dropoff: { latitude: 25.0781, longitude: -77.3431, name: "Bay Street", address: "Downtown Nassau" },
    rideType: "shared",
    estimatedFare: 7.5,
    estimatedDuration: 14,
    estimatedDistance: 5.6,
    island: "nassau",
    createdAt: new Date().toISOString(),
  },
  {
    id: "req5",
    riderId: "rider654",
    riderName: "Keisha Brown",
    riderRating: 5.0,
    pickup: { latitude: 25.039, longitude: -77.4662, name: "Nassau Airport", address: "Windsor Field Rd" },
    dropoff: { latitude: 25.0755, longitude: -77.4078, name: "Cable Beach", address: "Baha Mar Blvd" },
    rideType: "premium",
    estimatedFare: 32.0,
    estimatedDuration: 15,
    estimatedDistance: 7.8,
    island: "nassau",
    createdAt: new Date().toISOString(),
  },
];

// Keep backward compat
export const MOCK_RIDE_REQUEST: RideRequest = MOCK_RIDE_REQUESTS[0];

let _requestIndex = 0;
export function getNextMockRideRequest(): RideRequest {
  const req = { ...MOCK_RIDE_REQUESTS[_requestIndex % MOCK_RIDE_REQUESTS.length], id: `req_${Date.now()}`, createdAt: new Date().toISOString() };
  _requestIndex++;
  return req;
}

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

// ============================================================
// Mock Favorite Drivers (for demo)
// ============================================================
export const MOCK_FAVORITE_DRIVERS: FavoriteDriver[] = [
  {
    id: "driver456",
    name: "Marcus Thompson",
    rating: 4.9,
    vehicleInfo: {
      make: "Toyota",
      model: "Camry",
      year: 2024,
      color: "White",
      plateNumber: "NP-4521",
      seats: 4,
    },
    driverType: "rideshare",
    totalRidesWithYou: 5,
    lastRideDate: "2026-03-10T14:30:00Z",
    island: "nassau",
    avatarColor: "#0A9396",
  },
  {
    id: "driver789",
    name: "Sandra Williams",
    rating: 4.8,
    vehicleInfo: {
      make: "Honda",
      model: "Accord",
      year: 2023,
      color: "Silver",
      plateNumber: "NP-7832",
      seats: 4,
    },
    driverType: "taxi",
    totalRidesWithYou: 3,
    lastRideDate: "2026-03-09T08:15:00Z",
    island: "nassau",
    avatarColor: "#E9A820",
  },
];

// Nearby driver locations for map display (around Nassau)
export const NEARBY_DRIVERS: Location[] = [
  { latitude: 25.048, longitude: -77.345 },
  { latitude: 25.055, longitude: -77.355 },
  { latitude: 25.042, longitude: -77.338 },
  { latitude: 25.065, longitude: -77.36 },
  { latitude: 25.07, longitude: -77.34 },
  { latitude: 25.058, longitude: -77.37 },
];
