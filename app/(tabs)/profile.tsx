import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TextInput, Switch, Alert, Linking } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { ISLAND_LABELS } from "@/lib/types";
import type { Island, FavoriteDriver, RideType, ActiveRide, PopularDestination } from "@/lib/types";
import { createMockActiveRide, getRandomDestinationForIsland } from "@/lib/mock-data";
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
  | "fav_ride_complete"
  | "faq_detail"
  | "terms"
  | "privacy"
  | "contact_support"
  | "add_card"
  | "manage_contacts";

const GOLD = "#D4A853";

// FAQ content
const FAQ_ITEMS = [
  {
    q: "How does IslandRide work?",
    a: "IslandRide connects you with local drivers across the Bahamas. Simply choose your island, enter your destination, select a ride type, and a nearby driver will be matched to you. You can pay by cash or card.",
  },
  {
    q: "Which islands are covered?",
    a: "We currently operate across Nassau/Paradise Island, Grand Bahama, the Exumas, Eleuthera, Abaco, Andros, Bimini, and Long Island. Coverage varies by island - Nassau and Grand Bahama have the most drivers.",
  },
  {
    q: "How is the fare calculated?",
    a: "Fares include a base charge, per-kilometer rate, per-minute rate, and a small booking fee. Island Premium rides have a higher multiplier for luxury vehicles. Island Share rides split the cost with other passengers.",
  },
  {
    q: "Can I schedule a ride in advance?",
    a: "Advance scheduling is coming soon. For now, you can request rides on demand. Drivers typically arrive within 3-8 minutes in Nassau.",
  },
  {
    q: "How do I become a driver?",
    a: "Switch to Driver mode from your profile, then complete the verification steps: submit your Bahamas driver's license, profile photo, and authorize a background check. You'll also need to register your vehicle.",
  },
  {
    q: "Is my ride insured?",
    a: "All IslandRide trips include basic passenger coverage. Drivers are required to maintain valid vehicle insurance. For additional details, contact our support team.",
  },
];

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

  // FAQ detail state
  const [selectedFaq, setSelectedFaq] = useState<{ q: string; a: string } | null>(null);

  // Add card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardSaved, setCardSaved] = useState(false);

  // Contact support state
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  // Manage contacts state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [trustedContacts, setTrustedContacts] = useState<{ name: string; phone: string }[]>([]);

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
    const dest = getRandomDestinationForIsland(state.island);
    setFavRideDest(dest);
    setFavRideType("standard");
    setView("fav_ride_options");
  }, [state.island]);

  const handleFavRideRequest = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setView("fav_ride_matching");
    setTimeout(() => {
      const ride = createMockActiveRide({
        isRider: true,
        island: state.island,
        dropoff: favRideDest?.location,
        rideType: favRideType,
        driverName: requestedDriverName || undefined,
      });
      setFavActiveRide(ride);
      setView("fav_ride_tracking");
    }, 3000);
  }, [favRideDest, favRideType, requestedDriverName, state.island]);

  const handleFavRideComplete = useCallback(() => {
    if (favActiveRide) {
      const completedRide = { ...favActiveRide, status: "completed" as const };
      setFavActiveRide(completedRide);
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

  // ── Emergency call ──
  const handleEmergencyCall = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert(
      "Emergency Call",
      "You are about to call 919 (Bahamas Emergency Services). Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call 919", style: "destructive", onPress: () => Linking.openURL("tel:919") },
      ]
    );
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
            Connecting with your preferred driver...
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
                <ToggleRow label="High demand alerts" subtitle="When demand is high nearby" colors={colors} defaultValue={true} />
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                <ToggleRow label="Weekly earnings summary" subtitle="Every Sunday evening" colors={colors} defaultValue={true} />
              </View>
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Add Card ──
  if (view === "add_card") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("payment")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Add Card</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
            <IconSymbol name="shield.fill" size={18} color={colors.primary} />
            <Text style={[styles.infoCardText, { color: colors.primary }]}>
              Card details are stored securely and never shared with drivers.
            </Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>CARD NUMBER</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.muted}
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="number-pad"
              maxLength={19}
              returnKeyType="done"
            />
          </View>

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>EXPIRY</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.muted}
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  maxLength={5}
                  returnKeyType="done"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>CVV</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="123"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCardSaved(true);
              setTimeout(() => {
                setCardSaved(false);
                setCardNumber("");
                setCardExpiry("");
                setView("payment");
              }, 1500);
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: cardNumber.length > 10 ? colors.primary : colors.muted + "40" },
              pressed && cardNumber.length > 10 && { transform: [{ scale: 0.97 }] },
            ]}
          >
            {cardSaved ? (
              <View style={styles.savedRow}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Card Saved!</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>Save Card</Text>
            )}
          </Pressable>
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
              <IconSymbol name="banknote.fill" size={22} color={colors.success} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: colors.foreground }]}>Cash</Text>
              <Text style={[styles.paymentSub, { color: colors.muted }]}>Pay driver directly</Text>
            </View>
            <View style={[styles.defaultBadge, { backgroundColor: colors.primary + "15" }]}>
              <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
            </View>
          </View>

          <Pressable
            onPress={() => setView("add_card")}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.paymentCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.paymentIcon, { backgroundColor: colors.primary + "15" }]}>
                <IconSymbol name="creditcard.fill" size={22} color={colors.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentLabel, { color: colors.foreground }]}>Credit/Debit Card</Text>
                <Text style={[styles.paymentSub, { color: colors.muted }]}>Tap to add a card</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setView("add_card")}
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
              <Pressable
                onPress={() => {
                  Alert.alert("Bank Account", "Direct deposit setup will be available when IslandRide launches payment processing. For now, all driver payments are handled in cash.", [{ text: "OK" }]);
                }}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
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
              </Pressable>
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Manage Contacts ──
  if (view === "manage_contacts") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("safety")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Trusted Contacts</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
            <IconSymbol name="shield.fill" size={18} color={colors.primary} />
            <Text style={[styles.infoCardText, { color: colors.primary }]}>
              Trusted contacts can receive your trip details when you share your ride status.
            </Text>
          </View>

          {trustedContacts.map((c, i) => (
            <View key={i} style={[styles.contactRow, { backgroundColor: colors.surface }]}>
              <View style={[styles.contactAvatar, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.contactInitial, { color: colors.primary }]}>{c.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.contactPhone, { color: colors.muted }]}>{c.phone}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setTrustedContacts(trustedContacts.filter((_, idx) => idx !== i));
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={({ pressed }) => [pressed && { opacity: 0.6 }]}
              >
                <IconSymbol name="trash.fill" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>ADD CONTACT</Text>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>NAME</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Contact name"
              placeholderTextColor={colors.muted}
              value={contactName}
              onChangeText={setContactName}
              returnKeyType="done"
            />
          </View>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>PHONE</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="(242) 555-0123"
              placeholderTextColor={colors.muted}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>
          <Pressable
            onPress={() => {
              if (contactName.trim() && contactPhone.trim()) {
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTrustedContacts([...trustedContacts, { name: contactName.trim(), phone: contactPhone.trim() }]);
                setContactName("");
                setContactPhone("");
              }
            }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: contactName.trim() && contactPhone.trim() ? colors.primary : colors.muted + "40" },
              pressed && contactName.trim() && contactPhone.trim() && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.primaryBtnText}>Add Contact</Text>
          </Pressable>
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
            onPress={handleEmergencyCall}
            style={({ pressed }) => [
              styles.emergencyBtn,
              { backgroundColor: colors.error },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <IconSymbol name="phone.fill" size={22} color="#fff" />
            <View>
              <Text style={styles.emergencyTitle}>Emergency - Call 919</Text>
              <Text style={styles.emergencySub}>Bahamas emergency services</Text>
            </View>
          </Pressable>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>SAFETY FEATURES</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <ToggleRow label="Share trip status" subtitle="Let trusted contacts follow your ride" colors={colors} defaultValue={true} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="Trip safety alerts" subtitle="Detect unexpected stops or route changes" colors={colors} defaultValue={true} />
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <ToggleRow label="PIN verification" subtitle="Confirm driver with a PIN" colors={colors} defaultValue={false} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>TRUSTED CONTACTS</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Pressable
              onPress={() => setView("manage_contacts")}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Manage Contacts</Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>
                  {trustedContacts.length > 0 ? `${trustedContacts.length} contact${trustedContacts.length > 1 ? "s" : ""} saved` : "Add people you trust"}
                </Text>
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

  // ── Contact Support ──
  if (view === "contact_support") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("help")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Contact Support</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {supportSent ? (
            <View style={styles.supportSentContainer}>
              <View style={[styles.supportSentCircle, { backgroundColor: colors.success + "15" }]}>
                <IconSymbol name="checkmark" size={36} color={colors.success} />
              </View>
              <Text style={[styles.supportSentTitle, { color: colors.foreground }]}>Message Sent</Text>
              <Text style={[styles.supportSentSub, { color: colors.muted }]}>
                Our team will get back to you within 24 hours. Check your notifications for updates.
              </Text>
              <Pressable
                onPress={() => { setSupportSent(false); setSupportMessage(""); setView("help"); }}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary }, pressed && { transform: [{ scale: 0.97 }] }]}
              >
                <Text style={styles.primaryBtnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={[styles.infoCard, { backgroundColor: colors.primary + "10" }]}>
                <IconSymbol name="message.fill" size={18} color={colors.primary} />
                <Text style={[styles.infoCardText, { color: colors.primary }]}>
                  Describe your issue and our Bahamas-based support team will respond within 24 hours.
                </Text>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>YOUR MESSAGE</Text>
              <View style={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textArea, { color: colors.foreground }]}
                  placeholder="Tell us what happened..."
                  placeholderTextColor={colors.muted}
                  value={supportMessage}
                  onChangeText={setSupportMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              <Pressable
                onPress={() => {
                  if (supportMessage.trim()) {
                    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setSupportSent(true);
                  }
                }}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: supportMessage.trim() ? colors.primary : colors.muted + "40" },
                  pressed && supportMessage.trim() && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={styles.primaryBtnText}>Send Message</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── FAQ Detail ──
  if (view === "faq_detail" && selectedFaq) {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("help")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>FAQ</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{selectedFaq.q}</Text>
          <Text style={[styles.faqAnswer, { color: colors.muted }]}>{selectedFaq.a}</Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Terms of Service ──
  if (view === "terms") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("help")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Terms of Service</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.legalTitle, { color: colors.foreground }]}>IslandRide Terms of Service</Text>
          <Text style={[styles.legalDate, { color: colors.muted }]}>Last updated: March 2026</Text>
          <Text style={[styles.legalBody, { color: colors.muted }]}>
            By using the IslandRide platform, you agree to the following terms and conditions governing the use of our island mobility service throughout the Commonwealth of The Bahamas.{"\n\n"}
            1. Service Description{"\n"}IslandRide provides a technology platform connecting riders with independent transportation providers across the Bahamas. IslandRide does not provide transportation services directly.{"\n\n"}
            2. User Accounts{"\n"}You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.{"\n\n"}
            3. Fares and Payment{"\n"}Fares are calculated based on distance, time, and ride type. All fares are quoted in Bahamian Dollars (BSD). Cash and card payments are accepted.{"\n\n"}
            4. Driver Requirements{"\n"}Drivers must hold a valid Bahamas driver's license, pass a background check, and maintain vehicle insurance. Vehicles must meet IslandRide's safety standards.{"\n\n"}
            5. Safety{"\n"}Both riders and drivers are expected to treat each other with respect. IslandRide reserves the right to suspend accounts that violate community guidelines.{"\n\n"}
            6. Limitation of Liability{"\n"}IslandRide is not liable for delays, route changes, or incidents beyond our reasonable control. Our liability is limited to the fare paid for the affected trip.
          </Text>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Privacy Policy ──
  if (view === "privacy") {
    return (
      <ScreenContainer className="px-5 pt-2">
        <View style={styles.subHeader}>
          <Pressable onPress={() => setView("help")} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.subTitle, { color: colors.foreground }]}>Privacy Policy</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.legalTitle, { color: colors.foreground }]}>IslandRide Privacy Policy</Text>
          <Text style={[styles.legalDate, { color: colors.muted }]}>Last updated: March 2026</Text>
          <Text style={[styles.legalBody, { color: colors.muted }]}>
            IslandRide is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.{"\n\n"}
            Information We Collect{"\n"}We collect your name, phone number, location data during rides, ride history, and payment information. Location data is only collected when the app is actively in use.{"\n\n"}
            How We Use Your Information{"\n"}Your data is used to match you with drivers, calculate fares, improve our service, and ensure safety. We do not sell your personal information to third parties.{"\n\n"}
            Data Sharing{"\n"}We share limited information with drivers (your name and pickup/dropoff locations) to facilitate rides. We may share data with law enforcement when legally required.{"\n\n"}
            Data Retention{"\n"}Ride history is retained for 2 years. Account data is deleted within 30 days of account closure.{"\n\n"}
            Your Rights{"\n"}You may request access to, correction of, or deletion of your personal data by contacting our support team.
          </Text>
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
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>FREQUENTLY ASKED</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            {FAQ_ITEMS.map((faq, i) => (
              <View key={faq.q}>
                {i > 0 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => { setSelectedFaq(faq); setView("faq_detail"); }}
                  style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                    <IconSymbol name="questionmark.circle.fill" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>{faq.q}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>GET IN TOUCH</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Pressable
              onPress={() => setView("contact_support")}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="message.fill" size={18} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Contact Support</Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Send us a message</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => setView("terms")}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="doc.text.fill" size={18} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Terms of Service</Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>Legal information</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => setView("privacy")}
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="shield.fill" size={18} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Privacy Policy</Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>How we handle your data</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
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
            The Bahamas' island mobility service - connecting riders with trusted local drivers across Nassau, Grand Bahama, the Exumas, and beyond.
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
                  {state.userRating.toFixed(1)} � {state.totalRides} rides
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
              label="Preferred Drivers"
              subtitle={state.favoriteDrivers.length > 0 ? `${state.favoriteDrivers.length} saved` : "Save drivers you prefer"}
              colors={colors}
              onPress={() => setView("favorite_drivers")}
              accentColor={colors.error}
            />
          </View>
        )}

        {[
          [
            { icon: "location.fill", label: ISLAND_LABELS[state.island], subtitle: "Current island", view: "select_island" as const },
            { icon: "bell.fill", label: "Notifications", subtitle: "Ride alerts and updates", view: "notifications" as const },
            { icon: "creditcard.fill", label: "Payment Methods", subtitle: "Cash, card", view: "payment" as const },
            { icon: "shield.fill", label: "Safety", subtitle: "Emergency contacts, trip sharing", view: "safety" as const, accentColor: colors.error },
          ],
          ...(state.role === "driver"
            ? [[
                { icon: "doc.text.fill", label: "Driver Verification", subtitle: "License, background check", view: "driver_verification" as const },
                { icon: "car.fill", label: "Vehicle Details", subtitle: "Manage your vehicle", view: "vehicle_details" as const },
              ]]
            : []),
          [
            { icon: "info.circle.fill", label: "About IslandRide", subtitle: "Version 1.0.0", view: "about" as const },
            { icon: "questionmark.circle.fill", label: "Help & Support", subtitle: "FAQs, contact us", view: "help" as const },
          ],
        ].map((section, sectionIndex) => (
          <View key={sectionIndex} style={[styles.menuSection, { backgroundColor: colors.surface }]}>
            {section.map((item, itemIndex) => (
              <View key={item.view}>
                {itemIndex > 0 && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                <MenuItem
                  icon={item.icon}
                  label={item.label}
                  subtitle={item.subtitle}
                  colors={colors}
                  onPress={() => setView(item.view)}
                  accentColor={item.accentColor}
                />
              </View>
            ))}
          </View>
        ))}
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
  switchBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  menuSection: { borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: "500" },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  menuDivider: { height: 0.5, marginLeft: 66 },
  // Sub-screen header
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginBottom: 8,
  },
  subTitle: { fontSize: 18, fontWeight: "700" },
  saveText: { fontSize: 16, fontWeight: "600" },
  // Input
  inputContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  input: { fontSize: 16, paddingVertical: 0 },
  // Island select
  islandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 14,
  },
  islandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  islandLabel: { flex: 1, fontSize: 16, fontWeight: "500" },
  // Settings card
  settingsCard: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 16, fontWeight: "500" },
  toggleSub: { fontSize: 13, marginTop: 2 },
  // Payment
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
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
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
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
    marginTop: 4,
    marginBottom: 16,
  },
  addPaymentText: { fontSize: 15, fontWeight: "600" },
  // Emergency
  emergencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  emergencyTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emergencySub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  // Safety info
  safetyInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  safetyInfoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  // About
  aboutContent: { alignItems: "center", paddingTop: 20 },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  aboutName: { fontSize: 26, fontWeight: "800" },
  aboutVersion: { fontSize: 14, marginTop: 4 },
  aboutTagline: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  aboutDesc: { fontSize: 14, textAlign: "center", lineHeight: 22, marginTop: 16, paddingHorizontal: 12 },
  aboutCard: { borderRadius: 16, padding: 20, marginTop: 24, width: "100%" },
  aboutCardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  aboutCardText: { fontSize: 14, lineHeight: 22 },
  // Matching
  matchingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  ringOuter: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ringMiddle: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ringInner: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  matchingTitle: { fontSize: 22, fontWeight: "700", marginTop: 28 },
  matchingSubtitle: { fontSize: 15, marginTop: 8 },
  matchingDots: { flexDirection: "row", gap: 6, marginTop: 20 },
  matchingDot: { width: 8, height: 8, borderRadius: 4 },
  cancelBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 28 },
  cancelText: { fontSize: 16, fontWeight: "600" },
  // Primary button
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoCardText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // Field label
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  rowFields: { flexDirection: "row", gap: 12 },
  // Text area
  textAreaContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    minHeight: 140,
  },
  textArea: { fontSize: 16, paddingVertical: 0, minHeight: 120 },
  // FAQ
  faqQuestion: { fontSize: 20, fontWeight: "700", marginBottom: 16, lineHeight: 28 },
  faqAnswer: { fontSize: 16, lineHeight: 26 },
  // Legal
  legalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  legalDate: { fontSize: 13, marginBottom: 20 },
  legalBody: { fontSize: 15, lineHeight: 24 },
  // Support sent
  supportSentContainer: { alignItems: "center", paddingTop: 40 },
  supportSentCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  supportSentTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  supportSentSub: { fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 28, paddingHorizontal: 20 },
  // Contacts
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  contactInitial: { fontSize: 18, fontWeight: "700" },
  contactName: { fontSize: 16, fontWeight: "600" },
  contactPhone: { fontSize: 13, marginTop: 2 },
});
