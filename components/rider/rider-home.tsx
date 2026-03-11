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
import { ISLAND_LABELS, ISLAND_COORDS, RIDE_TYPE_CONFIG, calculateFare } from "@/lib/types";
import type { PopularDestination, RideType, ActiveRide, Island } from "@/lib/types";
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

  const handleSelectDestination = useCallback(
    (dest: PopularDestination) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedDestination(dest);
      setView("options");
    },
    []
  );

  const handleRequestRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setView("matching");
    // Simulate finding a driver
    setTimeout(() => {
      const ride = createMockActiveRide(true);
      ride.status = "driver_en_route";
      setActiveRide(ride);
      setView("tracking");
    }, 3000);
  }, []);

  const handleCompleteRide = useCallback(() => {
    if (activeRide) {
      setActiveRide({ ...activeRide, status: "completed" });
      setView("complete");
    }
  }, [activeRide]);

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
          <View style={[styles.pulseOuter, { borderColor: colors.primary }]}>
            <View style={[styles.pulseInner, { backgroundColor: colors.primary }]}>
              <IconSymbol name="car.fill" size={40} color={colors.background} />
            </View>
          </View>
          <Text style={[styles.matchingTitle, { color: colors.foreground }]}>
            Finding your driver...
          </Text>
          <Text style={[styles.matchingSubtitle, { color: colors.muted }]}>
            Connecting you with nearby drivers on {ISLAND_LABELS[currentIsland]}
          </Text>
          <Pressable
            onPress={() => setView("home")}
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: colors.error },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
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
      <ScreenContainer className="px-4 pt-2">
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

        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
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

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>
          {searchText ? "Results" : "Popular Destinations"}
        </Text>

        <FlatList
          data={filteredDestinations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelectDestination(item)}
              style={({ pressed }) => [
                styles.destRow,
                { borderBottomColor: colors.border },
                pressed && { opacity: 0.7, backgroundColor: colors.surface },
              ]}
            >
              <View style={[styles.destIcon, { backgroundColor: colors.surface }]}>
                <IconSymbol
                  name={item.icon as any}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.destInfo}>
                <Text style={[styles.destName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.destAddr, { color: colors.muted }]}>{item.address}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No destinations found
              </Text>
            </View>
          }
        />
      </ScreenContainer>
    );
  }

  // ── Home View ──
  return (
    <ScreenContainer>
      {/* Map Background */}
      <View style={[styles.mapContainer, { backgroundColor: colors.surface }]}>
        {/* Simulated map with grid and driver dots */}
        <View style={styles.mapGrid}>
          {[...Array(6)].map((_, i) => (
            <View
              key={`h${i}`}
              style={[styles.gridLineH, { top: `${(i + 1) * 14}%`, backgroundColor: colors.border }]}
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <View
              key={`v${i}`}
              style={[styles.gridLineV, { left: `${(i + 1) * 14}%`, backgroundColor: colors.border }]}
            />
          ))}
        </View>

        {/* Driver markers */}
        {NEARBY_DRIVERS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.driverMarker,
              {
                backgroundColor: colors.foreground,
                top: `${20 + Math.random() * 50}%`,
                left: `${15 + Math.random() * 65}%`,
              },
            ]}
          >
            <IconSymbol name="car.fill" size={14} color={colors.background} />
          </View>
        ))}

        {/* Current location marker */}
        <View style={styles.currentLocation}>
          <View style={[styles.currentLocationOuter, { borderColor: colors.primary }]}>
            <View style={[styles.currentLocationInner, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Island selector */}
        <View style={[styles.islandChip, { backgroundColor: colors.background }]}>
          <IconSymbol name="location.fill" size={14} color={colors.primary} />
          <Text style={[styles.islandChipText, { color: colors.foreground }]}>
            {ISLAND_LABELS[currentIsland]}
          </Text>
        </View>
      </View>

      {/* Bottom Card */}
      <View style={[styles.bottomCard, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
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
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <Text style={[styles.whereToText, { color: colors.muted }]}>Where to?</Text>
        </Pressable>

        {/* Quick destinations */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickDests}>
          {destinations.slice(0, 4).map((dest) => (
            <Pressable
              key={dest.id}
              onPress={() => handleSelectDestination(dest)}
              style={({ pressed }) => [
                styles.quickDestChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name={dest.icon as any} size={16} color={colors.primary} />
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
  mapContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.5,
  },
  driverMarker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLocation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
  },
  currentLocationOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,166,180,0.15)",
  },
  currentLocationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  islandChip: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  islandChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomCard: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  whereToBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  whereToText: {
    fontSize: 17,
    fontWeight: "500",
  },
  quickDests: {
    marginTop: 16,
  },
  quickDestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
  },
  quickDestText: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: 100,
  },
  // Search
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  destIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  destInfo: {
    flex: 1,
  },
  destName: {
    fontSize: 16,
    fontWeight: "600",
  },
  destAddr: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
  // Matching
  matchingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  pulseOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  pulseInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  matchingTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  matchingSubtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
  },
  cancelBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
