import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS, RIDE_TYPE_CONFIG } from "@/lib/types";
import { MOCK_RIDE_REQUEST, getMockEarnings, createMockActiveRide } from "@/lib/mock-data";
import type { RideRequest, ActiveRide } from "@/lib/types";
import DriverTrip from "./driver-trip";
import * as Haptics from "expo-haptics";

export default function DriverHome() {
  const colors = useColors();
  const { state, dispatch, goOnline, goOffline } = useApp();
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<ActiveRide | null>(null);
  const [requestTimer, setRequestTimer] = useState(15);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOnline = state.driverStatus === "online" || state.driverStatus === "on_trip";
  const todayEarnings = getMockEarnings("today");

  // Simulate incoming ride request when online
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

  // Request countdown timer
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

  // Active trip view
  if (activeTrip) {
    return <DriverTrip trip={activeTrip} onComplete={handleTripComplete} />;
  }

  return (
    <ScreenContainer>
      {/* Map area */}
      <View style={[styles.mapArea, { backgroundColor: colors.surface }]}>
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

        {/* Heat zones (demand areas) */}
        {isOnline && (
          <>
            <View style={[styles.heatZone, { backgroundColor: colors.primary + "20", top: "25%", left: "20%" }]} />
            <View style={[styles.heatZone, { backgroundColor: colors.warning + "25", top: "45%", left: "55%", width: 100, height: 100 }]} />
            <View style={[styles.heatZone, { backgroundColor: colors.primary + "15", top: "60%", left: "15%", width: 80, height: 80 }]} />
          </>
        )}

        {/* Current location */}
        <View style={styles.currentLocation}>
          <View style={[styles.locOuter, { borderColor: isOnline ? colors.success : colors.muted }]}>
            <View style={[styles.locInner, { backgroundColor: isOnline ? colors.success : colors.muted }]} />
          </View>
        </View>

        {/* Island label */}
        <View style={[styles.islandChip, { backgroundColor: colors.background }]}>
          <IconSymbol name="location.fill" size={14} color={colors.primary} />
          <Text style={[styles.islandText, { color: colors.foreground }]}>
            {ISLAND_LABELS[state.island]}
          </Text>
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isOnline ? colors.success : colors.muted },
          ]}
        >
          <Text style={styles.statusBadgeText}>{isOnline ? "Online" : "Offline"}</Text>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
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
        <View style={[styles.requestOverlay]}>
          <View style={[styles.requestCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            {/* Timer */}
            <View style={[styles.timerBar, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.timerFill,
                  { backgroundColor: colors.primary, width: `${(requestTimer / 15) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.requestContent}>
              <Text style={[styles.requestTitle, { color: colors.foreground }]}>New Ride Request</Text>
              <Text style={[styles.requestTimer, { color: colors.muted }]}>{requestTimer}s</Text>
            </View>

            {/* Rider info */}
            <View style={styles.riderRow}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.riderInitial}>{incomingRequest.riderName[0]}</Text>
              </View>
              <View style={styles.riderInfo}>
                <Text style={[styles.riderName, { color: colors.foreground }]}>
                  {incomingRequest.riderName}
                </Text>
                <View style={styles.riderRatingRow}>
                  <IconSymbol name="star.fill" size={14} color={colors.warning} />
                  <Text style={[styles.riderRating, { color: colors.muted }]}>
                    {incomingRequest.riderRating.toFixed(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.fareCol}>
                <Text style={[styles.requestFare, { color: colors.foreground }]}>
                  ${incomingRequest.estimatedFare.toFixed(2)}
                </Text>
                <Text style={[styles.requestDist, { color: colors.muted }]}>
                  {incomingRequest.estimatedDistance} km
                </Text>
              </View>
            </View>

            {/* Route */}
            <View style={[styles.routeCard, { backgroundColor: colors.surface }]}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>
                  {incomingRequest.pickup.name}
                </Text>
              </View>
              <View style={[styles.routeLine, { borderLeftColor: colors.border }]} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>
                  {incomingRequest.dropoff.name}
                </Text>
              </View>
            </View>

            {/* Accept / Decline */}
            <View style={styles.requestActions}>
              <Pressable
                onPress={handleDeclineRide}
                style={({ pressed }) => [
                  styles.declineBtn,
                  { borderColor: colors.error },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.declineBtnText, { color: colors.error }]}>Decline</Text>
              </Pressable>
              <Pressable
                onPress={handleAcceptRide}
                style={({ pressed }) => [
                  styles.acceptBtn,
                  { backgroundColor: colors.success },
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={styles.acceptBtnText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapArea: {
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
    opacity: 0.4,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.4,
  },
  heatZone: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  currentLocation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -18,
    marginLeft: -18,
  },
  locOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  locInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  islandText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  toggleBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  offlineHint: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 12,
  },
  // Request overlay
  requestOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    padding: 16,
  },
  requestCard: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: "hidden",
  },
  timerBar: {
    height: 4,
    width: "100%",
  },
  timerFill: {
    height: 4,
  },
  requestContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  requestTimer: {
    fontSize: 16,
    fontWeight: "600",
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  riderInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: "600",
  },
  riderRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  riderRating: {
    fontSize: 13,
  },
  fareCol: {
    alignItems: "flex-end",
  },
  requestFare: {
    fontSize: 20,
    fontWeight: "800",
  },
  requestDist: {
    fontSize: 13,
    marginTop: 2,
  },
  routeCard: {
    marginHorizontal: 18,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    borderLeftWidth: 2,
    borderStyle: "dashed",
    height: 16,
    marginLeft: 4,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
