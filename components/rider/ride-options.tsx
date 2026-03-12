import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { RIDE_TYPE_CONFIG, calculateFare, BASE_FARE, PER_KM_RATE, PER_MIN_RATE, BOOKING_FEE } from "@/lib/types";
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

// Simulated distances
const DEST_DISTANCES: Record<string, { km: number; mins: number }> = {
  "1": { km: 14.2, mins: 22 },
  "2": { km: 8.5, mins: 15 },
  "3": { km: 3.2, mins: 8 },
  "4": { km: 6.8, mins: 14 },
  "5": { km: 3.5, mins: 9 },
  "6": { km: 4.1, mins: 10 },
};

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: "banknote.fill" as const },
  { id: "card", label: "Visa •••• 4242", icon: "creditcard.fill" as const },
];

export default function RideOptions({ destination, selectedType, onSelectType, onRequest, onBack }: Props) {
  const colors = useColors();
  const [paymentIdx, setPaymentIdx] = useState(0);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);

  const dist = DEST_DISTANCES[destination.id] || { km: 5 + Math.random() * 8, mins: 10 + Math.round(Math.random() * 12) };
  const rideTypes: RideType[] = ["standard", "premium", "shared"];

  const handleCyclePayment = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaymentIdx((prev) => (prev + 1) % PAYMENT_METHODS.length);
  }, []);

  const currentFare = calculateFare(dist.km, dist.mins, selectedType);
  const config = RIDE_TYPE_CONFIG[selectedType];

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
            <Text style={[styles.routeStatText, { color: colors.muted }]}>{dist.km.toFixed(1)} km</Text>
          </View>
          <View style={[styles.routeStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.routeStat}>
            <IconSymbol name="clock.fill" size={14} color={colors.muted} />
            <Text style={[styles.routeStatText, { color: colors.muted }]}>{dist.mins} min</Text>
          </View>
          <View style={[styles.routeStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.routeStat}>
            <IconSymbol name="car.fill" size={14} color={colors.muted} />
            <Text style={[styles.routeStatText, { color: colors.muted }]}>3 nearby</Text>
          </View>
        </View>
      </View>

      {/* Ride type cards */}
      <ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
        {rideTypes.map((type) => {
          const typeConfig = RIDE_TYPE_CONFIG[type];
          const fare = calculateFare(dist.km, dist.mins, type);
          const isSelected = type === selectedType;
          const isPremium = type === "premium";
          const isShared = type === "shared";
          const accentColor = isPremium ? GOLD : colors.primary;
          const etaMin = isPremium ? dist.mins - 1 : isShared ? dist.mins + 5 : dist.mins;
          const arrivalMin = isPremium ? 2 : isShared ? 5 : 3;

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
                  borderColor: isSelected ? accentColor + "60" : colors.border + "80",
                },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.typeIcon, { backgroundColor: accentColor + "18" }]}>
                <IconSymbol
                  name={isPremium ? "crown.fill" : isShared ? "person.2.fill" : "car.fill"}
                  size={22}
                  color={accentColor}
                />
              </View>
              <View style={styles.typeInfo}>
                <View style={styles.typeNameRow}>
                  <Text style={[styles.typeName, { color: colors.foreground }]}>{typeConfig.label}</Text>
                  {isPremium && (
                    <View style={[styles.premiumBadge, { backgroundColor: GOLD + "20" }]}>
                      <Text style={[styles.premiumBadgeText, { color: GOLD }]}>LUXURY</Text>
                    </View>
                  )}
                  {isShared && (
                    <View style={[styles.premiumBadge, { backgroundColor: colors.success + "20" }]}>
                      <Text style={[styles.premiumBadgeText, { color: colors.success }]}>SAVE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.typeDesc, { color: colors.muted }]}>
                  {typeConfig.description} · {arrivalMin} min away
                </Text>
                <Text style={[styles.typeEta, { color: colors.muted }]}>
                  Est. trip: {etaMin} min
                </Text>
              </View>
              <View style={styles.typeFare}>
                <Text style={[styles.fareAmount, { color: isPremium ? GOLD : colors.foreground }]}>
                  ${fare.toFixed(2)}
                </Text>
                <Text style={[styles.fareUnit, { color: colors.muted }]}>BSD</Text>
              </View>

              {isSelected && (
                <View style={[styles.selectedBar, { backgroundColor: accentColor }]} />
              )}
            </Pressable>
          );
        })}

        {/* Fare breakdown toggle */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFareBreakdown(!showFareBreakdown);
          }}
          style={({ pressed }) => [styles.fareBreakdownToggle, pressed && { opacity: 0.7 }]}
        >
          <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
          <Text style={[styles.fareBreakdownToggleText, { color: colors.primary }]}>
            {showFareBreakdown ? "Hide fare breakdown" : "View fare breakdown"}
          </Text>
        </Pressable>

        {showFareBreakdown && (
          <View style={[styles.fareBreakdownCard, { backgroundColor: colors.surface }]}>
            <View style={styles.fareBreakdownRow}>
              <Text style={[styles.fareBreakdownLabel, { color: colors.muted }]}>Base fare</Text>
              <Text style={[styles.fareBreakdownValue, { color: colors.foreground }]}>
                ${(BASE_FARE * config.multiplier).toFixed(2)}
              </Text>
            </View>
            <View style={styles.fareBreakdownRow}>
              <Text style={[styles.fareBreakdownLabel, { color: colors.muted }]}>
                Distance ({dist.km.toFixed(1)} km × ${PER_KM_RATE.toFixed(2)})
              </Text>
              <Text style={[styles.fareBreakdownValue, { color: colors.foreground }]}>
                ${(dist.km * PER_KM_RATE * config.multiplier).toFixed(2)}
              </Text>
            </View>
            <View style={styles.fareBreakdownRow}>
              <Text style={[styles.fareBreakdownLabel, { color: colors.muted }]}>
                Time ({dist.mins} min × ${PER_MIN_RATE.toFixed(2)})
              </Text>
              <Text style={[styles.fareBreakdownValue, { color: colors.foreground }]}>
                ${(dist.mins * PER_MIN_RATE * config.multiplier).toFixed(2)}
              </Text>
            </View>
            <View style={styles.fareBreakdownRow}>
              <Text style={[styles.fareBreakdownLabel, { color: colors.muted }]}>Booking fee</Text>
              <Text style={[styles.fareBreakdownValue, { color: colors.foreground }]}>
                ${(BOOKING_FEE * config.multiplier).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.fareBreakdownTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.fareBreakdownTotalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.fareBreakdownTotalValue, { color: colors.primary }]}>
                ${currentFare.toFixed(2)} BSD
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Payment method row */}
      <Pressable
        onPress={handleCyclePayment}
        style={({ pressed }) => [
          styles.paymentRow,
          { borderTopColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={[styles.paymentIcon, { backgroundColor: colors.primary + "15" }]}>
          <IconSymbol name={PAYMENT_METHODS[paymentIdx].icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.paymentText, { color: colors.foreground }]}>
          {PAYMENT_METHODS[paymentIdx].label}
        </Text>
        <IconSymbol name="chevron.right" size={14} color={colors.muted} />
      </Pressable>

      {/* Request button */}
      <Pressable
        onPress={onRequest}
        style={({ pressed }) => [
          styles.requestBtn,
          { backgroundColor: selectedType === "premium" ? GOLD : colors.primary },
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        ]}
      >
        <Text style={styles.requestBtnText}>
          Request {RIDE_TYPE_CONFIG[selectedType].label}
        </Text>
        <View style={styles.requestBtnDivider} />
        <Text style={styles.requestBtnFare}>
          ${currentFare.toFixed(2)}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, marginBottom: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  routeCard: { borderRadius: 16, padding: 16, marginBottom: 14 },
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
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 16, borderTopWidth: 0.5, marginTop: 14, paddingTop: 12,
  },
  routeStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  routeStatText: { fontSize: 13, fontWeight: "500" },
  routeStatDivider: { width: 1, height: 14 },
  typeList: { flex: 1 },
  typeCard: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderRadius: 16, borderWidth: 1.5, marginBottom: 10, gap: 14, overflow: "hidden",
  },
  typeIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  typeInfo: { flex: 1 },
  typeNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeName: { fontSize: 16, fontWeight: "700" },
  premiumBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  premiumBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  typeDesc: { fontSize: 13, marginTop: 3 },
  typeEta: { fontSize: 12, marginTop: 2 },
  typeFare: { alignItems: "flex-end" },
  fareAmount: { fontSize: 18, fontWeight: "800" },
  fareUnit: { fontSize: 11, marginTop: 1 },
  selectedBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },

  fareBreakdownToggle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, justifyContent: "center",
  },
  fareBreakdownToggleText: { fontSize: 13, fontWeight: "500" },
  fareBreakdownCard: { borderRadius: 14, padding: 16, marginBottom: 8 },
  fareBreakdownRow: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 8,
  },
  fareBreakdownLabel: { fontSize: 13 },
  fareBreakdownValue: { fontSize: 13, fontWeight: "600" },
  fareBreakdownTotal: {
    flexDirection: "row", justifyContent: "space-between",
    paddingTop: 10, borderTopWidth: 0.5, marginTop: 4,
  },
  fareBreakdownTotalLabel: { fontSize: 15, fontWeight: "700" },
  fareBreakdownTotalValue: { fontSize: 17, fontWeight: "800" },

  paymentRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, borderTopWidth: 0.5, marginBottom: 4,
  },
  paymentIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  paymentText: { flex: 1, fontSize: 15, fontWeight: "500" },
  requestBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 12, paddingVertical: 16, borderRadius: 16, marginBottom: 8,
  },
  requestBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  requestBtnDivider: { width: 1, height: 18, backgroundColor: "rgba(255,255,255,0.3)" },
  requestBtnFare: { color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: "700" },
});
