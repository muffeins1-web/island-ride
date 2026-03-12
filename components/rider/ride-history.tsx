import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MOCK_RIDE_HISTORY } from "@/lib/mock-data";
import { RIDE_TYPE_CONFIG } from "@/lib/types";
import { useApp } from "@/lib/app-context";
import type { RideHistoryItem } from "@/lib/types";
import RideDetail from "./ride-detail";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";

interface Props {
  onRebook?: (pickup: string, dropoff: string) => void;
}

export default function RideHistory({ onRebook }: Props) {
  const colors = useColors();
  const { state } = useApp();
  const [selectedRide, setSelectedRide] = useState<RideHistoryItem | null>(null);

  // Merge state ride history (real completed rides) with mock data, deduped by id
  const allRides = React.useMemo(() => {
    const stateIds = new Set(state.rideHistory.map((r) => r.id));
    const mockFiltered = MOCK_RIDE_HISTORY.filter((r) => !stateIds.has(r.id));
    return [...state.rideHistory, ...mockFiltered];
  }, [state.rideHistory]);

  const handleSelectRide = useCallback((ride: RideHistoryItem) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRide(ride);
  }, []);

  const handleRebook = useCallback(() => {
    if (selectedRide && onRebook) {
      onRebook(
        selectedRide.pickup.name || "Pickup",
        selectedRide.dropoff.name || "Dropoff"
      );
    }
    setSelectedRide(null);
  }, [selectedRide, onRebook]);

  if (selectedRide) {
    return (
      <RideDetail
        ride={selectedRide}
        onBack={() => setSelectedRide(null)}
        onRebook={handleRebook}
      />
    );
  }

  const renderRide = ({ item }: { item: RideHistoryItem }) => {
    const config = RIDE_TYPE_CONFIG[item.rideType];
    const isPremium = item.rideType === "premium";
    const isCancelled = item.status === "cancelled";
    const dateStr = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const timeStr = new Date(item.date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return (
      <Pressable
        onPress={() => handleSelectRide(item)}
        style={({ pressed }) => [
          styles.rideItem,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.rideItemTop}>
          <View style={styles.rideItemLeft}>
            <View style={[styles.rideIcon, { backgroundColor: isPremium ? GOLD + "15" : colors.primary + "15" }]}>
              <IconSymbol name={config.icon as any} size={18} color={isPremium ? GOLD : colors.primary} />
            </View>
            <View style={styles.rideItemInfo}>
              <Text style={[styles.rideItemName, { color: colors.foreground }]} numberOfLines={1}>
                {item.dropoff.name || item.dropoff.address || "Destination"}
              </Text>
              <Text style={[styles.rideItemDate, { color: colors.muted }]}>
                {dateStr} · {timeStr}
              </Text>
            </View>
          </View>
          <View style={styles.rideItemRight}>
            {isCancelled ? (
              <Text style={[styles.cancelledText, { color: colors.error }]}>Cancelled</Text>
            ) : (
              <Text style={[styles.rideItemFare, { color: colors.foreground }]}>
                ${item.fare.toFixed(2)}
              </Text>
            )}
            <IconSymbol name="chevron.right" size={14} color={colors.muted} />
          </View>
        </View>

        {/* Route summary */}
        <View style={[styles.routeSummary, { borderTopColor: colors.border }]}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.routeText, { color: colors.muted }]} numberOfLines={1}>
              {item.pickup.name || item.pickup.address || "Pickup"}
            </Text>
          </View>
          <View style={styles.routeArrow}>
            <IconSymbol name="chevron.right" size={10} color={colors.border} />
          </View>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: GOLD }]} />
            <Text style={[styles.routeText, { color: colors.muted }]} numberOfLines={1}>
              {item.dropoff.name || item.dropoff.address || "Dropoff"}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="px-5 pt-2">
      <Text style={[styles.title, { color: colors.foreground }]}>Your Rides</Text>

      {/* Stats summary */}
      {allRides.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{allRides.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Rides</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              ${allRides.reduce((sum, r) => sum + r.fare, 0).toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Spent</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {allRides.filter((r) => r.status === "completed").length > 0
                ? `$${(
                    allRides.filter((r) => r.status === "completed").reduce(
                      (sum, r) => sum + r.fare,
                      0
                    ) / allRides.filter((r) => r.status === "completed").length
                  ).toFixed(0)}`
                : "$0"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Fare</Text>
          </View>
        </View>
      )}

      <FlatList
        data={allRides}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
              <IconSymbol name="car.fill" size={40} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No rides yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Your ride history will appear here after your first trip
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", paddingVertical: 16 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: { flex: 1, padding: 12, borderRadius: 14, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 4 },
  list: { paddingBottom: 24 },
  rideItem: { borderRadius: 16, padding: 14 },
  rideItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rideItemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rideIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rideItemInfo: { flex: 1 },
  rideItemName: { fontSize: 15, fontWeight: "600" },
  rideItemDate: { fontSize: 12, marginTop: 3 },
  rideItemRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rideItemFare: { fontSize: 16, fontWeight: "700" },
  cancelledText: { fontSize: 13, fontWeight: "600" },
  routeSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  routePoint: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeText: { fontSize: 12, flex: 1 },
  routeArrow: { paddingHorizontal: 4 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
});
