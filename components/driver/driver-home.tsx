import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS, RIDE_TYPE_CONFIG } from "@/lib/types";
import { MOCK_RIDE_REQUEST, getMockEarnings, createMockActiveRide } from "@/lib/mock-data";
import type { RideRequest, ActiveRide } from "@/lib/types";
import DriverTrip from "./driver-trip";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";

export default function DriverHome() {
  const colors = useColors();
  const { state, dispatch, goOnline, goOffline } = useApp();
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveRide | null>(null);
  const [requestTimer, setRequestTimer] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOnline = state.driverStatus === "online" || state.driverStatus === "on_trip";
  const todayEarnings = getMockEarnings("today");

  useEffect(() => {
    if (state.driverStatus === "online" && !incomingRequest && !activeTrip) {
      const timeout = setTimeout(() => {
        setIncomingRequest(MOCK_RIDE_REQUEST);
        setRequestTimer(15);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [state.driverStatus, incomingRequest, activeTrip]);

  useEffect(() => {
    if (incomingRequest && requestTimer > 0) {
      timerRef.current = setInterval(() => {
        setRequestTimer((prev) => {
          if (prev <= 1) {
            setIncomingRequest(null);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [incomingRequest, requestTimer]);

  const handleToggleOnline = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isOnline) {
      goOffline();
      setIncomingRequest(null);
    } else {
      goOnline();
    }
  }, [isOnline, goOnline, goOffline]);

  const handleAcceptRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIncomingRequest(null);
    if (timerRef.current) clearInterval(timerRef.current);
    const trip = createMockActiveRide(false);
    trip.status = "driver_en_route";
    setActiveTrip(trip);
    dispatch({ type: "SET_DRIVER_STATUS", status: "on_trip" });
  }, [dispatch]);

  const handleDeclineRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIncomingRequest(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleTripComplete = useCallback(() => {
    setActiveTrip(null);
    dispatch({ type: "SET_DRIVER_STATUS", status: "online" });
  }, [dispatch]);

  if (activeTrip) {
    return <DriverTrip trip={activeTrip} onComplete={handleTripComplete} />;
  }

  return (
    <ScreenContainer>
      {/* Map area */}
      <View style={[styles.mapArea, { backgroundColor: colors.surface }]}>
        <View style={styles.mapGrid}>
          {[...Array(8)].map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 11}%` as any, backgroundColor: colors.border + "50" }]} />
          ))}
          {[...Array(8)].map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 11}%` as any, backgroundColor: colors.border + "50" }]} />
          ))}
        </View>

        {/* Demand heat zones */}
        {isOnline && (
          <>
            <View style={[styles.heatZone, { backgroundColor: colors.primary + "18", top: "20%" as any, left: "15%" as any, width: 100, height: 100 }]} />
            <View style={[styles.heatZone, { backgroundColor: GOLD + "20", top: "40%" as any, left: "55%" as any, width: 120, height: 120 }]} />
            <View style={[styles.heatZone, { backgroundColor: colors.primary + "12", top: "60%" as any, left: "25%" as any, width: 80, height: 80 }]} />
          </>
        )}

        {/* Current location */}
        <View style={styles.currentLocation}>
          <View style={[styles.locPulse, { backgroundColor: (isOnline ? colors.success : colors.muted) + "20" }]} />
          <View style={[styles.locOuter, { borderColor: isOnline ? colors.success : colors.muted }]}>
            <View style={[styles.locInner, { backgroundColor: isOnline ? colors.success : colors.muted }]} />
          </View>
        </View>

        {/* Island chip */}
        <View style={[styles.islandChip, { backgroundColor: colors.background + "F0" }]}>
          <IconSymbol name="location.fill" size={13} color={colors.primary} />
          <Text style={[styles.islandChipText, { color: colors.foreground }]}>
            {ISLAND_LABELS[state.island]}
          </Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.success : colors.muted + "80" }]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? "#fff" : "#fff" }]} />
          <Text style={styles.statusBadgeText}>{isOnline ? "Online" : "Offline"}</Text>
        </View>

        {/* Demand indicator */}
        {isOnline && (
          <View style={[styles.demandChip, { backgroundColor: GOLD + "20" }]}>
            <IconSymbol name="bolt.fill" size={12} color={GOLD} />
            <Text style={[styles.demandText, { color: GOLD }]}>High demand nearby</Text>
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.background }]}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

        {/* Today's summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              ${todayEarnings.totalEarnings.toFixed(0)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Today</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {todayEarnings.totalTrips}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Trips</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {todayEarnings.totalHours.toFixed(1)}h
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Online</Text>
          </View>
        </View>

        {/* Go Online/Offline toggle */}
        <Pressable
          onPress={handleToggleOnline}
          style={({ pressed }) => [
            styles.toggleBtn,
            { backgroundColor: isOnline ? colors.error : colors.success },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <IconSymbol name="power" size={22} color="#fff" />
          <Text style={styles.toggleBtnText}>{isOnline ? "Go Offline" : "Go Online"}</Text>
        </Pressable>

        {!isOnline && (
          <Text style={[styles.offlineHint, { color: colors.muted }]}>
            Go online to start receiving ride requests
          </Text>
        )}
      </View>

      {/* Incoming ride request overlay */}
      {incomingRequest && (
        <View style={styles.requestOverlay}>
          <View style={[styles.requestCard, { backgroundColor: colors.background }]}>
            {/* Timer bar */}
            <View style={[styles.timerBar, { backgroundColor: colors.surface }]}>
              <View style={[styles.timerFill, { backgroundColor: colors.primary, width: `${(requestTimer / 15) * 100}%` as any }]} />
            </View>

            <View style={styles.requestHeader}>
              <View>
                <Text style={[styles.requestTitle, { color: colors.foreground }]}>New Ride Request</Text>
                <Text style={[styles.requestType, { color: colors.primary }]}>
                  {RIDE_TYPE_CONFIG[incomingRequest.rideType].label}
                </Text>
              </View>
              <View style={[styles.timerCircle, { borderColor: requestTimer <= 5 ? colors.error : colors.primary }]}>
                <Text style={[styles.timerText, { color: requestTimer <= 5 ? colors.error : colors.primary }]}>{requestTimer}</Text>
              </View>
            </View>

            {/* Rider info */}
            <View style={[styles.riderRow, { backgroundColor: colors.surface }]}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.riderInitial}>{incomingRequest.riderName[0]}</Text>
              </View>
              <View style={styles.riderInfo}>
                <Text style={[styles.riderName, { color: colors.foreground }]}>{incomingRequest.riderName}</Text>
                <View style={styles.riderRatingRow}>
                  <IconSymbol name="star.fill" size={13} color={colors.warning} />
                  <Text style={[styles.riderRating, { color: colors.muted }]}>{incomingRequest.riderRating.toFixed(1)}</Text>
                </View>
              </View>
              <View style={styles.fareCol}>
                <Text style={[styles.requestFare, { color: colors.foreground }]}>${incomingRequest.estimatedFare.toFixed(2)}</Text>
                <Text style={[styles.requestDist, { color: colors.muted }]}>{incomingRequest.estimatedDistance} km · {incomingRequest.estimatedDuration} min</Text>
              </View>
            </View>

            {/* Route */}
            <View style={styles.routeSection}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{incomingRequest.pickup.name}</Text>
              </View>
              <View style={[styles.routeLine, { borderLeftColor: colors.border }]} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: GOLD }]} />
                <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{incomingRequest.dropoff.name}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.requestActions}>
              <Pressable
                onPress={handleDeclineRide}
                style={({ pressed }) => [styles.declineBtn, { borderColor: colors.error }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.declineBtnText, { color: colors.error }]}>Decline</Text>
              </Pressable>
              <Pressable
                onPress={handleAcceptRide}
                style={({ pressed }) => [styles.acceptBtn, { backgroundColor: colors.success }, pressed && { transform: [{ scale: 0.97 }] }]}
              >
                <Text style={styles.acceptBtnText}>Accept Ride</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapArea: { flex: 1, position: "relative", overflow: "hidden" },
  mapGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 0.5 },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 0.5 },
  heatZone: { position: "absolute", borderRadius: 60 },
  currentLocation: {
    position: "absolute",
    top: "50%" as any,
    left: "50%" as any,
    marginTop: -24,
    marginLeft: -24,
    alignItems: "center",
    justifyContent: "center",
  },
  locPulse: { position: "absolute", width: 48, height: 48, borderRadius: 24 },
  locOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  locInner: { width: 12, height: 12, borderRadius: 6 },
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
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  demandChip: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  demandText: { fontSize: 12, fontWeight: "700" },
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  handleBar: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryValue: { fontSize: 24, fontWeight: "800" },
  summaryLabel: { fontSize: 13, marginTop: 4 },
  summaryDivider: { width: 1, height: 32 },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  toggleBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  offlineHint: { textAlign: "center", fontSize: 14, marginTop: 12 },
  // Request overlay
  requestOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    padding: 16,
  },
  requestCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  timerBar: { height: 4, width: "100%" },
  timerFill: { height: 4 },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  requestTitle: { fontSize: 20, fontWeight: "700" },
  requestType: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  timerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: { fontSize: 18, fontWeight: "800" },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    marginBottom: 14,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  riderInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 16, fontWeight: "600" },
  riderRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  riderRating: { fontSize: 13 },
  fareCol: { alignItems: "flex-end" },
  requestFare: { fontSize: 22, fontWeight: "800" },
  requestDist: { fontSize: 12, marginTop: 2 },
  routeSection: { paddingHorizontal: 20, marginBottom: 16 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { borderLeftWidth: 2, borderStyle: "dashed", height: 16, marginLeft: 4 },
  routeText: { fontSize: 14, fontWeight: "500", flex: 1 },
  requestActions: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  declineBtnText: { fontSize: 16, fontWeight: "600" },
  acceptBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
