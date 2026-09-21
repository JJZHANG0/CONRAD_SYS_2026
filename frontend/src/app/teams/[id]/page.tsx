"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout, PageBreadcrumb } from "@/components/layout/sidebar";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { endpoints, unwrapList } from "@/lib/api";
import type { Team, Deliverable, LessonRecord, RiskLog } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { StageScoringPanel } from "@/components/teams/stage-scoring-panel";
import { Star, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

function reloadTeamData(
  id: number,
  setTeam: (t: Team) => void,
  setDeliverables: (d: Deliverable[]) => void,
) {
  endpoints.team(id).then(setTeam).catch(console.error);
  endpoints.deliverables(`?team=${id}`).then((d) => setDeliverables(unwrapList(d))).catch(console.error);
}

const STAGES = [
  "项目立项与基础搭建", "PBL深化与正式作品产出", "决赛冲刺与完整展示系统",
  "最终提交", "模拟答辩", "赛后复盘",
];

export default function TeamDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [team, setTeam] = useState<Team | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [risks, setRisks] = useState<RiskLog[]>([]);

  useEffect(() => {
    if (!id) return;
    endpoints.team(id).then(setTeam).catch(console.error);
    endpoints.deliverables(`?team=${id}`).then((d) => setDeliverables(unwrapList(d))).catch(console.error);
    endpoints.lessons(`?team=${id}`).then((d) => setLessons(unwrapList(d))).catch(console.error);
    endpoints.risks(`?team=${id}`).then((d) => setRisks(unwrapList(d))).catch(console.error);
  }, [id]);

  if (!team) {
    return (
      <DashboardLayout title="队伍详情" subtitle="加载中...">
        <div className="flex items-center justify-center h-64 text-[#787876]">加载中...</div>
      </DashboardLayout>
    );
  }

  const stageOrder = team.current_stage || 1;

  return (
    <DashboardLayout title={team.team_name} subtitle={team.project_name_cn}>
      <PageBreadcrumb items={[
        { label: "队伍管理", href: "/teams" },
        { label: team.team_name },
      ]} />

      {/* Team header */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold">{team.team_name}</h2>
              <StatusBadge status={team.risk_status} />
            </div>
            <p className="text-[#787876]">{team.project_name_cn}</p>
            {team.project_name_en && (
              <p className="text-sm text-[#A8A8A6] mt-0.5">{team.project_name_en}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-[#787876]">项目运营</span><p className="font-medium">{team.project_manager_name || (team.project_manager as { name?: string })?.name || "—"}</p></div>
            <div><span className="text-[#787876]">带队教练</span><p className="font-medium">{team.lead_mentor_name || (team.lead_mentor as { name?: string })?.name || "—"}</p></div>
            <div><span className="text-[#787876]">线下带队</span><p className="font-medium">{team.offline_lead_name || "—"}</p></div>
            <div><span className="text-[#787876]">线下集训</span><p className="font-medium">{team.offline_city || "—"}</p></div>
            <div><span className="text-[#787876]">CRM编号</span><p className="font-medium text-xs">{team.crm_number || "—"}</p></div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="rounded-xl bg-[#F5F5F3] p-3">
            <p className="text-xs text-[#787876]">第一阶段</p>
            <p className="font-semibold tabular-nums">{team.stage1_progress ?? 0}%</p>
          </div>
          <div className="rounded-xl bg-[#F5F5F3] p-3">
            <p className="text-xs text-[#787876]">第二阶段</p>
            <p className="font-semibold tabular-nums">{team.stage2_progress ?? 0}%</p>
          </div>
          <div className="rounded-xl bg-[#F5F5F3] p-3">
            <p className="text-xs text-[#787876]">第三阶段</p>
            <p className="font-semibold tabular-nums">{team.stage3_progress ?? 0}%</p>
          </div>
          <div className="rounded-xl bg-[#F5F5F3] p-3">
            <p className="text-xs text-[#787876]">线下启动</p>
            <p className="font-medium text-xs">{formatDate(team.offline_start)}</p>
          </div>
          <div className="rounded-xl bg-[#F5F5F3] p-3">
            <p className="text-xs text-[#787876]">预定教室</p>
            <p className="font-medium text-xs">{team.classroom || "—"}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 pt-6 border-t border-[#E8E8E6]">
          <p className="text-xs font-medium text-[#787876] uppercase tracking-wide mb-4">阶段进度 Timeline</p>
          <div className="flex gap-1">
            {STAGES.map((stage, i) => {
              const done = i + 1 < stageOrder;
              const current = i + 1 === stageOrder;
              return (
                <div key={stage} className="flex-1">
                  <div className={`h-2 rounded-full ${done ? "bg-emerald-500" : current ? "bg-accent" : "bg-[#E8E8E6]"}`} />
                  <p className={`text-[10px] mt-1.5 leading-tight ${current ? "text-accent font-medium" : "text-[#A8A8A6]"}`}>
                    {stage.split("：")[0] || stage}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 阶段评分面板 — 管理员打分入口 */}
      <div id="scoring">
        <StageScoringPanel
          team={team}
          deliverables={deliverables}
          onUpdated={() => reloadTeamData(id, setTeam, setDeliverables)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Score panel */}
        <Card>
          <CardHeader title="队伍评分" subtitle="Team Scoring" />
          <div className="space-y-3">
            {[
              { label: "A 阶段交付物", score: 60, current: team.deliverable_completion_rate * 0.6 },
              { label: "B 课堂质量", score: 15, current: 12 },
              { label: "C 备课反馈", score: 10, current: 8 },
              { label: "D 团队管理", score: 5, current: 4 },
              { label: "E 最终成果", score: 10, current: 7 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#787876]">{item.label}</span>
                  <span className="font-medium tabular-nums">{item.current.toFixed(0)}/{item.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E8E8E6]">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(item.current / item.score) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-[#E8E8E6] flex justify-between">
              <span className="font-medium">总分</span>
              <span className="text-xl font-semibold text-accent tabular-nums">{team.mentor_score}</span>
            </div>
          </div>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader title="队伍成员" subtitle={`${team.members?.length || 0} 人`} />
          <div className="space-y-2">
            {team.members?.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-xs font-medium">
                  {m.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-[#787876]">{m.grade} · {m.role_in_team || "成员"}</p>
                </div>
              </div>
            )) || <p className="text-sm text-[#787876]">暂无成员</p>}
          </div>
        </Card>

        {/* Risks */}
        <Card>
          <CardHeader title="风险与备注" />
          <div className="space-y-3">
            {risks.length === 0 ? (
              <p className="text-sm text-[#787876]">暂无风险记录</p>
            ) : (
              risks.map((r) => (
                <div key={r.id} className="rounded-xl bg-[#F5F5F3] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={r.risk_level} />
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm">{r.description}</p>
                  {r.action_plan && <p className="text-xs text-[#787876] mt-1">计划: {r.action_plan}</p>}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Deliverables checklist */}
      <Card className="mb-6">
        <CardHeader title="阶段交付物 Checklist" subtitle="Deliverables by Stage" />
        <div className="space-y-6">
          {[1, 2, 3].map((stageNum) => {
            const stageDeliverables = deliverables.filter((d) => d.stage_name?.includes(`第${stageNum === 1 ? "一" : stageNum === 2 ? "二" : "三"}`));
            if (stageDeliverables.length === 0) return null;
            return (
              <div key={stageNum}>
                <p className="text-xs font-medium text-[#787876] uppercase tracking-wide mb-3">
                  第{stageNum === 1 ? "一" : stageNum === 2 ? "二" : "三"}阶段
                </p>
                <div className="space-y-2">
                  {stageDeliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[#FAFAF8] transition-colors">
                      {d.status === "approved" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : d.status === "overdue" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-[#A8A8A6] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-xs text-[#787876]">{d.owner_name || "—"} · {formatDate(d.due_date)}</p>
                      </div>
                      <StatusBadge status={d.status} />
                      {d.score && <span className="text-xs font-medium tabular-nums">{d.score}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent lessons */}
      <Card>
        <CardHeader title="课堂记录" subtitle="Recent Lessons" />
        <div className="space-y-3">
          {lessons.slice(0, 5).map((lesson) => (
            <div key={lesson.id} className="flex items-start gap-4 py-3 border-b border-[#F0F0EE] last:border-0">
              <div className="text-xs text-[#787876] whitespace-nowrap">{formatDateTime(lesson.lesson_time)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{lesson.topic}</p>
                <p className="text-xs text-[#787876] mt-0.5">{lesson.mentor_name} · {lesson.completed_content?.slice(0, 60)}</p>
              </div>
              <div className="flex items-center gap-2">
                {lesson.admin_score && (
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <Star className="h-3 w-3 text-amber-500" />{lesson.admin_score}
                  </span>
                )}
                <StatusBadge status={lesson.mentor_feedback_status} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
