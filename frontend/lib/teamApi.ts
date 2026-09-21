import { apiClient, patchWithRetry } from "./apiClient";
import type {
  TeamDetail,
  TeamProductLinks,
  TeamSummary,
  TeacherDailyEvaluation,
  TeacherEvaluationCheck,
} from "@/types/team";

export async function fetchTeams(): Promise<TeamSummary[]> {
  const { data } = await apiClient.get("/teams/");
  return data.results ?? data;
}

export async function fetchTeam(teamId: number): Promise<TeamDetail> {
  const { data } = await apiClient.get(`/teams/${teamId}/`);
  return data;
}

export async function fetchTeacherEvaluations(
  teamId: number
): Promise<TeacherDailyEvaluation[]> {
  const { data } = await apiClient.get(
    `/teams/${teamId}/teacher-evaluations/`
  );
  return data;
}

export async function updateTeacherEvaluation(
  teamId: number,
  day: number,
  payload: Partial<
    Record<TeacherEvaluationCheck, boolean> & { comment: string }
  >
): Promise<TeacherDailyEvaluation> {
  return patchWithRetry<TeacherDailyEvaluation>(
    `/teams/${teamId}/teacher-evaluations/${day}/`,
    payload
  );
}

export async function updateTeamProductLinks(
  teamId: number,
  payload: Pick<TeamProductLinks, "product_website_url" | "product_video_url">
): Promise<TeamProductLinks> {
  return patchWithRetry<TeamProductLinks>(
    `/teams/${teamId}/product-links/`,
    payload
  );
}
