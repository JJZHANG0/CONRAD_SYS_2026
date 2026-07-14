import { apiClient } from "./apiClient";
import type { LeanCanvas } from "@/types/bmc";
import type { FieldReviewStatus } from "@/types/review";

export async function fetchLeanCanvas(teamId: number): Promise<LeanCanvas> {
  const { data } = await apiClient.get(`/teams/${teamId}/lean-canvas/`);
  return data;
}

export async function updateLeanCanvas(teamId: number, payload: Partial<LeanCanvas>): Promise<LeanCanvas> {
  const { data } = await apiClient.patch(`/teams/${teamId}/lean-canvas/`, payload);
  return data;
}

export async function updateLeanCanvasReview(
  teamId: number,
  field: string,
  status: FieldReviewStatus
): Promise<LeanCanvas> {
  const { data } = await apiClient.patch(`/teams/${teamId}/lean-canvas/reviews/`, {
    field,
    status: status ?? "clear",
  });
  return data;
}
