export type RiskStatus = "normal" | "attention" | "critical";
export type DeliverableStatus =
  | "not_started" | "in_progress" | "submitted"
  | "needs_revision" | "approved" | "overdue";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Team {
  id: number;
  team_name: string;
  project_name_cn: string;
  project_name_en?: string;
  track: string;
  season: string;
  current_stage?: number;
  current_stage_name?: string;
  risk_status: RiskStatus;
  project_manager?: number;
  project_manager_name?: string;
  academic_admin?: number;
  academic_admin_name?: string;
  lead_mentor?: number;
  lead_mentor_name?: string;
  member_count?: number;
  deliverable_completion_rate: number;
  mentor_score: number;
  offline_lead?: number;
  offline_lead_name?: string;
  website_status?: string;
  rnd_approved?: boolean;
  crm_number?: string;
  offline_start?: string;
  offline_end?: string;
  offline_city?: string;
  classroom?: string;
  project_proposal?: string;
  budget_doc?: string;
  okr_link?: string;
  team_chat_group?: string;
  task_tracking_doc?: string;
  project_log_doc?: string;
  stage1_progress?: number;
  stage2_progress?: number;
  stage3_progress?: number;
  ceo_status?: string;
  cpo_status?: string;
  cto_status?: string;
  cmo_status?: string;
  cfo_status?: string;
  next_deadline?: string;
  updated_at: string;
  members?: Student[];
  description?: string;
}

export interface Student {
  id: number;
  name: string;
  english_name?: string;
  grade?: string;
  school?: string;
  role_in_team?: string;
}

export interface Deliverable {
  id: number;
  team: number;
  team_name?: string;
  stage?: number;
  stage_name?: string;
  title: string;
  type: string;
  status: DeliverableStatus;
  owner?: number;
  owner_name?: string;
  due_date?: string;
  submitted_at?: string;
  file_url?: string;
  external_link?: string;
  score?: number;
  review_comment?: string;
  updated_at: string;
}

export interface LessonRecord {
  id: number;
  team: number;
  team_name?: string;
  mentor?: number;
  mentor_name?: string;
  academic_admin_name?: string;
  lesson_time: string;
  topic: string;
  stage_name?: string;
  lesson_goal?: string;
  completed_content?: string;
  student_performance?: string;
  homework?: string;
  next_lesson_plan?: string;
  risk_notes?: string;
  admin_score?: number;
  mentor_feedback_status: string;
}

export interface RiskLog {
  id: number;
  team: number;
  team_name?: string;
  risk_level: RiskStatus;
  risk_type?: string;
  description: string;
  owner?: number;
  owner_name?: string;
  status: string;
  action_plan?: string;
  next_action?: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  team_name?: string;
  user_name?: string;
  created_at: string;
}

export interface DashboardData {
  season: string;
  total_teams: number;
  normal_teams: number;
  attention_teams: number;
  critical_teams: number;
  week_deliverables: number;
  week_lessons: number;
  avg_mentor_score: number;
  avg_lesson_score: number;
  health_score: number;
  deliverable_completion_rate: number;
  overdue_deliverables: number;
  risk_distribution: { normal: number; attention: number; critical: number };
}

export interface TeacherEvaluation {
  id: number;
  mentor: number;
  mentor_name?: string;
  team: number;
  team_name?: string;
  score_a: number;
  score_b: number;
  score_c: number;
  score_d: number;
  score_e: number;
  total_score: number;
  level: string;
  comments?: string;
}

export interface TeamScore {
  id: number;
  team: number;
  team_name?: string;
  project_clarity: number;
  technical_feasibility: number;
  business_model: number;
  market_research: number;
  prototype_quality: number;
  pitch_deck_quality: number;
  video_quality: number;
  website_quality: number;
  qa_preparation: number;
  teamwork: number;
  execution: number;
  final_competitiveness: number;
  total_score: number;
  strengths?: string;
  weaknesses?: string;
  suggestions?: string;
  comments?: string;
}

export interface TemplateResource {
  id: number;
  title: string;
  stage?: number;
  stage_name?: string;
  category: string;
  description?: string;
  file_url?: string;
  external_link?: string;
  uploaded_by_name?: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: number;
  team: number;
  team_name?: string;
  mentor_name?: string;
  start_time: string;
  end_time: string;
  topic: string;
  stage_name?: string;
  feedback_submitted: boolean;
}

export interface TeacherRanking {
  id: number;
  name: string;
  team_count: number;
  avg_score: number;
  level: string;
  evaluation_count: number;
}
