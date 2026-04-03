import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import RideHistory from "@/components/rider/ride-history";
import EarningsDashboard from "@/components/driver/earnings-dashboard";
import RideOptions from "@/components/rider/ride-options";
import RideTracking from "@/components/rider/ride-tracking";
import RideComplete from "@/components/rider/ride-complete";
import {
  createMockActiveRide,
  findDestinationByNameOrAddress,
  getCurrentLocationForIsland,
} from "@/lib/mock-data";
import type { RideType, ActiveRide, PopularDestination } from "@/lib/types";
import * as Haptics from "expo-haptics";


type RebookView = "history" | "options" | "matching" | "tracking" | "complete";

export default function ActivityScreen() {
  const { state, dispatch } = useApp();
  const colors = useColors();
  const [rebookView, setRebookView] = useState<RebookView>("history");
  const [rebookDest, setRebookDest] = useState<PopularDestination | null>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>("standard");
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);

  const handleRebook = useCallback((pickup: string, dropoff: string) => {
    const dest = findDestinationByNameOrAddress(dropoff, state.island) || {
      id: "rebook",
      name: dropoff,
      address: pickup,
      icon: "mappin.and.ellipse",
      location: { ...getCurrentLocationForIsland(state.island), name: dropoff, address: pickup },
      island: state.island,
    };
    setRebookDest(dest);
    setRebookView("options");
  }, [state.island]);

  const handleRequestRide = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRebookView("matching");
    setTimeout(() => {
      const ride = createMockActiveRide({
        isRider: true,
        island: state.island,
        dropoff: rebookDest?.location,
        rideType: selectedRideType,
      });
      setActiveRide(ride);
      setRebookView("tracking");
    }, 3000);
  }, [rebookDest, selectedRideType, state.island]);

  const handleCompleteRide = useCallback(() => {
    if (activeRide) {
      const completedRide = { ...activeRide, status: "completed" as const };
      setActiveRide(completedRide);
      // Record rebooked ride to history
      dispatch({
        type: "ADD_RIDE_HISTORY",
        item: {
          id: `rebook-${Date.now()}`,
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
      setRebookView("complete");
    }
  }, [activeRide, dispatch]);

  const handleDone = useCallback(() => {
    setRebookView("history");
    setActiveRide(null);
    setRebookDest(null);
  }, []);

  if (state.role === "driver") {
    return <EarningsDashboard />;
  }

  // Rebook flow: complete
  if (rebookView === "complete" && activeRide) {
    return <RideComplete ride={activeRide} onDone={handleDone} />;
  }

  // Rebook flow: tracking
  if (rebookView === "tracking" && activeRide) {
    return <RideTracking ride={activeRide} onComplete={handleCompleteRide} />;
  }

  // Rebook flow: matching
  if (rebookView === "matching") {
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
          <Text style={[styles.matchingTitle, { color: colors.foreground }]}>Connecting you with a driver</Text>
          <Text style={[styles.matchingSubtitle, { color: colors.muted }]}>
            Rebooking this trip...
          </Text>
          <View style={styles.matchingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.matchingDot, { backgroundColor: colors.primary, opacity: 0.3 + i * 0.3 }]} />
            ))}
          </View>
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [styles.cancelBtn, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // Rebook flow: ride options
  if (rebookView === "options" && rebookDest) {
    return (
      <RideOptions
        destination={rebookDest}
        selectedType={selectedRideType}
        onSelectType={setSelectedRideType}
        onRequest={handleRequestRide}
        onBack={handleDone}
      />
    );
  }

  // Default: ride history with rebook callback
  return <RideHistory onRebook={handleRebook} />;
}

const styles = StyleSheet.create({
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
