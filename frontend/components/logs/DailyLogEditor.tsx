"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Card, TextArea, SaveIndicator, Button, StatusBadge } from "@/components/ui";
import { LOG_FIELDS, type DailyLog, type SaveStatus } from "@/types/log";
import { updateLog } from "@/lib/logApi";
import { debounceSave, isOverLimit } from "@/utils/completion";
import { isRichTextEmpty } from "@/utils/richText";

interface Props {
  logs: DailyLog[];
  mode: "student" | "teacher";
  onUpdated: (log: DailyLog) => void;
  initialDay?: number;
  backHref?: string;
  backLabel?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  saveRedirectHref?: string;
}

export function DailyLogEditor({
  logs,
  mode,
  onUpdated,
  initialDay = 1,
  backHref,
  backLabel,
  pageTitle,
  pageSubtitle,
  saveRedirectHref = "/dashboard",
}: Props) {
  const router = useRouter();
  const [day, setDay] = useState(initialDay);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const log = logs.find((l) => l.day === day) || logs[0];

  const [fields, setFields] = useState({
    work_content: log?.work_content || "",
    task_completion: log?.task_completion || "",
    problems_solutions: log?.problems_solutions || "",
    reflection: log?.reflection || "",
    teacher_comment: log?.teacher_comment || "",
  });

  useEffect(() => {
    if (log) {
      setFields({
        work_content: log.work_content,
        task_completion: log.task_completion,
        problems_solutions: log.problems_solutions,
        reflection: log.reflection,
        teacher_comment: log.teacher_comment,
      });
    }
  }, [log?.id, day]);

  const hasErrors = useMemo(
    () => LOG_FIELDS.some((f) => isOverLimit(fields[f.id], f.maxChars)),
    [fields]
  );

  const save = useCallback(async (redirectAfter = false) => {
    if (!log || hasErrors) return false;
    setSaveStatus("saving");
    try {
      const payload =
        mode === "student"
          ? {
              work_content: fields.work_content,
              task_completion: fields.task_completion,
              problems_solutions: fields.problems_solutions,
              reflection: fields.reflection,
            }
          : { teacher_comment: fields.teacher_comment };
      const updated = await updateLog(log.id, payload);
      onUpdated(updated);
      if (redirectAfter) {
        router.push(saveRedirectHref);
        return true;
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch {
      setSaveStatus("failed");
      return false;
    }
  }, [log, fields, mode, hasErrors, onUpdated, router, saveRedirectHref]);

  const debouncedSave = useMemo(() => debounceSave(save, 1500), [save]);

  const handleField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleFieldBlur = () => {
    debouncedSave();
  };

  if (!log) return null;

  const completedCount = logs.filter((l) => l.is_complete).length;
  const commentedCount = logs.filter((l) => l.has_teacher_comment).length;

  return (
    <div className="w-full">
      {/* Back + page header */}
      <div className="mb-6">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            <span aria-hidden="true">←</span>
            {backLabel || "Back"}
          </Link>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {pageTitle || "Daily Learning Log"}
            </h1>
            {pageSubtitle && (
              <p className="mt-1 text-sm text-text-secondary">{pageSubtitle}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveIndicator status={saveStatus} />
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              {completedCount}/5 logs complete
            </span>
            {mode === "student" && (
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-accent-purple">
                {commentedCount} teacher comments
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Day navigation — compact sidebar */}
        <aside className="lg:w-44 lg:shrink-0">
          <Card className="!p-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
              Select Day
            </p>
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {[1, 2, 3, 4, 5].map((d) => {
                const l = logs.find((x) => x.day === d);
                const active = day === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={clsx(
                      "flex min-w-[72px] shrink-0 items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all lg:min-w-0 lg:w-full",
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "bg-gray-50 text-text-secondary hover:bg-primary-light hover:text-primary"
                    )}
                  >
                    <span>Day {d}</span>
                    <span className="flex gap-0.5 text-[10px]">
                      {l?.is_complete && <span title="Complete">✓</span>}
                      {l?.has_teacher_comment && (
                        <span className={active ? "text-purple-200" : "text-accent-purple"} title="Commented">
                          ★
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* Main content — full width */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Day summary bar */}
          <Card className="!p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Day {day}</h2>
                <p className="text-xs text-text-secondary">
                  Last updated {new Date(log.updated_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={log.is_complete ? "complete" : "incomplete"} />
                <StatusBadge status={log.has_teacher_comment ? "commented" : "pending"} />
              </div>
            </div>
          </Card>

          {/* Student log fields — stacked full-width cards */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                Student Log · 学生日志
              </h3>
            </div>

            {LOG_FIELDS.map((f, i) => (
              <Card key={f.id} borderTop="blue" className="!p-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-xs text-text-secondary">Section {i + 1} of 4</span>
                </div>
                <TextArea
                  key={`${day}-${f.id}`}
                  labelEn={f.labelEn}
                  labelZh={f.labelZh}
                  helper={f.helper}
                  value={fields[f.id]}
                  maxChars={f.maxChars}
                  onChange={(v) => handleField(f.id, v)}
                  onBlurSave={handleFieldBlur}
                  disabled={mode === "teacher"}
                  large
                  error={
                    isOverLimit(fields[f.id], f.maxChars)
                      ? "Character limit exceeded"
                      : undefined
                  }
                />
              </Card>
            ))}

            {mode === "student" && (
              <div className="flex justify-end pt-1">
                <Button onClick={() => save(true)} disabled={hasErrors}>
                  Save Log
                </Button>
              </div>
            )}
          </section>

          {/* Teacher comment — below student log */}
          <section className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-accent-purple" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-accent-purple">
                Teacher Comment · 老师评语
              </h3>
            </div>

            <Card borderTop="purple" className="!p-5 bg-purple-50/30">
              {mode === "student" && isRichTextEmpty(fields.teacher_comment) && (
                <p className="mb-3 rounded-xl bg-white/80 px-4 py-2 text-xs text-text-secondary">
                  Your teacher&apos;s feedback will appear here once reviewed.
                </p>
              )}
              <TextArea
                key={`${day}-teacher_comment`}
                labelEn="Teacher Comment"
                labelZh="老师评语"
                value={fields.teacher_comment}
                maxChars={800}
                onChange={(v) => handleField("teacher_comment", v)}
                onBlurSave={handleFieldBlur}
                disabled={mode === "student"}
                large
                helper={
                  mode === "teacher"
                    ? "Provide constructive feedback on the student's work for this day."
                    : undefined
                }
              />
              {mode === "teacher" && (
                <div className="mt-4 flex items-center justify-between">
                  <Button onClick={() => save(true)}>Save Comment</Button>
                  {log.teacher_comment_updated_at && (
                    <p className="text-xs text-text-secondary">
                      Last updated:{" "}
                      {new Date(log.teacher_comment_updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {mode === "student" && log.teacher_comment_updated_at && (
                <p className="mt-2 text-xs text-text-secondary">
                  Commented on {new Date(log.teacher_comment_updated_at).toLocaleString()}
                </p>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
