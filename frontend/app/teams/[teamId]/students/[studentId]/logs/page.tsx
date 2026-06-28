"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { DailyLogEditor } from "@/components/logs/DailyLogEditor";
import { LoadingState, Button } from "@/components/ui";
import { fetchStudentLogs } from "@/lib/logApi";
import { fetchTeam } from "@/lib/teamApi";
import { getErrorMessage } from "@/lib/apiClient";
import type { DailyLog } from "@/types/log";

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
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [studentName, setStudentName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    const tid = Number(teamId);
    const sid = Number(studentId);
    setLoading(true);
    setError("");
    Promise.all([fetchStudentLogs(tid, sid), fetchTeam(tid)])
      .then(([l, team]) => {
        setLogs(l);
        setTeamName(team.name);
        const member = team.members.find((m) => m.student.id === sid);
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

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  return (
    <DailyLogEditor
      logs={logs}
      mode="teacher"
      onUpdated={handleUpdated}
      backHref={`/teams/${teamId}`}
      backLabel="Back to Team"
      pageTitle={`${studentName}'s Daily Logs`}
      pageSubtitle={`${teamName} · Review and add teacher comments · 查看日志并填写评语`}
    />
  );
}
