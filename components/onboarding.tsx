import { useState, useCallback, useEffect } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
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

// ── Animated intro page component ──
function AnimatedIntroPage({
  pageData,
  pageIndex,
  currentPage,
  totalPages,
  onNext,
  onSkip,
}: {
  pageData: (typeof ONBOARDING_PAGES)[number];
  pageIndex: number;
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  // Shared values for entrance animations
  const bgScale = useSharedValue(1.15);
  const bgTranslateY = useSharedValue(-10);
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-15);
  const outerRingScale = useSharedValue(0.6);
  const outerRingOpacity = useSharedValue(0);
  const innerRingScale = useSharedValue(0.6);
  const innerRingOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(25);
  const dotsOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const skipOpacity = useSharedValue(0);

  // Ken Burns — slow continuous zoom and drift
  const kenBurnsScale = useSharedValue(1.15);
  const kenBurnsX = useSharedValue(0);

  // Ring pulse animation
  const ringPulse = useSharedValue(1);

  useEffect(() => {
    // Reset all values
    bgScale.value = 1.15;
    bgTranslateY.value = -10;
    iconScale.value = 0;
    iconRotate.value = -15;
    outerRingScale.value = 0.6;
    outerRingOpacity.value = 0;
    innerRingScale.value = 0.6;
    innerRingOpacity.value = 0;
    titleOpacity.value = 0;
    titleTranslateY.value = 30;
    subtitleOpacity.value = 0;
    subtitleTranslateY.value = 25;
    dotsOpacity.value = 0;
    buttonOpacity.value = 0;
    buttonTranslateY.value = 20;
    skipOpacity.value = 0;
    kenBurnsScale.value = 1.15;
    kenBurnsX.value = 0;

    // Ken Burns — slow zoom out and drift over 12 seconds
    kenBurnsScale.value = withTiming(1.02, {
      duration: 12000,
      easing: Easing.out(Easing.quad),
    });
    kenBurnsX.value = withTiming(pageIndex % 2 === 0 ? -8 : 8, {
      duration: 12000,
      easing: Easing.inOut(Easing.quad),
    });

    // Background fade-in zoom
    bgScale.value = withTiming(1.0, { duration: 800, easing: Easing.out(Easing.cubic) });
    bgTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Skip button fade in
    skipOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    // Outer ring expand
    outerRingScale.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) }));
    outerRingOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));

    // Inner ring expand (staggered)
    innerRingScale.value = withDelay(350, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) }));
    innerRingOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));

    // Icon pop in with spring
    iconScale.value = withDelay(500, withSpring(1, { damping: 12, stiffness: 150 }));
    iconRotate.value = withDelay(500, withSpring(0, { damping: 12, stiffness: 120 }));

    // Title slide up + fade in
    titleOpacity.value = withDelay(650, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(650, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));

    // Subtitle slide up + fade in (staggered)
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    subtitleTranslateY.value = withDelay(800, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));

    // Dots fade in
    dotsOpacity.value = withDelay(950, withTiming(1, { duration: 350 }));

    // Button slide up + fade in
    buttonOpacity.value = withDelay(1050, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    buttonTranslateY.value = withDelay(1050, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));

    // Ring pulse — gentle breathing loop
    ringPulse.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, [pageIndex]);

  // Animated styles
  const bgAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bgScale.value * kenBurnsScale.value },
      { translateY: bgTranslateY.value },
      { translateX: kenBurnsX.value },
    ],
  }));

  const skipAnimStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  const outerRingAnimStyle = useAnimatedStyle(() => ({
    opacity: outerRingOpacity.value,
    transform: [{ scale: outerRingScale.value * ringPulse.value }],
  }));

  const innerRingAnimStyle = useAnimatedStyle(() => ({
    opacity: innerRingOpacity.value,
    transform: [{ scale: innerRingScale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const dotsAnimStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <View style={styles.fullScreen}>
      {/* Animated background image with Ken Burns effect */}
      <Animated.View style={[StyleSheet.absoluteFillObject, bgAnimStyle]}>
        <Image
          source={{ uri: pageData.bgImage }}
          style={[StyleSheet.absoluteFillObject, { width: SCREEN_WIDTH + 30, height: SCREEN_HEIGHT + 30, left: -15, top: -15 }]}
          contentFit="cover"
        />
      </Animated.View>

      {/* Dark overlay */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(11,22,35,0.72)" }]} />

      {/* Content */}
      <View style={styles.pageContainer}>
        {/* Skip button */}
        <View style={styles.topBar}>
          <View style={{ width: 60 }} />
          <View style={{ flex: 1 }} />
          <Animated.View style={skipAnimStyle}>
            <Pressable
              onPress={onSkip}
              style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Center — icon with animated rings */}
        <View style={styles.centerArea}>
          <Animated.View style={[styles.outerRing, outerRingAnimStyle]}>
            <Animated.View style={[styles.innerRing, innerRingAnimStyle]}>
              <Animated.View style={[styles.iconCircle, { backgroundColor: pageData.iconColor }, iconAnimStyle]}>
                <IconSymbol name={pageData.icon} size={36} color="#fff" />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Bottom content — animated text, dots, button */}
        <View style={styles.bottomContent}>
          <Animated.Text style={[styles.pageTitle, titleAnimStyle]}>
            {pageData.title}
          </Animated.Text>
          <Animated.Text style={[styles.pageSubtitle, subtitleAnimStyle]}>
            {pageData.subtitle}
          </Animated.Text>

          {/* Animated dots */}
          <Animated.View style={[styles.dotsRow, dotsAnimStyle]}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === currentPage ? CYAN : "rgba(255,255,255,0.25)",
                    width: i === currentPage ? 24 : 8,
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Animated button */}
          <Animated.View style={[{ width: "100%" }, buttonAnimStyle]}>
            <Pressable
              onPress={onNext}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: CYAN },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={styles.nextBtnText}>
                {currentPage === totalPages - 1 ? "Get Started" : "Next"}
              </Text>
              <IconSymbol name="chevron.right" size={18} color="#fff" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
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

  // ── Setup page (no animation changes) ──
  if (isSetupPage) {
    const islands = Object.entries(ISLAND_LABELS) as [Island, string][];
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
        <ScrollView
          style={styles.setupContainer}
          contentContainerStyle={styles.setupContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text
            entering={FadeIn.delay(100).duration(400)}
            style={[styles.setupTitle, { color: colors.foreground }]}
          >
            Set up your profile
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.delay(200).duration(400)}
            style={[styles.setupSubtitle, { color: colors.muted }]}
          >
            Just a few details to get started
          </Animated.Text>

          {/* Name */}
          <Animated.View entering={FadeIn.delay(300).duration(400)}>
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
          </Animated.View>

          {/* Role */}
          <Animated.View entering={FadeIn.delay(400).duration(400)}>
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
          </Animated.View>

          {/* Island */}
          <Animated.View entering={FadeIn.delay(500).duration(400)}>
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
          </Animated.View>

          {/* Get Started */}
          <Animated.View entering={FadeIn.delay(600).duration(400)}>
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
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Animated intro pages ──
  const currentPageData = ONBOARDING_PAGES[page];

  return (
    <AnimatedIntroPage
      key={page}
      pageData={currentPageData}
      pageIndex={page}
      currentPage={page}
      totalPages={ONBOARDING_PAGES.length}
      onNext={handleNext}
      onSkip={() => setPage(ONBOARDING_PAGES.length)}
    />
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: NAVY,
    overflow: "hidden",
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
