"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input, Select } from "@/components/ui/button";
import { endpoints, unwrapList } from "@/lib/api";
import type { Team } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const trackLabels: Record<string, string> = {
  health: "营养健康",
  energy: "能源环境",
  cyber: "网络安全",
  aerospace: "航空航天",
  water: "水可持续",
  special: "特别赛道",
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (riskFilter) params.set("risk_status", riskFilter);
    if (trackFilter) params.set("track", trackFilter);
    const qs = params.toString() ? `?${params.toString()}` : "";
    endpoints.teams(qs).then((d) => setTeams(unwrapList(d))).catch(console.error);
  }, [search, riskFilter, trackFilter]);

  return (
    <DashboardLayout title="队伍管理" subtitle="Team List — 所有参赛队伍">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A8A6]" />
          <Input
            className="pl-9"
            placeholder="搜索队伍名称、项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="">全部风险状态</option>
          <option value="normal">正常推进</option>
          <option value="attention">需要关注</option>
          <option value="critical">需要介入</option>
        </Select>
        <Select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
          <option value="">全部赛道</option>
          <option value="health">健康与营养</option>
          <option value="energy">能源与环境</option>
          <option value="cyber">网络安全</option>
          <option value="aerospace">航空航天</option>
        </Select>
        <button className="flex items-center gap-2 h-10 px-3 rounded-xl border border-[#E8E8E6] text-sm text-[#787876] hover:bg-[#F5F5F3]">
          <Filter className="h-4 w-4" /> 更多筛选
        </button>
      </div>

      <Card padding="sm" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E8E6]">
                {["队伍名称", "项目名称", "赛道", "当前阶段", "运营老师", "带队教练", "线下带队", "人数", "一阶段", "二阶段", "三阶段", "风险", "更新"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#787876] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-[#F0F0EE] hover:bg-[#FAFAF8] transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <Link href={`/teams/${team.id}`} className="font-medium text-[#1A1A1A] group-hover:text-accent transition-colors">
                      {team.team_name}
                    </Link>
                    <Link href={`/teams/${team.id}#scoring`} className="text-[10px] text-accent hover:underline ml-2">
                      去评分
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-[#787876] max-w-[160px] truncate">{team.project_name_cn}</td>
                  <td className="px-4 py-3.5 text-[#787876] whitespace-nowrap">{trackLabels[team.track] || team.track}</td>
                  <td className="px-4 py-3.5 text-[#787876] whitespace-nowrap text-xs">{team.current_stage_name || "—"}</td>
                  <td className="px-4 py-3.5 text-[#787876] whitespace-nowrap">{team.project_manager_name || "—"}</td>
                  <td className="px-4 py-3.5 text-[#787876] whitespace-nowrap">{team.lead_mentor_name || "—"}</td>
                  <td className="px-4 py-3.5 text-[#787876] whitespace-nowrap">{team.offline_lead_name || "—"}</td>
                  <td className="px-4 py-3.5 text-center tabular-nums">{team.member_count ?? "—"}</td>
                  <td className="px-4 py-3.5 text-xs tabular-nums">{team.stage1_progress ?? 0}%</td>
                  <td className="px-4 py-3.5 text-xs tabular-nums">{team.stage2_progress ?? 0}%</td>
                  <td className="px-4 py-3.5 text-xs tabular-nums">{team.stage3_progress ?? 0}%</td>
                  <td className="px-4 py-3.5"><StatusBadge status={team.risk_status} /></td>
                  <td className="px-4 py-3.5 text-xs text-[#A8A8A6] whitespace-nowrap">{formatDate(team.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {teams.length === 0 && (
          <p className="text-center text-[#787876] py-12">暂无队伍数据</p>
        )}
      </Card>
    </DashboardLayout>
  );
}
