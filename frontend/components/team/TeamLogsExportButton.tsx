"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { fetchStudentLogs } from "@/lib/logApi";
import type { TeamDetail } from "@/types/team";
import {
  exportTeamLogsPdf,
  type StudentLogsBundle,
} from "@/utils/teamLogsExport";

export function TeamLogsExportButton({ team }: { team: TeamDetail }) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleExport = async () => {
    if (!team.members.length) {
      setError("该队伍暂无学生，无法导出日志");
      return;
    }

    setExporting(true);
    setError("");
    setProgress("正在读取全队日志…");
    try {
      const bundles: StudentLogsBundle[] = await Promise.all(
        team.members.map(async (member) => ({
          member,
          logs: await fetchStudentLogs(team.id, member.student.id),
        }))
      );

      setProgress("正在生成 PDF…");
      await exportTeamLogsPdf(team, bundles, (completed, total) => {
        setProgress(`正在生成 PDF… ${completed}/${total}`);
      });
      setProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败，请稍后重试");
      setProgress("");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="primary"
        className="gap-2"
        disabled={exporting}
        onClick={() => void handleExport()}
      >
        <span aria-hidden="true">↓</span>
        {exporting ? "正在汇总…" : "导出全队日志 PDF"}
      </Button>
      {progress && <p className="text-xs text-primary">{progress}</p>}
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
