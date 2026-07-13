import type { DailyLog } from "@/types/log";
import { stripHtml } from "@/utils/richText";

export interface LogExportMeta {
  studentName: string;
  teamName: string;
  day: number;
}

function section(title: string, html: string): string {
  const text = stripHtml(html).trim();
  return `【${title}】\n\n${text || "（暂无内容）"}`;
}

export function formatDailyLogExport(log: DailyLog, meta: LogExportMeta): string {
  const blocks = [
    "今日总结Log记录",
    "",
    `Day ${meta.day} · ${meta.studentName} · ${meta.teamName}`,
    "",
    section("Student Log · 学生日志", log.work_content),
    "",
    section(
      "Pending Tasks / Tomorrow's Plan 待完成任务 / 明日计划",
      log.task_completion
    ),
    "",
    section("Problems & Solutions 遇到问题与解决方法", log.problems_solutions),
    "",
    section("Reflection 当日收获与反思", log.reflection),
    "",
    section("Teacher Comment · 老师评语", log.teacher_comment),
  ];
  return blocks.join("\n").trim();
}
