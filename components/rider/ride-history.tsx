import { View, Text, FlatList, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RideCard } from "@/components/ui/ride-card";
import { MOCK_RIDE_HISTORY } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function RideHistory() {
  const colors = useColors();

  return (
    <ScreenContainer className="px-5 pt-2">
      <Text style={[styles.title, { color: colors.foreground }]}>Your Rides</Text>

      {/* Stats summary */}
      {MOCK_RIDE_HISTORY.length > 0 && (
        <View style={[styles.statsRow]}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{MOCK_RIDE_HISTORY.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Rides</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              ${MOCK_RIDE_HISTORY.reduce((sum, r) => sum + r.fare, 0).toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Spent</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              ${(MOCK_RIDE_HISTORY.reduce((sum, r) => sum + r.fare, 0) / MOCK_RIDE_HISTORY.length).toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Fare</Text>
          </View>
        </View>
      )}

      <FlatList
        data={MOCK_RIDE_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RideCard ride={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
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
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 4 },
  list: { paddingBottom: 24 },
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
