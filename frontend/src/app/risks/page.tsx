"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { endpoints, unwrapList } from "@/lib/api";
import type { RiskLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const COLUMNS = [
  { key: "normal", label: "正常推进", color: "border-emerald-200", bg: "bg-emerald-50/50" },
  { key: "attention", label: "需要关注", color: "border-amber-200", bg: "bg-amber-50/50" },
  { key: "critical", label: "需要介入", color: "border-red-200", bg: "bg-red-50/50" },
];

export default function RisksPage() {
  const [risks, setRisks] = useState<RiskLog[]>([]);

  useEffect(() => {
    endpoints.risks().then((d) => setRisks(unwrapList(d))).catch(console.error);
  }, []);

  return (
    <DashboardLayout title="风险看板" subtitle="Risk Board — Kanban 风险管理">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colRisks = risks.filter((r) => r.risk_level === col.key && r.status !== "resolved");
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-[#787876] bg-[#F5F5F3] rounded-full px-2 py-0.5">{colRisks.length}</span>
              </div>
              <div className="space-y-3">
                {colRisks.map((risk) => (
                  <Card key={risk.id} className={`border ${col.color} ${col.bg}`} padding="sm">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/teams/${risk.team}`} className="text-sm font-semibold hover:text-accent">
                        {risk.team_name}
                      </Link>
                      <StatusBadge status={risk.status} />
                    </div>
                    <p className="text-xs text-[#787876] mb-2">{risk.description}</p>
                    <div className="text-xs text-[#A8A8A6] space-y-1">
                      <p>责任人: {risk.owner_name || "—"}</p>
                      <p>更新: {formatDateTime(risk.updated_at)}</p>
                      {risk.next_action && <p className="text-accent">下一步: {risk.next_action}</p>}
                    </div>
                  </Card>
                ))}
                {colRisks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#E8E8E6] p-6 text-center text-xs text-[#A8A8A6]">
                    暂无风险
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
