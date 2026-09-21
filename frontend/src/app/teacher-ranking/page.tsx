"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { endpoints } from "@/lib/api";
import type { TeacherRanking } from "@/lib/types";
import { Trophy, Users, Star } from "lucide-react";

const levelDesc: Record<string, string> = {
  S: "S级核心导师", A: "A级稳定导师", B: "B级观察导师",
  C: "C级风险导师", D: "D级不建议续用", "N/A": "待评估",
};

export default function TeacherRankingPage() {
  const [ranking, setRanking] = useState<TeacherRanking[]>([]);

  useEffect(() => {
    endpoints.teacherRanking().then(setRanking).catch(console.error);
  }, []);

  return (
    <DashboardLayout title="导师排行榜" subtitle="Teacher Ranking — 专业评估系统">
      <Card padding="sm" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E8E6]">
              {["排名", "导师", "负责队伍", "平均评分", "等级", "评估次数"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#787876] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.map((mentor, i) => (
              <tr key={mentor.id} className="border-b border-[#F0F0EE] hover:bg-[#FAFAF8] transition-colors">
                <td className="px-4 py-4">
                  {i < 3 ? (
                    <Trophy className={`h-4 w-4 ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : "text-amber-700"}`} />
                  ) : (
                    <span className="text-[#787876] tabular-nums">{i + 1}</span>
                  )}
                </td>
                <td className="px-4 py-4 font-medium">{mentor.name}</td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1 text-[#787876]">
                    <Users className="h-3.5 w-3.5" /> {mentor.team_count}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1 font-semibold tabular-nums">
                    <Star className="h-3.5 w-3.5 text-amber-500" /> {mentor.avg_score}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={mentor.level} />
                  <p className="text-[10px] text-[#A8A8A6] mt-0.5">{levelDesc[mentor.level] || ""}</p>
                </td>
                <td className="px-4 py-4 text-[#787876] tabular-nums">{mentor.evaluation_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardLayout>
  );
}
