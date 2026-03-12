// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "checkmark": "check",
  "chevron.left.forwardslash.chevron.right": "code",
  // Transport
  "car.fill": "directions-car",
  "car.side": "directions-car",
  "paperplane.fill": "send",
  // People
  "person.fill": "person",
  "person.crop.circle": "person-outline",
  "person.2.fill": "people",
  "person.badge.plus": "person-add",
  // Status & Info
  "star.fill": "star",
  "star": "star-border",
  "location.fill": "my-location",
  "map.fill": "map",
  "clock.fill": "history",
  "info.circle.fill": "info",
  "questionmark.circle.fill": "help",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.circle.fill": "check-circle",
  "checkmark.seal.fill": "verified",
  // Finance
  "dollarsign.circle.fill": "attach-money",
  "chart.bar.fill": "bar-chart",
  "creditcard.fill": "credit-card",
  "wallet.pass.fill": "account-balance-wallet",
  "banknote.fill": "payments",
  // Settings & System
  "gearshape.fill": "settings",
  "power": "power-settings-new",
  "bell.fill": "notifications",
  "bell.badge.fill": "notifications-active",
  "switch.2": "swap-horiz",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "trash.fill": "delete",
  // Communication
  "phone.fill": "phone",
  "message.fill": "message",
  "envelope.fill": "email",
  // Safety & Security
  "shield.fill": "shield",
  "shield.checkmark": "verified-user",
  "exclamationmark.shield.fill": "gpp-maybe",
  "sos": "sos",
  // Media & Content
  "magnifyingglass": "search",
  "plus": "add",
  "minus": "remove",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "bolt.fill": "flash-on",
  "sun.max.fill": "wb-sunny",
  "moon.fill": "nights-stay",
  "flag.fill": "flag",
  "doc.text.fill": "description",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "list.bullet": "format-list-bulleted",
  // New for expanded flows
  "pencil": "edit",
  "square.and.pencil": "edit-note",
  "arrow.clockwise": "refresh",
  "hand.raised.fill": "pan-tool",
  "globe": "language",
  "paintbrush.fill": "brush",
  "speedometer": "speed",
  "gauge.medium": "speed",
  "timer": "timer",
  "calendar": "calendar-today",
  "scope": "gps-fixed",
  "waveform": "graphic-eq",
  "circle.fill": "circle",
  "circle": "radio-button-unchecked",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "mappin.and.ellipse": "place",
  "building.2.fill": "business",
  "ferry.fill": "directions-boat",
  "airplane": "flight",
  "leaf.fill": "eco",
  "crown.fill": "workspace-premium",
  "sparkles": "auto-awesome",
} as unknown as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
