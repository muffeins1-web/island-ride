import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { RIDE_TYPE_CONFIG } from "@/lib/types";
import type { RideHistoryItem } from "@/lib/types";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";

interface Props {
  ride: RideHistoryItem;
  onBack: () => void;
  onRebook: () => void;
}

export default function RideDetail({ ride, onBack, onRebook }: Props) {
  const colors = useColors();
  const config = RIDE_TYPE_CONFIG[ride.rideType];
  const isPremium = ride.rideType === "premium";
  const isCancelled = ride.status === "cancelled";

  const dateStr = new Date(ride.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date(ride.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <ScreenContainer className="px-5 pt-2">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trip Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isCancelled ? colors.error + "15" : colors.success + "15" },
            ]}
          >
            <IconSymbol
              name={isCancelled ? "xmark" : "checkmark"}
              size={14}
              color={isCancelled ? colors.error : colors.success}
            />
            <Text
              style={[
                styles.statusText,
                { color: isCancelled ? colors.error : colors.success },
              ]}
            >
              {isCancelled ? "Cancelled" : "Completed"}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: isPremium ? GOLD + "15" : colors.primary + "15" }]}>
            <Text style={[styles.typeText, { color: isPremium ? GOLD : colors.primary }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Date & time */}
        <View style={[styles.dateCard, { backgroundColor: colors.surface }]}>
          <IconSymbol name="clock.fill" size={18} color={colors.primary} />
          <View>
            <Text style={[styles.dateText, { color: colors.foreground }]}>{dateStr}</Text>
            <Text style={[styles.timeText, { color: colors.muted }]}>{timeStr}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={[styles.routeCard, { backgroundColor: colors.surface }]}>
          <View style={styles.routeRow}>
            <View style={styles.routeDots}>
              <View style={[styles.routeDotStart, { backgroundColor: colors.primary }]} />
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
              <View style={[styles.routeDotEnd, { backgroundColor: GOLD }]} />
            </View>
            <View style={styles.routeTexts}>
              <View style={styles.routeTextRow}>
                <Text style={[styles.routeLabel, { color: colors.muted }]}>PICKUP</Text>
                <Text style={[styles.routeAddress, { color: colors.foreground }]}>
                  {ride.pickup.name || ride.pickup.address || "Pickup location"}
                </Text>
              </View>
              <View style={styles.routeTextRow}>
                <Text style={[styles.routeLabel, { color: colors.muted }]}>DROPOFF</Text>
                <Text style={[styles.routeAddress, { color: colors.foreground }]}>
                  {ride.dropoff.name || ride.dropoff.address || "Dropoff location"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip stats */}
        {!isCancelled && (
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{ride.distance} km</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Distance</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{ride.duration} min</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Duration</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                ${ride.fare > 0 ? (ride.fare / ride.distance).toFixed(2) : "0.00"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Per km</Text>
            </View>
          </View>
        )}

        {/* Driver info */}
        <View style={[styles.driverCard, { backgroundColor: colors.surface }]}>
          <View style={styles.driverRow}>
            <View style={[styles.driverAvatar, { backgroundColor: isPremium ? GOLD : colors.primary }]}>
              <Text style={styles.driverInitial}>{ride.driverName[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: colors.foreground }]}>{ride.driverName}</Text>
              <View style={styles.driverMeta}>
                <IconSymbol name="star.fill" size={13} color={colors.warning} />
                <Text style={[styles.driverRating, { color: colors.muted }]}>
                  {ride.driverRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fare breakdown */}
        {!isCancelled && (
          <View style={[styles.fareCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.fareTitle, { color: colors.foreground }]}>Fare Summary</Text>
            <View style={styles.fareRow}>
              <Text style={[styles.fareLabel, { color: colors.muted }]}>Base fare</Text>
              <Text style={[styles.fareValue, { color: colors.foreground }]}>${ride.fare.toFixed(2)}</Text>
            </View>
            {ride.tip !== undefined && ride.tip > 0 && (
              <View style={styles.fareRow}>
                <Text style={[styles.fareLabel, { color: colors.muted }]}>Tip</Text>
                <Text style={[styles.fareValue, { color: GOLD }]}>${ride.tip.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ${(ride.fare + (ride.tip || 0)).toFixed(2)} BSD
              </Text>
            </View>
          </View>
        )}

        {/* Your rating */}
        {ride.riderRating !== undefined && (
          <View style={[styles.ratingCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.ratingTitle, { color: colors.foreground }]}>Your Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconSymbol
                  key={star}
                  name="star.fill"
                  size={24}
                  color={star <= (ride.riderRating || 0) ? colors.warning : colors.border}
                />
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRebook();
          }}
          style={({ pressed }) => [
            styles.rebookBtn,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <IconSymbol name="arrow.counterclockwise" size={18} color="#fff" />
          <Text style={styles.rebookBtnText}>Book This Trip Again</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert(
              "Report an Issue",
              "What would you like to report about this ride?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Fare dispute", onPress: () => Alert.alert("Reported", "We'll review the fare for this ride and follow up within 24 hours.") },
                { text: "Safety concern", onPress: () => Alert.alert("Reported", "Our safety team will review this and contact you shortly.") },
                { text: "Other issue", onPress: () => Alert.alert("Reported", "Your report has been submitted. Our support team will follow up.") },
              ]
            );
          }}
          style={({ pressed }) => [
            styles.reportBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="flag.fill" size={16} color={colors.muted} />
          <Text style={[styles.reportBtnText, { color: colors.muted }]}>Report an Issue</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { paddingBottom: 32 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: { fontSize: 13, fontWeight: "700" },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  typeText: { fontSize: 13, fontWeight: "700" },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  dateText: { fontSize: 15, fontWeight: "600" },
  timeText: { fontSize: 13, marginTop: 2 },
  routeCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  routeRow: { flexDirection: "row", gap: 14 },
  routeDots: { alignItems: "center", paddingTop: 4 },
  routeDotStart: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 32, marginVertical: 4 },
  routeDotEnd: { width: 10, height: 10, borderRadius: 3 },
  routeTexts: { flex: 1, justifyContent: "space-between", gap: 16 },
  routeTextRow: {},
  routeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  routeAddress: { fontSize: 15, fontWeight: "600" },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  statItem: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 28 },
  driverCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
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
  driverMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  driverRating: { fontSize: 13 },
  fareCard: { padding: 18, borderRadius: 16, marginBottom: 12 },
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
  ratingCard: { padding: 16, borderRadius: 16, marginBottom: 16, alignItems: "center" },
  ratingTitle: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  starsRow: { flexDirection: "row", gap: 4 },
  rebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  rebookBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  reportBtnText: { fontSize: 15, fontWeight: "500" },
});
