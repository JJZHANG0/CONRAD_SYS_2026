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
import type { InnovationBrief } from "@/types/brief";

export default function InnovationBriefPage() {
  return <AuthGuard><AppShell><BriefContent /></AppShell></AuthGuard>;
}

function BriefContent() {
  const { teamId } = useParams();
  const { user } = useAuthStore();
  const [brief, setBrief] = useState<InnovationBrief | null>(null);
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
    Promise.all([fetchBrief(tid), fetchTeam(tid)])
      .then(([b, t]) => {
        setBrief(b);
        setTeamName(t.name);
        setProjectName(t.project_name);
        setChallengeCategory(t.challenge_category);
        setTeacherName(t.teacher?.display_name || "");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [teamId]);

  if (loading) return <LoadingState message="Loading Innovation Brief..." />;

  if (error || !brief) {
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

  const canEdit = user?.role === "teacher" || user?.role === "student";
  const canExport = user?.role === "operations";

  return (
    <InnovationBriefForm
      brief={brief}
      teamName={teamName}
      projectName={projectName}
      canEdit={canEdit}
      canExport={canExport}
      exportMeta={{
        teamName,
        projectName,
        challengeCategory,
        teacherName,
      }}
      onUpdated={setBrief}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
