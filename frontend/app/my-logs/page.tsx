"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { DailyLogEditor } from "@/components/logs/DailyLogEditor";
import { LoadingState, Button } from "@/components/ui";
import { fetchMyLogs } from "@/lib/logApi";
import { fetchDashboard } from "@/lib/dashboardApi";
import { getErrorMessage } from "@/lib/apiClient";
import type { DailyLog } from "@/types/log";

export default function MyLogsPage() {
  return (
    <AuthGuard>
      <AppShell wide>
        <Suspense fallback={<LoadingState message="Loading logs..." />}>
          <MyLogsContent />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}

function MyLogsContent() {
  const searchParams = useSearchParams();
  const initialDay = Number(searchParams.get("day")) || 1;
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([fetchMyLogs(), fetchDashboard()])
      .then(([l, dash]) => {
        setLogs(l);
        if (dash.role === "student" && dash.team) {
          setTeamName(`${dash.team.name} · ${dash.team.project_name}`);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpdated = (updated: DailyLog) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  if (loading) return <LoadingState message="Loading your logs..." />;

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
      mode="student"
      onUpdated={handleUpdated}
      initialDay={initialDay}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="My Daily Logs"
      pageSubtitle={teamName || "Record your daily learning progress · 记录每日学习与项目进展"}
    />
  );
}
