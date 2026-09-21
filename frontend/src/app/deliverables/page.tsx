"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/button";
import { endpoints, unwrapList } from "@/lib/api";
import type { Deliverable } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    endpoints.deliverables(qs).then((d) => setDeliverables(unwrapList(d))).catch(console.error);
  }, [statusFilter]);

  const statusCounts = deliverables.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout title="阶段交付物" subtitle="Deliverables Management">
      <p className="text-sm text-[#787876] mb-4">
        要对某支队伍各阶段打分，请进入
        <Link href="/teams" className="text-accent hover:underline mx-1">队伍管理</Link>
        点击队伍名称，在详情页找到「阶段评分」面板。
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="not_started">未开始</option>
          <option value="in_progress">进行中</option>
          <option value="submitted">已提交</option>
          <option value="needs_revision">需修改</option>
          <option value="approved">已通过</option>
          <option value="overdue">已逾期</option>
        </Select>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <span key={status} className="flex items-center gap-1.5 text-xs">
              <StatusBadge status={status} /> <span className="text-[#787876]">{count}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deliverables.map((d) => (
          <Card key={d.id} hover>
            <div className="flex items-start justify-between mb-3">
              <StatusBadge status={d.status} />
              {d.score && <span className="text-sm font-semibold tabular-nums">{d.score}分</span>}
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{d.title}</h3>
            <p className="text-xs text-[#787876] mb-3">{d.team_name} · {d.stage_name}</p>
            <div className="flex items-center justify-between text-xs text-[#A8A8A6] pt-3 border-t border-[#F0F0EE]">
              <span>{d.owner_name || "—"}</span>
              <span>截止 {formatDate(d.due_date)}</span>
            </div>
            {d.review_comment && (
              <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg px-2 py-1">{d.review_comment}</p>
            )}
          </Card>
        ))}
      </div>
      {deliverables.length === 0 && (
        <Card><p className="text-center text-[#787876] py-12">暂无交付物</p></Card>
      )}
    </DashboardLayout>
  );
}
