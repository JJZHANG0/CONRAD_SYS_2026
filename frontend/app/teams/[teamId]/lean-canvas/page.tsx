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
import type { LeanCanvas } from "@/types/bmc";

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
  const [teamName, setTeamName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [challengeCategory, setChallengeCategory] = useState("");
  const [teacherName, setTeacherName] = useState("");
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
        setTeamName(t.name);
        setProjectName(t.project_name);
        setChallengeCategory(t.challenge_category);
        setTeacherName(t.teacher?.display_name || "");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [teamId]);

  if (loading) return <LoadingState message="Loading Lean Canvas..." />;

  if (error || !canvas) {
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

  const canEdit = user?.role === "teacher" || user?.role === "student";
  const canExport = user?.role === "operations";
  const canReview = user?.role === "operations";

  return (
    <LeanCanvasForm
      canvas={canvas}
      teamName={teamName}
      projectName={projectName}
      canEdit={canEdit}
      canExport={canExport}
      canReview={canReview}
      exportMeta={{
        teamName,
        projectName,
        challengeCategory,
        teacherName,
      }}
      onUpdated={setCanvas}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
