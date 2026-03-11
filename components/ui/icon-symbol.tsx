// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "car.fill": "directions-car",
  "clock.fill": "history",
  "person.fill": "person",
  "person.crop.circle": "person-outline",
  "star.fill": "star",
  "location.fill": "my-location",
  "map.fill": "map",
  "dollarsign.circle.fill": "attach-money",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "checkmark": "check",
  "phone.fill": "phone",
  "message.fill": "message",
  "shield.fill": "shield",
  "creditcard.fill": "credit-card",
  "bell.fill": "notifications",
  "info.circle.fill": "info",
  "questionmark.circle.fill": "help",
  "power": "power-settings-new",
  "magnifyingglass": "search",
  "plus": "add",
  "minus": "remove",
  "heart.fill": "favorite",
  "bolt.fill": "flash-on",
  "sun.max.fill": "wb-sunny",
  "moon.fill": "nights-stay",
  "flag.fill": "flag",
  "doc.text.fill": "description",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "wallet.pass.fill": "account-balance-wallet",
  "list.bullet": "format-list-bulleted",
  "switch.2": "swap-horiz",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
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
