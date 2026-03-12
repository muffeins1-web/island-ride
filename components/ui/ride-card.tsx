import { View, Text, StyleSheet } from "react-native";
import { IconSymbol } from "./icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { RideHistoryItem } from "@/lib/types";

const GOLD = "#D4A853";

interface RideCardProps {
  ride: RideHistoryItem;
}

export function RideCard({ ride }: RideCardProps) {
  const colors = useColors();
  const dateStr = new Date(ride.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const isCancelled = ride.status === "cancelled";
  const isPremium = ride.rideType === "premium";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <View style={styles.routeCol}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
              {ride.pickup.name || ride.pickup.address}
            </Text>
          </View>
          <View style={[styles.line, { borderLeftColor: colors.border }]} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: isCancelled ? colors.error : GOLD }]} />
            <Text style={[styles.locationText, { color: colors.foreground }]} numberOfLines={1}>
              {ride.dropoff.name || ride.dropoff.address}
            </Text>
          </View>
        </View>
        <View style={styles.fareCol}>
          <Text style={[styles.fare, { color: isCancelled ? colors.error : colors.foreground }]}>
            {isCancelled ? "Cancelled" : `$${ride.fare.toFixed(2)}`}
          </Text>
          <Text style={[styles.date, { color: colors.muted }]}>{dateStr}</Text>
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.driverRow}>
          <View style={[styles.driverDot, { backgroundColor: colors.primary }]}>
            <Text style={styles.driverInitial}>{ride.driverName[0]}</Text>
          </View>
          <Text style={[styles.driverName, { color: colors.muted }]}>{ride.driverName}</Text>
          <IconSymbol name="star.fill" size={12} color={colors.warning} />
          <Text style={[styles.rating, { color: colors.muted }]}>{ride.driverRating.toFixed(1)}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: isPremium ? GOLD + "15" : colors.primary + "12" }]}>
          <Text style={[styles.rideType, { color: isPremium ? GOLD : colors.primary }]}>
            {ride.rideType === "standard" ? "Standard" : ride.rideType === "premium" ? "Premium" : "Shared"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  routeCol: { flex: 1, marginRight: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { borderLeftWidth: 2, borderStyle: "dashed", height: 18, marginLeft: 4 },
  locationText: { fontSize: 14, fontWeight: "500", flex: 1 },
  fareCol: { alignItems: "flex-end" },
  fare: { fontSize: 18, fontWeight: "700" },
  date: { fontSize: 12, marginTop: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  driverDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInitial: { color: "#fff", fontSize: 11, fontWeight: "700" },
  driverName: { fontSize: 13, marginRight: 4 },
  rating: { fontSize: 13 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rideType: { fontSize: 12, fontWeight: "700" },
});
