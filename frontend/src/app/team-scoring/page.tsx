"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { endpoints, unwrapList } from "@/lib/api";
import type { TeamScore } from "@/lib/types";

const DIMENSIONS = [
  { key: "project_clarity", label: "项目方向清晰度" },
  { key: "technical_feasibility", label: "技术方案可行性" },
  { key: "business_model", label: "商业模式完整度" },
  { key: "market_research", label: "市场调研质量" },
  { key: "prototype_quality", label: "产品原型完成度" },
  { key: "pitch_deck_quality", label: "PPT表达质量" },
  { key: "video_quality", label: "视频完成度" },
  { key: "website_quality", label: "网站完成度" },
  { key: "qa_preparation", label: "答辩准备度" },
  { key: "teamwork", label: "团队协作度" },
  { key: "execution", label: "学生执行力" },
  { key: "final_competitiveness", label: "最终竞赛竞争力" },
];

export default function TeamScoringPage() {
  const [scores, setScores] = useState<TeamScore[]>([]);

  useEffect(() => {
    endpoints.teamScores().then((d) => setScores(unwrapList(d))).catch(console.error);
  }, []);

  return (
    <DashboardLayout title="队伍评分" subtitle="Team Scoring — 学生团队整体表现">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scores.map((score) => (
          <Card key={score.id} hover>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold">{score.team_name}</h3>
              <span className="text-2xl font-semibold text-accent tabular-nums">{score.total_score}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DIMENSIONS.map((dim) => {
                const val = score[dim.key as keyof TeamScore] as number;
                return (
                  <div key={dim.key} className="flex items-center justify-between text-xs py-1">
                    <span className="text-[#787876]">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 rounded-full bg-[#E8E8E6]">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(val / 10) * 100}%` }} />
                      </div>
                      <span className="font-medium tabular-nums w-4">{val}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {score.strengths && (
              <div className="mt-4 pt-3 border-t border-[#F0F0EE] space-y-2 text-xs">
                <p><span className="text-emerald-600 font-medium">优势：</span>{score.strengths}</p>
                {score.weaknesses && <p><span className="text-amber-600 font-medium">短板：</span>{score.weaknesses}</p>}
                {score.suggestions && <p><span className="text-accent font-medium">建议：</span>{score.suggestions}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
