"use client";

import Link from "next/link";
import { FileText, Grid3X3, UserRound } from "lucide-react";
import { Card, Button, ProgressBar, StatCard } from "@/components/ui";
import { TeamLogsExportButton } from "@/components/team/TeamLogsExportButton";
import { getChallengeThemeStyle } from "@/utils/challengeTheme";
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
    <Card className="team-category-card mb-6 glass-strong" style={getChallengeThemeStyle(team.challenge_category)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="team-category-badge rounded-md border px-2 py-1 text-[11px] font-semibold">{team.challenge_category}</span>
          <h1 className="mt-3 text-2xl font-semibold">{team.name}</h1>
          <p className="text-text-secondary">{team.project_name}</p>
          <p className="mt-1 text-sm">
            Teacher: {team.teacher_name || team.teacher.display_name}
          </p>
        </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/teams/${team.id}/innovation-brief`}>
              <Button variant="secondary" className="gap-2"><FileText size={15} /> Innovation Brief</Button>
            </Link>
            <Link href={`/teams/${team.id}/lean-canvas`}>
              <Button variant="secondary" className="gap-2"><Grid3X3 size={15} /> Lean Canvas</Button>
            </Link>
            {canExportTeamLogs && <TeamLogsExportButton team={team} />}
          </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Members" value={`${s.member_count}/5`} accent="blue" />
        <StatCard label="Logs Done" value={`${s.log_completion_count}/${s.total_log_count}`} accent="purple" />
        <StatCard label="Comments" value={`${s.teacher_comment_count}/${s.total_log_count}`} accent="yellow" />
        <StatCard label="Brief" value={`${s.innovation_brief_completion_count}/${s.innovation_brief_total}`} accent="blue" />
        <StatCard label="BMC" value={`${s.bmc_completion_count}/${s.bmc_total}`} accent="yellow" />
        {s.teacher_score_total != null && (
          <StatCard
            label="Teacher Score"
            value={`${s.teacher_score_total}/${s.teacher_score_max ?? 50}`}
            accent="purple"
          />
        )}
      </div>
    </Card>
  );
}

export function TeamMemberCard({ teamId, member }: { teamId: number; member: TeamDetail["members"][0] }) {
  const s = member.stats;
  return (
    <Card hover>
      <div className="mb-3 flex items-center gap-3">
        <span className="icon-tile"><UserRound size={16} /></span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{member.student.display_name}</h3>
          <p className="truncate text-xs text-text-secondary">{member.student.grade} · {member.student.school}</p>
        </div>
      </div>
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
