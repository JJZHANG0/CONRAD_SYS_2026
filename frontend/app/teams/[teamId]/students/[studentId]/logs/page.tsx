"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { DailyLogEditor } from "@/components/logs/DailyLogEditor";
import { LoadingState, Button } from "@/components/ui";
import { fetchStudentLogs } from "@/lib/logApi";
import { fetchTeam } from "@/lib/teamApi";
import { getErrorMessage } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { isAssignedTeamTeacher } from "@/utils/teamAccess";
import type { DailyLog } from "@/types/log";
import type { TeamDetail } from "@/types/team";

export default function StudentLogsPage() {
  return (
    <AuthGuard>
      <AppShell wide>
        <StudentLogsContent />
      </AppShell>
    </AuthGuard>
  );
}

function StudentLogsContent() {
  const { teamId, studentId } = useParams();
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    const tid = Number(teamId);
    const sid = Number(studentId);
    setLoading(true);
    setError("");
    Promise.all([fetchStudentLogs(tid, sid), fetchTeam(tid)])
      .then(([l, teamData]) => {
        setLogs(l);
        setTeam(teamData);
        const member = teamData.members.find((m) => m.student.id === sid);
        setStudentName(member?.student.display_name || "");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [teamId, studentId]);

  const handleUpdated = (updated: DailyLog) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  if (loading) return <LoadingState message="Loading student logs..." />;

  if (error || !team) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error || "Failed to load team"}</p>
        <Button className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  const assignedTeacher =
    Boolean(team.viewer_is_team_teacher) || isAssignedTeamTeacher(user, team);
  // Assigned co-teachers (including operations) get teacher editing; other ops stay read-only.
  const logMode =
    user?.role === "operations" && !assignedTeacher ? "operations" : "teacher";

  return (
    <DailyLogEditor
      logs={logs}
      mode={logMode}
      onUpdated={handleUpdated}
      backHref={`/teams/${teamId}`}
      backLabel="Back to Team"
      pageTitle={`${studentName}'s Daily Logs`}
      pageSubtitle={
        logMode === "operations"
          ? `${team.name} · 只读浏览 · 可导出当日 Log 文本`
          : `${team.name} · Review and add teacher comments · 查看日志并填写评语`
      }
      exportMeta={
        user?.role === "operations"
          ? { studentName, teamName: team.name }
          : undefined
      }
    />
  );
}
