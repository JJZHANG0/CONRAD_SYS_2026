"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { endpoints, unwrapList } from "@/lib/api";
import type { TeacherEvaluation } from "@/lib/types";

const SCORE_SECTIONS = [
  { key: "score_a", label: "A 阶段交付物完成度", max: 60, color: "bg-accent" },
  { key: "score_b", label: "B 课堂质量与项目推进", max: 15, color: "bg-emerald-500" },
  { key: "score_c", label: "C 课前备课与课后反馈", max: 10, color: "bg-sky-500" },
  { key: "score_d", label: "D 团队管理与沟通配合", max: 5, color: "bg-violet-500" },
  { key: "score_e", label: "E 最终成果与竞赛表现", max: 10, color: "bg-amber-500" },
];

export default function TeacherEvaluationPage() {
  const [evals, setEvals] = useState<TeacherEvaluation[]>([]);

  useEffect(() => {
    endpoints.teacherEvals().then((d) => setEvals(unwrapList(d))).catch(console.error);
  }, []);

  return (
    <DashboardLayout title="导师评分" subtitle="Teacher Evaluation — 综合评分系统">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {evals.map((ev) => (
          <Card key={ev.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">{ev.mentor_name}</h3>
                <p className="text-xs text-[#787876] mt-0.5">{ev.team_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">{ev.total_score}</p>
                <StatusBadge status={ev.level} />
              </div>
            </div>
            <div className="space-y-2">
              {SCORE_SECTIONS.map((section) => {
                const score = ev[section.key as keyof TeacherEvaluation] as number;
                return (
                  <div key={section.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#787876]">{section.label}</span>
                      <span className="font-medium tabular-nums">{score}/{section.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#E8E8E6]">
                      <div
                        className={`h-full rounded-full ${section.color}`}
                        style={{ width: `${(score / section.max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {ev.comments && (
              <p className="text-xs text-[#787876] mt-4 pt-3 border-t border-[#F0F0EE]">{ev.comments}</p>
            )}
          </Card>
        ))}
      </div>
      {evals.length === 0 && (
        <Card><p className="text-center text-[#787876] py-12">暂无评分数据</p></Card>
      )}
    </DashboardLayout>
  );
}
