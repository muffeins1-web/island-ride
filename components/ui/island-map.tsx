import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Easing, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const GOLD = "#D4A853";
const CORAL = "#E8735A";

// Bahamas-inspired palette
const OCEAN_DEEP = "#0B4F6C";
const OCEAN_MID = "#1A7A8A";
const OCEAN_SHALLOW = "#3DC1C9";
const OCEAN_SHORE = "#7DE8E0";
const LAND_GREEN = "#4A8B6E";
const LAND_LIGHT = "#6BAF8E";
const SAND_BEACH = "#E8D5B7";
const SAND_LIGHT = "#F2E6D0";

// ── Types ──
export type MapMode = "idle" | "searching" | "driver_approaching" | "trip_in_progress";

export interface MapMarker {
  id: string;
  type: "driver" | "pickup" | "dropoff" | "rider";
  x: number;
  y: number;
  label?: string;
  rotation?: number;
}

export interface IslandMapProps {
  mode?: MapMode;
  showDrivers?: boolean;
  showPickup?: boolean;
  showDropoff?: boolean;
  showRoute?: boolean;
  showRiderLocation?: boolean;
  driverCount?: number;
  pickupLabel?: string;
  dropoffLabel?: string;
  routeProgress?: number;
  children?: React.ReactNode;
}

// ── Realistic road network ──
const ROADS = {
  major: [
    { x1: 5, y1: 48, x2: 95, y2: 48, width: 3.5 },
    { x1: 30, y1: 20, x2: 30, y2: 80, width: 3 },
    { x1: 55, y1: 15, x2: 55, y2: 85, width: 3 },
    { x1: 10, y1: 35, x2: 90, y2: 35, width: 2.5 },
    { x1: 15, y1: 62, x2: 85, y2: 62, width: 2.5 },
  ],
  minor: [
    { x1: 15, y1: 25, x2: 15, y2: 75 },
    { x1: 42, y1: 20, x2: 42, y2: 78 },
    { x1: 68, y1: 18, x2: 68, y2: 82 },
    { x1: 82, y1: 22, x2: 82, y2: 76 },
    { x1: 8, y1: 28, x2: 92, y2: 28 },
    { x1: 12, y1: 55, x2: 88, y2: 55 },
    { x1: 10, y1: 72, x2: 90, y2: 72 },
    { x1: 60, y1: 20, x2: 78, y2: 10 },
  ],
};

// ── Ocean areas ──
const WATER_AREAS = [
  { x: 0, y: 0, w: 100, h: 10, color: OCEAN_DEEP },
  { x: 0, y: 0, w: 40, h: 6, color: OCEAN_MID },
  { x: 60, y: 3, w: 40, h: 14, color: OCEAN_MID },
  { x: 0, y: 85, w: 100, h: 15, color: OCEAN_DEEP + "60" },
];

// ── Shoreline / shallow water ──
const SHORE_AREAS = [
  { x: 0, y: 8, w: 100, h: 4, color: OCEAN_SHORE + "40" },
  { x: 55, y: 14, w: 30, h: 3, color: OCEAN_SHORE + "30" },
];

// ── Beach areas ──
const BEACH_AREAS = [
  { x: 0, y: 10, w: 100, h: 3, color: SAND_BEACH + "50" },
  { x: 60, y: 16, w: 25, h: 2, color: SAND_BEACH + "40" },
];

// ── Land blocks (buildings/vegetation) ──
const BLOCKS = [
  { x: 8, y: 30, w: 18, h: 15 },
  { x: 33, y: 22, w: 16, h: 12 },
  { x: 58, y: 38, w: 12, h: 10 },
  { x: 35, y: 50, w: 14, h: 10 },
  { x: 72, y: 28, w: 16, h: 14 },
  { x: 12, y: 64, w: 20, h: 10 },
  { x: 44, y: 65, w: 18, h: 10 },
  { x: 70, y: 55, w: 14, h: 12 },
  { x: 18, y: 42, w: 10, h: 8 },
  { x: 84, y: 45, w: 12, h: 10 },
];

// ── Green areas (parks/vegetation) ──
const GREEN_AREAS = [
  { x: 20, y: 25, w: 8, h: 6 },
  { x: 60, y: 50, w: 6, h: 5 },
  { x: 75, y: 70, w: 10, h: 7 },
  { x: 10, y: 55, w: 5, h: 4 },
];

// ── Driver positions ──
const IDLE_DRIVER_POSITIONS = [
  { x: 22, y: 32, rotation: 45 },
  { x: 48, y: 26, rotation: -30 },
  { x: 35, y: 52, rotation: 90 },
  { x: 72, y: 44, rotation: -60 },
  { x: 58, y: 68, rotation: 15 },
  { x: 18, y: 60, rotation: -45 },
];

export default function IslandMap({
  mode = "idle",
  showDrivers = true,
  showPickup = false,
  showDropoff = false,
  showRoute = false,
  showRiderLocation = true,
  driverCount = 6,
  pickupLabel,
  dropoffLabel,
  routeProgress = 0,
  children,
}: IslandMapProps) {
  const colors = useColors();

  // ── Animated values ──
  const riderPulseAnim = useRef(new Animated.Value(0.6)).current;
  const searchPulseAnim = useRef(new Animated.Value(1)).current;
  const driverAnims = useRef(
    IDLE_DRIVER_POSITIONS.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  ).current;
  const routeAnim = useRef(new Animated.Value(0)).current;
  const driverApproachAnim = useRef(new Animated.Value(0)).current;
  const tripProgressAnim = useRef(new Animated.Value(0)).current;

  // ── Rider pulse animation ──
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(riderPulseAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(riderPulseAnim, { toValue: 0.6, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: false }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [riderPulseAnim]);

  // ── Search pulse animation ──
  useEffect(() => {
    if (mode === "searching") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(searchPulseAnim, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
          Animated.timing(searchPulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [mode, searchPulseAnim]);

  // ── Driver idle movement ──
  useEffect(() => {
    if (mode === "idle" || mode === "searching") {
      const animations = driverAnims.map((anim) => {
        const moveX = Animated.loop(
          Animated.sequence([
            Animated.timing(anim.x, {
              toValue: (Math.random() - 0.5) * 6,
              duration: 2000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim.x, {
              toValue: (Math.random() - 0.5) * 6,
              duration: 2000 + Math.random() * 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
        const moveY = Animated.loop(
          Animated.sequence([
            Animated.timing(anim.y, {
              toValue: (Math.random() - 0.5) * 4,
              duration: 2500 + Math.random() * 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim.y, {
              toValue: (Math.random() - 0.5) * 4,
              duration: 2500 + Math.random() * 2000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
        moveX.start();
        moveY.start();
        return { moveX, moveY };
      });
      return () => {
        animations.forEach((a) => {
          a.moveX.stop();
          a.moveY.stop();
        });
      };
    }
  }, [mode, driverAnims]);

  // ── Driver approaching animation ──
  useEffect(() => {
    if (mode === "driver_approaching") {
      Animated.timing(driverApproachAnim, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      driverApproachAnim.setValue(0);
    }
  }, [mode, driverApproachAnim]);

  // ── Trip progress animation ──
  useEffect(() => {
    if (mode === "trip_in_progress") {
      Animated.timing(tripProgressAnim, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      tripProgressAnim.setValue(0);
    }
  }, [mode, tripProgressAnim]);

  // ── Route line animation ──
  useEffect(() => {
    if (showRoute) {
      Animated.timing(routeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      routeAnim.setValue(0);
    }
  }, [showRoute, routeAnim]);

  const pickupPos = { x: 38, y: 52 };
  const dropoffPos = { x: 75, y: 25 };
  const riderPos = { x: 50, y: 50 };

  const approachDriverX = driverApproachAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [22, 30, 35, pickupPos.x],
  });
  const approachDriverY = driverApproachAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: [32, 38, 45, pickupPos.y],
  });

  const tripDriverX = tripProgressAnim.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [pickupPos.x, 45, 55, 68, dropoffPos.x],
  });
  const tripDriverY = tripProgressAnim.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [pickupPos.y, 48, 42, 32, dropoffPos.y],
  });

  const pulseOpacity = riderPulseAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.15, 0.4],
  });
  const pulseScale = riderPulseAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [1, 1.6],
  });

  // Premium Bahamas map colors
  const mapBg = "#E8F4F0"; // Soft sage-green land base
  const roadMajorColor = "#C8D6D2";
  const roadMinorColor = "#D8E2DE";
  const blockColor = "#D5E3DD";
  const routeColor = colors.primary;
  const routeBgColor = colors.primary + "20";

  return (
    <View style={[styles.container, { backgroundColor: mapBg }]}>
      {/* Ocean areas */}
      {WATER_AREAS.map((area, i) => (
        <View
          key={`water-${i}`}
          style={[
            styles.waterArea,
            {
              left: `${area.x}%` as any,
              top: `${area.y}%` as any,
              width: `${area.w}%` as any,
              height: `${area.h}%` as any,
              backgroundColor: area.color,
            },
          ]}
        />
      ))}

      {/* Shoreline */}
      {SHORE_AREAS.map((area, i) => (
        <View
          key={`shore-${i}`}
          style={[
            styles.waterArea,
            {
              left: `${area.x}%` as any,
              top: `${area.y}%` as any,
              width: `${area.w}%` as any,
              height: `${area.h}%` as any,
              backgroundColor: area.color,
            },
          ]}
        />
      ))}

      {/* Beach */}
      {BEACH_AREAS.map((area, i) => (
        <View
          key={`beach-${i}`}
          style={[
            styles.waterArea,
            {
              left: `${area.x}%` as any,
              top: `${area.y}%` as any,
              width: `${area.w}%` as any,
              height: `${area.h}%` as any,
              backgroundColor: area.color,
            },
          ]}
        />
      ))}

      {/* Land blocks */}
      {BLOCKS.map((block, i) => (
        <View
          key={`block-${i}`}
          style={[
            styles.block,
            {
              left: `${block.x}%` as any,
              top: `${block.y}%` as any,
              width: `${block.w}%` as any,
              height: `${block.h}%` as any,
              backgroundColor: blockColor,
              borderColor: "#C0D0CA",
            },
          ]}
        />
      ))}

      {/* Green areas */}
      {GREEN_AREAS.map((area, i) => (
        <View
          key={`green-${i}`}
          style={[
            styles.greenArea,
            {
              left: `${area.x}%` as any,
              top: `${area.y}%` as any,
              width: `${area.w}%` as any,
              height: `${area.h}%` as any,
            },
          ]}
        />
      ))}

      {/* Minor roads */}
      {ROADS.minor.map((road, i) => {
        const isVertical = Math.abs(road.x2 - road.x1) < Math.abs(road.y2 - road.y1);
        const isDiagonal = Math.abs(road.x2 - road.x1) > 5 && Math.abs(road.y2 - road.y1) > 5;

        if (isDiagonal) {
          const dx = road.x2 - road.x1;
          const dy = road.y2 - road.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`minor-${i}`}
              style={[
                styles.roadDiagonal,
                {
                  left: `${road.x1}%` as any,
                  top: `${road.y1}%` as any,
                  width: `${length}%` as any,
                  backgroundColor: roadMinorColor,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        }

        return isVertical ? (
          <View
            key={`minor-${i}`}
            style={[
              styles.roadV,
              {
                left: `${road.x1}%` as any,
                top: `${Math.min(road.y1, road.y2)}%` as any,
                height: `${Math.abs(road.y2 - road.y1)}%` as any,
                backgroundColor: roadMinorColor,
              },
            ]}
          />
        ) : (
          <View
            key={`minor-${i}`}
            style={[
              styles.roadH,
              {
                left: `${Math.min(road.x1, road.x2)}%` as any,
                top: `${road.y1}%` as any,
                width: `${Math.abs(road.x2 - road.x1)}%` as any,
                backgroundColor: roadMinorColor,
              },
            ]}
          />
        );
      })}

      {/* Major roads */}
      {ROADS.major.map((road, i) => {
        const isVertical = Math.abs(road.x2 - road.x1) < Math.abs(road.y2 - road.y1);
        return isVertical ? (
          <View
            key={`major-${i}`}
            style={[
              styles.roadV,
              {
                left: `${road.x1}%` as any,
                top: `${Math.min(road.y1, road.y2)}%` as any,
                height: `${Math.abs(road.y2 - road.y1)}%` as any,
                width: road.width,
                backgroundColor: roadMajorColor,
              },
            ]}
          />
        ) : (
          <View
            key={`major-${i}`}
            style={[
              styles.roadH,
              {
                left: `${Math.min(road.x1, road.x2)}%` as any,
                top: `${road.y1}%` as any,
                width: `${Math.abs(road.x2 - road.x1)}%` as any,
                height: road.width,
                backgroundColor: roadMajorColor,
              },
            ]}
          />
        );
      })}

      {/* Route line */}
      {showRoute && (
        <>
          {/* Route background */}
          <Animated.View
            style={[
              styles.routeLine,
              {
                left: `${pickupPos.x}%` as any,
                top: `${pickupPos.y}%` as any,
                width: routeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", `${Math.sqrt(Math.pow(dropoffPos.x - pickupPos.x, 2) + Math.pow(dropoffPos.y - pickupPos.y, 2))}%`],
                }),
                backgroundColor: routeBgColor,
                transform: [
                  {
                    rotate: `${Math.atan2(dropoffPos.y - pickupPos.y, dropoffPos.x - pickupPos.x) * (180 / Math.PI)}deg`,
                  },
                ],
              },
            ]}
          />
          {/* Route foreground */}
          <Animated.View
            style={[
              styles.routeLine,
              {
                left: `${pickupPos.x}%` as any,
                top: `${pickupPos.y}%` as any,
                width: routeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", `${Math.sqrt(Math.pow(dropoffPos.x - pickupPos.x, 2) + Math.pow(dropoffPos.y - pickupPos.y, 2))}%`],
                }),
                backgroundColor: routeColor,
                height: 3,
                transform: [
                  {
                    rotate: `${Math.atan2(dropoffPos.y - pickupPos.y, dropoffPos.x - pickupPos.x) * (180 / Math.PI)}deg`,
                  },
                ],
              },
            ]}
          />
          {/* Route dots */}
          <View style={[styles.routeDot, { left: `${pickupPos.x}%` as any, top: `${pickupPos.y}%` as any, backgroundColor: routeColor }]} />
          <View style={[styles.routeDot, { left: `${dropoffPos.x}%` as any, top: `${dropoffPos.y}%` as any, backgroundColor: GOLD }]} />
        </>
      )}

      {/* Driver markers — professional clean style */}
      {showDrivers &&
        IDLE_DRIVER_POSITIONS.slice(0, driverCount).map((pos, i) => (
          <Animated.View
            key={`driver-${i}`}
            style={[
              styles.driverMarker,
              {
                left: Animated.add(pos.x, driverAnims[i].x).interpolate({
                  inputRange: [-100, 100],
                  outputRange: ["-100%", "100%"],
                }) as any,
                top: Animated.add(pos.y, driverAnims[i].y).interpolate({
                  inputRange: [-100, 100],
                  outputRange: ["-100%", "100%"],
                }) as any,
                backgroundColor: "#1A1A2E",
                borderColor: "#fff",
                transform: [{ rotate: `${pos.rotation}deg` }],
              },
            ]}
          >
            <IconSymbol name="car.fill" size={14} color="#fff" />
          </Animated.View>
        ))}

      {/* Approaching driver */}
      {mode === "driver_approaching" && (
        <Animated.View
          style={[
            styles.approachingDriver,
            {
              left: approachDriverX.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }) as any,
              top: approachDriverY.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }) as any,
              backgroundColor: colors.primary,
              borderColor: "#fff",
            },
          ]}
        >
          <IconSymbol name="car.fill" size={18} color="#fff" />
        </Animated.View>
      )}

      {/* Trip in progress driver */}
      {mode === "trip_in_progress" && (
        <Animated.View
          style={[
            styles.tripDriver,
            {
              left: tripDriverX.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }) as any,
              top: tripDriverY.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }) as any,
              backgroundColor: colors.primary,
              borderColor: "#fff",
            },
          ]}
        >
          <View style={[styles.tripDriverGlow, { backgroundColor: colors.primary + "25" }]} />
          <IconSymbol name="car.fill" size={16} color="#fff" />
        </Animated.View>
      )}

      {/* Search pulse ring */}
      {mode === "searching" && (
        <Animated.View
          style={[
            styles.searchPulse,
            {
              left: `${riderPos.x}%` as any,
              top: `${riderPos.y}%` as any,
              borderColor: colors.primary,
              transform: [{ scale: searchPulseAnim }],
              opacity: searchPulseAnim.interpolate({
                inputRange: [1, 1.8],
                outputRange: [0.5, 0],
              }),
            },
          ]}
        />
      )}

      {/* Pickup marker */}
      {showPickup && (
        <View
          style={[
            styles.pickupMarker,
            {
              left: `${pickupPos.x}%` as any,
              top: `${pickupPos.y}%` as any,
            },
          ]}
        >
          <View style={[styles.pickupPin, { backgroundColor: colors.success }]}>
            <View style={styles.pickupPinInner} />
          </View>
          <View style={[styles.pickupPinStem, { backgroundColor: colors.success }]} />
          <View style={[styles.pickupPinShadow, { backgroundColor: colors.success + "30" }]} />
          {pickupLabel && (
            <View style={[styles.markerLabel, { backgroundColor: "#fff" + "E8" }]}>
              <Text style={[styles.markerLabelText, { color: colors.success }]} numberOfLines={1}>
                {pickupLabel}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Dropoff marker */}
      {showDropoff && (
        <View
          style={[
            styles.dropoffMarker,
            {
              left: `${dropoffPos.x}%` as any,
              top: `${dropoffPos.y}%` as any,
            },
          ]}
        >
          <View style={[styles.dropoffPin, { backgroundColor: GOLD }]}>
            <IconSymbol name="mappin.and.ellipse" size={14} color="#fff" />
          </View>
          <View style={[styles.dropoffPinStem, { backgroundColor: GOLD }]} />
          <View style={[styles.dropoffPinShadow, { backgroundColor: GOLD + "30" }]} />
          {dropoffLabel && (
            <View style={[styles.markerLabel, { backgroundColor: "#fff" + "E8" }]}>
              <Text style={[styles.markerLabelText, { color: GOLD }]} numberOfLines={1}>
                {dropoffLabel}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Rider location */}
      {showRiderLocation && (
        <View
          style={[
            styles.riderLocation,
            {
              left: `${riderPos.x}%` as any,
              top: `${riderPos.y}%` as any,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.riderPulse,
              {
                backgroundColor: colors.primary,
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <View style={[styles.riderDotOuter, { borderColor: "#fff" }]}>
            <View style={[styles.riderDotInner, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}

      {/* Overlay children */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  waterArea: {
    position: "absolute",
    borderRadius: 2,
  },
  greenArea: {
    position: "absolute",
    borderRadius: 6,
    backgroundColor: LAND_GREEN + "25",
  },
  block: {
    position: "absolute",
    borderRadius: 4,
    borderWidth: 0.5,
  },
  roadH: {
    position: "absolute",
    height: 1.5,
    borderRadius: 1,
  },
  roadV: {
    position: "absolute",
    width: 1.5,
    borderRadius: 1,
  },
  roadDiagonal: {
    position: "absolute",
    height: 1.5,
    borderRadius: 1,
    transformOrigin: "left center",
  },
  routeLine: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    transformOrigin: "left center",
  },
  routeDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginTop: -3,
  },
  driverMarker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -14,
    marginTop: -14,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  approachingDriver: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -18,
    marginTop: -18,
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  tripDriver: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -19,
    marginTop: -19,
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  tripDriverGlow: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  searchPulse: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginLeft: -40,
    marginTop: -40,
  },
  pickupMarker: {
    position: "absolute",
    alignItems: "center",
    marginLeft: -14,
    marginTop: -40,
    zIndex: 5,
  },
  pickupPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  pickupPinStem: {
    width: 3,
    height: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  pickupPinShadow: {
    width: 14,
    height: 4,
    borderRadius: 7,
    marginTop: 2,
  },
  dropoffMarker: {
    position: "absolute",
    alignItems: "center",
    marginLeft: -14,
    marginTop: -40,
    zIndex: 5,
  },
  dropoffPin: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dropoffPinStem: {
    width: 3,
    height: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  dropoffPinShadow: {
    width: 14,
    height: 4,
    borderRadius: 7,
    marginTop: 2,
  },
  markerLabel: {
    position: "absolute",
    top: -20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  riderLocation: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    zIndex: 8,
  },
  riderPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  riderDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  riderDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
