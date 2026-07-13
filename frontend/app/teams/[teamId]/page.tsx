"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { TeamHeader, TeamMemberCard } from "@/components/team";
import { LoadingState, Button } from "@/components/ui";
import { fetchTeam } from "@/lib/teamApi";
import { getErrorMessage } from "@/lib/apiClient";
import type { TeamDetail } from "@/types/team";

export default function TeamDetailPage() {
  return <AuthGuard><AppShell><TeamContent /></AppShell></AuthGuard>;
}

function TeamContent() {
  const { teamId } = useParams();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    const tid = Number(teamId);
    if (!tid || Number.isNaN(tid)) {
      setError("Invalid team ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetchTeam(tid)
      .then(setTeam)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [teamId]);

  if (loading) return <LoadingState message="Loading team..." />;

  if (error || !team) {
    return (
      <div>
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary">
          ← Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error || "Failed to load team"}</p>
          <Button className="mt-4" onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TeamHeader team={team} />
      <h2 className="mb-4 text-lg font-semibold">Team Members</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.members.map((m) => (
          <TeamMemberCard key={m.id} teamId={team.id} member={m} />
        ))}
      </div>
    </div>
  );
}
