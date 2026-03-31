import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { POPULAR_DESTINATIONS, NEARBY_DRIVERS, createMockActiveRide } from "@/lib/mock-data";
import { RIDE_TYPE_CONFIG, calculateFare } from "@/lib/types";
import type { PopularDestination, RideType, ActiveRide } from "@/lib/types";
import RideOptions from "./ride-options";
import RideTracking from "./ride-tracking";
import RideComplete from "./ride-complete";
import IslandMap from "@/components/ui/island-map";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";

type RiderView = "home" | "search" | "options" | "matching" | "driver_found" | "tracking" | "complete";

// Simulated distances from "current location" for each destination
const DEST_DISTANCES: Record<string, { km: number; mins: number }> = {
  "1": { km: 14.2, mins: 22 },  // Airport
  "2": { km: 8.5, mins: 15 },   // Atlantis
  "3": { km: 3.2, mins: 8 },    // Downtown
  "4": { km: 6.8, mins: 14 },   // Cable Beach
  "5": { km: 3.5, mins: 9 },    // Cruise Port
  "6": { km: 4.1, mins: 10 },   // Fish Fry
  "7": { km: 3.0, mins: 7 },    // Bay Street
  "8": { km: 7.2, mins: 15 },   // Baha Mar
  "9": { km: 2.8, mins: 6 },    // Junkanoo Beach
  "10": { km: 2.1, mins: 5 },   // Queen's Staircase
  "11": { km: 4.5, mins: 11 },  // Fort Charlotte
  "12": { km: 2.9, mins: 7 },   // Straw Market
  "13": { km: 9.0, mins: 16 },  // Comfort Suites
  "14": { km: 4.0, mins: 9 },   // Potter's Cay
  "15": { km: 2.5, mins: 6 },   // PMH
  "16": { km: 5.5, mins: 12 },  // UB
  "gb1": { km: 4.2, mins: 10 }, // Port Lucaya
  "gb2": { km: 8.0, mins: 16 }, // GB Airport
  "gb3": { km: 18.0, mins: 28 },// Lucayan Park
  "gb4": { km: 5.5, mins: 12 }, // Taino Beach
  "gb5": { km: 3.8, mins: 9 },  // Intl Bazaar
  "gb6": { km: 10.0, mins: 18 },// Freeport Harbour
  "ex1": { km: 3.0, mins: 8 },  // George Town
  "ex2": { km: 6.5, mins: 14 }, // Exuma Airport
  "ex3": { km: 4.0, mins: 10 }, // Stocking Island
  "el1": { km: 5.0, mins: 12 }, // GHB Airport
  "el2": { km: 8.0, mins: 18 }, // Harbour Island
  "el3": { km: 12.0, mins: 22 },// Glass Window
  "ab1": { km: 4.5, mins: 10 }, // Marsh Harbour
  "ab2": { km: 7.0, mins: 15 }, // Hope Town
  "bi1": { km: 3.0, mins: 7 },  // Resorts World
  "bi2": { km: 5.0, mins: 11 }, // Bimini Airport
  "an1": { km: 4.0, mins: 9 },  // Andros Airport
  "an2": { km: 6.0, mins: 13 }, // Small Hope Bay
  "li1": { km: 5.0, mins: 11 }, // Stella Maris
  "li2": { km: 10.0, mins: 20 },// Dean's Blue Hole
};

// Saved places for the user
const SAVED_PLACES: { label: string; icon: string; dest: PopularDestination }[] = [
  {
    label: "Home",
    icon: "house.fill",
    dest: {
      id: "saved_home",
      name: "Home",
      address: "Eastern Road, Nassau",
      icon: "house.fill",
      location: { latitude: 25.0443, longitude: -77.3504, name: "Home", address: "Eastern Road, Nassau" },
      island: "nassau",
    },
  },
  {
    label: "Work",
    icon: "building.2.fill",
    dest: {
      id: "saved_work",
      name: "Work",
      address: "Frederick Street, Nassau",
      icon: "building.2.fill",
      location: { latitude: 25.0770, longitude: -77.3410, name: "Work", address: "Frederick Street, Nassau" },
      island: "nassau",
    },
  },
  {
    label: "Airport",
    icon: "paperplane.fill",
    dest: {
      id: "1",
      name: "Lynden Pindling Intl Airport",
      address: "Windsor Field Rd, Nassau",
      icon: "paperplane.fill",
      location: { latitude: 25.039, longitude: -77.4662, name: "Nassau Airport" },
      island: "nassau",
    },
  },
];

const DRIVER_NAMES = [
  "Marcus Thompson", "Sandra Williams", "Devon Rolle",
  "Keisha Ferguson", "Ricardo Cartwright", "Tamika Sands",
];
const VEHICLE_OPTIONS = [
  { make: "Toyota", model: "Camry", year: 2024, color: "White", plate: "NP-4521" },
  { make: "Honda", model: "Accord", year: 2023, color: "Silver", plate: "NP-7832" },
  { make: "Nissan", model: "Altima", year: 2024, color: "Black", plate: "NP-6190" },
  { make: "BMW", model: "5 Series", year: 2025, color: "Midnight Blue", plate: "NP-1088" },
  { make: "Mercedes", model: "E-Class", year: 2025, color: "Pearl White", plate: "NP-2255" },
];

export default function RiderHome() {
  const colors = useColors();
  const { state, dispatch } = useApp();
  const [view, setView] = useState<RiderView>("home");
  const [searchText, setSearchText] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<PopularDestination | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>("standard");
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [matchProgress, setMatchProgress] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // MVP: Nassau-only destinations
  const nassauDestinations = POPULAR_DESTINATIONS.filter((d) => d.island === "nassau");
  const filteredDestinations = searchText
    ? nassauDestinations.filter(
        (d) =>
          d.name.toLowerCase().includes(searchText.toLowerCase()) ||
          d.address.toLowerCase().includes(searchText.toLowerCase()) ||
          (d.location.name && d.location.name.toLowerCase().includes(searchText.toLowerCase()))
      )
    : nassauDestinations;

  // Recent rides from history
  const recentDestinations = useMemo(() => {
    return state.rideHistory
      .filter((r) => r.status === "completed")
      .slice(0, 3)
      .map((r) => ({
        name: r.dropoff.name || "Unknown",
        address: r.dropoff.address || "",
        date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
  }, [state.rideHistory]);

  const getDestDistance = useCallback((dest: PopularDestination) => {
    return DEST_DISTANCES[dest.id] || { km: 5 + Math.random() * 10, mins: 10 + Math.round(Math.random() * 15) };
  }, []);

  const handleSelectDestination = useCallback((dest: PopularDestination) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDestination(dest);
    setView("options");
  }, []);

  const handleRequestRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMatchProgress(0);
    setView("matching");

    // Simulate progressive matching
    const steps = [
      { delay: 800, progress: 25 },
      { delay: 1600, progress: 55 },
      { delay: 2400, progress: 85 },
      { delay: 3200, progress: 100 },
    ];
    steps.forEach(({ delay, progress }) => {
      setTimeout(() => setMatchProgress(progress), delay);
    });

    // After matching, show driver found
    setTimeout(() => {
      const driverIdx = Math.floor(Math.random() * DRIVER_NAMES.length);
      const vehicleIdx = selectedRideType === "premium"
        ? 3 + Math.floor(Math.random() * 2)
        : Math.floor(Math.random() * 3);
      const vehicle = VEHICLE_OPTIONS[vehicleIdx];
      const dist = selectedDestination ? getDestDistance(selectedDestination) : { km: 6.8, mins: 12 };
      const fare = calculateFare(dist.km, dist.mins, selectedRideType);

      const ride: ActiveRide = {
        id: `ride-${Date.now()}`,
        riderId: "rider123",
        driverId: `driver-${driverIdx}`,
        riderName: "You",
        driverName: DRIVER_NAMES[driverIdx],
        driverRating: 4.5 + Math.random() * 0.5,
        riderRating: 4.8,
        vehicleInfo: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          plateNumber: vehicle.plate,
          seats: 4,
        },
        pickup: { latitude: 25.0781, longitude: -77.3431, name: "Current Location", address: "Nassau, Bahamas" },
        dropoff: selectedDestination?.location || { latitude: 25.0867, longitude: -77.3233, name: "Atlantis Resort" },
        rideType: selectedRideType,
        status: "driver_en_route",
        fare,
        estimatedDuration: dist.mins,
        estimatedDistance: dist.km,
        driverLocation: { latitude: 25.073, longitude: -77.35 },
        eta: 3 + Math.floor(Math.random() * 4),
      };
      setActiveRide(ride);
      setView("driver_found");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3500);
  }, [selectedDestination, selectedRideType, getDestDistance]);

  const handleConfirmDriver = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setView("tracking");
  }, []);

  const handleCompleteRide = useCallback(() => {
    if (activeRide) {
      const completedRide = { ...activeRide, status: "completed" as const };
      setActiveRide(completedRide);
      dispatch({
        type: "ADD_RIDE_HISTORY",
        item: {
          id: `ride-${Date.now()}`,
          pickup: completedRide.pickup,
          dropoff: completedRide.dropoff,
          rideType: completedRide.rideType,
          status: "completed",
          fare: completedRide.fare,
          distance: completedRide.estimatedDistance,
          duration: completedRide.estimatedDuration,
          driverName: completedRide.driverName,
          driverRating: completedRide.driverRating,
          riderRating: 5,
          date: new Date().toISOString(),
        },
      });
      setView("complete");
    }
  }, [activeRide, dispatch]);

  const handleDone = useCallback(() => {
    setView("home");
    setActiveRide(null);
    setSelectedDestination(null);
    setSearchText("");
    setSelectedRideType("standard");
  }, []);

  // Pulse animation for matching
  useEffect(() => {
    if (view === "matching") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [view, pulseAnim]);

  // ── Ride Complete ──
  if (view === "complete" && activeRide) {
    return <RideComplete ride={activeRide} onDone={handleDone} />;
  }

  // ── Ride Tracking ──
  if (view === "tracking" && activeRide) {
    return <RideTracking ride={activeRide} onComplete={handleCompleteRide} />;
  }

  // ── Driver Found ──
  if (view === "driver_found" && activeRide) {
    const isPremium = activeRide.rideType === "premium";
    return (
      <ScreenContainer>
        <View style={[styles.driverFoundContainer, { backgroundColor: colors.background }]}>
          {/* Top section */}
          <View style={styles.driverFoundTop}>
            <View style={[styles.driverFoundBadge, { backgroundColor: colors.success + "15" }]}>
              <IconSymbol name="checkmark" size={20} color={colors.success} />
            </View>
            <Text style={[styles.driverFoundTitle, { color: colors.foreground }]}>Driver Found!</Text>
            <Text style={[styles.driverFoundSubtitle, { color: colors.muted }]}>
              Your driver is on the way
            </Text>
          </View>

          {/* Driver card */}
          <View style={[styles.driverFoundCard, { backgroundColor: colors.surface }]}>
            <View style={styles.driverFoundRow}>
              <View style={[styles.driverFoundAvatar, { backgroundColor: isPremium ? GOLD : colors.primary }]}>
                <Text style={styles.driverFoundInitial}>{activeRide.driverName[0]}</Text>
              </View>
              <View style={styles.driverFoundInfo}>
                <Text style={[styles.driverFoundName, { color: colors.foreground }]}>{activeRide.driverName}</Text>
                <View style={styles.driverFoundMeta}>
                  <IconSymbol name="star.fill" size={14} color={colors.warning} />
                  <Text style={[styles.driverFoundRating, { color: colors.muted }]}>
                    {activeRide.driverRating.toFixed(1)}
                  </Text>
                  <Text style={[{ color: colors.border }]}> · </Text>
                  <Text style={[styles.driverFoundTrips, { color: colors.muted }]}>
                    {200 + Math.floor(Math.random() * 800)} trips
                  </Text>
                </View>
              </View>
              <View style={[styles.driverFoundEtaBox, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.driverFoundEtaNum, { color: colors.primary }]}>{activeRide.eta}</Text>
                <Text style={[styles.driverFoundEtaLabel, { color: colors.primary }]}>min</Text>
              </View>
            </View>

            {/* Vehicle info */}
            <View style={[styles.vehicleInfoRow, { borderTopColor: colors.border }]}>
              <View style={[styles.vehicleIconBox, { backgroundColor: isPremium ? GOLD + "15" : colors.primary + "15" }]}>
                <IconSymbol name="car.fill" size={18} color={isPremium ? GOLD : colors.primary} />
              </View>
              <View style={styles.vehicleInfoText}>
                <Text style={[styles.vehicleName, { color: colors.foreground }]}>
                  {activeRide.vehicleInfo.color} {activeRide.vehicleInfo.make} {activeRide.vehicleInfo.model}
                </Text>
                <Text style={[styles.vehiclePlate, { color: colors.primary }]}>
                  {activeRide.vehicleInfo.plateNumber}
                </Text>
              </View>
              <Text style={[styles.vehicleYear, { color: colors.muted }]}>{activeRide.vehicleInfo.year}</Text>
            </View>
          </View>

          {/* Trip details */}
          <View style={[styles.tripDetailsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.tripRoute}>
              <View style={styles.tripRouteDots}>
                <View style={[styles.tripRouteDotStart, { backgroundColor: colors.primary }]} />
                <View style={[styles.tripRouteLine, { backgroundColor: colors.border }]} />
                <View style={[styles.tripRouteDotEnd, { backgroundColor: GOLD }]} />
              </View>
              <View style={styles.tripRouteTexts}>
                <View>
                  <Text style={[styles.tripRouteLabel, { color: colors.muted }]}>PICKUP</Text>
                  <Text style={[styles.tripRouteAddr, { color: colors.foreground }]}>{activeRide.pickup.name || "Current Location"}</Text>
                </View>
                <View>
                  <Text style={[styles.tripRouteLabel, { color: colors.muted }]}>DROPOFF</Text>
                  <Text style={[styles.tripRouteAddr, { color: colors.foreground }]}>{activeRide.dropoff.name || "Destination"}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.tripStatsRow, { borderTopColor: colors.border }]}>
              <View style={styles.tripStat}>
                <Text style={[styles.tripStatValue, { color: colors.foreground }]}>{activeRide.estimatedDistance.toFixed(1)} km</Text>
                <Text style={[styles.tripStatLabel, { color: colors.muted }]}>Distance</Text>
              </View>
              <View style={[styles.tripStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.tripStat}>
                <Text style={[styles.tripStatValue, { color: colors.foreground }]}>{activeRide.estimatedDuration} min</Text>
                <Text style={[styles.tripStatLabel, { color: colors.muted }]}>Duration</Text>
              </View>
              <View style={[styles.tripStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.tripStat}>
                <Text style={[styles.tripStatValue, { color: colors.foreground }]}>${activeRide.fare.toFixed(2)}</Text>
                <Text style={[styles.tripStatLabel, { color: colors.muted }]}>Est. Fare</Text>
              </View>
            </View>
          </View>

          {/* Confirm button */}
          <View style={styles.driverFoundActions}>
            <Pressable
              onPress={handleConfirmDriver}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: colors.primary },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={styles.confirmBtnText}>Track My Ride</Text>
              <IconSymbol name="chevron.right" size={18} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleDone}
              style={({ pressed }) => [styles.cancelLinkBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.cancelLinkText, { color: colors.muted }]}>Cancel Ride</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ── Matching Animation ──
  if (view === "matching") {
    return (
      <ScreenContainer>
        {/* Map with searching animation */}
        <View style={{ flex: 1 }}>
          <IslandMap
            mode="searching"
            showDrivers={true}
            showPickup={true}
            showDropoff={!!selectedDestination}
            showRoute={!!selectedDestination}
            pickupLabel="You"
            dropoffLabel={selectedDestination?.name}
            driverCount={6}
          />
        </View>

        {/* Bottom overlay */}
        <View style={[styles.matchingOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          <View style={styles.matchingHeader}>
            <Animated.View style={[styles.matchingIconRing, { borderColor: colors.primary, transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.matchingIconInner, { backgroundColor: colors.primary }]}>
                <IconSymbol name="car.fill" size={22} color="#fff" />
              </View>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.matchingTitle, { color: colors.foreground }]}>Finding your driver</Text>
              <Text style={[styles.matchingSubtitle, { color: colors.muted }]}>
                {matchProgress < 30 ? "Scanning nearby drivers..." : matchProgress < 60 ? "Found available drivers..." : matchProgress < 90 ? "Matching best driver..." : "Almost there..."}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.surface }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${matchProgress}%` as any }]} />
          </View>

          {/* Destination reminder */}
          {selectedDestination && (
            <View style={[styles.matchingDestCard, { backgroundColor: colors.surface }]}>
              <View style={styles.matchingDestRow}>
                <View style={[styles.matchingDestDot, { backgroundColor: GOLD }]} />
                <View style={styles.matchingDestInfo}>
                  <Text style={[styles.matchingDestName, { color: colors.foreground }]}>{selectedDestination.name}</Text>
                  <Text style={[styles.matchingDestAddr, { color: colors.muted }]}>{selectedDestination.address}</Text>
                </View>
                <Text style={[styles.matchingDestFare, { color: colors.primary }]}>
                  ~${calculateFare(getDestDistance(selectedDestination).km, getDestDistance(selectedDestination).mins, selectedRideType).toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={() => {
              setView("options");
              setMatchProgress(0);
            }}
            style={({ pressed }) => [
              styles.cancelMatchBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.cancelMatchText, { color: colors.muted }]}>Cancel Search</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── Ride Options ──
  if (view === "options" && selectedDestination) {
    return (
      <RideOptions
        destination={selectedDestination}
        selectedType={selectedRideType}
        onSelectType={setSelectedRideType}
        onRequest={handleRequestRide}
        onBack={() => setView("search")}
      />
    );
  }

  // ── Search View ──
  if (view === "search") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.searchHeader}>
          <Pressable
            onPress={() => setView("home")}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.searchTitle, { color: colors.foreground }]}>Where to?</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Route input */}
        <View style={[styles.routeInputCard, { backgroundColor: colors.surface }]}>
          <View style={styles.routeInputDots}>
            <View style={[styles.routeInputDotGreen, { backgroundColor: colors.primary }]} />
            <View style={[styles.routeInputLine, { backgroundColor: colors.border }]} />
            <View style={[styles.routeInputDotGold, { backgroundColor: GOLD }]} />
          </View>
          <View style={styles.routeInputTexts}>
            <View style={[styles.routeInputRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.routeInputFixed, { color: colors.foreground }]}>Current Location</Text>
              <View style={[styles.routeInputLiveDot, { backgroundColor: colors.success }]} />
            </View>
            <View style={styles.routeInputRow}>
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Enter destination..."
                placeholderTextColor={colors.muted}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
                returnKeyType="done"
              />
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText("")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                  <IconSymbol name="xmark" size={18} color={colors.muted} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Saved places */}
        {!searchText && (
          <View style={styles.savedRow}>
            {SAVED_PLACES.map((sp) => (
              <Pressable
                key={sp.label}
                onPress={() => handleSelectDestination(sp.dest)}
                style={({ pressed }) => [styles.savedChip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
              >
                <IconSymbol name={sp.icon as any} size={14} color={colors.primary} />
                <Text style={[styles.savedChipText, { color: colors.foreground }]}>{sp.label}</Text>
              </Pressable>
            ))}
            <Pressable style={({ pressed }) => [styles.savedChip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="plus" size={14} color={colors.muted} />
              <Text style={[styles.savedChipText, { color: colors.muted }]}>Add</Text>
            </Pressable>
          </View>
        )}

        {/* Recent rides */}
        {!searchText && recentDestinations.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Recent</Text>
            {recentDestinations.map((r, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  const match = nassauDestinations.find((d: PopularDestination) => d.name === r.name || d.location.name === r.name);
                  if (match) handleSelectDestination(match);
                }}
                style={({ pressed }) => [
                  styles.recentRow,
                  { borderBottomColor: colors.border },
                  pressed && { opacity: 0.7, backgroundColor: colors.surface },
                ]}
              >
                <View style={[styles.recentIcon, { backgroundColor: colors.surface }]}>
                  <IconSymbol name="clock.fill" size={16} color={colors.muted} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentName, { color: colors.foreground }]}>{r.name}</Text>
                  <Text style={[styles.recentAddr, { color: colors.muted }]}>{r.address || r.date}</Text>
                </View>
                <Text style={[styles.recentDate, { color: colors.muted }]}>{r.date}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Suggested destinations when search is empty */}
        {!searchText && (
          <View style={styles.suggestedSection}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Suggested for You</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {nassauDestinations.slice(0, 5).map((dest: PopularDestination) => {
                const dist = getDestDistance(dest);
                return (
                  <Pressable
                    key={dest.id}
                    onPress={() => handleSelectDestination(dest)}
                    style={({ pressed }) => [
                      styles.suggestedCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={[styles.suggestedIcon, { backgroundColor: colors.primary + "15" }]}>
                      <IconSymbol name={dest.icon as any} size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.suggestedName, { color: colors.foreground }]} numberOfLines={1}>{dest.name}</Text>
                    <Text style={[styles.suggestedEta, { color: colors.muted }]}>{dist.mins} min</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>
          {searchText
            ? `${filteredDestinations.length} result${filteredDestinations.length !== 1 ? "s" : ""} for "${searchText}"`
            : "Popular in Nassau"}
        </Text>

        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const dist = getDestDistance(item);
            const fare = calculateFare(dist.km, dist.mins, "standard");

            return (
              <Pressable
                onPress={() => handleSelectDestination(item)}
                style={({ pressed }) => [
                  styles.destRow,
                  { borderBottomColor: colors.border },
                  pressed && { opacity: 0.7, backgroundColor: colors.surface },
                ]}
              >
                <View style={[styles.destIcon, { backgroundColor: colors.primary + "12" }]}>
                  <IconSymbol name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.destInfo}>
                  <Text style={[styles.destName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.destAddr, { color: colors.muted }]}>
                    {item.address}
                  </Text>
                </View>
                <View style={styles.destMeta}>
                  <Text style={[styles.destEta, { color: colors.foreground }]}>{dist.mins} min</Text>
                  <Text style={[styles.destFare, { color: colors.muted }]}>~${fare.toFixed(0)}</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="magnifyingglass" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No destinations found</Text>
              <Text style={[styles.emptySubtext, { color: colors.border }]}>Try searching for a place, address, or landmark</Text>
            </View>
          }
        />
      </ScreenContainer>
    );
  }

  // ── Home View ──
  const driverCount = NEARBY_DRIVERS.length;
  return (
    <ScreenContainer>
      {/* Map Background */}
      <View style={[styles.mapContainer]}>
        <IslandMap mode="idle" showDrivers={true} driverCount={driverCount}>
          {/* Island chip */}
          <View style={[styles.islandChip, { backgroundColor: colors.background + "F0" }]}>
            <IconSymbol name="location.fill" size={13} color={colors.primary} />
            <Text style={[styles.islandChipText, { color: colors.foreground }]}>
              Nassau / Paradise Island
            </Text>
          </View>

          {/* Drivers nearby badge */}
          <View style={[styles.driverCountBadge, { backgroundColor: colors.background + "F0" }]}>
            <View style={[styles.driverCountDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.driverCountText, { color: colors.foreground }]}>
              {driverCount} drivers nearby
            </Text>
          </View>
        </IslandMap>
      </View>

      {/* Bottom Card */}
      <View style={[styles.bottomCard, { backgroundColor: colors.background }]}>
        {/* Handle bar */}
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

        <Text style={[styles.greeting, { color: colors.foreground }]}>
          Good {getTimeOfDay()}, {state.userName.split(" ")[0]}
        </Text>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setView("search");
          }}
          style={({ pressed }) => [
            styles.whereToBtn,
            { backgroundColor: colors.surface },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <View style={[styles.whereToIcon, { backgroundColor: colors.primary + "18" }]}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.whereToText, { color: colors.muted }]}>Where to?</Text>
          <View style={[styles.scheduleBadge, { backgroundColor: colors.primary + "12" }]}>
            <IconSymbol name="clock.fill" size={14} color={colors.primary} />
            <Text style={[styles.scheduleText, { color: colors.primary }]}>Now</Text>
          </View>
        </Pressable>

        {/* Quick destinations */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickDests}>
          {nassauDestinations.slice(0, 4).map((dest: PopularDestination) => {
            const dist = getDestDistance(dest);
            return (
              <Pressable
                key={dest.id}
                onPress={() => handleSelectDestination(dest)}
                style={({ pressed }) => [
                  styles.quickDestChip,
                  { backgroundColor: colors.surface },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.quickDestIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name={dest.icon as any} size={14} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.quickDestText, { color: colors.foreground }]} numberOfLines={1}>
                    {dest.name.split(" ").slice(0, 2).join(" ")}
                  </Text>
                  <Text style={[styles.quickDestEta, { color: colors.muted }]}>{dist.mins} min</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  // Map
  mapContainer: { flex: 1, position: "relative", overflow: "hidden" },
  mapGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 0.5 },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 0.5 },
  roadH: { position: "absolute", left: 0, right: 0, height: 3 },
  roadV: { position: "absolute", top: 0, bottom: 0, width: 3 },
  driverMarker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  currentLocation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -24,
    marginLeft: -24,
    alignItems: "center",
    justifyContent: "center",
  },
  locPulse: { position: "absolute", width: 48, height: 48, borderRadius: 24 },
  locOuter: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 3,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,212,228,0.1)",
  },
  locInner: { width: 12, height: 12, borderRadius: 6 },
  islandChip: {
    position: "absolute", top: 12, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  islandChipText: { fontSize: 13, fontWeight: "600" },
  driverCountBadge: {
    position: "absolute", top: 12, right: 14,
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  driverCountDot: { width: 7, height: 7, borderRadius: 3.5 },
  driverCountText: { fontSize: 12, fontWeight: "600" },

  // Bottom card
  bottomCard: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8,
  },
  handleBar: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  greeting: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  whereToBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16,
  },
  whereToIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  whereToText: { flex: 1, fontSize: 17, fontWeight: "500" },
  scheduleBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  scheduleText: { fontSize: 13, fontWeight: "600" },
  quickDests: { marginTop: 14 },
  quickDestChip: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 10,
  },
  quickDestIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  quickDestText: { fontSize: 14, fontWeight: "500", maxWidth: 100 },
  quickDestEta: { fontSize: 11, marginTop: 1 },

  // Search
  searchHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12,
  },
  searchTitle: { fontSize: 18, fontWeight: "700" },
  routeInputCard: { borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: "row", gap: 12 },
  routeInputDots: { alignItems: "center", paddingTop: 8, gap: 0 },
  routeInputDotGreen: { width: 10, height: 10, borderRadius: 5 },
  routeInputLine: { width: 2, height: 24, marginVertical: 2 },
  routeInputDotGold: { width: 10, height: 10, borderRadius: 3 },
  routeInputTexts: { flex: 1 },
  routeInputRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: "transparent",
  },
  routeInputFixed: { flex: 1, fontSize: 15, fontWeight: "500" },
  routeInputLiveDot: { width: 8, height: 8, borderRadius: 4 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  savedRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  savedChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  savedChipText: { fontSize: 13, fontWeight: "500" },
  recentSection: { marginBottom: 12 },
  recentRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 0.5, gap: 12,
  },
  recentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: "600" },
  recentAddr: { fontSize: 12, marginTop: 2 },
  recentDate: { fontSize: 11 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", textTransform: "uppercase",
    letterSpacing: 0.8, marginBottom: 8,
  },
  destRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14,
    borderBottomWidth: 0.5, gap: 12,
  },
  destIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  destInfo: { flex: 1 },
  destName: { fontSize: 15, fontWeight: "600" },
  destAddr: { fontSize: 13, marginTop: 2 },
  destMeta: { alignItems: "flex-end" },
  destEta: { fontSize: 14, fontWeight: "700" },
  destFare: { fontSize: 12, marginTop: 2 },
  suggestedSection: { marginBottom: 12 },
  suggestedCard: {
    width: 110, alignItems: "center", paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 14, borderWidth: 1, marginRight: 10,
  },
  suggestedIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  suggestedName: { fontSize: 12, fontWeight: "600", textAlign: "center" as const },
  suggestedEta: { fontSize: 11, marginTop: 3 },
  emptyState: { paddingVertical: 48, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  emptySubtext: { fontSize: 13 },

  // Matching
  matchingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  matchingOverlay: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  matchingHeader: {
    flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8, marginBottom: 14,
  },
  matchingIconRing: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2.5,
    alignItems: "center", justifyContent: "center",
  },
  matchingIconInner: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  matchingPulse: { borderWidth: 2, borderRadius: 100, padding: 8, marginBottom: 36 },
  ringOuter: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  ringMiddle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  ringInner: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  matchingTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  matchingSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  progressBarBg: { width: "80%", height: 6, borderRadius: 3, marginBottom: 10, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 13, marginBottom: 24 },
  matchingDestCard: { width: "100%", borderRadius: 14, padding: 14, marginBottom: 24 },
  matchingDestRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  matchingDestDot: { width: 10, height: 10, borderRadius: 3 },
  matchingDestInfo: { flex: 1 },
  matchingDestName: { fontSize: 15, fontWeight: "600" },
  matchingDestAddr: { fontSize: 12, marginTop: 2 },
  matchingDestFare: { fontSize: 16, fontWeight: "700" },
  cancelMatchBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  cancelMatchText: { fontSize: 16, fontWeight: "500" },

  // Driver Found
  driverFoundContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  driverFoundTop: { alignItems: "center", marginBottom: 24 },
  driverFoundBadge: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  driverFoundTitle: { fontSize: 26, fontWeight: "800" },
  driverFoundSubtitle: { fontSize: 15, marginTop: 6 },
  driverFoundCard: { borderRadius: 18, padding: 18, marginBottom: 14 },
  driverFoundRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  driverFoundAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  driverFoundInitial: { color: "#fff", fontSize: 24, fontWeight: "700" },
  driverFoundInfo: { flex: 1 },
  driverFoundName: { fontSize: 18, fontWeight: "700" },
  driverFoundMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  driverFoundRating: { fontSize: 14 },
  driverFoundTrips: { fontSize: 14 },
  driverFoundEtaBox: {
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14,
  },
  driverFoundEtaNum: { fontSize: 22, fontWeight: "800" },
  driverFoundEtaLabel: { fontSize: 11, fontWeight: "600" },
  vehicleInfoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 14, paddingTop: 14, borderTopWidth: 0.5,
  },
  vehicleIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  vehicleInfoText: { flex: 1 },
  vehicleName: { fontSize: 14, fontWeight: "600" },
  vehiclePlate: { fontSize: 14, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  vehicleYear: { fontSize: 13 },

  tripDetailsCard: { borderRadius: 18, padding: 18, marginBottom: 14 },
  tripRoute: { flexDirection: "row", gap: 14 },
  tripRouteDots: { alignItems: "center", paddingTop: 4 },
  tripRouteDotStart: { width: 10, height: 10, borderRadius: 5 },
  tripRouteLine: { width: 2, height: 28, marginVertical: 4 },
  tripRouteDotEnd: { width: 10, height: 10, borderRadius: 3 },
  tripRouteTexts: { flex: 1, justifyContent: "space-between", gap: 14 },
  tripRouteLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  tripRouteAddr: { fontSize: 15, fontWeight: "600" },
  tripStatsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderTopWidth: 0.5, marginTop: 14, paddingTop: 14,
  },
  tripStat: { alignItems: "center", flex: 1 },
  tripStatValue: { fontSize: 16, fontWeight: "700" },
  tripStatLabel: { fontSize: 11, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  tripStatDivider: { width: 1, height: 28 },

  driverFoundActions: { marginTop: 8 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  confirmBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  cancelLinkBtn: { alignItems: "center", paddingVertical: 14 },
  cancelLinkText: { fontSize: 15, fontWeight: "500" },
});
