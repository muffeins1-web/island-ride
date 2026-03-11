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

export default function RideOptions({ destination, selectedType, onSelectType, onRequest, onBack }: Props) {
  const colors = useColors();
  // Mock distance/duration for demo
  const distance = 6.8;
  const duration = 12;

  const rideTypes: RideType[] = ["standard", "premium", "shared"];

  return (
    <ScreenContainer className="px-4 pt-2">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Choose your ride</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Destination summary */}
      <View style={[styles.destCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.destRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.destLabel, { color: colors.muted }]}>Current Location</Text>
        </View>
        <View style={[styles.destLine, { borderLeftColor: colors.border }]} />
        <View style={styles.destRow}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.destLabel, { color: colors.foreground }]}>{destination.name}</Text>
        </View>
        <View style={styles.destMeta}>
          <Text style={[styles.metaText, { color: colors.muted }]}>{distance} km</Text>
          <Text style={[styles.metaDot, { color: colors.muted }]}> · </Text>
          <Text style={[styles.metaText, { color: colors.muted }]}>{duration} min</Text>
        </View>
      </View>

      {/* Ride type cards */}
      <ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
        {rideTypes.map((type) => {
          const config = RIDE_TYPE_CONFIG[type];
          const fare = calculateFare(distance, duration, type);
          const isSelected = type === selectedType;

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
                  backgroundColor: isSelected ? colors.primary + "12" : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.typeIcon, { backgroundColor: isSelected ? colors.primary : colors.muted + "30" }]}>
                <IconSymbol name={config.icon as any} size={22} color={isSelected ? "#fff" : colors.muted} />
              </View>
              <View style={styles.typeInfo}>
                <Text style={[styles.typeName, { color: colors.foreground }]}>{config.label}</Text>
                <Text style={[styles.typeDesc, { color: colors.muted }]}>{config.description}</Text>
                <Text style={[styles.typeEta, { color: colors.muted }]}>
                  {Math.round(duration * (type === "shared" ? 1.4 : 1))} min away
                </Text>
              </View>
              <View style={styles.typeFare}>
                <Text style={[styles.fareAmount, { color: colors.foreground }]}>
                  ${fare.toFixed(2)}
                </Text>
                <Text style={[styles.fareCurrency, { color: colors.muted }]}>BSD</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  destCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  destLine: {
    borderLeftWidth: 2,
    borderStyle: "dashed",
    height: 18,
    marginLeft: 4,
  },
  destLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  destMeta: {
    flexDirection: "row",
    marginTop: 10,
    marginLeft: 20,
  },
  metaText: {
    fontSize: 13,
  },
  metaDot: {
    fontSize: 13,
  },
  typeList: {
    flex: 1,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 14,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: "700",
  },
  typeDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  typeEta: {
    fontSize: 12,
    marginTop: 4,
  },
  typeFare: {
    alignItems: "flex-end",
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  fareCurrency: {
    fontSize: 11,
    marginTop: 2,
  },
  requestBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  requestBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
