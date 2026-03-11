import { View, Text, FlatList, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RideCard } from "@/components/ui/ride-card";
import { MOCK_RIDE_HISTORY } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function RideHistory() {
  const colors = useColors();

  return (
    <ScreenContainer className="px-4 pt-2">
      <Text style={[styles.title, { color: colors.foreground }]}>Your Rides</Text>
      <FlatList
        data={MOCK_RIDE_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RideCard ride={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="car.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No rides yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Your ride history will appear here
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800",
    paddingVertical: 16,
  },
  list: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
