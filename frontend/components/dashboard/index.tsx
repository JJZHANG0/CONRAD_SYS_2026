"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CircleGauge,
  Search,
  Users,
  X,
} from "lucide-react";
import { Card, Button, StatusBadge, ProgressBar, EmptyState } from "@/components/ui";
import { OperationsManagementPanel } from "@/components/operations/OperationsManagementPanel";
import { BulkDocumentExport } from "@/components/operations/BulkDocumentExport";
import { TeamProductLink } from "@/components/team/TeamProductLinks";
import { getChallengeTheme, getChallengeThemeStyle } from "@/utils/challengeTheme";
import type { DailyLog } from "@/types/log";
import type { StudentDashboard, TeacherDashboard, OperationsDashboard, TeamStats, TeamSummary } from "@/types/team";

interface OperationsDashboardProps {
  data: OperationsDashboard;
  onRefresh?: () => void;
}

export function DayLogCard({ log, teamId }: { log: DailyLog; teamId?: number }) {
  const status = log.is_complete ? "complete" : "incomplete";
  const commentStatus = log.has_teacher_comment ? "commented" : "pending";
  return (
    <Card borderTop="blue" hover>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-text-primary">Day {log.day}</h3>
          <p className="mt-1 text-xs text-text-secondary">Updated {new Date(log.updated_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col gap-1">
          <StatusBadge status={status} />
          <StatusBadge status={commentStatus} />
        </div>
      </div>
      <Link href={`/my-logs?day=${log.day}${teamId ? `&team=${teamId}` : ""}`} className="mt-4 block">
        <span className="block w-full rounded-xl border border-border bg-white py-2 text-center text-xs font-medium text-text-primary hover:bg-gray-50">
          Edit / View
        </span>
      </Link>
    </Card>
  );
}

export function StudentDashboardView({ data }: { data: StudentDashboard }) {
  if (!data.teams.length) return <p className="text-text-secondary">You are not assigned to a team yet.</p>;
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">My Dashboard</h1>
        <p className="mt-1 text-text-secondary">Team Progress, Daily Reflection, Innovation Brief & Lean Canvas</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {data.teams.map((team) => {
          const theme = getChallengeTheme(team.challenge_category);
          return (
          <Card key={team.id} className="team-category-card mb-0" style={getChallengeThemeStyle(team.challenge_category)}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.deep }}>My Team</p>
                <h2 className="text-xl font-semibold">{team.name}</h2>
                <p className="text-sm text-text-secondary">{team.project_name} · {team.challenge_category}</p>
                <p className="mt-1 text-sm">Teacher: <span className="font-medium text-primary">{team.teacher_name}</span></p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <TeamProductLink kind="website" url={team.product_website_url} compact />
                  <TeamProductLink kind="video" url={team.product_video_url} compact />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/my-logs?team=${team.id}`}><Button style={{ backgroundColor: theme.accent, borderColor: theme.accent }}>Write Today&apos;s Log</Button></Link>
                <Link href={`/teams/${team.id}/innovation-brief`}><Button variant="secondary">Innovation Brief</Button></Link>
                <Link href={`/teams/${team.id}/lean-canvas`}><Button variant="secondary">Lean Canvas</Button></Link>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <ProgressBar value={team.my_log_completion} max={team.total_log_count} label="Log Completion" color={theme.accent} />
              <p className="text-sm text-text-secondary">Teacher comments: <strong>{team.teacher_comment_count}</strong></p>
              <p className="text-sm text-text-secondary">Suggested day: <strong style={{ color: theme.deep }}>Day {team.next_incomplete_day}</strong></p>
            </div>
            <Link href={`/my-logs?team=${team.id}`} className="mt-4 inline-block text-sm hover:underline" style={{ color: theme.deep }}>View all logs →</Link>
          </Card>
          );
        })}
      </div>
    </div>
  );
}

export function TeamCard({ team }: { team: TeamSummary & TeamStats }) {
  const theme = getChallengeTheme(team.challenge_category);
  return (
    <div className="group block h-full">
      <Card hover className="team-category-card relative flex h-full flex-col !p-5" style={getChallengeThemeStyle(team.challenge_category)}>
        <Link href={`/teams/${team.id}`} className="absolute inset-0 z-0 rounded-xl" aria-label={`查看${team.name}详情`} />
        <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="team-category-badge inline-flex max-w-full rounded-md border px-2 py-1 text-[10px] font-semibold">
              <span className="truncate">{team.challenge_category || "Uncategorized"}</span>
            </span>
            <h3 className="mt-3 truncate text-lg font-semibold text-text-primary">{team.name}</h3>
            <p className="mt-0.5 truncate text-sm text-text-secondary">{team.project_name}</p>
          </div>
          <span className="team-category-action flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white/70 transition-colors">
            <ArrowUpRight size={16} />
          </span>
        </div>
        {team.teacher_name && (
          <p className="mt-3 truncate text-xs text-text-secondary">导师 · {team.teacher_name}</p>
        )}
        <div className="pointer-events-auto mt-4 grid grid-cols-2 gap-2">
          <TeamProductLink kind="website" url={team.product_website_url} compact />
          <TeamProductLink kind="video" url={team.product_video_url} compact />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-border/70 py-3">
          <div><strong className="team-category-value block text-sm tabular-nums">{team.member_count}/5</strong><span className="text-[10px] text-text-secondary">成员</span></div>
          <div><strong className="team-category-value block text-sm tabular-nums">{team.bmc_completion_count ?? 0}/{team.bmc_total || 12}</strong><span className="text-[10px] text-text-secondary">BMC</span></div>
          <div><strong className="team-category-value block text-sm tabular-nums">{team.innovation_brief_completion_count ?? 0}/{team.innovation_brief_total || 10}</strong><span className="text-[10px] text-text-secondary">IB</span></div>
        </div>
        <div className="mt-4 space-y-2.5">
          <ProgressBar value={team.member_count} max={5} label="Members" color={theme.accent} />
          <ProgressBar value={team.log_completion_count} max={team.total_log_count || 1} label="Student Logs" color={theme.accent} />
        </div>
        </div>
      </Card>
    </div>
  );
}

export function OperationsDashboardView({ data, onRefresh }: OperationsDashboardProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredTeams = useMemo(() => {
    if (!normalizedQuery) return data.teams;
    return data.teams.filter((team) =>
      [team.name, team.project_name, team.challenge_category, team.teacher_name]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [data.teams, normalizedQuery]);
  const totalMembers = data.teams.reduce((sum, team) => sum + team.member_count, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">OPERATIONS COMMAND CENTER</p>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">队伍运营工作台</h1>
          <p className="mt-1 text-sm text-text-secondary">集中检索、追踪和导出全部项目资料</p>
        </div>
        <div className="flex gap-2">
          <span className="glass-panel flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary"><BriefcaseBusiness size={14} className="text-primary" /> {data.teams.length} 支队伍</span>
          <span className="glass-panel flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary"><Users size={14} className="text-emerald-600" /> {totalMembers} 名成员</span>
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <Card className="h-full !p-5">
          <div className="flex items-start gap-3">
            <span className="icon-tile" aria-hidden="true"><CircleGauge size={18} /></span>
            <div>
              <h2 className="font-semibold text-text-primary">快速定位队伍</h2>
              <p className="mt-1 text-xs text-text-secondary">按队伍、项目、赛道或导师搜索</p>
            </div>
          </div>
          <div className="relative mt-4">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input-field !h-12 !pl-11 !pr-11"
              placeholder="输入队伍名、项目名、赛道或导师…"
              aria-label="搜索队伍"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                title="清除搜索"
                aria-label="清除搜索"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            显示 <strong className="font-semibold text-text-primary">{filteredTeams.length}</strong> / {data.teams.length} 支队伍
          </p>
        </Card>
        <BulkDocumentExport teams={data.teams} />
      </div>

      {onRefresh && <OperationsManagementPanel teams={data.teams} onChanged={onRefresh} />}

      <div className="mb-4 mt-7 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">队伍列表</h2>
          <p className="mt-0.5 text-xs text-text-secondary">点击卡片进入队伍详情</p>
        </div>
        {normalizedQuery && <span className="rounded-md border border-primary/15 bg-primary-light/70 px-2.5 py-1 text-xs font-medium text-primary">搜索结果 {filteredTeams.length}</span>}
      </div>
      {filteredTeams.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTeams.map((team) => <TeamCard key={team.id} team={team} />)}
        </div>
      ) : (
        <Card><EmptyState title="没有找到匹配的队伍" description="尝试输入项目名称、赛道或导师姓名" /></Card>
      )}
    </div>
  );
}

export function TeacherDashboardView({ data }: { data: TeacherDashboard }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Teacher Dashboard</h1>
        <p className="mt-1 text-text-secondary">{data.teams.length} team(s) assigned</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.teams.map((t) => <TeamCard key={t.id} team={t} />)}
      </div>
    </div>
  );
}
