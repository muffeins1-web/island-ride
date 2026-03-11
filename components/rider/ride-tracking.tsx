import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ActiveRide } from "@/lib/types";
import * as Haptics from "expo-haptics";

interface Props {
  ride: ActiveRide;
  onComplete: () => void;
}

export default function RideTracking({ ride, onComplete }: Props) {
  const colors = useColors();
  const [eta, setEta] = useState(ride.eta);
  const [status, setStatus] = useState(ride.status);

  useEffect(() => {
    // Simulate ETA countdown
    const interval = setInterval(() => {
      setEta((prev) => {
        if (prev <= 1) {
          if (status === "driver_en_route") {
            setStatus("arrived");
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  const handleStartTrip = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("in_progress");
    setEta(ride.estimatedDuration);
    // Simulate trip completion
    setTimeout(() => {
      onComplete();
    }, 5000);
  }, [ride.estimatedDuration, onComplete]);

  const statusMessages: Record<string, { title: string; subtitle: string }> = {
    driver_en_route: {
      title: "Driver is on the way",
      subtitle: `${ride.driverName} is heading to your pickup`,
    },
    arrived: {
      title: "Your driver has arrived",
      subtitle: `${ride.driverName} is waiting at the pickup point`,
    },
    in_progress: {
      title: "Ride in progress",
      subtitle: `Heading to ${ride.dropoff.name || "destination"}`,
    },
  };

  const msg = statusMessages[status] || statusMessages.driver_en_route;

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

        {/* Route line */}
        <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />

        {/* Driver marker */}
        <View style={[styles.driverPin, { backgroundColor: colors.foreground }]}>
          <IconSymbol name="car.fill" size={18} color={colors.background} />
        </View>

        {/* Destination marker */}
        <View style={[styles.destPin, { backgroundColor: colors.warning }]}>
          <IconSymbol name="location.fill" size={18} color="#fff" />
        </View>

        {/* ETA badge */}
        <View style={[styles.etaBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.etaText}>{eta} min</Text>
        </View>
      </View>

      {/* Bottom info card */}
      <View style={[styles.bottomCard, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {/* Status */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  status === "arrived"
                    ? colors.success
                    : status === "in_progress"
                    ? colors.primary
                    : colors.warning,
              },
            ]}
          />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>{msg.title}</Text>
            <Text style={[styles.statusSubtitle, { color: colors.muted }]}>{msg.subtitle}</Text>
          </View>
        </View>

        {/* Driver info */}
        <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.driverInitial}>{ride.driverName[0]}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, { color: colors.foreground }]}>{ride.driverName}</Text>
            <View style={styles.driverMeta}>
              <IconSymbol name="star.fill" size={14} color={colors.warning} />
              <Text style={[styles.driverRating, { color: colors.muted }]}>
                {ride.driverRating.toFixed(1)}
              </Text>
              <Text style={[styles.vehicleText, { color: colors.muted }]}>
                {" · "}
                {ride.vehicleInfo.color} {ride.vehicleInfo.make} {ride.vehicleInfo.model}
              </Text>
            </View>
            <Text style={[styles.plateText, { color: colors.primary }]}>
              {ride.vehicleInfo.plateNumber}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {status === "arrived" && (
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
          <Pressable
            style={({ pressed }) => [
              styles.contactBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="phone.fill" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.contactBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="message.fill" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Fare estimate */}
        <View style={[styles.fareRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.fareLabel, { color: colors.muted }]}>Estimated fare</Text>
          <Text style={[styles.fareValue, { color: colors.foreground }]}>${ride.fare.toFixed(2)} BSD</Text>
        </View>
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
    opacity: 0.5,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.5,
  },
  routeLine: {
    position: "absolute",
    top: "35%",
    left: "25%",
    width: "50%",
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: "-15deg" }],
  },
  driverPin: {
    position: "absolute",
    top: "30%",
    left: "22%",
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
    top: "40%",
    right: "22%",
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
  etaBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  etaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
  },
  driverMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  driverRating: {
    fontSize: 13,
  },
  vehicleText: {
    fontSize: 13,
  },
  plateText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  contactBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  fareLabel: {
    fontSize: 14,
  },
  fareValue: {
    fontSize: 18,
    fontWeight: "700",
  },
});
