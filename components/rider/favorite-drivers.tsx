import { useCallback } from "react";
import { View, Text, Pressable, FlatList, StyleSheet, Platform, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS } from "@/lib/types";
import type { FavoriteDriver } from "@/lib/types";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";

interface Props {
  onBack: () => void;
  onRequestRide: (driver: FavoriteDriver) => void;
}

export default function FavoriteDrivers({ onBack, onRequestRide }: Props) {
  const colors = useColors();
  const { state, removeFavoriteDriver } = useApp();

  const handleRemove = useCallback(
    (driver: FavoriteDriver) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        "Remove Favorite",
        `Remove ${driver.name} from your favorites?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: () => removeFavoriteDriver(driver.id) },
        ]
      );
    },
    [removeFavoriteDriver]
  );

  const handleRequest = useCallback(
    (driver: FavoriteDriver) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onRequestRide(driver);
    },
    [onRequestRide]
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderDriver = ({ item }: { item: FavoriteDriver }) => (
    <View style={[styles.driverCard, { backgroundColor: colors.surface }]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.driverName, { color: colors.foreground }]}>{item.name}</Text>
            <IconSymbol name="heart.fill" size={14} color={colors.error} />
          </View>
          <View style={styles.metaRow}>
            <IconSymbol name="star.fill" size={12} color={colors.warning} />
            <Text style={[styles.rating, { color: colors.muted }]}>{item.rating.toFixed(1)}</Text>
            <Text style={[styles.dot, { color: colors.border }]}> · </Text>
            <View style={[styles.typeBadge, { backgroundColor: item.driverType === "taxi" ? GOLD + "15" : colors.primary + "12" }]}>
              <Text style={[styles.typeText, { color: item.driverType === "taxi" ? GOLD : colors.primary }]}>
                {item.driverType === "taxi" ? "Taxi" : "Rideshare"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle info */}
      <View style={[styles.vehicleRow, { backgroundColor: colors.background }]}>
        <IconSymbol name="car.fill" size={14} color={colors.primary} />
        <Text style={[styles.vehicleText, { color: colors.foreground }]}>
          {item.vehicleInfo.color} {item.vehicleInfo.make} {item.vehicleInfo.model}
        </Text>
        <Text style={[styles.plateText, { color: colors.primary }]}>{item.vehicleInfo.plateNumber}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{item.totalRidesWithYou}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            {item.totalRidesWithYou === 1 ? "ride" : "rides"}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{formatDate(item.lastRideDate)}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>last ride</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {ISLAND_LABELS[item.island].split("/")[0].trim()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>island</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => handleRequest(item)}
          style={({ pressed }) => [
            styles.requestBtn,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <IconSymbol name="car.fill" size={16} color="#fff" />
          <Text style={styles.requestBtnText}>Book This Driver</Text>
        </Pressable>
        <Pressable
          onPress={() => handleRemove(item)}
          style={({ pressed }) => [
            styles.removeBtn,
            { backgroundColor: colors.error + "10" },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="xmark" size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="px-5 pt-2">
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Your Preferred Drivers</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Drivers you trust. Book them directly for your next trip.
      </Text>

      {state.favoriteDrivers.length > 0 && (
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "10" }]}>
          <IconSymbol name="heart.fill" size={14} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.primary }]}>
            {state.favoriteDrivers.length} favorite{state.favoriteDrivers.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <FlatList
        data={state.favoriteDrivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyCircle, { backgroundColor: colors.surface }]}>
              <IconSymbol name="heart.fill" size={40} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No favorites yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              After a trip, tap the heart icon to save drivers you'd like to ride with again.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 14,
  },
  countText: { fontSize: 13, fontWeight: "600" },
  list: { paddingBottom: 32 },
  driverCard: { borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  driverInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  driverName: { fontSize: 17, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { fontSize: 13 },
  dot: { fontSize: 13 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: "700" },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  vehicleText: { flex: 1, fontSize: 13, fontWeight: "500" },
  plateText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 24 },
  statValue: { fontSize: 14, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10 },
  requestBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  requestBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  removeBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
