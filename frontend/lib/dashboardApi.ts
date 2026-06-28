import { apiClient } from "./apiClient";
import type { DashboardData } from "@/types/team";

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get("/dashboard/");
  return data;
}
