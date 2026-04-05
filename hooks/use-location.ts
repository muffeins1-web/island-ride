/**
 * useLocation — real GPS hook for IslandRide
 *
 * Usage:
 *   const { location, permissionStatus, error, refresh } = useLocation();
 *
 * - Requests permission on mount.
 * - Falls back to island-center coordinates when GPS unavailable.
 * - Provides a real-time `watch` mode for driver tracking.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCurrentPosition,
  getLocationPermissionStatus,
  requestLocationPermission,
  reverseGeocode,
  toAppLocation,
  watchPosition,
  type LocationPermissionStatus,
  type LocationUpdate,
} from "@/lib/_core/location";
import { ISLAND_COORDS } from "@/lib/islands";
import type { Location } from "@/lib/types";
import type { Island } from "@/lib/types";

export interface UseLocationOptions {
  /** If true, start continuous GPS tracking. Default: false. */
  watch?: boolean;
  /** Fallback island center when GPS is not available. Default: "nassau" */
  fallbackIsland?: Island;
  /** If true, reverse-geocode the coordinates to get a human address. */
  reverseGeocode?: boolean;
}

export interface UseLocationResult {
  /** Current GPS location, or null while loading / permission denied. */
  location: Location | null;
  /** Raw lat/lng + accuracy from GPS. */
  rawUpdate: LocationUpdate | null;
  permissionStatus: LocationPermissionStatus;
  loading: boolean;
  error: string | null;
  /** Re-fetch a one-shot position reading. */
  refresh: () => Promise<void>;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationResult {
  const {
    watch = false,
    fallbackIsland = "nassau",
    reverseGeocode: shouldGeocode = false,
  } = options;

  const [location, setLocation] = useState<Location | null>(null);
  const [rawUpdate, setRawUpdate] = useState<LocationUpdate | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Resolve a LocationUpdate to a full Location ──
  const resolveLocation = useCallback(
    async (update: LocationUpdate): Promise<Location> => {
      setRawUpdate(update);
      if (shouldGeocode) {
        try {
          const geo = await reverseGeocode(update.latitude, update.longitude);
          if (geo) {
            return toAppLocation(update, geo.name, geo.address);
          }
        } catch {
          // geocode failed — use coordinates only
        }
      }
      return toAppLocation(update);
    },
    [shouldGeocode]
  );

  // ── Fallback to island center ──
  const useFallback = useCallback(() => {
    const center = ISLAND_COORDS[fallbackIsland];
    setLocation({
      latitude: center.lat,
      longitude: center.lng,
      name: "Current Location",
      address: undefined,
    });
  }, [fallbackIsland]);

  // ── One-shot fetch ──
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await requestLocationPermission();
      setPermissionStatus(status);
      if (status !== "granted") {
        useFallback();
        return;
      }
      const pos = await getCurrentPosition();
      if (pos) {
        const loc = await resolveLocation(pos);
        setLocation(loc);
      } else {
        useFallback();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Location unavailable";
      setError(msg);
      useFallback();
    } finally {
      setLoading(false);
    }
  }, [resolveLocation, useFallback]);

  // ── On mount: check permission then fetch/watch ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const status = await getLocationPermissionStatus();
      if (cancelled) return;
      setPermissionStatus(status);

      if (status === "denied" || status === "unavailable") {
        useFallback();
        setLoading(false);
        return;
      }

      // If permission is already granted, skip the request dialog
      const effectiveStatus =
        status === "granted" ? "granted" : await requestLocationPermission();
      if (cancelled) return;
      setPermissionStatus(effectiveStatus);

      if (effectiveStatus !== "granted") {
        useFallback();
        setLoading(false);
        return;
      }

      if (watch) {
        // Continuous tracking
        const unsub = await watchPosition(async (update) => {
          if (cancelled) return;
          const loc = await resolveLocation(update);
          if (!cancelled) setLocation(loc);
          setLoading(false);
        });
        unsubscribeRef.current = unsub;
      } else {
        await refresh();
      }
    };

    init();
    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return { location, rawUpdate, permissionStatus, loading, error, refresh };
}
