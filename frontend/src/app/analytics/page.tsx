"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    endpoints.analytics().then(setData).catch(console.error);
  }, []);

  const riskDist = data?.risk_distribution as { normal: number; attention: number; critical: number } | undefined;
  const pieData = riskDist ? [
    { name: "正常", value: riskDist.normal, color: "#22C55E" },
    { name: "关注", value: riskDist.attention, color: "#EAB308" },
    { name: "介入", value: riskDist.critical, color: "#EF4444" },
  ] : [];

  const stageDist = (data?.stage_distribution as Array<{ current_stage__name: string; count: number }>) || [];
  const barData = stageDist.map((s) => ({
    name: s.current_stage__name?.split("：")[0] || "未知",
    count: s.count,
  }));

  return (
    <DashboardLayout title="数据分析" subtitle="Analytics — 管理层数据看板">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="总队伍数" value={String(data?.total_teams ?? "—")} />
        <StatCard label="交付完成率" value={`${data?.deliverable_completion_rate ?? "—"}%`} />
        <StatCard label="平均导师评分" value={String(data?.avg_mentor_score ?? "—")} />
        <StatCard label="平均课堂评分" value={String(data?.avg_lesson_score ?? "—")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader title="各阶段队伍分布" subtitle="Teams by Stage" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#787876" }} />
                <YAxis tick={{ fontSize: 11, fill: "#787876" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B5BDB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="风险分布" subtitle="Risk Distribution" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="逾期交付物" value={String(data?.overdue_deliverables ?? "—")} />
        <StatCard label="视频完成" value={String(data?.video_completed ?? "—")} />
        <StatCard label="网站完成" value={String(data?.website_completed ?? "—")} />
        <StatCard label="风险队伍" value={
          riskDist ? String(riskDist.attention + riskDist.critical) : "—"
        } />
      </div>
    </DashboardLayout>
  );
}
