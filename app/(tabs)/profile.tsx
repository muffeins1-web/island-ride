import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TextInput, Switch } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS } from "@/lib/types";
import type { Island, FavoriteDriver, RideType, ActiveRide, PopularDestination } from "@/lib/types";
import { POPULAR_DESTINATIONS, createMockActiveRide } from "@/lib/mock-data";
import * as Haptics from "expo-haptics";

import FavoriteDrivers from "@/components/rider/favorite-drivers";
import DriverVerification from "@/components/driver/driver-verification";
import VehicleDetails from "@/components/driver/vehicle-details";
import RideOptions from "@/components/rider/ride-options";
import RideTracking from "@/components/rider/ride-tracking";
import RideComplete from "@/components/rider/ride-complete";

type ProfileView =
  | "main"
  | "edit_name"
  | "select_island"
  | "about"
  | "favorite_drivers"
  | "notifications"
  | "payment"
  | "safety"
  | "help"
  | "driver_verification"
  | "vehicle_details"
  | "fav_ride_options"
  | "fav_ride_matching"
  | "fav_ride_tracking"
  | "fav_ride_complete";

const GOLD = "#D4A853";

export default function ProfileScreen() {
  const colors = useColors();
  const { state, dispatch, switchRole } = useApp();
  const [view, setView] = useState<ProfileView>("main");
  const [editName, setEditName] = useState(state.userName);

  // Favorite driver ride flow state
  const [favRideDest, setFavRideDest] = useState<PopularDestination | null>(null);
  const [favRideType, setFavRideType] = useState<RideType>("standard");
  const [favActiveRide, setFavActiveRide] = useState<ActiveRide | null>(null);
  const [requestedDriverName, setRequestedDriverName] = useState("");

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

  // ── Favorite driver → ride flow ──
  const handleRequestFavDriver = useCallback((driver: FavoriteDriver) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRequestedDriverName(driver.name);
    // Pick a random destination for demo
    const islandDests = POPULAR_DESTINATIONS.filter((d) => d.island === state.island);
    const dest = islandDests[Math.floor(Math.random() * islandDests.length)] || POPULAR_DESTINATIONS[0];
    setFavRideDest(dest);
    setFavRideType("standard");
    setView("fav_ride_options");
  }, [state.island]);

  const handleFavRideRequest = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setView("fav_ride_matching");
    setTimeout(() => {
      const ride = createMockActiveRide(true);
      ride.status = "driver_en_route";
      ride.driverName = requestedDriverName || ride.driverName;
      if (favRideDest) {
        ride.dropoff = favRideDest.location;
      }
      setFavActiveRide(ride);
      setView("fav_ride_tracking");
    }, 3000);
  }, [favRideDest, requestedDriverName]);

  const handleFavRideComplete = useCallback(() => {
    if (favActiveRide) {
      const completedRide = { ...favActiveRide, status: "completed" as const };
      setFavActiveRide(completedRide);
      // Record to history
      dispatch({
        type: "ADD_RIDE_HISTORY",
        item: {
          id: `fav-${Date.now()}`,
          pickup: completedRide.pickup,
          dropoff: completedRide.dropoff,
          rideType: completedRide.rideType,
          status: "completed",
          fare: completedRide.fare,
          distance: completedRide.estimatedDistance,
          duration: completedRide.estimatedDuration,
          driverName: completedRide.driverName,
          driverRating: completedRide.driverRating,
          riderRating: 5,
          date: new Date().toISOString(),
        },
      });
      setView("fav_ride_complete");
    }
  }, [favActiveRide, dispatch]);

  const handleFavRideDone = useCallback(() => {
    setView("main");
    setFavActiveRide(null);
    setFavRideDest(null);
    setRequestedDriverName("");
  }, []);

  // ── Favorite driver ride flow screens ──
  if (view === "fav_ride_complete" && favActiveRide) {
    return <RideComplete ride={favActiveRide} onDone={handleFavRideDone} />;
  }

  if (view === "fav_ride_tracking" && favActiveRide) {
    return <RideTracking ride={favActiveRide} onComplete={handleFavRideComplete} />;
  }

  if (view === "fav_ride_matching") {
    return (
      <ScreenContainer>
        <View style={[styles.matchingContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.ringOuter, { borderColor: colors.primary + "15" }]}>
            <View style={[styles.ringMiddle, { borderColor: colors.primary + "30" }]}>
              <View style={[styles.ringInner, { backgroundColor: colors.primary }]}>
                <IconSymbol name="car.fill" size={36} color="#fff" />
              </View>
            </View>
          </View>
          <Text style={[styles.matchingTitle, { color: colors.foreground }]}>
            Requesting {requestedDriverName}
          </Text>
          <Text style={[styles.matchingSubtitle, { color: colors.muted }]}>
            Connecting with your favorite driver...
          </Text>
          <View style={styles.matchingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.matchingDot, { backgroundColor: colors.primary, opacity: 0.3 + i * 0.3 }]} />
            ))}
          </View>
          <Pressable
            onPress={handleFavRideDone}
            style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (view === "fav_ride_options" && favRideDest) {
    return (
      <RideOptions
        destination={favRideDest}
        selectedType={favRideType}
        onSelectType={setFavRideType}
        onRequest={handleFavRideRequest}
        onBack={() => setView("favorite_drivers")}
      />
    );
  }

  // ── Sub-screens ──
  if (view === "favorite_drivers") {
    return (
      <FavoriteDrivers
        onBack={() => setView("main")}
        onRequestRide={handleRequestFavDriver}
      />
    );
  }

  if (view === "driver_verification") {
    return <DriverVerification onBack={() => setView("main")} />;
  }

  if (view === "vehicle_details") {
    return <VehicleDetails onBack={() => setView("main")} />;
  }

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
              <View style={[styles.islandIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="location.fill" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.islandLabel, { color: colors.foreground }]}>{label}</Text>
              {state.island === key && (
                <IconSymbol name="checkmark.circle.fill" size={22} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Notifications Settings ──
  if (view === "notifications") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>RIDE NOTIFICATIONS</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <ToggleRow label="Ride updates" subtitle="Status changes during rides" colors={colors} defaultValue={true} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Driver arrival" subtitle="When your driver arrives" colors={colors} defaultValue={true} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Receipt notifications" subtitle="After each completed ride" colors={colors} defaultValue={true} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>PROMOTIONS</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <ToggleRow label="Special offers" subtitle="Discounts and promotions" colors={colors} defaultValue={false} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Island events" subtitle="Local events and festivals" colors={colors} defaultValue={true} />
          </View>

          {state.role === "driver" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>DRIVER NOTIFICATIONS</Text>
              <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
                <ToggleRow label="New ride requests" subtitle="Sound and vibration alerts" colors={colors} defaultValue={true} />
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                <ToggleRow label="Surge pricing alerts" subtitle="When demand is high nearby" colors={colors} defaultValue={true} />
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                <ToggleRow label="Weekly earnings summary" subtitle="Every Sunday evening" colors={colors} defaultValue={true} />
              </View>
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Payment Methods ──
  if (view === "payment") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Payment Methods</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.paymentCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.paymentIcon, { backgroundColor: colors.success + "15" }]}>
              <IconSymbol name="banknote" size={22} color={colors.success} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: colors.foreground }]}>Cash</Text>
              <Text style={[styles.paymentSub, { color: colors.muted }]}>Pay driver directly</Text>
            </View>
            <View style={[styles.defaultBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
            </View>
          </View>

          <View style={[styles.paymentCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.paymentIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="creditcard.fill" size={22} color={colors.primary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: colors.foreground }]}>Credit/Debit Card</Text>
              <Text style={[styles.paymentSub, { color: colors.muted }]}>No card added</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addPaymentBtn,
              { borderColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addPaymentText, { color: colors.primary }]}>Add Payment Method</Text>
          </Pressable>

          {state.role === "driver" && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>PAYOUT SETTINGS</Text>
              <View style={[styles.paymentCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.paymentIcon, { backgroundColor: GOLD + "15" }]}>
                  <IconSymbol name="building.2.fill" size={22} color={GOLD} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, { color: colors.foreground }]}>Bank Account</Text>
                  <Text style={[styles.paymentSub, { color: colors.muted }]}>Set up direct deposit</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </View>
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Safety ──
  if (view === "safety") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("main")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Safety</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
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

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>SAFETY FEATURES</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <ToggleRow label="Share trip status" subtitle="Let trusted contacts follow your ride" colors={colors} defaultValue={true} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="RideCheck" subtitle="Detect unexpected stops" colors={colors} defaultValue={true} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="PIN verification" subtitle="Confirm driver with a PIN" colors={colors} defaultValue={false} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>TRUSTED CONTACTS</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Pressable style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Manage Contacts</Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>No contacts added yet</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          </View>

          <View style={[styles.safetyInfoCard, { backgroundColor: colors.primary + "08" }]}>
            <IconSymbol name="shield.fill" size={20} color={colors.primary} />
            <Text style={[styles.safetyInfoText, { color: colors.muted }]}>
              IslandRide is committed to your safety. All drivers are verified and background-checked. Your ride details are always available to trusted contacts.
            </Text>
          </View>
        </ScrollView>
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
          <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutTagline, { color: colors.primary }]}>Ride the Islands</Text>
          <Text style={[styles.aboutDesc, { color: colors.muted }]}>
            The Bahamas' own rideshare platform. Connecting riders with drivers across the beautiful islands. Whether you need a taxi or a friendly local ride, IslandRide has you covered.
          </Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
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

        {/* Role switch */}
        <View style={[styles.roleCard, { backgroundColor: colors.primary + "08" }]}>
          <View style={[styles.roleIcon, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name={state.role === "rider" ? "person.fill" : "car.fill"} size={22} color={colors.primary} />
          </View>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleLabel, { color: colors.foreground }]}>
              {state.role === "rider" ? "Rider Mode" : "Driver Mode"}
            </Text>
            <Text style={[styles.roleDesc, { color: colors.muted }]}>
              {state.role === "rider" ? "Switch to start earning" : "Switch to book rides"}
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
            <IconSymbol name="switch.2" size={16} color="#fff" />
            <Text style={styles.switchBtnText}>Switch</Text>
          </Pressable>
        </View>

        {/* Favorite Drivers (rider mode only) */}
        {state.role === "rider" && (
          <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
            <MenuItem
              icon="heart.fill"
              label="Favorite Drivers"
              subtitle={state.favoriteDrivers.length > 0 ? `${state.favoriteDrivers.length} saved` : "Save drivers you love"}
              colors={colors}
              onPress={() => setView("favorite_drivers")}
              accentColor={colors.error}
            />
          </View>
        )}

        {/* General settings */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          <MenuItem icon="location.fill" label={ISLAND_LABELS[state.island]} subtitle="Current island" colors={colors} onPress={() => setView("select_island")} />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem icon="bell.fill" label="Notifications" subtitle="Ride alerts and updates" colors={colors} onPress={() => setView("notifications")} />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem icon="creditcard.fill" label="Payment Methods" subtitle="Cash, card" colors={colors} onPress={() => setView("payment")} />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem icon="shield.fill" label="Safety" subtitle="Emergency contacts, share trip" colors={colors} onPress={() => setView("safety")} accentColor={colors.error} />
        </View>

        {/* Driver-only */}
        {state.role === "driver" && (
          <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
            <MenuItem icon="doc.text.fill" label="Driver Verification" subtitle="License, background check" colors={colors} onPress={() => setView("driver_verification")} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <MenuItem icon="car.fill" label="Vehicle Details" subtitle="Manage your vehicle" colors={colors} onPress={() => setView("vehicle_details")} />
          </View>
        )}

        {/* About & Help */}
        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          <MenuItem icon="info.circle.fill" label="About IslandRide" subtitle="Version 1.0.0" colors={colors} onPress={() => setView("about")} />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem icon="questionmark.circle.fill" label="Help & Support" subtitle="FAQs, contact us" colors={colors} onPress={() => setView("help")} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Reusable Components ──

function MenuItem({ icon, label, subtitle, colors, onPress, accentColor }: {
  icon: any; label: string; subtitle: string; colors: any; onPress: () => void; accentColor?: string;
}) {
  const iconColor = accentColor || colors.primary;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}>
      <View style={[styles.menuIcon, { backgroundColor: iconColor + "12" }]}>
        <IconSymbol name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </Pressable>
  );
}

function ToggleRow({ label, subtitle, colors, defaultValue }: {
  label: string; subtitle: string; colors: any; defaultValue: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultValue);
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleSub, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: colors.border, true: colors.primary + "60" }}
        thumbColor={enabled ? colors.primary : colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", paddingVertical: 16 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
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
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: "700" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 14 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontWeight: "700" },
  roleDesc: { fontSize: 13, marginTop: 2 },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  switchBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  menuSection: { borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: "600" },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  menuDivider: { height: 0.5, marginLeft: 62 },
  // Sub views
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 8,
  },
  subTitle: { fontSize: 18, fontWeight: "700" },
  saveText: { fontSize: 16, fontWeight: "600" },
  inputContainer: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 8 },
  input: { fontSize: 17, paddingVertical: 0 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  islandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  islandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  islandLabel: { flex: 1, fontSize: 16, fontWeight: "500" },
  // Settings
  settingsCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleSub: { fontSize: 12, marginTop: 2 },
  // Payment
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 16, fontWeight: "600" },
  paymentSub: { fontSize: 13, marginTop: 2 },
  defaultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  defaultText: { fontSize: 12, fontWeight: "700" },
  addPaymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  addPaymentText: { fontSize: 15, fontWeight: "600" },
  // Safety
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  emergencyTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emergencySub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  safetyInfoCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  safetyInfoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // About
  aboutContent: { alignItems: "center", paddingTop: 24 },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  aboutName: { fontSize: 28, fontWeight: "800" },
  aboutVersion: { fontSize: 14, marginTop: 4 },
  aboutTagline: { fontSize: 16, fontWeight: "600", marginTop: 4, marginBottom: 20 },
  aboutDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  aboutCard: { width: "100%", padding: 18, borderRadius: 16 },
  aboutCardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  aboutCardText: { fontSize: 14, lineHeight: 20 },
  // Matching (for fav driver ride flow)
  matchingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  ringMiddle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  matchingTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  matchingSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 24 },
  matchingDots: { flexDirection: "row", gap: 6, marginBottom: 32 },
  matchingDot: { width: 8, height: 8, borderRadius: 4 },
  cancelBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  cancelText: { fontSize: 16, fontWeight: "500" },
});
