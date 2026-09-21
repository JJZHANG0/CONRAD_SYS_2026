"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, FileText, BookOpen, Star, TrendingUp,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { endpoints, unwrapList } from "@/lib/api";
import type { DashboardData, RiskLog, ActivityLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

const RISK_COLORS = { normal: "#22C55E", attention: "#EAB308", critical: "#EF4444" };

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [criticalRisks, setCriticalRisks] = useState<RiskLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    endpoints.dashboard().then(setData).catch(console.error);
    endpoints.criticalRisks().then((d) => setCriticalRisks(unwrapList(d))).catch(console.error);
    endpoints.activities().then((d) => setActivities(unwrapList(d))).catch(console.error);
  }, []);

  const pieData = data ? [
    { name: "正常", value: data.risk_distribution.normal, color: RISK_COLORS.normal },
    { name: "关注", value: data.risk_distribution.attention, color: RISK_COLORS.attention },
    { name: "介入", value: data.risk_distribution.critical, color: RISK_COLORS.critical },
  ] : [];

  return (
    <DashboardLayout
      title="总览 Dashboard"
      subtitle={data?.season || "2026-2027 Conrad Challenge"}
    >
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <StatCard label="总队伍" value={data?.total_teams ?? "—"} icon={<Users className="h-4 w-4" />} />
        <StatCard label="正常推进" value={data?.normal_teams ?? "—"} sub="绿色状态" />
        <StatCard label="需要关注" value={data?.attention_teams ?? "—"} sub="黄色状态" />
        <StatCard label="需要介入" value={data?.critical_teams ?? "—"} sub="红色状态" />
        <StatCard label="本周交付物" value={data?.week_deliverables ?? "—"} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="本周课程" value={data?.week_lessons ?? "—"} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="导师均分" value={data?.avg_mentor_score ?? "—"} icon={<Star className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Health overview */}
        <Card className="lg:col-span-2">
          <CardHeader title="项目健康度总览" subtitle="Overall Project Health" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Health Score", value: data?.health_score ?? 0, max: 100, color: "bg-accent" },
              { label: "交付完成率", value: data?.deliverable_completion_rate ?? 0, max: 100, color: "bg-emerald-500" },
              { label: "导师评分", value: data?.avg_mentor_score ?? 0, max: 100, color: "bg-violet-500" },
              { label: "课堂评分", value: data?.avg_lesson_score ?? 0, max: 10, color: "bg-sky-500" },
              { label: "逾期交付物", value: data?.overdue_deliverables ?? 0, max: null, color: "bg-red-500" },
              { label: "风险队伍", value: (data?.attention_teams ?? 0) + (data?.critical_teams ?? 0), max: null, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[#F5F5F3] p-4">
                <p className="text-xs text-[#787876]">{item.label}</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums">
                  {item.value}{item.max ? `/${item.max}` : ""}
                </p>
                {item.max && (
                  <div className="mt-2 h-1.5 rounded-full bg-[#E8E8E6]">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Risk distribution */}
        <Card>
          <CardHeader title="队伍状态分布" subtitle="Risk Distribution" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-[#787876]">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name} {d.value}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical risks */}
        <Card>
          <CardHeader
            title="高风险提醒"
            subtitle="Critical Risk Alerts"
            action={
              <Link href="/risks" className="text-xs text-accent hover:underline flex items-center gap-1">
                查看全部 <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="space-y-3">
            {criticalRisks.length === 0 ? (
              <p className="text-sm text-[#787876] py-4 text-center">暂无红色风险队伍</p>
            ) : (
              criticalRisks.map((risk) => (
                <Link
                  key={risk.id}
                  href={`/teams/${risk.team}`}
                  className="block rounded-xl border border-red-100 bg-red-50/50 p-4 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{risk.team_name}</p>
                      <p className="text-xs text-[#787876] mt-0.5">{risk.description}</p>
                    </div>
                    <StatusBadge status="critical" />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#787876]">
                    <span>负责人: {risk.owner_name || "—"}</span>
                    <span>{formatDateTime(risk.updated_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader title="最近动态" subtitle="Activity Feed" />
          <div className="space-y-3">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="flex gap-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F3]">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-[#1A1A1A]">{act.description}</p>
                  <p className="text-xs text-[#A8A8A6] mt-0.5">{formatDateTime(act.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
