const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const data = await api<{ access: string; refresh: string; user: unknown }>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

// API endpoints
export const endpoints = {
  dashboard: () => api<import("./types").DashboardData>("/analytics/dashboard/"),
  teams: (params?: string) => api<{ results?: import("./types").Team[] } | import("./types").Team[]>(`/teams/${params || ""}`),
  team: (id: number) => api<import("./types").Team>(`/teams/${id}/`),
  updateTeam: (id: number, data: Record<string, unknown>) =>
    api<import("./types").Team>(`/teams/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  deliverables: (params?: string) => api<{ results?: import("./types").Deliverable[] } | import("./types").Deliverable[]>(`/deliverables/${params || ""}`),
  reviewDeliverable: (id: number, data: Record<string, unknown>) =>
    api<import("./types").Deliverable>(`/deliverables/${id}/review/`, { method: "PATCH", body: JSON.stringify(data) }),
  lessons: (params?: string) => api<{ results?: import("./types").LessonRecord[] } | import("./types").LessonRecord[]>(`/lessons/${params || ""}`),
  risks: (params?: string) => api<{ results?: import("./types").RiskLog[] } | import("./types").RiskLog[]>(`/risks/${params || ""}`),
  criticalRisks: () => api<{ results?: import("./types").RiskLog[] } | import("./types").RiskLog[]>("/risks/critical/"),
  activities: () => api<{ results?: import("./types").ActivityLog[] } | import("./types").ActivityLog[]>("/risks/activities/"),
  teacherEvals: (params?: string) => api<{ results?: import("./types").TeacherEvaluation[] } | import("./types").TeacherEvaluation[]>(`/evaluations/teacher/${params || ""}`),
  teamScores: (params?: string) => api<{ results?: import("./types").TeamScore[] } | import("./types").TeamScore[]>(`/evaluations/team/${params || ""}`),
  teacherRanking: () => api<import("./types").TeacherRanking[]>("/evaluations/teacher/ranking/"),
  templates: (params?: string) => api<{ results?: import("./types").TemplateResource[] } | import("./types").TemplateResource[]>(`/templates/${params || ""}`),
  calendar: (params?: string) => api<{ results?: import("./types").CalendarEvent[] } | import("./types").CalendarEvent[]>(`/lessons/calendar/${params || ""}`),
  analytics: () => api<Record<string, unknown>>("/analytics/detail/"),
  currentUser: () => api<import("./types").User>("/auth/me/"),
};

export function unwrapList<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data.results || [];
}
