import type {
  RideHistoryItem,
  PopularDestination,
  EarningsSummary,
  DailyEarning,
  RideRequest,
  ActiveRide,
  Location,
  FavoriteDriver,
  RideType,
  Island,
} from "./types";
import { ISLAND_COORDS, calculateFare, getIslandShortLabel } from "./types";

export interface SavedPlace {
  label: string;
  icon: string;
  dest: PopularDestination;
}

const DEFAULT_DRIVER_NAMES = [
  "Marcus Thompson",
  "Sandra Williams",
  "Devon Rolle",
  "Keisha Ferguson",
  "Ricardo Cartwright",
  "Tamika Sands",
];

const DEFAULT_RIDERS = [
  { id: "rider123", name: "Sarah Johnson", rating: 4.8 },
  { id: "rider456", name: "David Chen", rating: 4.6 },
  { id: "rider789", name: "Maria Santos", rating: 4.9 },
  { id: "rider321", name: "James Mitchell", rating: 4.5 },
  { id: "rider654", name: "Keisha Brown", rating: 5.0 },
];

const VEHICLE_OPTIONS = [
  { make: "Toyota", model: "Camry", year: 2024, color: "White", plateNumber: "NP-4521" },
  { make: "Honda", model: "Accord", year: 2023, color: "Silver", plateNumber: "NP-7832" },
  { make: "Nissan", model: "Altima", year: 2024, color: "Black", plateNumber: "NP-6190" },
  { make: "BMW", model: "5 Series", year: 2025, color: "Midnight Blue", plateNumber: "NP-1088" },
  { make: "Mercedes", model: "E-Class", year: 2025, color: "Pearl White", plateNumber: "NP-2255" },
];

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
    location: { latitude: 25.0855, longitude: -77.326, name: "Comfort Suites" },
    island: "nassau",
  },
  {
    id: "14",
    name: "Potter's Cay Dock",
    address: "East Bay Street, Nassau",
    icon: "flag.fill",
    location: { latitude: 25.0815, longitude: -77.335, name: "Potter's Cay" },
    island: "nassau",
  },
  {
    id: "15",
    name: "Princess Margaret Hospital",
    address: "Shirley Street, Nassau",
    icon: "heart.fill",
    location: { latitude: 25.072, longitude: -77.338, name: "PMH" },
    island: "nassau",
  },
  {
    id: "16",
    name: "University of The Bahamas",
    address: "University Dr, Oakes Field",
    icon: "building.2.fill",
    location: { latitude: 25.06, longitude: -77.355, name: "UB" },
    island: "nassau",
  },
  {
    id: "gb1",
    name: "Port Lucaya Marketplace",
    address: "Sea Horse Rd, Freeport",
    icon: "map.fill",
    location: { latitude: 26.528, longitude: -78.6567, name: "Port Lucaya" },
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
    location: { latitude: 26.51, longitude: -78.67, name: "Taino Beach" },
    island: "grand_bahama",
  },
  {
    id: "gb5",
    name: "International Bazaar",
    address: "East Mall Dr, Freeport",
    icon: "map.fill",
    location: { latitude: 26.535, longitude: -78.69, name: "Intl Bazaar" },
    island: "grand_bahama",
  },
  {
    id: "gb6",
    name: "Freeport Harbour",
    address: "Freeport Harbour, Grand Bahama",
    icon: "flag.fill",
    location: { latitude: 26.52, longitude: -78.75, name: "Freeport Harbour" },
    island: "grand_bahama",
  },
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
    location: { latitude: 23.5625, longitude: -75.878, name: "Exuma Airport" },
    island: "exumas",
  },
  {
    id: "ex3",
    name: "Stocking Island Beach",
    address: "Stocking Island, Exuma",
    icon: "sun.max.fill",
    location: { latitude: 23.525, longitude: -75.76, name: "Stocking Island" },
    island: "exumas",
  },
  {
    id: "el1",
    name: "Governor's Harbour Airport",
    address: "Queen's Highway, Governor's Harbour",
    icon: "paperplane.fill",
    location: { latitude: 25.2847, longitude: -76.331, name: "GHB Airport" },
    island: "eleuthera",
  },
  {
    id: "el2",
    name: "Harbour Island",
    address: "Pink Sands Beach, Harbour Island",
    icon: "sun.max.fill",
    location: { latitude: 25.5, longitude: -76.6333, name: "Harbour Island" },
    island: "eleuthera",
  },
  {
    id: "el3",
    name: "Glass Window Bridge",
    address: "Queen's Highway, Eleuthera",
    icon: "map.fill",
    location: { latitude: 25.35, longitude: -76.2, name: "Glass Window" },
    island: "eleuthera",
  },
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
    location: { latitude: 26.54, longitude: -76.9667, name: "Hope Town" },
    island: "abaco",
  },
  {
    id: "bi1",
    name: "Resorts World Bimini",
    address: "North Bimini, Bimini",
    icon: "star.fill",
    location: { latitude: 25.73, longitude: -79.27, name: "Resorts World" },
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
    location: { latitude: 24.75, longitude: -77.7833, name: "Small Hope Bay" },
    island: "andros",
  },
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
    location: { latitude: 23.105, longitude: -75.0967, name: "Dean's Blue Hole" },
    island: "long_island",
  },
];

export const DESTINATION_DISTANCE_BY_ID: Record<string, { km: number; mins: number }> = {
  "1": { km: 14.2, mins: 22 },
  "2": { km: 8.5, mins: 15 },
  "3": { km: 3.2, mins: 8 },
  "4": { km: 6.8, mins: 14 },
  "5": { km: 3.5, mins: 9 },
  "6": { km: 4.1, mins: 10 },
  "7": { km: 3, mins: 7 },
  "8": { km: 7.2, mins: 15 },
  "9": { km: 2.8, mins: 6 },
  "10": { km: 2.1, mins: 5 },
  "11": { km: 4.5, mins: 11 },
  "12": { km: 2.9, mins: 7 },
  "13": { km: 9, mins: 16 },
  "14": { km: 4, mins: 9 },
  "15": { km: 2.5, mins: 6 },
  "16": { km: 5.5, mins: 12 },
  gb1: { km: 4.2, mins: 10 },
  gb2: { km: 8, mins: 16 },
  gb3: { km: 18, mins: 28 },
  gb4: { km: 5.5, mins: 12 },
  gb5: { km: 3.8, mins: 9 },
  gb6: { km: 10, mins: 18 },
  ex1: { km: 3, mins: 8 },
  ex2: { km: 6.5, mins: 14 },
  ex3: { km: 4, mins: 10 },
  el1: { km: 5, mins: 12 },
  el2: { km: 8, mins: 18 },
  el3: { km: 12, mins: 22 },
  ab1: { km: 4.5, mins: 10 },
  ab2: { km: 7, mins: 15 },
  bi1: { km: 3, mins: 7 },
  bi2: { km: 5, mins: 11 },
  an1: { km: 4, mins: 9 },
  an2: { km: 6, mins: 13 },
  li1: { km: 5, mins: 11 },
  li2: { km: 10, mins: 20 },
};

export const POPULAR_DESTINATIONS_BY_ISLAND = POPULAR_DESTINATIONS.reduce(
  (acc, destination) => {
    acc[destination.island].push(destination);
    return acc;
  },
  {
    nassau: [],
    grand_bahama: [],
    exumas: [],
    abaco: [],
    eleuthera: [],
    andros: [],
    bimini: [],
    long_island: [],
  } as Record<Island, PopularDestination[]>,
);

function offsetLocation(base: { lat: number; lng: number }, latOffset: number, lngOffset: number, name?: string, address?: string): Location {
  return {
    latitude: Number((base.lat + latOffset).toFixed(4)),
    longitude: Number((base.lng + lngOffset).toFixed(4)),
    name,
    address,
  };
}

export function getDestinationsForIsland(island: Island): PopularDestination[] {
  return POPULAR_DESTINATIONS_BY_ISLAND[island];
}

export function getRandomDestinationForIsland(island: Island): PopularDestination {
  const destinations = getDestinationsForIsland(island);
  return destinations[Math.floor(Math.random() * destinations.length)] ?? POPULAR_DESTINATIONS[0];
}

export function findDestinationByNameOrAddress(query: string, preferredIsland?: Island): PopularDestination | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const matches = POPULAR_DESTINATIONS.filter(
    (destination) =>
      destination.name.toLowerCase() === normalized ||
      destination.location.name?.toLowerCase() === normalized ||
      destination.address.toLowerCase().includes(normalized),
  );

  if (preferredIsland) {
    const islandMatch = matches.find((destination) => destination.island === preferredIsland);
    if (islandMatch) return islandMatch;
  }

  return matches[0] ?? null;
}

export function getDestinationEstimate(destination: PopularDestination): { km: number; mins: number } {
  return DESTINATION_DISTANCE_BY_ID[destination.id] ?? { km: 5, mins: 12 };
}

export function getCurrentLocationForIsland(island: Island): Location {
  const shortLabel = getIslandShortLabel(island);
  return {
    latitude: ISLAND_COORDS[island].lat,
    longitude: ISLAND_COORDS[island].lng,
    name: "Current Location",
    address: `${shortLabel}, Bahamas`,
  };
}

export function getSavedPlacesForIsland(island: Island): SavedPlace[] {
  const center = ISLAND_COORDS[island];
  const airport =
    getDestinationsForIsland(island).find((destination) => destination.name.toLowerCase().includes("airport")) ??
    getDestinationsForIsland(island)[0];
  const shortLabel = getIslandShortLabel(island);

  return [
    {
      label: "Home",
      icon: "house.fill",
      dest: {
        id: `saved-home-${island}`,
        name: "Home",
        address: `${shortLabel}, Bahamas`,
        icon: "house.fill",
        location: offsetLocation(center, 0.0025, -0.0025, "Home", `${shortLabel}, Bahamas`),
        island,
      },
    },
    {
      label: "Work",
      icon: "building.2.fill",
      dest: {
        id: `saved-work-${island}`,
        name: "Work",
        address: `${shortLabel}, Bahamas`,
        icon: "building.2.fill",
        location: offsetLocation(center, 0.006, 0.003, "Work", `${shortLabel}, Bahamas`),
        island,
      },
    },
    {
      label: airport?.name.toLowerCase().includes("airport") ? "Airport" : airport?.name ?? "Saved Place",
      icon: airport?.icon ?? "mappin.and.ellipse",
      dest: airport ?? {
        id: `saved-airport-${island}`,
        name: "Airport",
        address: `${shortLabel}, Bahamas`,
        icon: "paperplane.fill",
        location: offsetLocation(center, -0.004, 0.004, "Airport", `${shortLabel}, Bahamas`),
        island,
      },
    },
  ];
}

const DRIVER_OFFSETS = [
  { lat: 0.0035, lng: 0.004 },
  { lat: -0.0025, lng: 0.006 },
  { lat: 0.0045, lng: -0.0035 },
  { lat: -0.0055, lng: -0.004 },
  { lat: 0.006, lng: 0.0015 },
  { lat: -0.003, lng: -0.0065 },
];

export function getNearbyDriversForIsland(island: Island): Location[] {
  const center = ISLAND_COORDS[island];
  return DRIVER_OFFSETS.map((offset, index) =>
    offsetLocation(center, offset.lat, offset.lng, `Driver ${index + 1}`),
  );
}

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
    tip: 3,
  },
  {
    id: "r2",
    pickup: { latitude: 25.0781, longitude: -77.3431, name: "Bay Street", address: "Downtown Nassau" },
    dropoff: { latitude: 25.039, longitude: -77.4662, name: "Nassau Airport", address: "Windsor Field Rd" },
    rideType: "premium",
    status: "completed",
    fare: 35,
    distance: 14.5,
    duration: 22,
    driverName: "Sandra Williams",
    driverRating: 4.8,
    riderRating: 5,
    date: "2026-03-09T08:15:00Z",
    tip: 5,
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
  const total = daily.reduce((sum, item) => sum + item.earnings, 0);
  const trips = daily.reduce((sum, item) => sum + item.trips, 0);

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

function buildRideRequestTemplates(island: Island): RideRequest[] {
  const destinations = getDestinationsForIsland(island);
  const pickupBase = destinations[0] ?? getRandomDestinationForIsland(island);
  const alternatePickup = destinations[1] ?? pickupBase;
  const thirdStop = destinations[2] ?? alternatePickup;
  const fourthStop = destinations[3] ?? thirdStop;
  const fifthStop = destinations[4] ?? fourthStop;

  const routes = [
    { pickup: alternatePickup, dropoff: pickupBase, rideType: "standard" as RideType },
    { pickup: pickupBase, dropoff: thirdStop, rideType: "premium" as RideType },
    { pickup: thirdStop, dropoff: fourthStop, rideType: "standard" as RideType },
    { pickup: fourthStop, dropoff: alternatePickup, rideType: "shared" as RideType },
    { pickup: fifthStop, dropoff: pickupBase, rideType: "premium" as RideType },
  ];

  return routes.map((route, index) => {
    const rider = DEFAULT_RIDERS[index % DEFAULT_RIDERS.length];
    const estimate = getDestinationEstimate(route.dropoff);
    return {
      id: `req-${island}-${index + 1}`,
      riderId: rider.id,
      riderName: rider.name,
      riderRating: rider.rating,
      pickup: route.pickup.location,
      dropoff: route.dropoff.location,
      rideType: route.rideType,
      estimatedFare: calculateFare(estimate.km, estimate.mins, route.rideType),
      estimatedDuration: estimate.mins,
      estimatedDistance: estimate.km,
      island,
      createdAt: new Date().toISOString(),
    };
  });
}

export function getMockRideRequestsForIsland(island: Island): RideRequest[] {
  return buildRideRequestTemplates(island);
}

export const MOCK_RIDE_REQUESTS: RideRequest[] = getMockRideRequestsForIsland("nassau");
export const MOCK_RIDE_REQUEST: RideRequest = MOCK_RIDE_REQUESTS[0];

let requestIndex = 0;

export function getNextMockRideRequest(island: Island = "nassau"): RideRequest {
  const requests = getMockRideRequestsForIsland(island);
  const request = requests[requestIndex % requests.length];
  requestIndex += 1;
  return {
    ...request,
    id: `req_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
}

interface CreateMockActiveRideOptions {
  isRider: boolean;
  island?: Island;
  pickup?: Location;
  dropoff?: Location;
  rideType?: RideType;
  riderName?: string;
  driverName?: string;
  riderRating?: number;
  driverRating?: number;
}

export function createMockActiveRide(input: boolean | CreateMockActiveRideOptions): ActiveRide {
  const options: CreateMockActiveRideOptions =
    typeof input === "boolean" ? { isRider: input } : input;

  const island = options.island ?? "nassau";
  const rideType = options.rideType ?? "standard";
  const destination = options.dropoff ?? getRandomDestinationForIsland(island).location;
  const estimate =
    options.dropoff && "name" in options.dropoff && options.dropoff.name
      ? getDestinationEstimate(
          POPULAR_DESTINATIONS.find((item) => item.location.name === options.dropoff?.name) ??
            getRandomDestinationForIsland(island),
        )
      : getDestinationEstimate(getRandomDestinationForIsland(island));
  const vehicle = rideType === "premium" ? VEHICLE_OPTIONS[3] : VEHICLE_OPTIONS[0];

  return {
    id: `active-${Date.now()}`,
    riderId: "rider123",
    driverId: "driver456",
    riderName: options.isRider ? "You" : options.riderName ?? DEFAULT_RIDERS[0].name,
    driverName: options.isRider ? options.driverName ?? DEFAULT_DRIVER_NAMES[0] : options.driverName ?? "You",
    driverRating: options.driverRating ?? 4.9,
    riderRating: options.riderRating ?? 4.8,
    driverPhoto: undefined,
    vehicleInfo: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      plateNumber: vehicle.plateNumber,
      seats: 4,
    },
    pickup: options.pickup ?? getCurrentLocationForIsland(island),
    dropoff: destination,
    rideType,
    status: "driver_en_route",
    fare: calculateFare(estimate.km, estimate.mins, rideType),
    estimatedDuration: estimate.mins,
    estimatedDistance: estimate.km,
    driverLocation: getNearbyDriversForIsland(island)[0],
    eta: 4,
  };
}

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

export const NEARBY_DRIVERS: Location[] = getNearbyDriversForIsland("nassau");
