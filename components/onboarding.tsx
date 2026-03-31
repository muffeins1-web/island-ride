import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const colors = useColors();
  const { dispatch } = useApp();
  const [page, setPage] = useState<"welcome" | "name">("welcome");
  const [name, setName] = useState("");

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage("name");
  }, []);

  const handleFinish = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (name.trim()) {
      dispatch({ type: "SET_USER_NAME", name: name.trim() });
    }
    dispatch({ type: "SET_ROLE", role: "rider" });
    dispatch({ type: "SET_ISLAND", island: "nassau" });
    dispatch({ type: "SET_ONBOARDED", value: true });
    onComplete();
  }, [name, dispatch, onComplete]);

  // ── Step 2: Name Entry ──
  if (page === "name") {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.pageContainer}>
          <Pressable
            onPress={() => {
              dispatch({ type: "SET_ONBOARDED", value: true });
              onComplete();
            }}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.skipBtnText, { color: colors.muted }]}>Skip</Text>
          </Pressable>

          <View style={styles.nameArea}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <IconSymbol name="person.fill" size={32} color="#fff" />
            </View>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>What's your name?</Text>
            <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
              So your driver knows who to look for
            </Text>

            <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="person.fill" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
                onSubmitEditing={handleFinish}
                autoFocus
              />
            </View>
          </View>

          <Pressable
            onPress={handleFinish}
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.nextBtnText}>Get Started</Text>
            <IconSymbol name="chevron.right" size={18} color="#fff" />
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── Step 1: Welcome ──
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.pageContainer}>
        <Pressable
          onPress={() => {
            dispatch({ type: "SET_ONBOARDED", value: true });
            onComplete();
          }}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.skipBtnText, { color: colors.muted }]}>Skip</Text>
        </Pressable>

        {/* Icon */}
        <View style={styles.iconArea}>
          <View style={[styles.iconRingOuter, { borderColor: "#00D4E4" + "15" }]}>
            <View style={[styles.iconRingMiddle, { borderColor: "#00D4E4" + "25" }]}>
              <View style={[styles.iconCircle, { backgroundColor: "#00D4E4" }]}>
                <IconSymbol name="car.fill" size={38} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        {/* Text */}
        <View style={styles.textArea}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Welcome to IslandRide</Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>
            Nassau's ride-hailing app.{"\n"}Get where you're going, island style.
          </Text>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary, width: 24 }]} />
          <View style={[styles.dot, { backgroundColor: colors.border, width: 8 }]} />
        </View>

        {/* Next */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.nextBtnText}>Next</Text>
          <IconSymbol name="chevron.right" size={18} color="#fff" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageContainer: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  skipBtn: { alignSelf: "flex-end", paddingVertical: 12, paddingHorizontal: 4 },
  skipBtnText: { fontSize: 16, fontWeight: "500" },
  iconArea: { alignItems: "center", justifyContent: "center", height: 180, marginTop: 12 },
  iconRingOuter: {
    width: 170, height: 170, borderRadius: 85, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  iconRingMiddle: {
    width: 136, height: 136, borderRadius: 68, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center",
  },
  textArea: { alignItems: "center", marginBottom: 24, marginTop: 20, minHeight: 100 },
  pageTitle: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  pageSubtitle: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  dotsRow: { flexDirection: "row", alignSelf: "center", gap: 6, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  nameArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, width: "100%", marginTop: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
