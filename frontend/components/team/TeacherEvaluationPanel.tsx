"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Button, Card, LoadingState } from "@/components/ui";
import {
  fetchTeacherEvaluations,
  updateTeacherEvaluation,
} from "@/lib/teamApi";
import { getErrorMessage } from "@/lib/apiClient";
import type {
  TeacherDailyEvaluation,
  TeacherEvaluationCheck,
} from "@/types/team";

interface Criterion {
  key: TeacherEvaluationCheck;
  text: string;
}

const BUSINESS_CRITERIA: Criterion[] = [
  {
    key: "business_duration",
    text: "时长达标：老师在商业组现场指导累计时长超过 3 小时（不含集中讲课）。",
  },
  {
    key: "business_correction",
    text: "纠错干预：老师发现并纠正了学生商业逻辑中的明显错误（如定价、成本）。",
  },
  {
    key: "business_progress",
    text: "进度把控：老师明确了当日任务节点，并在节点前进行了检查。",
  },
  {
    key: "business_questions",
    text: "答疑解惑：老师针对商业画布或路演稿回答了学生的具体提问。",
  },
  {
    key: "business_log_feedback",
    text: "日志反馈：老师检查并点评反馈了当日学生的商业日志或复盘笔记。",
  },
];

const ENGINEERING_CRITERIA: Criterion[] = [
  {
    key: "engineering_duration",
    text: "时长达标：老师在工程组现场指导累计时长超过 3 小时（不含集中讲课）。",
  },
  {
    key: "engineering_development",
    text: "研发协助：老师指导学生进行原型研发或功能开发，解决代码或硬件 Bug。",
  },
  {
    key: "engineering_review",
    text: "技术复盘：老师针对当天技术难点在白板或纸上进行了梳理总结。",
  },
  {
    key: "engineering_progress",
    text: "进度检查：老师检查了研发进度，并确认符合当日计划。",
  },
  {
    key: "engineering_log_feedback",
    text: "日志反馈：老师检查并点评反馈了当日学生的工程日志或实验记录。",
  },
];

const ALL_CRITERIA = [...BUSINESS_CRITERIA, ...ENGINEERING_CRITERIA];

function emptyEvaluation(day: number): TeacherDailyEvaluation {
  return {
    day,
    business_duration: false,
    business_correction: false,
    business_progress: false,
    business_questions: false,
    business_log_feedback: false,
    engineering_duration: false,
    engineering_development: false,
    engineering_review: false,
    engineering_progress: false,
    engineering_log_feedback: false,
    business_score: 0,
    engineering_score: 0,
    total_score: 0,
    comment: "",
  };
}

function scoreFor(
  evaluation: TeacherDailyEvaluation,
  criteria: Criterion[]
): number {
  return criteria.reduce(
    (total, criterion) => total + (evaluation[criterion.key] ? 1 : 0),
    0
  );
}

function EvaluationGroup({
  title,
  criteria,
  evaluation,
  editable,
  onToggle,
}: {
  title: string;
  criteria: Criterion[];
  evaluation: TeacherDailyEvaluation;
  editable: boolean;
  onToggle: (key: TeacherEvaluationCheck) => void;
}) {
  const score = scoreFor(evaluation, criteria);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <span className="rounded-full bg-primary-light px-3 py-1 text-sm font-bold text-primary">
          {score}/5
        </span>
      </div>
      <div className="divide-y divide-border">
        {criteria.map((criterion, index) => (
          <label
            key={criterion.key}
            className={clsx(
              "flex gap-3 px-4 py-3.5",
              editable ? "cursor-pointer hover:bg-blue-50/50" : "cursor-default",
              evaluation[criterion.key] && "bg-emerald-50/60"
            )}
          >
            <input
              type="checkbox"
              checked={evaluation[criterion.key]}
              disabled={!editable}
              onChange={() => onToggle(criterion.key)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 accent-emerald-600"
            />
            <span className="flex-1 text-sm leading-relaxed text-text-primary">
              <span className="mr-2 font-semibold text-text-secondary">
                {index + 1}.
              </span>
              {criterion.text}
            </span>
            <span className="shrink-0 text-xs font-medium text-text-secondary">
              1 分
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function TeacherEvaluationPanel({
  teamId,
  teacherName,
  canEdit,
  onSaved,
}: {
  teamId: number;
  teacherName: string;
  canEdit: boolean;
  onSaved?: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [evaluations, setEvaluations] = useState<
    Record<number, TeacherDailyEvaluation>
  >({});
  const [savedDays, setSavedDays] = useState<Set<number>>(new Set());
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchTeacherEvaluations(teamId)
      .then((items) => {
        const next: Record<number, TeacherDailyEvaluation> = {};
        items.forEach((item) => {
          next[item.day] = item;
        });
        setEvaluations(next);
        setSavedDays(new Set(items.map((item) => item.day)));
        setDirtyDays(new Set());
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [teamId]);

  const current = evaluations[selectedDay] || emptyEvaluation(selectedDay);
  const businessScore = scoreFor(current, BUSINESS_CRITERIA);
  const engineeringScore = scoreFor(current, ENGINEERING_CRITERIA);
  const totalScore = businessScore + engineeringScore;
  const fiveDayTotal = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => index + 1).reduce(
        (total, day) => {
          const evaluation = evaluations[day];
          return evaluation
            ? total +
                scoreFor(evaluation, BUSINESS_CRITERIA) +
                scoreFor(evaluation, ENGINEERING_CRITERIA)
            : total;
        },
        0
      ),
    [evaluations]
  );

  const updateCurrent = (
    updater: (value: TeacherDailyEvaluation) => TeacherDailyEvaluation
  ) => {
    setEvaluations((previous) => ({
      ...previous,
      [selectedDay]: updater(
        previous[selectedDay] || emptyEvaluation(selectedDay)
      ),
    }));
    setDirtyDays((previous) => new Set(previous).add(selectedDay));
    setError("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const checks = ALL_CRITERIA.reduce(
        (payload, criterion) => {
          payload[criterion.key] = Boolean(current[criterion.key]);
          return payload;
        },
        {} as Record<TeacherEvaluationCheck, boolean>
      );
      const saved = await updateTeacherEvaluation(teamId, selectedDay, {
        ...checks,
        comment: current.comment,
      });
      setEvaluations((previous) => ({ ...previous, [selectedDay]: saved }));
      setSavedDays((previous) => new Set(previous).add(selectedDay));
      setDirtyDays((previous) => {
        const next = new Set(previous);
        next.delete(selectedDay);
        return next;
      });
      onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="正在加载老师每日评分..." />;

  return (
    <Card className="mb-6 !p-0 overflow-hidden">
      <div className="border-b border-border bg-gradient-to-r from-indigo-50 via-purple-50 to-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-purple">
              Teacher Daily Evaluation · 老师每日巡查评分
            </p>
            <h2 className="mt-1 text-xl font-bold text-text-primary">
              {teacherName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              每日满分 10 分，五天累计满分 50 分
              {!canEdit && " · 运营评分结果（只读）"}
            </p>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-white px-5 py-3 text-center shadow-sm">
            <p className="text-xs text-text-secondary">五天当前总分</p>
            <p className="mt-1 text-2xl font-black text-accent-purple">
              {fiveDayTotal}
              <span className="text-sm font-medium text-text-secondary">/50</span>
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={clsx(
                "relative min-w-[84px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                selectedDay === day
                  ? "bg-accent-purple text-white shadow-sm"
                  : "border border-purple-100 bg-white text-text-secondary hover:border-purple-300 hover:text-accent-purple"
              )}
            >
              Day {day}
              {dirtyDays.has(day) ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400" />
              ) : savedDays.has(day) ? (
                <span className="ml-1 text-emerald-400">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="font-semibold text-text-primary">Day {selectedDay} 巡查记录</p>
            <p className="text-xs text-text-secondary">
              {savedDays.has(selectedDay) ? "该日已评分" : "该日尚未评分"}
              {current.reviewed_by_name
                ? ` · 评分人：${current.reviewed_by_name}`
                : ""}
            </p>
          </div>
          <p className="text-lg font-black text-primary">
            {businessScore} + {engineeringScore} = {totalScore}
            <span className="ml-1 text-sm font-medium text-text-secondary">
              /10
            </span>
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <EvaluationGroup
            title="商业教学（满分 5 分）"
            criteria={BUSINESS_CRITERIA}
            evaluation={current}
            editable={canEdit}
            onToggle={(key) =>
              updateCurrent((value) => ({ ...value, [key]: !value[key] }))
            }
          />
          <EvaluationGroup
            title="工程技术（满分 5 分）"
            criteria={ENGINEERING_CRITERIA}
            evaluation={current}
            editable={canEdit}
            onToggle={(key) =>
              updateCurrent((value) => ({ ...value, [key]: !value[key] }))
            }
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor={`teacher-evaluation-comment-${selectedDay}`}
            className="mb-2 block text-sm font-semibold text-text-primary"
          >
            运营老师当日评语
          </label>
          <textarea
            id={`teacher-evaluation-comment-${selectedDay}`}
            value={current.comment}
            disabled={!canEdit}
            maxLength={2000}
            onChange={(event) =>
              updateCurrent((value) => ({
                ...value,
                comment: event.target.value,
              }))
            }
            placeholder={
              canEdit
                ? "记录老师当天指导的亮点、需要改进的地方或后续建议..."
                : "运营老师暂未填写当日评语"
            }
            className="min-h-28 w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-text-secondary"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              {dirtyDays.has(selectedDay) && canEdit && (
                <p className="text-xs font-medium text-amber-600">
                  当前 Day 有尚未保存的修改
                </p>
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
            {canEdit && (
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "保存中..." : `保存 Day ${selectedDay} 评分`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
