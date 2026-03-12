import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface Props {
  onBack: () => void;
}

const GOLD = "#D4A853";

export default function VehicleDetails({ onBack }: Props) {
  const colors = useColors();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [saved, setSaved] = useState(false);

  const isComplete = make.length > 0 && model.length > 0 && year.length === 4 && plateNumber.length > 0;

  const handleSave = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <ScreenContainer className="px-5 pt-2">
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Vehicle Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Vehicle illustration */}
        <View style={[styles.vehicleCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.vehicleIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="car.fill" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.vehicleCardTitle, { color: colors.foreground }]}>
            {make && model ? `${make} ${model}` : "Add Your Vehicle"}
          </Text>
          <Text style={[styles.vehicleCardSub, { color: colors.muted }]}>
            {year && color ? `${year} · ${color}` : "Enter your vehicle information below"}
          </Text>
          {plateNumber ? (
            <View style={[styles.plateBadge, { backgroundColor: GOLD + "15" }]}>
              <Text style={[styles.plateText, { color: GOLD }]}>{plateNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* Form fields */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>VEHICLE INFORMATION</Text>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>MAKE</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. Toyota, Honda, Nissan"
            placeholderTextColor={colors.muted}
            value={make}
            onChangeText={setMake}
            returnKeyType="done"
          />
        </View>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>MODEL</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. Camry, Civic, Altima"
            placeholderTextColor={colors.muted}
            value={model}
            onChangeText={setModel}
            returnKeyType="done"
          />
        </View>

        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>YEAR</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="2024"
                placeholderTextColor={colors.muted}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
              />
            </View>
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>COLOR</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="White"
                placeholderTextColor={colors.muted}
                value={color}
                onChangeText={setColor}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <Text style={[styles.fieldLabel, { color: colors.muted }]}>LICENSE PLATE</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="e.g. AB-1234"
            placeholderTextColor={colors.muted}
            value={plateNumber}
            onChangeText={setPlateNumber}
            autoCapitalize="characters"
            returnKeyType="done"
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>VEHICLE PHOTOS</Text>

        <View style={styles.photoGrid}>
          {["Front", "Back", "Left Side", "Right Side"].map((label) => (
            <Pressable
              key={label}
              style={({ pressed }) => [
                styles.photoBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="camera.fill" size={22} color={colors.muted} />
              <Text style={[styles.photoLabel, { color: colors.muted }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Vehicle requirements */}
        <View style={[styles.requirementsCard, { backgroundColor: colors.primary + "08" }]}>
          <Text style={[styles.requirementsTitle, { color: colors.foreground }]}>Vehicle Requirements</Text>
          {[
            "4-door vehicle, 2010 or newer",
            "Valid vehicle registration",
            "Valid vehicle insurance",
            "Passes safety inspection",
            "Air conditioning required",
          ].map((req) => (
            <View key={req} style={styles.reqRow}>
              <IconSymbol name="checkmark.circle.fill" size={14} color={colors.primary} />
              <Text style={[styles.reqText, { color: colors.muted }]}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: isComplete ? colors.primary : colors.muted + "40" },
            pressed && isComplete && { transform: [{ scale: 0.97 }] },
          ]}
        >
          {saved ? (
            <View style={styles.savedRow}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Saved!</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Save Vehicle Details</Text>
          )}
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
  vehicleCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  vehicleIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  vehicleCardTitle: { fontSize: 20, fontWeight: "700" },
  vehicleCardSub: { fontSize: 14, marginTop: 4 },
  plateBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plateText: { fontSize: 16, fontWeight: "800", letterSpacing: 1.5 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  input: { fontSize: 16, paddingVertical: 0 },
  rowFields: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  photoBox: {
    width: "47%" as any,
    aspectRatio: 1.4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoLabel: { fontSize: 12, fontWeight: "500" },
  requirementsCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  requirementsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reqText: { fontSize: 14 },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
