export interface DailyLog {
  id: number;
  team: number;
  student: number;
  day: number;
  work_content: string;
  task_completion: string;
  problems_solutions: string;
  reflection: string;
  teacher_comment: string;
  teacher_comment_updated_at: string | null;
  is_complete: boolean;
  has_teacher_comment: boolean;
  updated_at: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export interface LogFieldDef {
  id: keyof Pick<DailyLog, "work_content" | "task_completion" | "problems_solutions" | "reflection">;
  labelEn: string;
  labelZh: string;
  maxChars: number;
  helper?: string;
}

export const LOG_FIELDS: LogFieldDef[] = [
  { id: "work_content", labelEn: "Today's Work", labelZh: "今日工作内容", maxChars: 800,
    helper: "记录今天完成了哪些学习、调研、设计、建模、编程、讨论或路演准备工作。" },
  { id: "task_completion", labelEn: "Task Completion", labelZh: "任务完成情况", maxChars: 600,
    helper: "说明今日任务是否完成，完成到什么程度，还有哪些待补充。" },
  { id: "problems_solutions", labelEn: "Problems & Solutions", labelZh: "遇到问题与解决方法", maxChars: 800,
    helper: "记录遇到的技术、协作、资料或表达问题，以及尝试的解决方式。" },
  { id: "reflection", labelEn: "Reflection", labelZh: "当日收获与反思", maxChars: 800,
    helper: "记录今天最大的收获、能力成长、思考变化，以及明天可以改进的地方。" },
];
