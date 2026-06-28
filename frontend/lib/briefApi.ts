import { apiClient } from "./apiClient";
import type { InnovationBrief } from "@/types/brief";

export async function fetchBrief(teamId: number): Promise<InnovationBrief> {
  const { data } = await apiClient.get(`/teams/${teamId}/innovation-brief/`);
  return data;
}

export async function updateBrief(teamId: number, payload: Partial<InnovationBrief>): Promise<InnovationBrief> {
  const { data } = await apiClient.patch(`/teams/${teamId}/innovation-brief/`, payload);
  return data;
}
