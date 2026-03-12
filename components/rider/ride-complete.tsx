import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import type { ActiveRide, FavoriteDriver } from "@/lib/types";
import * as Haptics from "expo-haptics";

const AVATAR_COLORS = ["#0A9396", "#D4A853", "#005F73", "#EE6C4D", "#3D5A80", "#2A9D8F"];
const GOLD = "#D4A853";

interface Props {
  ride: ActiveRide;
  onDone: () => void;
}

export default function RideComplete({ ride, onDone }: Props) {
  const colors = useColors();
  const { isFavoriteDriver, addFavoriteDriver, removeFavoriteDriver, state } = useApp();
  const [rating, setRating] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const isFaved = isFavoriteDriver(ride.driverId);
  const tipOptions = [0, 2, 5, 10];

  const handleRate = useCallback((stars: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(stars);
  }, []);

  const handleTip = useCallback((amount: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTip(amount === selectedTip ? null : amount);
  }, [selectedTip]);

  const handleToggleFavorite = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFaved) {
      removeFavoriteDriver(ride.driverId);
    } else {
      const driver: FavoriteDriver = {
        id: ride.driverId,
        name: ride.driverName,
        rating: ride.driverRating,
        vehicleInfo: ride.vehicleInfo,
        driverType: "rideshare",
        totalRidesWithYou: 1,
        lastRideDate: new Date().toISOString(),
        island: state.island,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      };
      addFavoriteDriver(driver);
    }
  }, [isFaved, ride, state.island, addFavoriteDriver, removeFavoriteDriver]);

  const total = ride.fare + (selectedTip || 0);

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success */}
        <View style={styles.successContainer}>
          <View style={[styles.successCircle, { backgroundColor: colors.success + "15" }]}>
            <IconSymbol name="checkmark" size={44} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Ride Complete!</Text>
          <Text style={[styles.successSubtitle, { color: colors.muted }]}>
            You arrived at {ride.dropoff.name || "your destination"}
          </Text>
        </View>

        {/* Driver card with favorite */}
        <View style={[styles.driverCard, { backgroundColor: colors.surface }]}>
          <View style={styles.driverRow}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.driverInitial}>{ride.driverName[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>{ride.driverName}</Text>
              <View style={styles.driverMeta}>
                <IconSymbol name="star.fill" size={13} color={colors.warning} />
                <Text style={[styles.driverRating, { color: colors.muted }]}>
                  {ride.driverRating.toFixed(1)}
                </Text>
                <Text style={[styles.driverVehicle, { color: colors.muted }]}>
                  {" · "}{ride.vehicleInfo.color} {ride.vehicleInfo.make}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleToggleFavorite}
              style={({ pressed }) => [
                styles.favBtn,
                { backgroundColor: isFaved ? colors.error + "15" : colors.surface },
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
            >
              <IconSymbol
                name={isFaved ? "heart.fill" : "heart"}
                size={24}
                color={isFaved ? colors.error : colors.muted}
              />
            </Pressable>
          </View>
          {isFaved && (
            <View style={[styles.favBadge, { backgroundColor: colors.error + "10" }]}>
              <IconSymbol name="heart.fill" size={12} color={colors.error} />
              <Text style={[styles.favBadgeText, { color: colors.error }]}>Saved to favorites</Text>
            </View>
          )}
        </View>

        {/* Fare breakdown */}
        <View style={[styles.fareCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.fareTitle, { color: colors.foreground }]}>Fare Summary</Text>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.muted }]}>Base fare</Text>
            <Text style={[styles.fareValue, { color: colors.foreground }]}>${ride.fare.toFixed(2)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.muted }]}>Tip</Text>
            <Text style={[styles.fareValue, { color: GOLD }]}>
              ${(selectedTip || 0).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${total.toFixed(2)} BSD</Text>
          </View>
        </View>

        {/* Rate driver */}
        <View style={styles.rateSection}>
          <Text style={[styles.rateTitle, { color: colors.foreground }]}>
            Rate {ride.driverName}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => handleRate(star)}
                style={({ pressed }) => [pressed && { transform: [{ scale: 0.9 }] }]}
              >
                <IconSymbol
                  name="star.fill"
                  size={40}
                  color={star <= rating ? colors.warning : colors.border}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipSection}>
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>Add a tip</Text>
          <View style={styles.tipRow}>
            {tipOptions.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleTip(amount)}
                style={({ pressed }) => [
                  styles.tipBtn,
                  {
                    backgroundColor: selectedTip === amount ? colors.primary : colors.surface,
                    borderColor: selectedTip === amount ? colors.primary : colors.border,
                  },
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                <Text
                  style={[
                    styles.tipBtnText,
                    { color: selectedTip === amount ? "#fff" : colors.foreground },
                  ]}
                >
                  {amount === 0 ? "No tip" : `$${amount}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Done */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDone();
          }}
          style={({ pressed }) => [
            styles.doneBtn,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 32 },
  successContainer: { alignItems: "center", paddingVertical: 20 },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: { fontSize: 28, fontWeight: "800" },
  successSubtitle: { fontSize: 15, marginTop: 6, textAlign: "center" },
  driverCard: { padding: 16, borderRadius: 18, marginBottom: 16 },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitial: { color: "#fff", fontSize: 20, fontWeight: "700" },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: "700" },
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  driverRating: { fontSize: 13 },
  driverVehicle: { fontSize: 13 },
  favBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  favBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  favBadgeText: { fontSize: 12, fontWeight: "600" },
  fareCard: { padding: 18, borderRadius: 18, marginBottom: 24 },
  fareTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  fareRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  fareLabel: { fontSize: 15 },
  fareValue: { fontSize: 15, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 0.5,
    marginTop: 4,
  },
  totalLabel: { fontSize: 17, fontWeight: "700" },
  totalValue: { fontSize: 22, fontWeight: "800" },
  rateSection: { alignItems: "center", marginBottom: 24 },
  rateTitle: { fontSize: 17, fontWeight: "600", marginBottom: 12 },
  starsRow: { flexDirection: "row", gap: 8 },
  tipSection: { marginBottom: 24 },
  tipTitle: { fontSize: 17, fontWeight: "600", marginBottom: 12 },
  tipRow: { flexDirection: "row", gap: 10 },
  tipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  tipBtnText: { fontSize: 15, fontWeight: "600" },
  doneBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
