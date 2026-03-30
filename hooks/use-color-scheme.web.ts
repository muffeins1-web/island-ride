import { useThemeContext } from "@/lib/theme-provider";

/**
 * Web-specific color scheme hook.
 * Delegates to ThemeProvider so the scheme stays consistent across the app.
 */
export function useColorScheme() {
  return useThemeContext().colorScheme;
}
