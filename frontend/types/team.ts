export interface TeamStats {
  member_count: number;
  log_completion_count: number;
  total_log_count: number;
  teacher_comment_count: number;
  innovation_brief_completion_count: number;
  innovation_brief_total: number;
}

export interface TeamSummary {
  id: number;
  name: string;
  project_name: string;
  challenge_category: string;
  teacher_name?: string;
  stats?: TeamStats;
  updated_at?: string;
}

export interface TeamMember {
  id: number;
  student: {
    id: number;
    username: string;
    display_name: string;
    school?: string;
    grade?: string;
  };
  student_role?: string;
  stats: {
    log_completion_count: number;
    total_log_count: number;
    teacher_comment_count: number;
  };
}

export interface TeamDetail extends TeamSummary {
  description?: string;
  teacher: { id: number; display_name: string; email: string };
  members: TeamMember[];
  stats: TeamStats;
}

export interface StudentDashboard {
  role: "student";
  team: {
    id: number;
    name: string;
    project_name: string;
    challenge_category: string;
    teacher_name: string;
  } | null;
  my_log_completion: number;
  teacher_comment_count: number;
  next_incomplete_day: number;
  total_log_count: number;
}

export interface TeacherDashboard {
  role: "teacher";
  teams: (TeamSummary & TeamStats)[];
}

export type DashboardData = StudentDashboard | TeacherDashboard;
