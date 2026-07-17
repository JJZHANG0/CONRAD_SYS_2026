"use client";

import Link from "next/link";
import { Card, Button, ProgressBar, StatCard } from "@/components/ui";
import { TeamLogsExportButton } from "@/components/team/TeamLogsExportButton";
import type { TeamDetail } from "@/types/team";

export function TeamHeader({
  team,
  canExportTeamLogs = false,
}: {
  team: TeamDetail;
  canExportTeamLogs?: boolean;
}) {
  const s = team.stats;
  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs text-primary">{team.challenge_category}</span>
          <h1 className="mt-2 text-2xl font-bold">{team.name}</h1>
          <p className="text-text-secondary">{team.project_name}</p>
          <p className="mt-1 text-sm">Teacher: {team.teacher.display_name}</p>
        </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/teams/${team.id}/innovation-brief`}>
              <Button variant="secondary">Innovation Brief</Button>
            </Link>
            <Link href={`/teams/${team.id}/lean-canvas`}>
              <Button variant="secondary">Lean Canvas</Button>
            </Link>
            {canExportTeamLogs && <TeamLogsExportButton team={team} />}
          </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Members" value={`${s.member_count}/5`} accent="blue" />
        <StatCard label="Logs Done" value={`${s.log_completion_count}/${s.total_log_count}`} accent="purple" />
        <StatCard label="Comments" value={`${s.teacher_comment_count}/${s.total_log_count}`} accent="yellow" />
        <StatCard label="Brief" value={`${s.innovation_brief_completion_count}/${s.innovation_brief_total}`} accent="blue" />
        <StatCard label="BMC" value={`${s.bmc_completion_count}/${s.bmc_total}`} accent="yellow" />
      </div>
    </Card>
  );
}

export function TeamMemberCard({ teamId, member }: { teamId: number; member: TeamDetail["members"][0] }) {
  const s = member.stats;
  return (
    <Card borderTop="blue" hover>
      <h3 className="font-semibold">{member.student.display_name}</h3>
      <p className="text-xs text-text-secondary">{member.student.grade} · {member.student.school}</p>
      {member.student_role && <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs">{member.student_role}</span>}
      <div className="mt-3 space-y-2">
        <ProgressBar value={s.log_completion_count} max={s.total_log_count} label="Logs" />
        <ProgressBar value={s.teacher_comment_count} max={s.total_log_count} label="Comments" />
      </div>
      <Link href={`/teams/${teamId}/students/${member.student.id}/logs`} className="mt-4 block">
        <Button variant="secondary" size="sm" className="w-full">View Logs</Button>
      </Link>
    </Card>
  );
}
