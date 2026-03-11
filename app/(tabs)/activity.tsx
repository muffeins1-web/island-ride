import { useApp } from "@/lib/app-context";
import RideHistory from "@/components/rider/ride-history";
import EarningsDashboard from "@/components/driver/earnings-dashboard";

export default function ActivityScreen() {
  const { state } = useApp();
  return state.role === "driver" ? <EarningsDashboard /> : <RideHistory />;
}
