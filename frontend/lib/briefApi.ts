import { apiClient, patchWithRetry } from "./apiClient";
import type { InnovationBrief } from "@/types/brief";
import type { FieldReviewStatus } from "@/types/review";

export async function fetchBrief(teamId: number): Promise<InnovationBrief> {
  const { data } = await apiClient.get(`/teams/${teamId}/innovation-brief/`);
  return data;
}

export async function updateBrief(teamId: number, payload: Partial<InnovationBrief>): Promise<InnovationBrief> {
  return patchWithRetry<InnovationBrief>(`/teams/${teamId}/innovation-brief/`, payload);
}

export async function updateBriefReview(
  teamId: number,
  field: string,
  status: FieldReviewStatus
): Promise<InnovationBrief> {
  return patchWithRetry<InnovationBrief>(`/teams/${teamId}/innovation-brief/reviews/`, {
    field,
    status: status ?? "clear",
  });
}
