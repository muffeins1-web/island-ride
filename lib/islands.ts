export const ISLANDS = [
  {
    id: "nassau",
    label: "Nassau / Paradise Island",
    shortLabel: "Nassau",
    coords: { lat: 25.0443, lng: -77.3504 },
  },
  {
    id: "grand_bahama",
    label: "Grand Bahama",
    shortLabel: "Grand Bahama",
    coords: { lat: 26.6593, lng: -78.5201 },
  },
  {
    id: "exumas",
    label: "The Exumas",
    shortLabel: "Exumas",
    coords: { lat: 23.6203, lng: -75.9699 },
  },
  {
    id: "abaco",
    label: "Abaco",
    shortLabel: "Abaco",
    coords: { lat: 26.3454, lng: -77.1565 },
  },
  {
    id: "eleuthera",
    label: "Eleuthera",
    shortLabel: "Eleuthera",
    coords: { lat: 25.1372, lng: -76.1494 },
  },
  {
    id: "andros",
    label: "Andros",
    shortLabel: "Andros",
    coords: { lat: 24.7, lng: -77.8 },
  },
  {
    id: "bimini",
    label: "Bimini",
    shortLabel: "Bimini",
    coords: { lat: 25.7267, lng: -79.2667 },
  },
  {
    id: "long_island",
    label: "Long Island",
    shortLabel: "Long Island",
    coords: { lat: 23.1, lng: -75.1 },
  },
] as const;

export type Island = (typeof ISLANDS)[number]["id"];

export const ISLAND_OPTIONS = ISLANDS.map(({ id, label, shortLabel }) => ({
  id,
  label,
  shortLabel,
}));

export const ISLAND_LABELS = Object.fromEntries(
  ISLANDS.map(({ id, label }) => [id, label]),
) as Record<Island, string>;

export const ISLAND_SHORT_LABELS = Object.fromEntries(
  ISLANDS.map(({ id, shortLabel }) => [id, shortLabel]),
) as Record<Island, string>;

export const ISLAND_COORDS = Object.fromEntries(
  ISLANDS.map(({ id, coords }) => [id, coords]),
) as Record<Island, { lat: number; lng: number }>;

export function getIslandShortLabel(island: Island): string {
  return ISLAND_SHORT_LABELS[island];
}
