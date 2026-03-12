import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS } from "@/lib/types";
import type { Island, UserRole } from "@/lib/types";
import * as Haptics from "expo-haptics";

const GOLD = "#D4A853";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_PAGES = [
  {
    icon: "car.fill" as const,
    title: "Welcome to IslandRide",
    subtitle: "The Bahamas' own ride-hailing platform.\nConnecting riders and drivers across the islands.",
    color: "#00D4E4",
  },
  {
    icon: "person.2.fill" as const,
    title: "Ride or Drive",
    subtitle: "Request rides as a passenger, or earn money\nby driving — switch anytime.",
    color: GOLD,
  },
  {
    icon: "location.fill" as const,
    title: "Island to Island",
    subtitle: "Available across Nassau, Grand Bahama,\nExumas, Eleuthera, and more.",
    color: "#34D399",
  },
];

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const colors = useColors();
  const { dispatch } = useApp();
  const [page, setPage] = useState(0);
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("rider");
  const [selectedIsland, setSelectedIsland] = useState<Island>("nassau");

  const isSetupPage = page === ONBOARDING_PAGES.length;

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (page < ONBOARDING_PAGES.length) {
      setPage(page + 1);
    }
  }, [page]);

  const handleFinish = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (name.trim()) {
      dispatch({ type: "SET_USER_NAME", name: name.trim() });
    }
    dispatch({ type: "SET_ROLE", role: selectedRole });
    dispatch({ type: "SET_ISLAND", island: selectedIsland });
    dispatch({ type: "SET_ONBOARDED", value: true });
    onComplete();
  }, [name, selectedRole, selectedIsland, dispatch, onComplete]);

  // ── Setup page ──
  if (isSetupPage) {
    const islands = Object.entries(ISLAND_LABELS) as [Island, string][];
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView
          style={styles.setupContainer}
          contentContainerStyle={styles.setupContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.setupTitle, { color: colors.foreground }]}>Set up your profile</Text>
          <Text style={[styles.setupSubtitle, { color: colors.muted }]}>
            Just a few details to get started
          </Text>

          {/* Name */}
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>YOUR NAME</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.surface }]}>
            <IconSymbol name="person.fill" size={18} color={colors.muted} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
            />
          </View>

          {/* Role */}
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>I WANT TO</Text>
          <View style={styles.roleRow}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRole("rider");
              }}
              style={({ pressed }) => [
                styles.roleCard,
                {
                  backgroundColor: selectedRole === "rider" ? colors.primary + "12" : colors.surface,
                  borderColor: selectedRole === "rider" ? colors.primary : colors.border,
                },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.roleIconBox, { backgroundColor: colors.primary + "18" }]}>
                <IconSymbol name="person.fill" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>Ride</Text>
              <Text style={[styles.roleCardDesc, { color: colors.muted }]}>Get around the islands</Text>
              {selectedRole === "rider" && (
                <View style={[styles.roleCheck, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedRole("driver");
              }}
              style={({ pressed }) => [
                styles.roleCard,
                {
                  backgroundColor: selectedRole === "driver" ? GOLD + "12" : colors.surface,
                  borderColor: selectedRole === "driver" ? GOLD : colors.border,
                },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.roleIconBox, { backgroundColor: GOLD + "18" }]}>
                <IconSymbol name="car.fill" size={24} color={GOLD} />
              </View>
              <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>Drive</Text>
              <Text style={[styles.roleCardDesc, { color: colors.muted }]}>Earn with your vehicle</Text>
              {selectedRole === "driver" && (
                <View style={[styles.roleCheck, { backgroundColor: GOLD }]}>
                  <IconSymbol name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Island */}
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>YOUR ISLAND</Text>
          <View style={[styles.islandGrid]}>
            {islands.slice(0, 6).map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIsland(key);
                }}
                style={({ pressed }) => [
                  styles.islandChip,
                  {
                    backgroundColor: selectedIsland === key ? colors.primary + "12" : colors.surface,
                    borderColor: selectedIsland === key ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[
                    styles.islandChipText,
                    { color: selectedIsland === key ? colors.primary : colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {label.split("/")[0].trim()}
                </Text>
                {selectedIsland === key && (
                  <IconSymbol name="checkmark" size={14} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Get Started */}
          <Pressable
            onPress={handleFinish}
            style={({ pressed }) => [
              styles.finishBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.finishBtnText}>Get Started</Text>
            <IconSymbol name="chevron.right" size={18} color="#fff" />
          </Pressable>

          <Pressable
            onPress={() => {
              dispatch({ type: "SET_ONBOARDED", value: true });
              onComplete();
            }}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.skipText, { color: colors.muted }]}>Skip for now</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Intro pages ──
  const currentPage = ONBOARDING_PAGES[page];
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.pageContainer}>
        {/* Skip */}
        <Pressable
          onPress={() => setPage(ONBOARDING_PAGES.length)}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.skipBtnText, { color: colors.muted }]}>Skip</Text>
        </Pressable>

        {/* Icon */}
        <View style={styles.iconArea}>
          <View style={[styles.iconRingOuter, { borderColor: currentPage.color + "15" }]}>
            <View style={[styles.iconRingMiddle, { borderColor: currentPage.color + "25" }]}>
              <View style={[styles.iconCircle, { backgroundColor: currentPage.color }]}>
                <IconSymbol name={currentPage.icon} size={38} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        {/* Text */}
        <View style={styles.textArea}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{currentPage.title}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.muted }]}>{currentPage.subtitle}</Text>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === page ? colors.primary : colors.border,
                  width: i === page ? 24 : 8,
                },
              ]}
            />
          ))}
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
          <Text style={styles.nextBtnText}>
            {page === ONBOARDING_PAGES.length - 1 ? "Get Started" : "Next"}
          </Text>
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
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingMiddle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: { alignItems: "center", marginBottom: 24, marginTop: 20, minHeight: 100 },
  pageTitle: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 10, color: "#ECEDEE" },
  pageSubtitle: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  dotsRow: { flexDirection: "row", alignSelf: "center", gap: 6, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  // Setup
  setupContainer: { flex: 1 },
  setupContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 },
  setupTitle: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  setupSubtitle: { fontSize: 15, marginBottom: 28 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  roleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCardTitle: { fontSize: 18, fontWeight: "700" },
  roleCardDesc: { fontSize: 12, textAlign: "center" },
  roleCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  islandGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  islandChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  islandChipText: { fontSize: 14, fontWeight: "500" },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  finishBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  skipText: { fontSize: 15, textAlign: "center", paddingVertical: 8 },
});
