import { useApp } from "@/lib/app-context";
import RiderHome from "@/components/rider/rider-home";
import DriverHome from "@/components/driver/driver-home";

export default function HomeScreen() {
  const { state } = useApp();
  return state.role === "driver" ? <DriverHome /> : <RiderHome />;
}
