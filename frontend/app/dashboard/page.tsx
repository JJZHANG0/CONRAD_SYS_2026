"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { StudentDashboardView, TeacherDashboardView, OperationsDashboardView, DayLogCard } from "@/components/dashboard";
import { LoadingState, Button } from "@/components/ui";
import { fetchDashboard } from "@/lib/dashboardApi";
import { fetchMyLogs } from "@/lib/logApi";
import { getErrorMessage } from "@/lib/apiClient";
import type { DashboardData, StudentDashboard } from "@/types/team";
import type { DailyLog } from "@/types/log";

export default function DashboardPage() {
  return <AuthGuard><AppShell><DashboardContent /></AppShell></AuthGuard>;
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    fetchDashboard()
      .then((d) => {
        setData(d);
        if (d.role === "student") return fetchMyLogs().then(setLogs);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button className="mt-4" onClick={load}>Retry</Button>
      </div>
    );
  }

  if (!data) return <LoadingState message="No data available" />;

  if (data.role === "teacher") {
    return <TeacherDashboardView data={data} />;
  }

  if (data.role === "operations") {
    return <OperationsDashboardView data={data} />;
  }

  return (
    <div>
      <StudentDashboardView data={data as StudentDashboard} />
      {logs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">My Daily Logs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {logs.map((log) => <DayLogCard key={log.id} log={log} />)}
          </div>
        </div>
      )}
    </div>
  );
}
