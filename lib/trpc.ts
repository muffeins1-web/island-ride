import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { Platform } from "react-native";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  const baseUrl = getApiBaseUrl();
  const nativeApiUnavailable = Platform.OS !== "web" && !baseUrl;

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: nativeApiUnavailable ? "http://api-base-url.invalid/api/trpc" : `${baseUrl}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        async headers() {
          const token = await Auth.getSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Custom fetch to include credentials for cookie-based auth
        fetch(url, options) {
          if (nativeApiUnavailable) {
            return Promise.reject(
              new Error(
                "Native tRPC API base URL is unavailable. Start Expo in LAN mode on the same Wi-Fi network or set EXPO_PUBLIC_API_BASE_URL.",
              ),
            );
          }

          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
