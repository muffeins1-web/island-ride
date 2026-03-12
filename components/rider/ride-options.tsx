import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { RIDE_TYPE_CONFIG, calculateFare } from "@/lib/types";
import type { PopularDestination, RideType } from "@/lib/types";
import * as Haptics from "expo-haptics";

interface Props {
  destination: PopularDestination;
  selectedType: RideType;
  onSelectType: (type: RideType) => void;
  onRequest: () => void;
  onBack: () => void;
}

const GOLD = "#D4A853";

export default function RideOptions({ destination, selectedType, onSelectType, onRequest, onBack }: Props) {
  const colors = useColors();
  const estimatedDistance = 4.5 + Math.random() * 8;
  const estimatedDuration = Math.round(estimatedDistance * 2.5 + 5);

  const rideTypes: RideType[] = ["standard", "premium", "shared"];

  return (
    <ScreenContainer className="px-5 pt-2">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Choose a ride</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Route summary */}
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
              <Text style={[styles.routeAddress, { color: colors.foreground }]}>Current Location</Text>
            </View>
            <View style={styles.routeTextRow}>
              <Text style={[styles.routeLabel, { color: colors.muted }]}>DROPOFF</Text>
              <Text style={[styles.routeAddress, { color: colors.foreground }]}>{destination.name}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.routeStats, { borderTopColor: colors.border }]}>
          <View style={styles.routeStat}>
            <IconSymbol name="scope" size={14} color={colors.muted} />
            <Text style={[styles.routeStatText, { color: colors.muted }]}>
              {estimatedDistance.toFixed(1)} km
            </Text>
          </View>
          <View style={[styles.routeStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.routeStat}>
            <IconSymbol name="clock.fill" size={14} color={colors.muted} />
            <Text style={[styles.routeStatText, { color: colors.muted }]}>
              {estimatedDuration} min
            </Text>
          </View>
        </View>
      </View>

      {/* Ride type cards */}
      <ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
        {rideTypes.map((type) => {
          const config = RIDE_TYPE_CONFIG[type];
          const fare = calculateFare(estimatedDistance, estimatedDuration, type);
          const isSelected = type === selectedType;
          const isPremium = type === "premium";
          const accentColor = isPremium ? GOLD : colors.primary;

          return (
            <Pressable
              key={type}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectType(type);
              }}
              style={({ pressed }) => [
                styles.typeCard,
                {
                  backgroundColor: isSelected ? accentColor + "10" : colors.surface,
                  borderColor: isSelected ? accentColor + "60" : colors.border,
                },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.typeIcon, { backgroundColor: accentColor + "18" }]}>
                <IconSymbol
                  name={isPremium ? "crown.fill" : type === "shared" ? "person.2.fill" : "car.fill"}
                  size={22}
                  color={accentColor}
                />
              </View>
              <View style={styles.typeInfo}>
                <View style={styles.typeNameRow}>
                  <Text style={[styles.typeName, { color: colors.foreground }]}>{config.label}</Text>
                  {isPremium && (
                    <View style={[styles.premiumBadge, { backgroundColor: GOLD + "20" }]}>
                      <Text style={[styles.premiumBadgeText, { color: GOLD }]}>LUXURY</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.typeDesc, { color: colors.muted }]}>{config.description}</Text>
              </View>
              <View style={styles.typeFare}>
                <Text style={[styles.fareAmount, { color: colors.foreground }]}>
                  ${fare.toFixed(2)}
                </Text>
                <Text style={[styles.fareEta, { color: colors.muted }]}>
                  {type === "shared" ? `${estimatedDuration + 5} min` : `${estimatedDuration} min`}
                </Text>
              </View>

              {isSelected && (
                <View style={[styles.selectedBar, { backgroundColor: accentColor }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Payment method row */}
      <View style={[styles.paymentRow, { borderTopColor: colors.border }]}>
        <View style={[styles.paymentIcon, { backgroundColor: colors.primary + "15" }]}>
          <IconSymbol name="creditcard.fill" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.paymentText, { color: colors.foreground }]}>Cash</Text>
        <IconSymbol name="chevron.right" size={14} color={colors.muted} />
      </View>

      {/* Request button */}
      <Pressable
        onPress={onRequest}
        style={({ pressed }) => [
          styles.requestBtn,
          { backgroundColor: colors.primary },
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        ]}
      >
        <Text style={styles.requestBtnText}>
          Request {RIDE_TYPE_CONFIG[selectedType].label}
        </Text>
        <Text style={styles.requestBtnFare}>
          ${calculateFare(estimatedDistance, estimatedDuration, selectedType).toFixed(2)}
        </Text>
      </Pressable>
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
  routeCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  routeRow: { flexDirection: "row", gap: 14 },
  routeDots: { alignItems: "center", paddingTop: 4 },
  routeDotStart: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, height: 32, marginVertical: 4 },
  routeDotEnd: { width: 10, height: 10, borderRadius: 3 },
  routeTexts: { flex: 1, justifyContent: "space-between", gap: 16 },
  routeTextRow: {},
  routeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  routeAddress: { fontSize: 15, fontWeight: "600" },
  routeStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    borderTopWidth: 0.5,
    marginTop: 14,
    paddingTop: 12,
  },
  routeStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  routeStatText: { fontSize: 13, fontWeight: "500" },
  routeStatDivider: { width: 1, height: 14 },
  typeList: { flex: 1 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
    gap: 14,
    overflow: "hidden",
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeInfo: { flex: 1 },
  typeNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeName: { fontSize: 16, fontWeight: "700" },
  premiumBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  premiumBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  typeDesc: { fontSize: 13, marginTop: 2 },
  typeFare: { alignItems: "flex-end" },
  fareAmount: { fontSize: 18, fontWeight: "800" },
  fareEta: { fontSize: 12, marginTop: 2 },
  selectedBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    marginBottom: 4,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentText: { flex: 1, fontSize: 15, fontWeight: "500" },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  requestBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  requestBtnFare: { color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "600" },
});
