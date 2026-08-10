"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { LeanCanvasForm } from "@/components/bmc/LeanCanvasForm";
import { LoadingState, Button } from "@/components/ui";
import { fetchLeanCanvas } from "@/lib/bmcApi";
import { fetchTeam } from "@/lib/teamApi";
import { getErrorMessage } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { isAssignedTeamTeacher } from "@/utils/teamAccess";
import type { LeanCanvas } from "@/types/bmc";
import type { TeamDetail } from "@/types/team";

export default function LeanCanvasPage() {
  return (
    <AuthGuard>
      <AppShell>
        <LeanCanvasContent />
      </AppShell>
    </AuthGuard>
  );
}

function LeanCanvasContent() {
  const { teamId } = useParams();
  const { user } = useAuthStore();
  const [canvas, setCanvas] = useState<LeanCanvas | null>(null);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tid = Number(teamId);
  const backHref = user?.role === "student" ? "/dashboard" : `/teams/${teamId}`;
  const backLabel = user?.role === "student" ? "Back to Dashboard" : "Back to Team";

  const load = () => {
    if (!tid || Number.isNaN(tid)) {
      setError("Invalid team ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([fetchLeanCanvas(tid), fetchTeam(tid)])
      .then(([c, t]) => {
        setCanvas(c);
        setTeam(t);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [teamId]);

  if (loading) return <LoadingState message="Loading Lean Canvas..." />;

  if (error || !canvas || !team) {
    return (
      <div>
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary">
          ← {backLabel}
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error || "Failed to load Lean Canvas"}</p>
          <Button className="mt-4" onClick={load}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const assignedTeacher =
    Boolean(team.viewer_is_team_teacher) || isAssignedTeamTeacher(user, team);
  const canEdit =
    user?.role === "teacher" ||
    user?.role === "student" ||
    assignedTeacher;
  const canExport = user?.role === "operations";
  const canTranslate = user?.role === "teacher" || user?.role === "operations";
  const canReview = user?.role === "operations";

  return (
    <LeanCanvasForm
      canvas={canvas}
      teamName={team.name}
      projectName={team.project_name}
      canEdit={canEdit}
      canExport={canExport}
      canTranslate={canTranslate}
      canReview={canReview}
      exportMeta={{
        teamName: team.name,
        projectName: team.project_name,
        challengeCategory: team.challenge_category,
        teacherName: team.teacher_name || team.teacher.display_name,
      }}
      onUpdated={setCanvas}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
