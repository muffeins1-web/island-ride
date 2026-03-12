import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Platform, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { RIDE_TYPE_CONFIG } from "@/lib/types";
import type { ActiveRide, RideStatus } from "@/lib/types";
import IslandMap from "@/components/ui/island-map";
import type { MapMode } from "@/components/ui/island-map";
import * as Haptics from "expo-haptics";

interface Props {
  ride: ActiveRide;
  onComplete: () => void;
}

const GOLD = "#D4A853";

export default function RideTracking({ ride, onComplete }: Props) {
  const colors = useColors();
  const { isFavoriteDriver } = useApp();
  const [status, setStatus] = useState<RideStatus>(ride.status);
  const [eta, setEta] = useState(ride.eta);
  const [elapsed, setElapsed] = useState(0);
  const [liveFare, setLiveFare] = useState(ride.fare);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isFav = isFavoriteDriver(ride.driverId);
  const isPremium = ride.rideType === "premium";

  // ETA countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
      setElapsed((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-transition: driver_en_route → arrived
  useEffect(() => {
    if (status === "driver_en_route" && eta <= 1) {
      setStatus("arrived");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [eta, status]);

  // Live fare meter during in_progress
  useEffect(() => {
    if (status === "in_progress") {
      const interval = setInterval(() => {
        setLiveFare((prev) => prev + 0.15 + Math.random() * 0.1);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Route progress animation
  useEffect(() => {
    if (status === "in_progress") {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: false,
      }).start();
    } else if (status === "driver_en_route") {
      Animated.timing(progressAnim, {
        toValue: 0.3,
        duration: 10000,
        useNativeDriver: false,
      }).start();
    }
  }, [status, progressAnim]);

  const handleStartTrip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("in_progress");
    setEta(ride.estimatedDuration);
    setElapsed(0);
  }, [ride.estimatedDuration]);

  const statusConfig: Record<string, { title: string; subtitle: string; color: string; icon: string }> = {
    driver_en_route: {
      title: "Driver is on the way",
      subtitle: `Arriving in ${eta} min`,
      color: colors.primary,
      icon: "car.fill",
    },
    arrived: {
      title: "Driver has arrived",
      subtitle: "Meet at the pickup point",
      color: colors.success,
      icon: "checkmark",
    },
    in_progress: {
      title: "Trip in progress",
      subtitle: `${Math.max(0, eta - elapsed)} min remaining`,
      color: colors.primary,
      icon: "location.fill",
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.driver_en_route;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const mapMode: MapMode = status === "in_progress" ? "trip_in_progress" : status === "driver_en_route" ? "driver_approaching" : "idle";

  return (
    <ScreenContainer>
      {/* Map area with IslandMap */}
      <View style={[styles.mapArea]}>
        <IslandMap
          mode={mapMode}
          showDrivers={false}
          showPickup={true}
          showDropoff={true}
          showRoute={true}
          showRiderLocation={status !== "in_progress"}
          pickupLabel={ride.pickup.name || "Pickup"}
          dropoffLabel={ride.dropoff.name || "Dropoff"}
          routeProgress={status === "in_progress" ? elapsed / (ride.estimatedDuration || 15) : 0}
        >
          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: currentStatus.color }]}>
            <IconSymbol name={currentStatus.icon as any} size={14} color="#fff" />
            <Text style={styles.statusPillText}>{currentStatus.title}</Text>
          </View>

          {/* Live fare badge */}
          {status === "in_progress" && (
            <View style={[styles.fareBadge, { backgroundColor: colors.background + "F0" }]}>
              <Text style={[styles.fareBadgeLabel, { color: colors.muted }]}>Fare</Text>
              <Text style={[styles.fareBadgeValue, { color: colors.primary }]}>${liveFare.toFixed(2)}</Text>
            </View>
          )}
        </IslandMap>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.background }]}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

        {/* Status header with ETA */}
        <View style={styles.statusHeader}>
          <View style={styles.statusHeaderLeft}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>{currentStatus.title}</Text>
            <Text style={[styles.statusSubtitle, { color: colors.muted }]}>{currentStatus.subtitle}</Text>
          </View>
          {status !== "arrived" && (
            <View style={[styles.etaCircle, { borderColor: currentStatus.color }]}>
              <Text style={[styles.etaNum, { color: currentStatus.color }]}>
                {status === "in_progress" ? Math.max(0, eta - elapsed) : eta}
              </Text>
              <Text style={[styles.etaLabel, { color: colors.muted }]}>min</Text>
            </View>
          )}
        </View>

        {/* Route progress bar */}
        <View style={[styles.routeProgressBg, { backgroundColor: colors.surface }]}>
          <Animated.View style={[styles.routeProgressFill, { backgroundColor: currentStatus.color, width: progressWidth }]} />
          <View style={styles.routeProgressLabels}>
            <View style={styles.routeProgressLabel}>
              <View style={[styles.routeProgressDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.routeProgressText, { color: colors.muted }]} numberOfLines={1}>
                {ride.pickup.name || "Pickup"}
              </Text>
            </View>
            <View style={styles.routeProgressLabel}>
              <View style={[styles.routeProgressDot, { backgroundColor: GOLD }]} />
              <Text style={[styles.routeProgressText, { color: colors.muted }]} numberOfLines={1}>
                {ride.dropoff.name || "Dropoff"}
              </Text>
            </View>
          </View>
        </View>

        {/* Driver card */}
        <View style={[styles.driverCard, { backgroundColor: colors.surface }]}>
          <View style={styles.driverRow}>
            <View style={[styles.driverAvatar, { backgroundColor: isPremium ? GOLD : colors.primary }]}>
              <Text style={styles.driverInitial}>{ride.driverName[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={[styles.driverName, { color: colors.foreground }]}>{ride.driverName}</Text>
                {isFav && (
                  <View style={[styles.favBadge, { backgroundColor: colors.error + "15" }]}>
                    <IconSymbol name="heart.fill" size={10} color={colors.error} />
                    <Text style={[styles.favBadgeText, { color: colors.error }]}>Favorite</Text>
                  </View>
                )}
              </View>
              <View style={styles.driverMeta}>
                <IconSymbol name="star.fill" size={13} color={colors.warning} />
                <Text style={[styles.driverRating, { color: colors.muted }]}>{ride.driverRating.toFixed(1)}</Text>
                <Text style={[{ color: colors.border }]}> · </Text>
                <Text style={[styles.driverVehicle, { color: colors.muted }]}>
                  {ride.vehicleInfo.color} {ride.vehicleInfo.make} {ride.vehicleInfo.model}
                </Text>
              </View>
              <Text style={[styles.driverPlate, { color: colors.primary }]}>{ride.vehicleInfo.plateNumber}</Text>
            </View>
          </View>

          <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
            <Pressable style={({ pressed }) => [styles.contactBtn, { backgroundColor: colors.primary + "12" }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="phone.fill" size={18} color={colors.primary} />
              <Text style={[styles.contactBtnText, { color: colors.primary }]}>Call</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.contactBtn, { backgroundColor: colors.primary + "12" }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="message.fill" size={18} color={colors.primary} />
              <Text style={[styles.contactBtnText, { color: colors.primary }]}>Message</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.contactBtn, { backgroundColor: colors.error + "12" }, pressed && { opacity: 0.7 }]}>
              <IconSymbol name="shield.fill" size={18} color={colors.error} />
              <Text style={[styles.contactBtnText, { color: colors.error }]}>Safety</Text>
            </Pressable>
          </View>
        </View>

        {/* Ride info */}
        <View style={[styles.rideInfoRow, { borderTopColor: colors.border }]}>
          <View style={styles.rideInfoItem}>
            <Text style={[styles.rideInfoLabel, { color: colors.muted }]}>Type</Text>
            <Text style={[styles.rideInfoValue, { color: isPremium ? GOLD : colors.foreground }]}>
              {RIDE_TYPE_CONFIG[ride.rideType].label}
            </Text>
          </View>
          <View style={[styles.rideInfoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.rideInfoItem}>
            <Text style={[styles.rideInfoLabel, { color: colors.muted }]}>Fare</Text>
            <Text style={[styles.rideInfoValue, { color: colors.foreground }]}>
              ${(status === "in_progress" ? liveFare : ride.fare).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.rideInfoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.rideInfoItem}>
            <Text style={[styles.rideInfoLabel, { color: colors.muted }]}>Distance</Text>
            <Text style={[styles.rideInfoValue, { color: colors.foreground }]}>
              {ride.estimatedDistance.toFixed(1)} km
            </Text>
          </View>
        </View>

        {status === "arrived" && (
          <Pressable
            onPress={handleStartTrip}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.success }, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <IconSymbol name="checkmark" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>I'm in the car — Start trip</Text>
          </Pressable>
        )}
        {status === "in_progress" && elapsed > 3 && (
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <IconSymbol name="flag.fill" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Complete Trip</Text>
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
  routePath: {
    position: "absolute", top: "30%", left: "20%", width: "60%", height: 4,
    borderRadius: 2, transform: [{ rotate: "25deg" }],
  },
  routePathActive: {
    position: "absolute", top: "30%", left: "20%", height: 4,
    borderRadius: 2, transform: [{ rotate: "25deg" }],
  },
  pickupMarker: {
    position: "absolute", top: "35%", left: "18%",
    width: 24, height: 24, borderRadius: 12, borderWidth: 3,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,212,228,0.1)",
  },
  pickupDot: { width: 10, height: 10, borderRadius: 5 },
  dropoffMarker: {
    position: "absolute", top: "22%", right: "18%",
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  driverMarker: {
    position: "absolute", top: "40%", left: "38%",
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  statusPill: {
    position: "absolute", top: 12, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  statusPillText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  fareBadge: {
    position: "absolute", top: 12, right: 14,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  fareBadgeLabel: { fontSize: 10, fontWeight: "600" },
  fareBadgeValue: { fontSize: 16, fontWeight: "800" },
  bottomPanel: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  handleBar: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  statusHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statusHeaderLeft: { flex: 1 },
  statusTitle: { fontSize: 20, fontWeight: "700" },
  statusSubtitle: { fontSize: 14, marginTop: 4 },
  etaCircle: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2.5,
    alignItems: "center", justifyContent: "center",
  },
  etaNum: { fontSize: 18, fontWeight: "800", lineHeight: 20 },
  etaLabel: { fontSize: 10, fontWeight: "600" },
  routeProgressBg: { height: 32, borderRadius: 8, marginBottom: 12, overflow: "hidden", justifyContent: "center" },
  routeProgressFill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 8 },
  routeProgressLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 10 },
  routeProgressLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  routeProgressDot: { width: 6, height: 6, borderRadius: 3 },
  routeProgressText: { fontSize: 11, fontWeight: "500" },
  driverCard: { borderRadius: 16, padding: 14, marginBottom: 10 },
  driverRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  driverInitial: { color: "#fff", fontSize: 20, fontWeight: "700" },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  driverName: { fontSize: 16, fontWeight: "700" },
  favBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  favBadgeText: { fontSize: 10, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  driverRating: { fontSize: 13 },
  driverVehicle: { fontSize: 13 },
  driverPlate: { fontSize: 13, fontWeight: "700", marginTop: 3, letterSpacing: 1 },
  contactRow: {
    flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5,
  },
  contactBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 12,
  },
  contactBtnText: { fontSize: 13, fontWeight: "600" },
  rideInfoRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    paddingVertical: 10, borderTopWidth: 0.5,
  },
  rideInfoItem: { alignItems: "center", flex: 1 },
  rideInfoLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  rideInfoValue: { fontSize: 15, fontWeight: "700", marginTop: 3 },
  rideInfoDivider: { width: 1, height: 24 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 4,
  },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
