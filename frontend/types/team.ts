export interface TeamStats {
  member_count: number;
  log_completion_count: number;
  total_log_count: number;
  teacher_comment_count: number;
  innovation_brief_completion_count: number;
  innovation_brief_total: number;
  bmc_completion_count: number;
  bmc_total: number;
  teacher_score_total?: number;
  teacher_score_max?: number;
  teacher_score_days?: number;
}

export type TeacherEvaluationCheck =
  | "business_duration"
  | "business_correction"
  | "business_progress"
  | "business_questions"
  | "business_log_feedback"
  | "engineering_duration"
  | "engineering_development"
  | "engineering_review"
  | "engineering_progress"
  | "engineering_log_feedback";

export interface TeacherDailyEvaluation
  extends Record<TeacherEvaluationCheck, boolean> {
  id?: number;
  day: number;
  business_score: number;
  engineering_score: number;
  total_score: number;
  comment: string;
  reviewed_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamSummary {
  id: number;
  name: string;
  project_name: string;
  challenge_category: string;
  teacher_name?: string;
  co_teacher_names?: string[];
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
  co_teachers?: { id: number; display_name: string; email: string }[];
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

export interface OperationsDashboard {
  role: "operations";
  teams: (TeamSummary & TeamStats & { teacher_name?: string })[];
}

export type DashboardData = StudentDashboard | TeacherDashboard | OperationsDashboard;
