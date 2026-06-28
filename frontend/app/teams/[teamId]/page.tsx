"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard, AppShell } from "@/components/layout/AppShell";
import { TeamHeader, TeamMemberCard } from "@/components/team";
import { LoadingState } from "@/components/ui";
import { fetchTeam } from "@/lib/teamApi";
import type { TeamDetail } from "@/types/team";

export default function TeamDetailPage() {
  return <AuthGuard><AppShell><TeamContent /></AppShell></AuthGuard>;
}

function TeamContent() {
  const { teamId } = useParams();
  const [team, setTeam] = useState<TeamDetail | null>(null);

  useEffect(() => {
    fetchTeam(Number(teamId)).then(setTeam);
  }, [teamId]);

  if (!team) return <LoadingState />;

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
