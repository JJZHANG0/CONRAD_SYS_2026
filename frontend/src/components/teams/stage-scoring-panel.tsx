"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button, Input, Select, Textarea } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { endpoints } from "@/lib/api";
import type { Deliverable, Team } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Save, Star } from "lucide-react";

const STAGE_LABELS = ["第一阶段", "第二阶段", "第三阶段"];
const STAGE_KEYS = ["stage1_progress", "stage2_progress", "stage3_progress"] as const;

const STATUS_OPTIONS = [
  { value: "not_started", label: "未开始" },
  { value: "in_progress", label: "进行中" },
  { value: "submitted", label: "已提交" },
  { value: "needs_revision", label: "需修改" },
  { value: "approved", label: "已通过" },
  { value: "overdue", label: "已逾期" },
];

interface Props {
  team: Team;
  deliverables: Deliverable[];
  onUpdated: () => void;
}

export function StageScoringPanel({ team, deliverables, onUpdated }: Props) {
  const [stageProgress, setStageProgress] = useState({
    stage1: team.stage1_progress ?? 0,
    stage2: team.stage2_progress ?? 0,
    stage3: team.stage3_progress ?? 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ score: "", status: "", review_comment: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveStageProgress() {
    setSaving(true);
    setMessage("");
    try {
      await endpoints.updateTeam(team.id, {
        stage1_progress: stageProgress.stage1,
        stage2_progress: stageProgress.stage2,
        stage3_progress: stageProgress.stage3,
        deliverable_completion_rate: Math.round(
          (stageProgress.stage1 + stageProgress.stage2 + stageProgress.stage3) / 3
        ),
      });
      setMessage("阶段进度已保存");
      onUpdated();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(d: Deliverable) {
    setEditingId(d.id);
    setEditForm({
      score: d.score != null ? String(d.score) : "",
      status: d.status,
      review_comment: d.review_comment || "",
    });
  }

  async function saveDeliverable(id: number) {
    setSaving(true);
    setMessage("");
    try {
      await endpoints.reviewDeliverable(id, {
        status: editForm.status,
        score: editForm.score ? parseFloat(editForm.score) : null,
        review_comment: editForm.review_comment,
      });
      setEditingId(null);
      setMessage("交付物评分已保存");
      onUpdated();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const byStage = [1, 2, 3].map((n) => ({
    num: n,
    label: STAGE_LABELS[n - 1],
    items: deliverables.filter((d) =>
      d.stage_name?.includes(`第${n === 1 ? "一" : n === 2 ? "二" : "三"}`)
    ),
  }));

  return (
    <Card className="mb-6 border-accent/20">
      <CardHeader
        title="阶段评分"
        subtitle="管理员 / 项目经理可为各阶段进度与交付物打分"
        action={
          <div className="flex items-center gap-1 text-xs text-accent">
            <Star className="h-3.5 w-3.5" /> 评分面板
          </div>
        }
      />

      {message && (
        <p className="mb-4 text-sm px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700">{message}</p>
      )}

      {/* 阶段总进度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-[#F5F5F3]">
        {STAGE_KEYS.map((key, i) => (
          <div key={key}>
            <label className="text-xs font-medium text-[#787876] mb-2 block">
              {STAGE_LABELS[i]}进度 (%)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={stageProgress[`stage${i + 1}` as keyof typeof stageProgress]}
                onChange={(e) =>
                  setStageProgress((s) => ({
                    ...s,
                    [`stage${i + 1}`]: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  }))
                }
                className="h-9"
              />
              <span className="text-xs text-[#787876]">%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#E8E8E6]">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${stageProgress[`stage${i + 1}` as keyof typeof stageProgress]}%` }}
              />
            </div>
          </div>
        ))}
        <div className="md:col-span-3 flex justify-end">
          <Button onClick={saveStageProgress} disabled={saving} size="sm">
            <Save className="h-3.5 w-3.5" /> 保存阶段进度
          </Button>
        </div>
      </div>

      {/* 各阶段交付物评分 */}
      <div className="space-y-6">
        {byStage.map(({ num, label, items }) => (
          <div key={num}>
            <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wide mb-3 flex items-center gap-2">
              {label}
              <span className="text-[#787876] font-normal">({items.length} 项交付物)</span>
            </p>
            <div className="space-y-2">
              {items.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-[#E8E8E6] p-3 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{d.title}</p>
                        <StatusBadge status={d.status} />
                        {d.score != null && (
                          <span className="text-xs font-semibold text-accent tabular-nums">
                            {d.score} 分
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A8A8A6] mt-0.5">
                        截止 {formatDate(d.due_date)} · {d.owner_name || "—"}
                      </p>
                      {d.review_comment && editingId !== d.id && (
                        <p className="text-xs text-orange-600 mt-1 bg-orange-50 rounded px-2 py-1">
                          {d.review_comment}
                        </p>
                      )}
                    </div>
                    {editingId !== d.id && (
                      <Button variant="secondary" size="sm" onClick={() => startEdit(d)}>
                        打分
                      </Button>
                    )}
                  </div>

                  {editingId === d.id && (
                    <div className="mt-3 pt-3 border-t border-[#F0F0EE] grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-[#787876] mb-1 block">评分 (0-10)</label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={editForm.score}
                          onChange={(e) => setEditForm((f) => ({ ...f, score: e.target.value }))}
                          placeholder="0-10"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#787876] mb-1 block">审核状态</label>
                        <Select
                          value={editForm.status}
                          onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-[#787876] mb-1 block">修改意见 / 评语</label>
                        <Textarea
                          value={editForm.review_comment}
                          onChange={(e) => setEditForm((f) => ({ ...f, review_comment: e.target.value }))}
                          placeholder="填写评分说明或修改意见..."
                          className="min-h-[72px]"
                        />
                      </div>
                      <div className="md:col-span-4 flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>取消</Button>
                        <Button size="sm" onClick={() => saveDeliverable(d.id)} disabled={saving}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> 确认保存
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-[#A8A8A6] py-2">该阶段暂无交付物</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
