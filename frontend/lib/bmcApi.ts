import { apiClient } from "./apiClient";
import type { LeanCanvas } from "@/types/bmc";

export async function fetchLeanCanvas(teamId: number): Promise<LeanCanvas> {
  const { data } = await apiClient.get(`/teams/${teamId}/lean-canvas/`);
  return data;
}

export async function updateLeanCanvas(teamId: number, payload: Partial<LeanCanvas>): Promise<LeanCanvas> {
  const { data } = await apiClient.patch(`/teams/${teamId}/lean-canvas/`, payload);
  return data;
}
