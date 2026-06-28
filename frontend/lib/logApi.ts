import { apiClient } from "./apiClient";
import type { DailyLog } from "@/types/log";

export async function fetchMyLogs(): Promise<DailyLog[]> {
  const { data } = await apiClient.get("/my/logs/");
  return data;
}

export async function fetchStudentLogs(teamId: number, studentId: number): Promise<DailyLog[]> {
  const { data } = await apiClient.get(`/teams/${teamId}/students/${studentId}/logs/`);
  return data;
}

export async function updateLog(logId: number, payload: Partial<DailyLog>): Promise<DailyLog> {
  const { data } = await apiClient.patch(`/logs/${logId}/`, payload);
  return data;
}
