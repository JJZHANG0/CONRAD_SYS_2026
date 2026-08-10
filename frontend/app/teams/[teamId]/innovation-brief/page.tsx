"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { InnovationBriefForm } from "@/components/brief/InnovationBriefForm";
import { LoadingState, Button } from "@/components/ui";
import { fetchBrief } from "@/lib/briefApi";
import { fetchTeam } from "@/lib/teamApi";
import { getErrorMessage } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { isAssignedTeamTeacher } from "@/utils/teamAccess";
import type { InnovationBrief } from "@/types/brief";
import type { TeamDetail } from "@/types/team";

export default function InnovationBriefPage() {
  return <AuthGuard><AppShell><BriefContent /></AppShell></AuthGuard>;
}

function BriefContent() {
  const { teamId } = useParams();
  const { user } = useAuthStore();
  const [brief, setBrief] = useState<InnovationBrief | null>(null);
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
    Promise.all([fetchBrief(tid), fetchTeam(tid)])
      .then(([b, t]) => {
        setBrief(b);
        setTeam(t);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [teamId]);

  if (loading) return <LoadingState message="Loading Innovation Brief..." />;

  if (error || !brief || !team) {
    return (
      <div>
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary">
          ← {backLabel}
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error || "Failed to load brief"}</p>
          <Button className="mt-4" onClick={load}>Retry</Button>
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
    <InnovationBriefForm
      brief={brief}
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
      onUpdated={setBrief}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
