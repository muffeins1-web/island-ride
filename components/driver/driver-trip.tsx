import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Animated as RNAnimated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { RIDE_TYPE_CONFIG } from "@/lib/types";
import type { ActiveRide } from "@/lib/types";
import IslandMap from "@/components/ui/island-map";
import type { MapMode } from "@/components/ui/island-map";
import * as Haptics from "expo-haptics";

type TripPhase = "to_pickup" | "arriving" | "at_pickup" | "in_progress" | "complete";

interface Props {
  trip: ActiveRide;
  onComplete: () => void;
}

const GOLD = "#D4A853";

export default function DriverTrip({ trip, onComplete }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<TripPhase>("to_pickup");
  const [pickupEta, setPickupEta] = useState(4);
  const [tripEta, setTripEta] = useState(trip.estimatedDuration);
  const [tripTime, setTripTime] = useState(0);
  const [fareAccrued, setFareAccrued] = useState(0);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [riderConfirmed, setRiderConfirmed] = useState(false);
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  const isPremium = trip.rideType === "premium";

  // Pulse animation for "at pickup" phase
  useEffect(() => {
    if (phase === "at_pickup" || phase === "arriving") {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase, pulseAnim]);

  // Navigate to pickup countdown
  useEffect(() => {
    if (phase === "to_pickup") {
      const interval = setInterval(() => {
        setPickupEta((prev) => {
          if (prev <= 1) {
            setPhase("arriving");
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Auto transition from arriving to at_pickup
  useEffect(() => {
    if (phase === "arriving") {
      const timeout = setTimeout(() => {
        setPhase("at_pickup");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  // Trip in progress meter
  useEffect(() => {
    if (phase === "in_progress") {
      const interval = setInterval(() => {
        setTripTime((prev) => prev + 1);
        setFareAccrued((prev) => Math.min(prev + trip.fare / 25, trip.fare));
        setDistanceCovered((prev) => Math.min(prev + trip.estimatedDistance / 25, trip.estimatedDistance));
        setTripEta((prev) => Math.max(prev - 0.5, 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, trip.fare, trip.estimatedDistance]);

  const handleConfirmPickup = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRiderConfirmed(true);
  }, []);

  const handleStartTrip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("in_progress");
    setTripEta(trip.estimatedDuration);
  }, [trip.estimatedDuration]);

  const handleCompleteTrip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase("complete");
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const phaseLabel = {
    to_pickup: "Navigating to pickup",
    arriving: "Arriving now",
    at_pickup: "At pickup location",
    in_progress: "Trip in progress",
    complete: "Trip complete",
  };

  const phaseColor = {
    to_pickup: colors.primary,
    arriving: colors.warning,
    at_pickup: colors.success,
    in_progress: colors.primary,
    complete: colors.success,
  };

  // ── Trip Complete ──
  if (phase === "complete") {
    const baseFare = trip.fare * 0.55;
    const distanceFee = trip.fare * 0.28;
    const timeFee = trip.fare * 0.12;
    const platformFee = trip.fare * 0.05;
    const driverEarnings = trip.fare - platformFee;
    const tipAmount = trip.fare * 0.15;

    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
          {/* Success header */}
          <View style={styles.completeHeader}>
            <View style={[styles.completeCircle, { backgroundColor: colors.success + "15" }]}>
              <IconSymbol name="checkmark" size={40} color={colors.success} />
            </View>
            <Text style={[styles.completeTitle, { color: colors.foreground }]}>Trip Complete!</Text>
            <Text style={[styles.completeSubtitle, { color: colors.muted }]}>
              {trip.riderName} has been dropped off
            </Text>
          </View>

          {/* Earnings card */}
          <View style={[styles.earningsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.earningsLabel, { color: colors.muted }]}>Your Earnings</Text>
            <Text style={[styles.earningsAmount, { color: colors.primary }]}>
              ${driverEarnings.toFixed(2)}
            </Text>
            <Text style={[styles.earningsCurrency, { color: colors.muted }]}>BSD</Text>

            {/* Fare breakdown toggle */}
            <Pressable
              onPress={() => setShowFareBreakdown(!showFareBreakdown)}
              style={({ pressed }) => [styles.breakdownToggle, pressed && { opacity: 0.7 }]}
            >
              <Text style={[styles.breakdownToggleText, { color: colors.primary }]}>
                {showFareBreakdown ? "Hide Details" : "View Details"}
              </Text>
              <IconSymbol name={showFareBreakdown ? "chevron.up" : "chevron.down"} size={14} color={colors.primary} />
            </Pressable>

            {showFareBreakdown && (
              <View style={[styles.breakdownSection, { borderTopColor: colors.border }]}>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Base fare</Text>
                  <Text style={[styles.breakdownValue, { color: colors.foreground }]}>${baseFare.toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Distance ({trip.estimatedDistance} km)</Text>
                  <Text style={[styles.breakdownValue, { color: colors.foreground }]}>${distanceFee.toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Time ({formatTime(tripTime)})</Text>
                  <Text style={[styles.breakdownValue, { color: colors.foreground }]}>${timeFee.toFixed(2)}</Text>
                </View>
                <View style={[styles.breakdownRow, { borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                  <Text style={[styles.breakdownLabel, { color: colors.muted }]}>Platform fee</Text>
                  <Text style={[styles.breakdownValue, { color: colors.error }]}>-${platformFee.toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: GOLD }]}>Tip</Text>
                  <Text style={[styles.breakdownValue, { color: GOLD }]}>+${tipAmount.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {/* Trip stats */}
            <View style={[styles.tripStats, { borderTopColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{trip.estimatedDistance} km</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Distance</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{formatTime(tripTime)}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Duration</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: GOLD }]}>+${tipAmount.toFixed(2)}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Tip</Text>
              </View>
            </View>
          </View>

          {/* Route summary */}
          <View style={[styles.routeSummaryCard, { backgroundColor: colors.surface }]}>
            <View style={styles.routeSummaryRow}>
              <View style={[styles.routeDotGreen, { backgroundColor: colors.success }]} />
              <Text style={[styles.routeSummaryText, { color: colors.foreground }]} numberOfLines={1}>{trip.pickup.name}</Text>
            </View>
            <View style={[styles.routeSummaryLine, { borderLeftColor: colors.border }]} />
            <View style={styles.routeSummaryRow}>
              <View style={[styles.routeDotGold, { backgroundColor: GOLD }]} />
              <Text style={[styles.routeSummaryText, { color: colors.foreground }]} numberOfLines={1}>{trip.dropoff.name}</Text>
            </View>
          </View>

          {/* Rate rider */}
          <Text style={[styles.rateLabel, { color: colors.foreground }]}>Rate {trip.riderName}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => {
                  setRiderRating(star);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [pressed && { transform: [{ scale: 0.9 }] }]}
              >
                <IconSymbol
                  name="star.fill"
                  size={36}
                  color={star <= riderRating ? colors.warning : colors.border}
                />
              </Pressable>
            ))}
          </View>

          {/* Done button */}
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Active Trip Phases ──
  return (
    <ScreenContainer>
      {/* Map area */}
      <View style={[styles.mapArea]}>
        <IslandMap
          mode={phase === "in_progress" ? "trip_in_progress" : phase === "to_pickup" || phase === "arriving" ? "driver_approaching" : "idle"}
          showDrivers={false}
          showPickup={phase !== "in_progress"}
          showDropoff={true}
          showRoute={true}
          showRiderLocation={phase === "to_pickup" || phase === "arriving" || phase === "at_pickup"}
          pickupLabel={trip.pickup.name || "Pickup"}
          dropoffLabel={trip.dropoff.name || "Dropoff"}
          routeProgress={phase === "in_progress" ? distanceCovered / trip.estimatedDistance : 0}
        >
          {/* Phase badge */}
          <View style={[styles.phaseBadge, { backgroundColor: phaseColor[phase] }]}>
            <IconSymbol
              name={phase === "to_pickup" ? "arrow.right" : phase === "arriving" ? "bell.fill" : phase === "at_pickup" ? "checkmark" : "car.fill"}
              size={14}
              color="#fff"
            />
            <Text style={styles.phaseText}>{phaseLabel[phase]}</Text>
          </View>

          {/* ETA overlay */}
          {(phase === "to_pickup" || phase === "in_progress") && (
            <View style={[styles.etaOverlay, { backgroundColor: colors.background + "E8" }]}>
              <Text style={[styles.etaValue, { color: colors.foreground }]}>
                {phase === "to_pickup" ? pickupEta : Math.ceil(tripEta)}
              </Text>
              <Text style={[styles.etaUnit, { color: colors.muted }]}>min</Text>
            </View>
          )}

          {/* Trip progress bar */}
          {phase === "in_progress" && (
            <View style={[styles.progressBarContainer, { backgroundColor: colors.background + "90" }]}>
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: colors.primary, width: `${Math.min((distanceCovered / trip.estimatedDistance) * 100, 100)}%` as any },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>
                {distanceCovered.toFixed(1)} / {trip.estimatedDistance} km
              </Text>
            </View>
          )}
        </IslandMap>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.background }]}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

        {/* Rider info */}
        <View style={styles.riderRow}>
          <View style={[styles.riderAvatar, { backgroundColor: isPremium ? GOLD : colors.primary }]}>
            <Text style={styles.riderInitial}>{trip.riderName[0]}</Text>
          </View>
          <View style={styles.riderInfo}>
            <View style={styles.riderNameRow}>
              <Text style={[styles.riderName, { color: colors.foreground }]}>{trip.riderName}</Text>
              {isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: GOLD + "20" }]}>
                  <Text style={[styles.premiumBadgeText, { color: GOLD }]}>Premium</Text>
                </View>
              )}
            </View>
            <View style={styles.riderMeta}>
              <IconSymbol name="star.fill" size={13} color={colors.warning} />
              <Text style={[styles.riderRatingText, { color: colors.muted }]}>{trip.riderRating.toFixed(1)}</Text>
              <Text style={[styles.rideTypeLabel, { color: colors.muted }]}>
                {" "}  {RIDE_TYPE_CONFIG[trip.rideType].label}
              </Text>
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.contactBtn, { backgroundColor: colors.primary + "12" }, pressed && { opacity: 0.7 }]}>
            <IconSymbol name="phone.fill" size={18} color={colors.primary} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.contactBtn, { backgroundColor: colors.primary + "12" }, pressed && { opacity: 0.7 }]}>
            <IconSymbol name="message.fill" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {/* Route info */}
        <View style={[styles.routeInfo, { backgroundColor: colors.surface }]}>
          <View style={styles.routeInfoRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
            <View style={styles.routeTextCol}>
              <Text style={[styles.routeLocationLabel, { color: colors.muted }]}>PICKUP</Text>
              <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{trip.pickup.name}</Text>
            </View>
          </View>
          <View style={[styles.routeInfoLine, { borderLeftColor: colors.border }]} />
          <View style={styles.routeInfoRow}>
            <View style={[styles.routeDot, { backgroundColor: GOLD, borderRadius: 3 }]} />
            <View style={styles.routeTextCol}>
              <Text style={[styles.routeLocationLabel, { color: colors.muted }]}>DROPOFF</Text>
              <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{trip.dropoff.name}</Text>
            </View>
          </View>
        </View>

        {/* Fare meter (in progress) */}
        {phase === "in_progress" && (
          <View style={[styles.fareMeter, { backgroundColor: colors.surface }]}>
            <View style={styles.fareCol}>
              <Text style={[styles.fareLabel, { color: colors.muted }]}>FARE</Text>
              <Text style={[styles.fareAmount, { color: colors.foreground }]}>${fareAccrued.toFixed(2)}</Text>
            </View>
            <View style={[styles.fareDivider, { backgroundColor: colors.border }]} />
            <View style={styles.fareCol}>
              <Text style={[styles.fareLabel, { color: colors.muted }]}>TIME</Text>
              <Text style={[styles.fareAmount, { color: colors.foreground }]}>{formatTime(tripTime)}</Text>
            </View>
            <View style={[styles.fareDivider, { backgroundColor: colors.border }]} />
            <View style={styles.fareCol}>
              <Text style={[styles.fareLabel, { color: colors.muted }]}>DIST</Text>
              <Text style={[styles.fareAmount, { color: colors.foreground }]}>{distanceCovered.toFixed(1)} km</Text>
            </View>
          </View>
        )}

        {/* Action buttons by phase */}
        {phase === "to_pickup" && (
          <View style={[styles.enRouteBar, { backgroundColor: colors.primary + "10" }]}>
            <IconSymbol name="car.fill" size={18} color={colors.primary} />
            <Text style={[styles.enRouteText, { color: colors.foreground }]}>
              Navigating to pickup — {pickupEta} min away
            </Text>
          </View>
        )}

        {phase === "arriving" && (
          <View style={[styles.arrivingBar, { backgroundColor: colors.warning + "15" }]}>
            <IconSymbol name="bell.fill" size={18} color={colors.warning} />
            <Text style={[styles.arrivingBarText, { color: colors.foreground }]}>
              Arriving at pickup location...
            </Text>
          </View>
        )}

        {phase === "at_pickup" && !riderConfirmed && (
          <View>
            <View style={[styles.waitingCard, { backgroundColor: colors.surface }]}>
              <IconSymbol name="person.fill" size={20} color={colors.primary} />
              <Text style={[styles.waitingText, { color: colors.foreground }]}>Waiting for rider...</Text>
            </View>
            <Pressable
              onPress={handleConfirmPickup}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.success },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <IconSymbol name="checkmark" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Confirm Rider Pickup</Text>
            </Pressable>
          </View>
        )}

        {phase === "at_pickup" && riderConfirmed && (
          <View>
            <View style={[styles.confirmedCard, { backgroundColor: colors.success + "12" }]}>
              <IconSymbol name="checkmark" size={16} color={colors.success} />
              <Text style={[styles.confirmedText, { color: colors.success }]}>Rider confirmed in vehicle</Text>
            </View>
            <Pressable
              onPress={handleStartTrip}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.primary },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <IconSymbol name="arrow.right" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Start Trip</Text>
            </Pressable>
          </View>
        )}

        {phase === "in_progress" && (
          <Pressable
            onPress={handleCompleteTrip}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.success },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <IconSymbol name="flag.fill" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Complete Trip — Drop Off</Text>
          </Pressable>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapArea: { flex: 1, position: "relative", overflow: "hidden" },
  mapGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 0.5 },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 0.5 },
  routeViz: {
    position: "absolute",
    top: "38%" as any,
    left: "20%" as any,
    width: "55%" as any,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: "-10deg" }],
  },
  driverPin: {
    position: "absolute",
    top: "35%" as any,
    left: "18%" as any,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  destPin: {
    position: "absolute",
    top: "42%" as any,
    right: "18%" as any,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  arrivingPulse: {
    position: "absolute",
    top: "32%" as any,
    right: "15%" as any,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 1,
  },
  phaseBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  phaseText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  etaOverlay: {
    position: "absolute",
    bottom: 40,
    right: 16,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  etaValue: { fontSize: 28, fontWeight: "800" },
  etaUnit: { fontSize: 11, fontWeight: "600", marginTop: -2 },
  progressBarContainer: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  progressBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 11, marginTop: 4, textAlign: "center" },
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
  handleBar: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  riderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  riderInitial: { color: "#fff", fontSize: 20, fontWeight: "700" },
  riderInfo: { flex: 1 },
  riderNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  riderName: { fontSize: 17, fontWeight: "700" },
  premiumBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  premiumBadgeText: { fontSize: 11, fontWeight: "700" },
  riderMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  riderRatingText: { fontSize: 13 },
  rideTypeLabel: { fontSize: 12 },
  contactBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  routeInfo: { padding: 14, borderRadius: 14, marginBottom: 12 },
  routeInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeInfoLine: { borderLeftWidth: 2, borderStyle: "dashed", height: 20, marginLeft: 4 },
  routeTextCol: { flex: 1 },
  routeLocationLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  routeText: { fontSize: 14, fontWeight: "500" },
  fareMeter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  fareCol: { alignItems: "center", flex: 1 },
  fareLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  fareAmount: { fontSize: 18, fontWeight: "800" },
  fareDivider: { width: 1, height: 28 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  enRouteBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  enRouteText: { fontSize: 15, fontWeight: "600" },
  arrivingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  arrivingBarText: { fontSize: 15, fontWeight: "600" },
  waitingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  waitingText: { fontSize: 14, fontWeight: "500" },
  confirmedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  confirmedText: { fontSize: 14, fontWeight: "600" },
  // Complete
  completeScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  completeHeader: { alignItems: "center", marginBottom: 24 },
  completeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  completeTitle: { fontSize: 28, fontWeight: "800" },
  completeSubtitle: { fontSize: 15, marginTop: 4 },
  earningsCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  earningsLabel: { fontSize: 14, marginBottom: 4 },
  earningsAmount: { fontSize: 44, fontWeight: "800" },
  earningsCurrency: { fontSize: 14, marginTop: 2 },
  breakdownToggle: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12 },
  breakdownToggleText: { fontSize: 14, fontWeight: "600" },
  breakdownSection: { width: "100%", borderTopWidth: 0.5, marginTop: 12, paddingTop: 12 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  breakdownLabel: { fontSize: 14 },
  breakdownValue: { fontSize: 14, fontWeight: "600" },
  tripStats: {
    flexDirection: "row",
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 0.5,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 32 },
  routeSummaryCard: { padding: 14, borderRadius: 14, marginBottom: 24 },
  routeSummaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDotGreen: { width: 10, height: 10, borderRadius: 5 },
  routeDotGold: { width: 10, height: 10, borderRadius: 3 },
  routeSummaryLine: { borderLeftWidth: 2, borderStyle: "dashed", height: 16, marginLeft: 4 },
  routeSummaryText: { fontSize: 14, fontWeight: "500", flex: 1 },
  rateLabel: { fontSize: 17, fontWeight: "600", textAlign: "center", marginBottom: 12 },
  starsRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 28 },
  doneBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  doneBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
