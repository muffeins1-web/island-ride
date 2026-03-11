import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ActiveRide } from "@/lib/types";
import * as Haptics from "expo-haptics";

interface Props {
  ride: ActiveRide;
  onDone: () => void;
}

export default function RideComplete({ ride, onDone }: Props) {
  const colors = useColors();
  const [rating, setRating] = useState(0);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const tipOptions = [0, 2, 5, 10];

  const handleRate = useCallback((stars: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(stars);
  }, []);

  const handleTip = useCallback((amount: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTip(amount === selectedTip ? null : amount);
  }, [selectedTip]);

  const total = ride.fare + (selectedTip || 0);

  return (
    <ScreenContainer className="px-5 pt-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success icon */}
        <View style={styles.successContainer}>
          <View style={[styles.successCircle, { backgroundColor: colors.success + "20" }]}>
            <IconSymbol name="checkmark" size={40} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Ride Complete!</Text>
          <Text style={[styles.successSubtitle, { color: colors.muted }]}>
            You arrived at {ride.dropoff.name || "your destination"}
          </Text>
        </View>

        {/* Fare breakdown */}
        <View style={[styles.fareCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fareTitle, { color: colors.foreground }]}>Fare Summary</Text>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.muted }]}>Base fare</Text>
            <Text style={[styles.fareValue, { color: colors.foreground }]}>${ride.fare.toFixed(2)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.muted }]}>Tip</Text>
            <Text style={[styles.fareValue, { color: colors.foreground }]}>
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

        {/* Done button */}
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
  scrollContent: {
    paddingBottom: 32,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
  },
  successSubtitle: {
    fontSize: 15,
    marginTop: 6,
    textAlign: "center",
  },
  fareCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  fareTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fareLabel: {
    fontSize: 15,
  },
  fareValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  rateSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  rateTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipSection: {
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
  },
  tipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  tipBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
