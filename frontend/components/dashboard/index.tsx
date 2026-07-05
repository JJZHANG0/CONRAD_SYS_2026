"use client";

import Link from "next/link";
import { Card, Button, StatusBadge, ProgressBar } from "@/components/ui";
import type { DailyLog } from "@/types/log";
import type { StudentDashboard, TeacherDashboard } from "@/types/team";

export function DayLogCard({ log }: { log: DailyLog }) {
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
      <Link href={`/my-logs?day=${log.day}`} className="mt-4 block">
        <span className="block w-full rounded-xl border border-border bg-white py-2 text-center text-xs font-medium text-text-primary hover:bg-gray-50">
          Edit / View
        </span>
      </Link>
    </Card>
  );
}

export function StudentDashboardView({ data }: { data: StudentDashboard }) {
  if (!data.team) return <p className="text-text-secondary">You are not assigned to a team yet.</p>;
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">My Dashboard</h1>
        <p className="mt-1 text-text-secondary">Team Progress, Daily Reflection, Innovation Brief</p>
      </div>
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-secondary">My Team</p>
            <h2 className="text-xl font-semibold">{data.team.name}</h2>
            <p className="text-sm text-text-secondary">{data.team.project_name} · {data.team.challenge_category}</p>
            <p className="mt-1 text-sm">Teacher: <span className="font-medium text-primary">{data.team.teacher_name}</span></p>
          </div>
          <div className="flex gap-3">
            <Link href="/my-logs"><Button>Write Today&apos;s Log</Button></Link>
            <Link href={`/teams/${data.team.id}/innovation-brief`}><Button variant="secondary">Innovation Brief</Button></Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ProgressBar value={data.my_log_completion} max={data.total_log_count} label="Log Completion" />
          <p className="text-sm text-text-secondary">Teacher comments: <strong>{data.teacher_comment_count}</strong></p>
          <p className="text-sm text-text-secondary">Suggested day: <strong className="text-primary">Day {data.next_incomplete_day}</strong></p>
        </div>
      </Card>
      <Link href="/my-logs" className="text-sm text-primary hover:underline">View all logs →</Link>
    </div>
  );
}

export function TeamCard({ team }: { team: TeacherDashboard["teams"][0] }) {
  return (
    <Link href={`/teams/${team.id}`} className="block">
      <Card hover borderTop="purple">
        <div className="mb-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs text-accent-purple">{team.challenge_category}</div>
        <h3 className="text-lg font-semibold text-text-primary">{team.name}</h3>
        <p className="text-sm text-text-secondary">{team.project_name}</p>
        <div className="mt-4 space-y-2">
          <ProgressBar value={team.member_count} max={5} label="Members" />
          <ProgressBar value={team.log_completion_count} max={team.total_log_count || 1} label="Student Logs" />
          <ProgressBar value={team.teacher_comment_count} max={team.total_log_count || 1} label="Teacher Comments" />
          <ProgressBar value={team.innovation_brief_completion_count ?? 0} max={team.innovation_brief_total || 10} label="Innovation Brief" />
        </div>
        <span className="mt-4 block w-full rounded-xl border border-border bg-white py-2 text-center text-sm font-medium text-text-primary">
          Enter Team →
        </span>
      </Card>
    </Link>
  );
}

export function OperationsDashboardView({ data }: { data: import("@/types/team").OperationsDashboard }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Operations Dashboard</h1>
        <p className="mt-1 text-text-secondary">All teams · {data.teams.length} total</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.teams.map((t) => (
          <Link key={t.id} href={`/teams/${t.id}`} className="block">
            <Card hover borderTop="purple">
              <div className="mb-1 inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs text-accent-purple">{t.challenge_category}</div>
              <h3 className="text-lg font-semibold text-text-primary">{t.name}</h3>
              <p className="text-sm text-text-secondary">{t.project_name}</p>
              {t.teacher_name && (
                <p className="mt-1 text-xs text-text-secondary">Teacher: {t.teacher_name}</p>
              )}
              <div className="mt-4 space-y-2">
                <ProgressBar value={t.member_count} max={5} label="Members" />
                <ProgressBar value={t.log_completion_count} max={t.total_log_count || 1} label="Student Logs" />
                <ProgressBar value={t.teacher_comment_count} max={t.total_log_count || 1} label="Teacher Comments" />
                <ProgressBar value={t.innovation_brief_completion_count ?? 0} max={t.innovation_brief_total || 10} label="Innovation Brief" />
              </div>
              <span className="mt-4 block w-full rounded-xl border border-border bg-white py-2 text-center text-sm font-medium text-text-primary">
                Enter Team →
              </span>
            </Card>
          </Link>
        ))}
      </div>
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.teams.map((t) => <TeamCard key={t.id} team={t} />)}
      </div>
    </div>
  );
}
