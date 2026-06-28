import { apiClient } from "./apiClient";
import type { TeamDetail, TeamSummary } from "@/types/team";

export async function fetchTeams(): Promise<TeamSummary[]> {
  const { data } = await apiClient.get("/teams/");
  return data.results ?? data;
}

export async function fetchTeam(teamId: number): Promise<TeamDetail> {
  const { data } = await apiClient.get(`/teams/${teamId}/`);
  return data;
}
