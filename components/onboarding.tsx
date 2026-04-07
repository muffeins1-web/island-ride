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
import { Image } from "expo-image";

const NAVY = "#0B1623";
const NAVY_SURFACE = "#132035";
const GOLD = "#D4A853";
const TURQUOISE = "#00D4AA";
const CYAN = "#00E5CC";
const RING_COLOR = "rgba(255,255,255,0.06)";
const RING_COLOR_2 = "rgba(255,255,255,0.03)";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Background images for each onboarding page
const BG_WELCOME = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029561572/EDxhXSUho2ibhDsxCXss7y/onboarding-welcome-bg-JWYSERHbQhscNUs6AZHRgX.webp";
const BG_RIDE_DRIVE = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029561572/EDxhXSUho2ibhDsxCXss7y/onboarding-ride-drive-bg-FwK7JVo9QFgeeKJNwUNMcd.webp";
const BG_ISLANDS = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029561572/EDxhXSUho2ibhDsxCXss7y/onboarding-islands-bg-QmtStVK4o2PRXmZ2Ps8hqX.webp";

const ONBOARDING_PAGES = [
  {
    icon: "car.fill" as const,
    title: "Welcome to IslandRide",
    subtitle: "The Bahamas' own ride-hailing platform.\nConnecting riders and drivers across the islands.",
    iconColor: TURQUOISE,
    bgImage: BG_WELCOME,
  },
  {
    icon: "person.2.fill" as const,
    title: "Ride or Drive",
    subtitle: "Request rides as a passenger, or earn money\nby driving \u2014 switch anytime.",
    iconColor: GOLD,
    bgImage: BG_RIDE_DRIVE,
  },
  {
    icon: "location.fill" as const,
    title: "Island to Island",
    subtitle: "Serving Nassau, Grand Bahama,\nExumas, Eleuthera, and beyond.",
    iconColor: "#34D399",
    bgImage: BG_ISLANDS,
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
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
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
          <View style={[styles.inputBox, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
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
                  backgroundColor: selectedRole === "rider" ? TURQUOISE + "12" : colors.surface,
                  borderColor: selectedRole === "rider" ? TURQUOISE : colors.border,
                },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.roleIconBox, { backgroundColor: TURQUOISE + "18" }]}>
                <IconSymbol name="person.fill" size={24} color={TURQUOISE} />
              </View>
              <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>Ride</Text>
              <Text style={[styles.roleCardDesc, { color: colors.muted }]}>Get around the islands</Text>
              {selectedRole === "rider" && (
                <View style={[styles.roleCheck, { backgroundColor: TURQUOISE }]}>
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
            {islands.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIsland(key);
                }}
                style={({ pressed }) => [
                  styles.islandChip,
                  {
                    backgroundColor: selectedIsland === key ? TURQUOISE + "12" : colors.surface,
                    borderColor: selectedIsland === key ? TURQUOISE : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[
                    styles.islandChipText,
                    { color: selectedIsland === key ? TURQUOISE : colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {label.split("/")[0].trim()}
                </Text>
                {selectedIsland === key && (
                  <IconSymbol name="checkmark" size={14} color={TURQUOISE} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Get Started */}
          <Pressable
            onPress={handleFinish}
            style={({ pressed }) => [
              styles.finishBtn,
              { backgroundColor: CYAN },
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

  // ── Intro pages with background images and icon rings ──
  const currentPage = ONBOARDING_PAGES[page];

  return (
    <View style={styles.fullScreen}>
      {/* Background image — subtle behind the dark overlay */}
      <Image
        source={{ uri: currentPage.bgImage }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={400}
      />

      {/* Dark navy overlay to maintain dark theme feel with image showing through */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(11,22,35,0.72)" }]} />

      {/* Content */}
      <View style={styles.pageContainer}>
        {/* Skip button — top right */}
        <View style={styles.topBar}>
          <View style={{ width: 60 }} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setPage(ONBOARDING_PAGES.length)}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </View>

        {/* Center content — icon with rings */}
        <View style={styles.centerArea}>
          {/* Outer ring */}
          <View style={styles.outerRing}>
            {/* Inner ring */}
            <View style={styles.innerRing}>
              {/* Icon circle */}
              <View style={[styles.iconCircle, { backgroundColor: currentPage.iconColor }]}>
                <IconSymbol name={currentPage.icon} size={36} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom content — title, subtitle, dots, button */}
        <View style={styles.bottomContent}>
          <Text style={styles.pageTitle}>{currentPage.title}</Text>
          <Text style={styles.pageSubtitle}>{currentPage.subtitle}</Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {ONBOARDING_PAGES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === page ? CYAN : "rgba(255,255,255,0.25)",
                    width: i === page ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Next button — cyan gradient style */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: CYAN },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.nextBtnText}>
              {page === ONBOARDING_PAGES.length - 1 ? "Get Started" : "Next"}
            </Text>
            <IconSymbol name="chevron.right" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: NAVY,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "web" ? 16 : 52,
    paddingBottom: Platform.OS === "web" ? 24 : 44,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  // Center icon with concentric rings
  centerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: RING_COLOR_2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  innerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: RING_COLOR,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  // Bottom content
  bottomContent: {
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#fff",
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    width: "100%",
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  // Setup page styles
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
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  finishBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  skipText: { fontSize: 15, textAlign: "center", paddingVertical: 8 },
});
