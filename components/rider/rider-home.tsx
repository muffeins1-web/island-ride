import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { POPULAR_DESTINATIONS, NEARBY_DRIVERS, createMockActiveRide } from "@/lib/mock-data";
import { ISLAND_LABELS, RIDE_TYPE_CONFIG, calculateFare } from "@/lib/types";
import type { PopularDestination, RideType, ActiveRide } from "@/lib/types";
import RideOptions from "./ride-options";
import RideTracking from "./ride-tracking";
import RideComplete from "./ride-complete";
import * as Haptics from "expo-haptics";

type RiderView = "home" | "search" | "options" | "matching" | "tracking" | "complete";

export default function RiderHome() {
  const colors = useColors();
  const { state, dispatch } = useApp();
  const [view, setView] = useState<RiderView>("home");
  const [searchText, setSearchText] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<PopularDestination | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>("standard");
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);

  const currentIsland = state.island;
  const destinations = POPULAR_DESTINATIONS.filter((d) => d.island === currentIsland);
  const filteredDestinations = searchText
    ? destinations.filter(
        (d) =>
          d.name.toLowerCase().includes(searchText.toLowerCase()) ||
          d.address.toLowerCase().includes(searchText.toLowerCase())
      )
    : destinations;

  const handleSelectDestination = useCallback((dest: PopularDestination) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDestination(dest);
    setView("options");
  }, []);

  const handleRequestRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setView("matching");
    setTimeout(() => {
      const ride = createMockActiveRide(true);
      ride.status = "driver_en_route";
      // Use the selected destination if available
      if (selectedDestination) {
        ride.dropoff = selectedDestination.location;
      }
      setActiveRide(ride);
      setView("tracking");
    }, 3000);
  }, [selectedDestination]);

  const handleCompleteRide = useCallback(() => {
    if (activeRide) {
      const completedRide = { ...activeRide, status: "completed" as const };
      setActiveRide(completedRide);
      // Record to ride history
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
  }, []);

  // ── Ride Complete ──
  if (view === "complete" && activeRide) {
    return <RideComplete ride={activeRide} onDone={handleDone} />;
  }

  // ── Ride Tracking ──
  if (view === "tracking" && activeRide) {
    return <RideTracking ride={activeRide} onComplete={handleCompleteRide} />;
  }

  // ── Matching Animation ──
  if (view === "matching") {
    return (
      <ScreenContainer>
        <View style={[styles.matchingContainer, { backgroundColor: colors.background }]}>
          {/* Animated rings */}
          <View style={[styles.ringOuter, { borderColor: colors.primary + "15" }]}>
            <View style={[styles.ringMiddle, { borderColor: colors.primary + "30" }]}>
              <View style={[styles.ringInner, { backgroundColor: colors.primary }]}>
                <IconSymbol name="car.fill" size={36} color="#fff" />
              </View>
            </View>
          </View>
          <Text style={[styles.matchingTitle, { color: colors.foreground }]}>
            Finding your driver
          </Text>
          <Text style={[styles.matchingSubtitle, { color: colors.muted }]}>
            Connecting you with nearby drivers on{"\n"}{ISLAND_LABELS[currentIsland]}
          </Text>
          <View style={[styles.matchingDots]}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.matchingDot, { backgroundColor: colors.primary, opacity: 0.3 + i * 0.3 }]} />
            ))}
          </View>
          <Pressable
            onPress={() => setView("home")}
            style={({ pressed }) => [
              styles.cancelMatchBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.cancelMatchText, { color: colors.muted }]}>Cancel</Text>
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

        {/* Search input */}
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.searchDot, { backgroundColor: colors.primary }]} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search destination..."
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

        {/* Saved places */}
        {!searchText && (
          <View style={styles.savedRow}>
            <Pressable style={({ pressed }) => [styles.savedChip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="house.fill" size={16} color={colors.primary} />
              <Text style={[styles.savedChipText, { color: colors.foreground }]}>Home</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.savedChip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="building.2.fill" size={16} color={colors.primary} />
              <Text style={[styles.savedChipText, { color: colors.foreground }]}>Work</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.savedChip, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="plus" size={16} color={colors.muted} />
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>
          {searchText ? "Results" : "Popular on " + ISLAND_LABELS[currentIsland].split("/")[0].trim()}
        </Text>

        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
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
                <Text style={[styles.destAddr, { color: colors.muted }]}>{item.address}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.border} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="magnifyingglass" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No destinations found</Text>
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
      <View style={[styles.mapContainer, { backgroundColor: colors.surface }]}>
        {/* Grid lines */}
        <View style={styles.mapGrid}>
          {[...Array(8)].map((_, i) => (
            <View
              key={`h${i}`}
              style={[styles.gridLineH, { top: `${(i + 1) * 11}%`, backgroundColor: colors.border + "60" }]}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <View
              key={`v${i}`}
              style={[styles.gridLineV, { left: `${(i + 1) * 11}%`, backgroundColor: colors.border + "60" }]}
            />
          ))}
        </View>

        {/* Road-like paths */}
        <View style={[styles.roadH, { top: "35%", backgroundColor: colors.border + "40" }]} />
        <View style={[styles.roadH, { top: "65%", backgroundColor: colors.border + "40" }]} />
        <View style={[styles.roadV, { left: "30%", backgroundColor: colors.border + "40" }]} />
        <View style={[styles.roadV, { left: "70%", backgroundColor: colors.border + "40" }]} />

        {/* Driver markers */}
        {NEARBY_DRIVERS.map((_, i) => {
          const positions = [
            { top: "22%" as any, left: "18%" as any },
            { top: "30%" as any, left: "55%" as any },
            { top: "45%" as any, left: "35%" as any },
            { top: "55%" as any, left: "72%" as any },
            { top: "65%" as any, left: "25%" as any },
            { top: "38%" as any, left: "80%" as any },
          ];
          const pos = positions[i] || positions[0];
          return (
            <View
              key={i}
              style={[
                styles.driverMarker,
                { backgroundColor: colors.foreground, top: pos.top, left: pos.left },
              ]}
            >
              <IconSymbol name="car.fill" size={13} color={colors.background} />
            </View>
          );
        })}

        {/* Current location */}
        <View style={styles.currentLocation}>
          <View style={[styles.locPulse, { backgroundColor: colors.primary + "20" }]} />
          <View style={[styles.locOuter, { borderColor: colors.primary }]}>
            <View style={[styles.locInner, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Island chip */}
        <View style={[styles.islandChip, { backgroundColor: colors.background + "F0" }]}>
          <IconSymbol name="location.fill" size={13} color={colors.primary} />
          <Text style={[styles.islandChipText, { color: colors.foreground }]}>
            {ISLAND_LABELS[currentIsland]}
          </Text>
        </View>

        {/* Drivers nearby badge */}
        <View style={[styles.driverCountBadge, { backgroundColor: colors.background + "F0" }]}>
          <View style={[styles.driverCountDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.driverCountText, { color: colors.foreground }]}>
            {driverCount} drivers nearby
          </Text>
        </View>
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
          {destinations.slice(0, 4).map((dest) => (
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
              <Text style={[styles.quickDestText, { color: colors.foreground }]} numberOfLines={1}>
                {dest.name.split(" ").slice(0, 2).join(" ")}
              </Text>
            </Pressable>
          ))}
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
  mapContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
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
  locPulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  locOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,212,228,0.1)",
  },
  locInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  islandChip: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  islandChipText: { fontSize: 13, fontWeight: "600" },
  driverCountBadge: {
    position: "absolute",
    top: 12,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  driverCountDot: { width: 7, height: 7, borderRadius: 3.5 },
  driverCountText: { fontSize: 12, fontWeight: "600" },

  // Bottom card
  bottomCard: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  greeting: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  whereToBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
  },
  whereToIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  whereToText: { flex: 1, fontSize: 17, fontWeight: "500" },
  scheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scheduleText: { fontSize: 13, fontWeight: "600" },
  quickDests: { marginTop: 14 },
  quickDestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
  },
  quickDestIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quickDestText: { fontSize: 14, fontWeight: "500", maxWidth: 100 },

  // Search
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  searchTitle: { fontSize: 18, fontWeight: "700" },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchDot: { width: 8, height: 8, borderRadius: 4 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  savedRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  savedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedChipText: { fontSize: 14, fontWeight: "500" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  destIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  destInfo: { flex: 1 },
  destName: { fontSize: 15, fontWeight: "600" },
  destAddr: { fontSize: 13, marginTop: 2 },
  emptyState: { paddingVertical: 48, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 15 },

  // Matching
  matchingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  ringMiddle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  matchingTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  matchingSubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  matchingDots: { flexDirection: "row", gap: 6, marginBottom: 32 },
  matchingDot: { width: 8, height: 8, borderRadius: 4 },
  cancelMatchBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  cancelMatchText: { fontSize: 16, fontWeight: "500" },
});
