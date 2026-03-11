import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ActiveRide } from "@/lib/types";
import * as Haptics from "expo-haptics";

type TripPhase = "to_pickup" | "at_pickup" | "in_progress" | "complete";

interface Props {
  trip: ActiveRide;
  onComplete: () => void;
}

export default function DriverTrip({ trip, onComplete }: Props) {
  const colors = useColors();
  const [phase, setPhase] = useState<TripPhase>("to_pickup");
  const [eta, setEta] = useState(4);
  const [tripTime, setTripTime] = useState(0);
  const [fareAccrued, setFareAccrued] = useState(0);

  // Simulate arrival at pickup
  useEffect(() => {
    if (phase === "to_pickup") {
      const interval = setInterval(() => {
        setEta((prev) => {
          if (prev <= 1) {
            setPhase("at_pickup");
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Trip timer and fare meter
  useEffect(() => {
    if (phase === "in_progress") {
      const interval = setInterval(() => {
        setTripTime((prev) => prev + 1);
        setFareAccrued((prev) => Math.min(prev + trip.fare / 20, trip.fare));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, trip.fare]);

  const handleStartTrip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("in_progress");
    setEta(trip.estimatedDuration);
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

  // Trip complete view
  if (phase === "complete") {
    return (
      <ScreenContainer className="px-5 pt-4">
        <View style={styles.completeContainer}>
          <View style={[styles.completeCircle, { backgroundColor: colors.success + "20" }]}>
            <IconSymbol name="checkmark" size={40} color={colors.success} />
          </View>
          <Text style={[styles.completeTitle, { color: colors.foreground }]}>Trip Complete!</Text>

          <View style={[styles.earningsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.earningsLabel, { color: colors.muted }]}>You earned</Text>
            <Text style={[styles.earningsAmount, { color: colors.primary }]}>
              ${trip.fare.toFixed(2)}
            </Text>
            <Text style={[styles.earningsCurrency, { color: colors.muted }]}>BSD</Text>

            <View style={[styles.tripStats, { borderTopColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {trip.estimatedDistance} km
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Distance</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {formatTime(tripTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Duration</Text>
              </View>
            </View>
          </View>

          {/* Rate rider */}
          <Text style={[styles.rateLabel, { color: colors.foreground }]}>
            Rate {trip.riderName}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} style={({ pressed }) => [pressed && { transform: [{ scale: 0.9 }] }]}>
                <IconSymbol name="star.fill" size={36} color={colors.warning} />
              </Pressable>
            ))}
          </View>

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
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Map area */}
      <View style={[styles.mapArea, { backgroundColor: colors.surface }]}>
        <View style={styles.mapGrid}>
          {[...Array(5)].map((_, i) => (
            <View
              key={`h${i}`}
              style={[styles.gridLineH, { top: `${(i + 1) * 16}%`, backgroundColor: colors.border }]}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <View
              key={`v${i}`}
              style={[styles.gridLineV, { left: `${(i + 1) * 16}%`, backgroundColor: colors.border }]}
            />
          ))}
        </View>

        {/* Route visualization */}
        <View style={[styles.routeViz, { backgroundColor: colors.primary }]} />

        {/* Your position */}
        <View style={[styles.myPin, { backgroundColor: colors.success }]}>
          <IconSymbol name="car.fill" size={18} color="#fff" />
        </View>

        {/* Destination */}
        <View
          style={[
            styles.destPin,
            { backgroundColor: phase === "in_progress" ? colors.warning : colors.primary },
          ]}
        >
          <IconSymbol name="location.fill" size={18} color="#fff" />
        </View>

        {/* Phase badge */}
        <View style={[styles.phaseBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.phaseText}>
            {phase === "to_pickup"
              ? `Arriving in ${eta} min`
              : phase === "at_pickup"
              ? "At pickup"
              : `Trip: ${formatTime(tripTime)}`}
          </Text>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {/* Rider info */}
        <View style={styles.riderRow}>
          <View style={[styles.riderAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.riderInitial}>{trip.riderName[0]}</Text>
          </View>
          <View style={styles.riderInfo}>
            <Text style={[styles.riderName, { color: colors.foreground }]}>{trip.riderName}</Text>
            <View style={styles.riderMeta}>
              <IconSymbol name="star.fill" size={14} color={colors.warning} />
              <Text style={[styles.riderRating, { color: colors.muted }]}>
                {trip.riderRating.toFixed(1)}
              </Text>
            </View>
          </View>
          <View style={styles.contactBtns}>
            <Pressable
              style={({ pressed }) => [
                styles.contactBtn,
                { borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="phone.fill" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.contactBtn,
                { borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="message.fill" size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Route info */}
        <View style={[styles.routeInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.routeInfoRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>
              {trip.pickup.name}
            </Text>
          </View>
          <View style={[styles.routeInfoLine, { borderLeftColor: colors.border }]} />
          <View style={styles.routeInfoRow}>
            <View style={[styles.routeDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>
              {trip.dropoff.name}
            </Text>
          </View>
        </View>

        {/* Fare display for in_progress */}
        {phase === "in_progress" && (
          <View style={styles.fareMeter}>
            <Text style={[styles.fareLabel, { color: colors.muted }]}>Current fare</Text>
            <Text style={[styles.fareAmount, { color: colors.foreground }]}>
              ${fareAccrued.toFixed(2)} BSD
            </Text>
          </View>
        )}

        {/* Action button */}
        {phase === "at_pickup" && (
          <Pressable
            onPress={handleStartTrip}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.success },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.actionBtnText}>Start Trip</Text>
          </Pressable>
        )}
        {phase === "in_progress" && (
          <Pressable
            onPress={handleCompleteTrip}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.actionBtnText}>Complete Trip</Text>
          </Pressable>
        )}
        {phase === "to_pickup" && (
          <View style={[styles.enRouteBar, { backgroundColor: colors.surface }]}>
            <IconSymbol name="car.fill" size={18} color={colors.primary} />
            <Text style={[styles.enRouteText, { color: colors.foreground }]}>
              Navigating to pickup...
            </Text>
          </View>
        )}
      </View>
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
  routeViz: {
    position: "absolute",
    top: "38%",
    left: "20%",
    width: "55%",
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: "-10deg" }],
  },
  myPin: {
    position: "absolute",
    top: "35%",
    left: "18%",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  destPin: {
    position: "absolute",
    top: "42%",
    right: "18%",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  phaseBadge: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  phaseText: {
    color: "#fff",
    fontSize: 15,
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
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
  },
  riderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  riderRating: {
    fontSize: 13,
  },
  contactBtns: {
    flexDirection: "row",
    gap: 8,
  },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  routeInfo: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  routeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeInfoLine: {
    borderLeftWidth: 2,
    borderStyle: "dashed",
    height: 14,
    marginLeft: 4,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  fareMeter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  fareLabel: {
    fontSize: 14,
  },
  fareAmount: {
    fontSize: 22,
    fontWeight: "800",
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  enRouteBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  enRouteText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Complete
  completeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  completeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 24,
  },
  earningsCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 24,
  },
  earningsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 40,
    fontWeight: "800",
  },
  earningsCurrency: {
    fontSize: 14,
    marginTop: 2,
  },
  tripStats: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  rateLabel: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  doneBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
