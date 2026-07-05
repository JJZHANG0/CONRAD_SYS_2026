import { apiClient } from "./apiClient";

export interface OpsTeacher {
  id: number;
  username: string;
  display_name: string;
  email: string;
}

export async function fetchOpsTeachers(): Promise<OpsTeacher[]> {
  const { data } = await apiClient.get("/operations/teachers/");
  return data;
}

export async function createOpsTeam(payload: {
  team_name: string;
  project_name: string;
  challenge_category: string;
  teacher_username: string;
  description?: string;
}) {
  const { data } = await apiClient.post("/operations/teams/", payload);
  return data;
}

export async function createOpsStudent(payload: {
  display_name: string;
  team_id: number;
  username?: string;
  password?: string;
  email?: string;
  school?: string;
  grade?: string;
  student_role?: string;
}) {
  const { data } = await apiClient.post("/operations/students/", payload);
  return data;
}

export async function deleteOpsTeam(teamId: number, confirmName: string) {
  const { data } = await apiClient.post("/operations/teams/delete/", {
    team_id: teamId,
    confirm_name: confirmName,
  });
  return data;
}
