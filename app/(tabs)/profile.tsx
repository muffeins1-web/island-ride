import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS } from "@/lib/types";
import type { Island } from "@/lib/types";
import * as Haptics from "expo-haptics";

type ProfileView = "main" | "edit_name" | "select_island" | "settings" | "about";

export default function ProfileScreen() {
  const colors = useColors();
  const { state, dispatch, switchRole } = useApp();
  const [view, setView] = useState<ProfileView>("main");
  const [editName, setEditName] = useState(state.userName);

  const handleSaveName = useCallback(() => {
    if (editName.trim()) {
      dispatch({ type: "SET_USER_NAME", name: editName.trim() });
    }
    setView("main");
  }, [editName, dispatch]);

  const handleSelectIsland = useCallback(
    (island: Island) => {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      dispatch({ type: "SET_ISLAND", island });
      setView("main");
    },
    [dispatch]
  );

  const handleSwitchRole = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchRole();
  }, [switchRole]);

  // ── Edit Name ──
  if (view === "edit_name") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Edit Name</Text>
          <Pressable onPress={handleSaveName} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
          </Pressable>
        </View>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
          />
        </View>
      </ScreenContainer>
    );
  }

  // ── Select Island ──
  if (view === "select_island") {
    const islands = Object.entries(ISLAND_LABELS) as [Island, string][];
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Select Island</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {islands.map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => handleSelectIsland(key)}
              style={({ pressed }) => [
                styles.islandRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surface },
              ]}
            >
              <IconSymbol name="location.fill" size={20} color={colors.primary} />
              <Text style={[styles.islandLabel, { color: colors.foreground }]}>{label}</Text>
              {state.island === key && (
                <IconSymbol name="checkmark" size={20} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── About ──
  if (view === "about") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>About</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.aboutContent}>
          <View style={[styles.aboutLogo, { backgroundColor: colors.primary }]}>
            <IconSymbol name="car.fill" size={40} color="#fff" />
          </View>
          <Text style={[styles.aboutName, { color: colors.foreground }]}>IslandRide</Text>
          <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: colors.muted }]}>
            The Bahamas' own rideshare platform. Connecting riders with drivers across the beautiful islands of the Bahamas. Whether you need a taxi or a friendly local ride, IslandRide has you covered.
          </Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.aboutCardTitle, { color: colors.foreground }]}>Made in the Bahamas</Text>
            <Text style={[styles.aboutCardText, { color: colors.muted }]}>
              Built for Bahamians, by Bahamians. Supporting local taxi drivers and rideshare providers across Nassau, Grand Bahama, the Exumas, and beyond.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // ── Main Profile ──
  return (
    <ScreenContainer className="px-5 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

        {/* User card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{state.userName[0]?.toUpperCase() || "G"}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{state.userName}</Text>
            <View style={styles.ratingRow}>
              <IconSymbol name="star.fill" size={16} color={colors.warning} />
              <Text style={[styles.ratingText, { color: colors.muted }]}>
                {state.userRating.toFixed(1)} · {state.totalRides} rides
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              setEditName(state.userName);
              setView("edit_name");
            }}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {/* Role switch */}
        <View style={[styles.roleCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleLabel, { color: colors.foreground }]}>
              Current Mode: {state.role === "rider" ? "Rider" : "Driver"}
            </Text>
            <Text style={[styles.roleDesc, { color: colors.muted }]}>
              {state.role === "rider"
                ? "Switch to driver mode to start earning"
                : "Switch to rider mode to book rides"}
            </Text>
          </View>
          <Pressable
            onPress={handleSwitchRole}
            style={({ pressed }) => [
              styles.switchBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <IconSymbol name="switch.2" size={18} color="#fff" />
            <Text style={styles.switchBtnText}>Switch</Text>
          </Pressable>
        </View>

        {/* Menu items */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuItem
            icon="location.fill"
            label={ISLAND_LABELS[state.island]}
            subtitle="Current island"
            colors={colors}
            onPress={() => setView("select_island")}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="bell.fill"
            label="Notifications"
            subtitle="Ride alerts and updates"
            colors={colors}
            onPress={() => {}}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="creditcard.fill"
            label="Payment Methods"
            subtitle="Cash, card"
            colors={colors}
            onPress={() => {}}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="shield.fill"
            label="Safety"
            subtitle="Emergency contacts, share trip"
            colors={colors}
            onPress={() => {}}
          />
        </View>

        {/* Driver verification (only in driver mode) */}
        {state.role === "driver" && (
          <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuItem
              icon="doc.text.fill"
              label="Driver Verification"
              subtitle="License, vehicle info"
              colors={colors}
              onPress={() => {}}
            />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="car.fill"
              label="Vehicle Details"
              subtitle="Manage your vehicle"
              colors={colors}
              onPress={() => {}}
            />
          </View>
        )}

        {/* About */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MenuItem
            icon="info.circle.fill"
            label="About IslandRide"
            subtitle="Version 1.0.0"
            colors={colors}
            onPress={() => setView("about")}
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="questionmark.circle.fill"
            label="Help & Support"
            subtitle="FAQs, contact us"
            colors={colors}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  colors,
  onPress,
}: {
  icon: any;
  label: string;
  subtitle: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    paddingVertical: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  roleDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  switchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  menuSection: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginLeft: 62,
  },
  // Sub views
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  input: {
    fontSize: 17,
    paddingVertical: 0,
  },
  islandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  islandLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  // About
  aboutContent: {
    alignItems: "center",
    paddingTop: 24,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  aboutName: {
    fontSize: 28,
    fontWeight: "800",
  },
  aboutVersion: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  aboutDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  aboutCard: {
    width: "100%",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  aboutCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  aboutCardText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
