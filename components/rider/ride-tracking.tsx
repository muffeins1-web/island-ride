import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { RIDE_TYPE_CONFIG } from "@/lib/types";
import type { ActiveRide, RideStatus } from "@/lib/types";
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

  const isFav = isFavoriteDriver(ride.driverId);
  const isPremium = ride.rideType === "premium";

  useEffect(() => {
    const interval = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
      setElapsed((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === "driver_en_route" && eta <= 2) {
      setStatus("arrived");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [eta, status]);

  const handleStartTrip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("in_progress");
    setEta(ride.estimatedDuration);
  }, [ride.estimatedDuration]);

  const statusConfig: Record<string, { title: string; subtitle: string; color: string }> = {
    driver_en_route: {
      title: "Driver is on the way",
      subtitle: `Arriving in ${eta} min`,
      color: colors.primary,
    },
    arrived: {
      title: "Driver has arrived",
      subtitle: "Meet at the pickup point",
      color: colors.success,
    },
    in_progress: {
      title: "Trip in progress",
      subtitle: `${Math.max(0, eta - elapsed)} min remaining`,
      color: colors.primary,
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.driver_en_route;

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

        <View style={[styles.routePath, { backgroundColor: colors.primary + "30" }]} />

        <View style={[styles.pickupMarker, { borderColor: colors.primary }]}>
          <View style={[styles.pickupDot, { backgroundColor: colors.primary }]} />
        </View>

        <View style={[styles.dropoffMarker, { backgroundColor: GOLD }]}>
          <IconSymbol name="mappin.and.ellipse" size={14} color="#fff" />
        </View>

        <View style={[styles.driverMarker, { backgroundColor: colors.foreground }]}>
          <IconSymbol name="car.fill" size={16} color={colors.background} />
        </View>

        <View style={[styles.statusPill, { backgroundColor: currentStatus.color }]}>
          <Text style={styles.statusPillText}>{currentStatus.title}</Text>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: colors.background }]}>
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

        <View style={styles.statusHeader}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>{currentStatus.title}</Text>
          <Text style={[styles.statusSubtitle, { color: colors.muted }]}>{currentStatus.subtitle}</Text>
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
                <Text style={[styles.driverRating, { color: colors.muted }]}>
                  {ride.driverRating.toFixed(1)}
                </Text>
                <Text style={[styles.driverDot, { color: colors.border }]}>·</Text>
                <Text style={[styles.driverVehicle, { color: colors.muted }]}>
                  {ride.vehicleInfo.color} {ride.vehicleInfo.make} {ride.vehicleInfo.model}
                </Text>
              </View>
              <Text style={[styles.driverPlate, { color: colors.primary }]}>
                {ride.vehicleInfo.plateNumber}
              </Text>
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
            <Text style={[styles.rideInfoValue, { color: colors.foreground }]}>
              {RIDE_TYPE_CONFIG[ride.rideType].label}
            </Text>
          </View>
          <View style={[styles.rideInfoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.rideInfoItem}>
            <Text style={[styles.rideInfoLabel, { color: colors.muted }]}>Fare</Text>
            <Text style={[styles.rideInfoValue, { color: colors.foreground }]}>
              ${ride.fare.toFixed(2)}
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
            <Text style={styles.actionBtnText}>I'm in the car — Start trip</Text>
          </Pressable>
        )}
        {status === "in_progress" && elapsed > 3 && (
          <Pressable
            onPress={onComplete}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.97 }] }]}
          >
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
    position: "absolute",
    top: "30%" as any,
    left: "25%" as any,
    width: "50%" as any,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: "25deg" }],
  },
  pickupMarker: {
    position: "absolute",
    top: "35%" as any,
    left: "22%" as any,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,212,228,0.1)",
  },
  pickupDot: { width: 10, height: 10, borderRadius: 5 },
  dropoffMarker: {
    position: "absolute",
    top: "25%" as any,
    right: "22%" as any,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  driverMarker: {
    position: "absolute",
    top: "42%" as any,
    left: "40%" as any,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  statusPill: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPillText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  handleBar: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  statusHeader: { marginBottom: 14 },
  statusTitle: { fontSize: 20, fontWeight: "700" },
  statusSubtitle: { fontSize: 14, marginTop: 4 },
  driverCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  driverRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitial: { color: "#fff", fontSize: 22, fontWeight: "700" },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  driverName: { fontSize: 17, fontWeight: "700" },
  favBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  favBadgeText: { fontSize: 10, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  driverRating: { fontSize: 13 },
  driverDot: { fontSize: 13 },
  driverVehicle: { fontSize: 13 },
  driverPlate: { fontSize: 14, fontWeight: "700", marginTop: 4, letterSpacing: 1 },
  contactRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 0.5,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactBtnText: { fontSize: 13, fontWeight: "600" },
  rideInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  rideInfoItem: { alignItems: "center", flex: 1 },
  rideInfoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  rideInfoValue: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  rideInfoDivider: { width: 1, height: 28 },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  actionBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
