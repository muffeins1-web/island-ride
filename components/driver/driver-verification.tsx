import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface Props {
  onBack: () => void;
}

type VerificationStep = "overview" | "license" | "photo" | "background" | "complete";

interface StepInfo {
  id: VerificationStep;
  title: string;
  icon: any;
  status: "complete" | "pending" | "locked";
}

export default function DriverVerification({ onBack }: Props) {
  const colors = useColors();
  const [step, setStep] = useState<VerificationStep>("overview");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const steps: StepInfo[] = [
    {
      id: "license",
      title: "Driver's License",
      icon: "doc.text.fill",
      status: completedSteps.has("license") ? "complete" : "pending",
    },
    {
      id: "photo",
      title: "Profile Photo",
      icon: "camera.fill",
      status: completedSteps.has("photo")
        ? "complete"
        : completedSteps.has("license")
        ? "pending"
        : "locked",
    },
    {
      id: "background",
      title: "Background Check",
      icon: "shield.checkmark",
      status: completedSteps.has("background")
        ? "complete"
        : completedSteps.has("photo")
        ? "pending"
        : "locked",
    },
  ];

  const allComplete = completedSteps.size >= 3;

  const handleCompleteStep = useCallback(
    (stepId: string) => {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompletedSteps((prev) => new Set([...prev, stepId]));
      setStep("overview");
    },
    []
  );

  // ── License step ──
  if (step === "license") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.header}>
          <Pressable onPress={() => setStep("overview")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Driver's License</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
            <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Enter your Bahamas driver's license details. This information will be verified.
            </Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>LICENSE NUMBER</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="e.g. DL-123456"
              placeholderTextColor={colors.muted}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>EXPIRY DATE</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="MM/YYYY"
              placeholderTextColor={colors.muted}
              value={licenseExpiry}
              onChangeText={setLicenseExpiry}
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>LICENSE PHOTO</Text>
          <Pressable
            style={({ pressed }) => [
              styles.uploadBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="camera.fill" size={28} color={colors.muted} />
            <Text style={[styles.uploadText, { color: colors.muted }]}>Tap to upload photo</Text>
            <Text style={[styles.uploadHint, { color: colors.muted }]}>Front of license, clear and readable</Text>
          </Pressable>

          <Pressable
            onPress={() => handleCompleteStep("license")}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: licenseNumber.length > 3 ? colors.primary : colors.muted + "40" },
              pressed && licenseNumber.length > 3 && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.submitBtnText}>Submit License</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Photo step ──
  if (step === "photo") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.header}>
          <Pressable onPress={() => setStep("overview")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile Photo</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.photoContent}>
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="person.fill" size={64} color={colors.muted} />
          </View>
          <Text style={[styles.photoInstructions, { color: colors.muted }]}>
            Take a clear photo of your face.{"\n"}This will be shown to riders.
          </Text>

          <View style={styles.photoTips}>
            {["Good lighting", "Face the camera", "No sunglasses"].map((tip) => (
              <View key={tip} style={[styles.tipRow, { backgroundColor: colors.surface }]}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => handleCompleteStep("photo")}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <IconSymbol name="camera.fill" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Take Photo</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── Background check step ──
  if (step === "background") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.header}>
          <Pressable onPress={() => setStep("overview")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Background Check</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
            <IconSymbol name="shield.fill" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              We partner with local authorities to verify your driving record and background.
            </Text>
          </View>

          <View style={[styles.consentCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.consentTitle, { color: colors.foreground }]}>Consent Required</Text>
            <Text style={[styles.consentText, { color: colors.muted }]}>
              By proceeding, you authorize IslandRide to conduct a background check including:
            </Text>
            {["Criminal record check", "Driving history review", "Identity verification"].map((item) => (
              <View key={item} style={styles.consentItem}>
                <IconSymbol name="checkmark" size={14} color={colors.primary} />
                <Text style={[styles.consentItemText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => handleCompleteStep("background")}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.submitBtnText}>Authorize & Submit</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Overview ──
  return (
    <ScreenContainer className="px-5 pt-2">
      <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Driver Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.foreground }]}>
              {allComplete ? "Verification Complete" : "Complete Your Profile"}
            </Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {completedSteps.size}/3
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: allComplete ? colors.success : colors.primary, width: `${(completedSteps.size / 3) * 100}%` as any },
              ]}
            />
          </View>
          <Text style={[styles.progressHint, { color: colors.muted }]}>
            {allComplete
              ? "You're all set to start driving!"
              : "Complete all steps to start accepting rides"}
          </Text>
        </View>

        {/* Steps */}
        {steps.map((s, i) => (
          <Pressable
            key={s.id}
            onPress={() => {
              if (s.status !== "locked") {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep(s.id);
              }
            }}
            style={({ pressed }) => [
              styles.stepCard,
              {
                backgroundColor: colors.surface,
                borderColor: s.status === "complete" ? colors.success + "40" : colors.border,
                opacity: s.status === "locked" ? 0.5 : 1,
              },
              pressed && s.status !== "locked" && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <View
              style={[
                styles.stepIcon,
                {
                  backgroundColor:
                    s.status === "complete"
                      ? colors.success + "15"
                      : colors.primary + "12",
                },
              ]}
            >
              <IconSymbol
                name={s.status === "complete" ? "checkmark.circle.fill" : s.icon}
                size={22}
                color={s.status === "complete" ? colors.success : colors.primary}
              />
            </View>
            <View style={styles.stepInfo}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{s.title}</Text>
              <Text style={[styles.stepStatus, { color: s.status === "complete" ? colors.success : colors.muted }]}>
                {s.status === "complete" ? "Verified" : s.status === "locked" ? "Complete previous step" : "Tap to complete"}
              </Text>
            </View>
            {s.status === "locked" ? (
              <IconSymbol name="lock.fill" size={16} color={colors.muted} />
            ) : (
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            )}
          </Pressable>
        ))}
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
    marginBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  progressCard: { borderRadius: 16, padding: 18, marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  progressTitle: { fontSize: 17, fontWeight: "700" },
  progressCount: { fontSize: 15, fontWeight: "700" },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, borderRadius: 3 },
  progressHint: { fontSize: 13 },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: "600" },
  stepStatus: { fontSize: 13, marginTop: 2 },
  // Form styles
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 6, marginTop: 8 },
  inputBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  input: { fontSize: 16, paddingVertical: 0 },
  uploadBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  uploadText: { fontSize: 15, fontWeight: "500" },
  uploadHint: { fontSize: 12 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  submitBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  // Photo
  photoContent: { flex: 1, alignItems: "center", paddingTop: 20 },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  photoInstructions: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  photoTips: { width: "100%", gap: 8, marginBottom: 28 },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  tipText: { fontSize: 15, fontWeight: "500" },
  // Consent
  consentCard: { borderRadius: 16, padding: 18, marginBottom: 24 },
  consentTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  consentText: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  consentItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  consentItemText: { fontSize: 15, fontWeight: "500" },
});
