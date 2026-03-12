import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Animated as RNAnimated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS, RIDE_TYPE_CONFIG } from "@/lib/types";
import { getNextMockRideRequest, getMockEarnings, createMockActiveRide } from "@/lib/mock-data";
import type { RideRequest, ActiveRide } from "@/lib/types";
import DriverTrip from "./driver-trip";
import IslandMap from "@/components/ui/island-map";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";
const REQUEST_TIMEOUT = 30; // seconds

export default function DriverHome() {
  const colors = useColors();
  const { state, dispatch, goOnline, goOffline } = useApp();
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveRide | null>(null);
  const [requestTimer, setRequestTimer] = useState(REQUEST_TIMEOUT);
  const [declinedCount, setDeclinedCount] = useState(0);
  const [waitingText, setWaitingText] = useState("Looking for riders nearby...");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  const isOnline = state.driverStatus === "online" || state.driverStatus === "on_trip";
  const todayEarnings = getMockEarnings("today");

  // Pulse animation for online indicator
  useEffect(() => {
    if (isOnline && !incomingRequest && !activeTrip) {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.3, duration: 1200, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline, incomingRequest, activeTrip, pulseAnim]);

  // Waiting text rotation
  useEffect(() => {
    if (isOnline && !incomingRequest && !activeTrip) {
      const texts = [
        "Looking for riders nearby...",
        "Scanning Bay Street area...",
        "Checking Paradise Island...",
        "Searching Cable Beach zone...",
        "Monitoring downtown requests...",
      ];
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % texts.length;
        setWaitingText(texts[idx]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOnline, incomingRequest, activeTrip]);

  // Auto-generate ride requests when online
  useEffect(() => {
    if (state.driverStatus === "online" && !incomingRequest && !activeTrip) {
      const delay = declinedCount > 0 ? 3000 + Math.random() * 4000 : 5000 + Math.random() * 3000;
      const timeout = setTimeout(() => {
        const request = getNextMockRideRequest();
        setIncomingRequest(request);
        setRequestTimer(REQUEST_TIMEOUT);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [state.driverStatus, incomingRequest, activeTrip, declinedCount]);

  // Countdown timer for ride request
  useEffect(() => {
    if (incomingRequest && requestTimer > 0) {
      timerRef.current = setInterval(() => {
        setRequestTimer((prev) => {
          if (prev <= 1) {
            setIncomingRequest(null);
            setDeclinedCount((c) => c + 1);
            return REQUEST_TIMEOUT;
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
      setDeclinedCount(0);
    } else {
      goOnline();
    }
  }, [isOnline, goOnline, goOffline]);

  const handleAcceptRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const req = incomingRequest;
    setIncomingRequest(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setDeclinedCount(0);

    // Build trip from the request data
    const trip = createMockActiveRide(false);
    if (req) {
      trip.riderName = req.riderName;
      trip.riderRating = req.riderRating;
      trip.pickup = req.pickup;
      trip.dropoff = req.dropoff;
      trip.rideType = req.rideType;
      trip.fare = req.estimatedFare;
      trip.estimatedDuration = req.estimatedDuration;
      trip.estimatedDistance = req.estimatedDistance;
    }
    trip.status = "driver_en_route";
    setActiveTrip(trip);
    dispatch({ type: "SET_DRIVER_STATUS", status: "on_trip" });
  }, [incomingRequest, dispatch]);

  const handleDeclineRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIncomingRequest(null);
    setDeclinedCount((c) => c + 1);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleTripComplete = useCallback(() => {
    setActiveTrip(null);
    dispatch({ type: "SET_DRIVER_STATUS", status: "online" });
  }, [dispatch]);

  // ── Active Trip ──
  if (activeTrip) {
    return <DriverTrip trip={activeTrip} onComplete={handleTripComplete} />;
  }

  const timerPercent = (requestTimer / REQUEST_TIMEOUT) * 100;
  const timerColor = requestTimer <= 10 ? colors.error : requestTimer <= 20 ? colors.warning : colors.primary;

  return (
    <ScreenContainer>
      {/* Map area */}
      <View style={[styles.mapArea]}>
        <IslandMap
          mode={isOnline ? "searching" : "idle"}
          showDrivers={false}
          showRiderLocation={true}
          driverCount={0}
        >
          {/* Demand heat zones */}
          {isOnline && (
            <>
              <View style={[styles.heatZone, { backgroundColor: colors.primary + "18", top: "20%" as any, left: "15%" as any, width: 100, height: 100 }]} />
              <View style={[styles.heatZone, { backgroundColor: GOLD + "20", top: "40%" as any, left: "55%" as any, width: 120, height: 120 }]} />
              <View style={[styles.heatZone, { backgroundColor: colors.primary + "12", top: "60%" as any, left: "25%" as any, width: 80, height: 80 }]} />
            </>
          )}

          {/* Island chip */}
          <View style={[styles.islandChip, { backgroundColor: colors.background + "F0" }]}>
            <IconSymbol name="location.fill" size={13} color={colors.primary} />
            <Text style={[styles.islandChipText, { color: colors.foreground }]}>
              {ISLAND_LABELS[state.island]}
            </Text>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.success : colors.muted + "80" }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>{isOnline ? "Online" : "Offline"}</Text>
          </View>

          {/* Searching indicator */}
          {isOnline && !incomingRequest && (
            <View style={[styles.searchingChip, { backgroundColor: colors.background + "E8" }]}>
              <View style={[styles.searchingDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.searchingText, { color: colors.foreground }]}>{waitingText}</Text>
            </View>
          )}

          {/* Demand indicator */}
          {isOnline && (
            <View style={[styles.demandChip, { backgroundColor: GOLD + "20" }]}>
              <IconSymbol name="bolt.fill" size={12} color={GOLD} />
              <Text style={[styles.demandText, { color: GOLD }]}>High demand nearby</Text>
            </View>
          )}
        </IslandMap>
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

      {/* ── Incoming Ride Request Overlay ── */}
      {incomingRequest && (
        <View style={styles.requestOverlay}>
          <View style={[styles.requestCard, { backgroundColor: colors.background }]}>
            {/* Timer progress bar */}
            <View style={[styles.timerBar, { backgroundColor: colors.surface }]}>
              <View style={[styles.timerFill, { backgroundColor: timerColor, width: `${timerPercent}%` as any }]} />
            </View>

            {/* Header: title + timer circle */}
            <View style={styles.requestHeader}>
              <View>
                <Text style={[styles.requestTitle, { color: colors.foreground }]}>New Ride Request</Text>
                <Text style={[styles.requestType, { color: RIDE_TYPE_CONFIG[incomingRequest.rideType].label.includes("Premium") ? GOLD : colors.primary }]}>
                  {RIDE_TYPE_CONFIG[incomingRequest.rideType].label}
                </Text>
              </View>
              <View style={[styles.timerCircle, { borderColor: timerColor }]}>
                <Text style={[styles.timerText, { color: timerColor }]}>{requestTimer}</Text>
                <Text style={[styles.timerUnit, { color: timerColor }]}>sec</Text>
              </View>
            </View>

            {/* Rider info card */}
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
                <Text style={[styles.requestFareLabel, { color: colors.muted }]}>Est. fare</Text>
              </View>
            </View>

            {/* Trip details grid */}
            <View style={[styles.tripDetailsGrid, { backgroundColor: colors.surface }]}>
              <View style={styles.tripDetailItem}>
                <IconSymbol name="mappin.and.ellipse" size={16} color={colors.primary} />
                <Text style={[styles.tripDetailValue, { color: colors.foreground }]}>{incomingRequest.estimatedDistance} km</Text>
                <Text style={[styles.tripDetailLabel, { color: colors.muted }]}>Trip dist.</Text>
              </View>
              <View style={[styles.tripDetailDivider, { backgroundColor: colors.border }]} />
              <View style={styles.tripDetailItem}>
                <IconSymbol name="clock.fill" size={16} color={colors.primary} />
                <Text style={[styles.tripDetailValue, { color: colors.foreground }]}>{incomingRequest.estimatedDuration} min</Text>
                <Text style={[styles.tripDetailLabel, { color: colors.muted }]}>Est. time</Text>
              </View>
              <View style={[styles.tripDetailDivider, { backgroundColor: colors.border }]} />
              <View style={styles.tripDetailItem}>
                <IconSymbol name="car.fill" size={16} color={colors.primary} />
                <Text style={[styles.tripDetailValue, { color: colors.foreground }]}>{(incomingRequest.estimatedDistance * 0.4).toFixed(1)} km</Text>
                <Text style={[styles.tripDetailLabel, { color: colors.muted }]}>To pickup</Text>
              </View>
            </View>

            {/* Route: pickup → dropoff */}
            <View style={styles.routeSection}>
              <View style={styles.routeRow}>
                <View style={styles.routeIconCol}>
                  <View style={[styles.routeDotPickup, { backgroundColor: colors.success }]} />
                  <View style={[styles.routeConnector, { borderLeftColor: colors.border }]} />
                </View>
                <View style={styles.routeTextCol}>
                  <Text style={[styles.routeLabel, { color: colors.muted }]}>PICKUP</Text>
                  <Text style={[styles.routeName, { color: colors.foreground }]} numberOfLines={1}>{incomingRequest.pickup.name}</Text>
                  {incomingRequest.pickup.address && (
                    <Text style={[styles.routeAddress, { color: colors.muted }]} numberOfLines={1}>{incomingRequest.pickup.address}</Text>
                  )}
                </View>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.routeIconCol}>
                  <View style={[styles.routeDotDest, { backgroundColor: GOLD }]} />
                </View>
                <View style={styles.routeTextCol}>
                  <Text style={[styles.routeLabel, { color: colors.muted }]}>DESTINATION</Text>
                  <Text style={[styles.routeName, { color: colors.foreground }]} numberOfLines={1}>{incomingRequest.dropoff.name}</Text>
                  {incomingRequest.dropoff.address && (
                    <Text style={[styles.routeAddress, { color: colors.muted }]} numberOfLines={1}>{incomingRequest.dropoff.address}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.requestActions}>
              <Pressable
                onPress={handleDeclineRide}
                style={({ pressed }) => [styles.declineBtn, { borderColor: colors.error }, pressed && { opacity: 0.7 }]}
              >
                <IconSymbol name="xmark" size={18} color={colors.error} />
                <Text style={[styles.declineBtnText, { color: colors.error }]}>Decline</Text>
              </Pressable>
              <Pressable
                onPress={handleAcceptRide}
                style={({ pressed }) => [styles.acceptBtn, { backgroundColor: colors.success }, pressed && { transform: [{ scale: 0.97 }] }]}
              >
                <IconSymbol name="checkmark" size={18} color="#fff" />
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
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  searchingChip: {
    position: "absolute",
    top: 48,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchingDot: { width: 8, height: 8, borderRadius: 4 },
  searchingText: { fontSize: 13, fontWeight: "500" },
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
  // ── Request overlay ──
  requestOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    padding: 16,
  },
  requestCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  timerBar: { height: 4, width: "100%" },
  timerFill: { height: 4 },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  requestTitle: { fontSize: 20, fontWeight: "800" },
  requestType: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  timerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: { fontSize: 20, fontWeight: "800", lineHeight: 22 },
  timerUnit: { fontSize: 9, fontWeight: "600", marginTop: -2 },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    marginBottom: 10,
  },
  riderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  riderInitial: { color: "#fff", fontSize: 19, fontWeight: "700" },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 16, fontWeight: "600" },
  riderRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  riderRating: { fontSize: 13 },
  fareCol: { alignItems: "flex-end" },
  requestFare: { fontSize: 24, fontWeight: "800" },
  requestFareLabel: { fontSize: 11, marginTop: 1 },
  // Trip details grid
  tripDetailsGrid: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  tripDetailItem: { flex: 1, alignItems: "center", gap: 4 },
  tripDetailValue: { fontSize: 15, fontWeight: "700" },
  tripDetailLabel: { fontSize: 11 },
  tripDetailDivider: { width: 1, height: 36, alignSelf: "center" },
  // Route section
  routeSection: { paddingHorizontal: 20, marginBottom: 16 },
  routeRow: { flexDirection: "row", gap: 12 },
  routeIconCol: { alignItems: "center", width: 20 },
  routeDotPickup: { width: 12, height: 12, borderRadius: 6 },
  routeDotDest: { width: 12, height: 12, borderRadius: 4 },
  routeConnector: { borderLeftWidth: 2, borderStyle: "dashed", height: 28, marginVertical: 2 },
  routeTextCol: { flex: 1, paddingBottom: 8 },
  routeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  routeName: { fontSize: 15, fontWeight: "600" },
  routeAddress: { fontSize: 12, marginTop: 1 },
  // Actions
  requestActions: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  declineBtnText: { fontSize: 16, fontWeight: "600" },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: 14,
  },
  acceptBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
