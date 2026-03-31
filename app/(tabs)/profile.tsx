import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";

type ProfileView = "main" | "edit_name" | "about" | "help";

export default function ProfileScreen() {
  const colors = useColors();
  const { state, dispatch } = useApp();
  const [view, setView] = useState<ProfileView>("main");
  const [editName, setEditName] = useState(state.userName);

  const handleSaveName = useCallback(() => {
    if (editName.trim()) {
      dispatch({ type: "SET_USER_NAME", name: editName.trim() });
    }
    setView("main");
  }, [editName, dispatch]);

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

  // ── Help & Support ──
  if (view === "help") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Help & Support</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Emergency */}
          <Pressable
            style={({ pressed }) => [
              styles.emergencyBtn,
              { backgroundColor: colors.error },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <IconSymbol name="phone.fill" size={22} color="#fff" />
            <View>
              <Text style={styles.emergencyTitle}>Emergency — Call 919</Text>
              <Text style={styles.emergencySub}>Bahamas emergency services</Text>
            </View>
          </Pressable>

          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            {[
              { icon: "questionmark.circle.fill", label: "FAQs", sub: "Common questions answered" },
              { icon: "message.fill", label: "Contact Support", sub: "Chat with our team" },
              { icon: "doc.text.fill", label: "Terms of Service", sub: "Legal information" },
              { icon: "shield.fill", label: "Privacy Policy", sub: "How we handle your data" },
              { icon: "star.fill", label: "Rate IslandRide", sub: "Leave a review" },
            ].map((item, i) => (
              <View key={item.label}>
                {i > 0 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                <Pressable style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                    <IconSymbol name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.muted }]}>{item.sub}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
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
          <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.0.0 (MVP)</Text>
          <Text style={[styles.aboutTagline, { color: colors.primary }]}>Nassau's Ride-Hailing App</Text>
          <Text style={[styles.aboutDesc, { color: colors.muted }]}>
            The Bahamas' own rideshare platform. Connecting riders with drivers across Nassau and Paradise Island. Whether you need a taxi or a friendly local ride, IslandRide has you covered.
          </Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.aboutCardTitle, { color: colors.foreground }]}>Made in the Bahamas</Text>
            <Text style={[styles.aboutCardText, { color: colors.muted }]}>
              Built for Bahamians, by Bahamians. Starting with Nassau and expanding to more islands soon.
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
        <Pressable
          onPress={() => {
            setEditName(state.userName);
            setView("edit_name");
          }}
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{state.userName[0]?.toUpperCase() || "G"}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.foreground }]}>{state.userName}</Text>
              <View style={styles.ratingRow}>
                <IconSymbol name="star.fill" size={14} color={colors.warning} />
                <Text style={[styles.ratingText, { color: colors.muted }]}>
                  {state.userRating.toFixed(1)} · {state.totalRides} rides
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </View>
        </Pressable>

        {/* Location badge */}
        <View style={[styles.locationBadge, { backgroundColor: colors.surface }]}>
          <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
            <IconSymbol name="location.fill" size={18} color={colors.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Nassau / Paradise Island</Text>
            <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Current location</Text>
          </View>
        </View>

        {/* About & Help */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          <MenuItem icon="info.circle.fill" label="About IslandRide" subtitle="Version 1.0.0" colors={colors} onPress={() => setView("about")} />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem icon="questionmark.circle.fill" label="Help & Support" subtitle="FAQs, emergency, contact us" colors={colors} onPress={() => setView("help")} />
        </View>

        {/* Version footer */}
        <Text style={[styles.versionFooter, { color: colors.muted }]}>
          IslandRide MVP · Nassau Launch
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Reusable Components ──

function MenuItem({ icon, label, subtitle, colors, onPress }: {
  icon: any; label: string; subtitle: string; colors: any; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
        <IconSymbol name={icon} size={18} color={colors.primary} />
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
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", paddingVertical: 16 },
  userCard: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderRadius: 16, marginBottom: 16, gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 14 },
  locationBadge: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 16, marginBottom: 16, gap: 12,
  },
  menuSection: { borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: "600" },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  menuDivider: { height: 0.5, marginLeft: 62 },
  subHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, marginBottom: 8,
  },
  subTitle: { fontSize: 18, fontWeight: "700" },
  saveText: { fontSize: 16, fontWeight: "600" },
  inputContainer: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 8 },
  input: { fontSize: 17, paddingVertical: 0 },
  settingsCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  emergencyBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 18, borderRadius: 16, marginBottom: 20,
  },
  emergencyTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emergencySub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  aboutContent: { alignItems: "center", paddingTop: 24 },
  aboutLogo: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  aboutName: { fontSize: 28, fontWeight: "800" },
  aboutVersion: { fontSize: 14, marginTop: 4 },
  aboutTagline: { fontSize: 16, fontWeight: "600", marginTop: 4, marginBottom: 20 },
  aboutDesc: {
    fontSize: 15, textAlign: "center", lineHeight: 22,
    paddingHorizontal: 16, marginBottom: 20,
  },
  aboutCard: { width: "100%", padding: 18, borderRadius: 16 },
  aboutCardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  aboutCardText: { fontSize: 14, lineHeight: 20 },
  versionFooter: { textAlign: "center", fontSize: 12, marginTop: 8, paddingBottom: 16 },
});
