import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  UserRole,
  Island,
  ActiveRide,
  DriverStatus,
  RideHistoryItem,
  EarningsSummary,
  DailyEarning,
  Location,
  RideRequest,
  PopularDestination,
} from "./types";

// ============================================================
// State
// ============================================================
interface AppState {
  role: UserRole;
  island: Island;
  userName: string;
  userRating: number;
  totalRides: number;
  driverStatus: DriverStatus;
  activeRide: ActiveRide | null;
  rideHistory: RideHistoryItem[];
  earnings: EarningsSummary;
  hasOnboarded: boolean;
  incomingRequest: RideRequest | null;
  savedPlaces: PopularDestination[];
}

const initialEarnings: EarningsSummary = {
  period: "today",
  totalEarnings: 0,
  totalTrips: 0,
  totalHours: 0,
  averageFare: 0,
  tips: 0,
  dailyBreakdown: [],
};

const defaultState: AppState = {
  role: "rider",
  island: "nassau",
  userName: "Guest",
  userRating: 5.0,
  totalRides: 0,
  driverStatus: "offline",
  activeRide: null,
  rideHistory: [],
  earnings: initialEarnings,
  hasOnboarded: false,
  incomingRequest: null,
  savedPlaces: [],
};

// ============================================================
// Actions
// ============================================================
type Action =
  | { type: "SET_ROLE"; role: UserRole }
  | { type: "SET_ISLAND"; island: Island }
  | { type: "SET_USER_NAME"; name: string }
  | { type: "SET_DRIVER_STATUS"; status: DriverStatus }
  | { type: "SET_ACTIVE_RIDE"; ride: ActiveRide | null }
  | { type: "ADD_RIDE_HISTORY"; item: RideHistoryItem }
  | { type: "SET_EARNINGS"; earnings: EarningsSummary }
  | { type: "SET_ONBOARDED"; value: boolean }
  | { type: "SET_INCOMING_REQUEST"; request: RideRequest | null }
  | { type: "SET_SAVED_PLACES"; places: PopularDestination[] }
  | { type: "LOAD_STATE"; state: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_ISLAND":
      return { ...state, island: action.island };
    case "SET_USER_NAME":
      return { ...state, userName: action.name };
    case "SET_DRIVER_STATUS":
      return { ...state, driverStatus: action.status };
    case "SET_ACTIVE_RIDE":
      return { ...state, activeRide: action.ride };
    case "ADD_RIDE_HISTORY":
      return {
        ...state,
        rideHistory: [action.item, ...state.rideHistory],
        totalRides: state.totalRides + 1,
      };
    case "SET_EARNINGS":
      return { ...state, earnings: action.earnings };
    case "SET_ONBOARDED":
      return { ...state, hasOnboarded: action.value };
    case "SET_INCOMING_REQUEST":
      return { ...state, incomingRequest: action.request };
    case "SET_SAVED_PLACES":
      return { ...state, savedPlaces: action.places };
    case "LOAD_STATE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  switchRole: () => void;
  goOnline: () => void;
  goOffline: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "@islandride_state";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          dispatch({ type: "LOAD_STATE", state: saved });
        }
      } catch {}
    })();
  }, []);

  // Persist key fields
  useEffect(() => {
    const toSave = {
      role: state.role,
      island: state.island,
      userName: state.userName,
      hasOnboarded: state.hasOnboarded,
      rideHistory: state.rideHistory.slice(0, 50),
      savedPlaces: state.savedPlaces,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state.role, state.island, state.userName, state.hasOnboarded, state.rideHistory, state.savedPlaces]);

  const switchRole = useCallback(() => {
    const newRole = state.role === "rider" ? "driver" : "rider";
    dispatch({ type: "SET_ROLE", role: newRole });
    if (newRole === "rider") {
      dispatch({ type: "SET_DRIVER_STATUS", status: "offline" });
    }
  }, [state.role]);

  const goOnline = useCallback(() => {
    dispatch({ type: "SET_DRIVER_STATUS", status: "online" });
  }, []);

  const goOffline = useCallback(() => {
    dispatch({ type: "SET_DRIVER_STATUS", status: "offline" });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, switchRole, goOnline, goOffline }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
