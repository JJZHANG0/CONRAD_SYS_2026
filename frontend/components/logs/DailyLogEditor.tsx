"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Card, TextArea, SaveIndicator, Button, StatusBadge } from "@/components/ui";
import { LOG_FIELDS, type DailyLog, type SaveStatus } from "@/types/log";
import { LogExportButton } from "@/components/logs/LogExportModal";
import { LogMinimumModal } from "@/components/logs/LogMinimumModal";
import { updateLog } from "@/lib/logApi";
import { getErrorMessage } from "@/lib/apiClient";
import { useQueuedSave } from "@/hooks/useQueuedSave";
import { isOverLimit } from "@/utils/completion";
import {
  clearLogDraft,
  loadLogDraft,
  storeLogDraft,
} from "@/utils/logDraft";
import {
  getPlainTextLength,
  isRichTextEmpty,
  sanitizeRichTextHtml,
} from "@/utils/richText";

type LogFields = Pick<
  DailyLog,
  "work_content" | "task_completion" | "problems_solutions" | "reflection" | "teacher_comment"
>;
type LogFieldKey = keyof LogFields;
type StudentLogField = (typeof LOG_FIELDS)[number]["id"];

const MIN_LOG_CHARS = 100;

interface SaveRequest {
  logId: number;
  payload: Partial<LogFields>;
}

interface Props {
  logs: DailyLog[];
  mode: "student" | "teacher" | "operations";
  onUpdated: (log: DailyLog) => void;
  initialDay?: number;
  backHref?: string;
  backLabel?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  saveRedirectHref?: string;
  exportMeta?: { studentName: string; teamName: string };
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
  exportMeta,
}: Props) {
  const router = useRouter();
  const [day, setDay] = useState(initialDay);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [minimumPrompt, setMinimumPrompt] = useState<{
    fieldLabel: string;
    currentCount: number;
  } | null>(null);
  const log = logs.find((l) => l.day === day) || logs[0];
  const isReadOnly = mode === "operations";

  const initialFields: LogFields = {
    work_content: log?.work_content || "",
    task_completion: log?.task_completion || "",
    problems_solutions: log?.problems_solutions || "",
    reflection: log?.reflection || "",
    teacher_comment: log?.teacher_comment || "",
  };
  const [fields, setFields] = useState<LogFields>(initialFields);
  const fieldsRef = useRef<LogFields>(initialFields);
  const dirtyByLogRef = useRef<Record<number, Set<LogFieldKey>>>({});
  const originalByLogRef = useRef<Record<number, LogFields>>({});

  useEffect(() => {
    if (log) {
      const serverFields: LogFields = {
        work_content: log.work_content,
        task_completion: log.task_completion,
        problems_solutions: log.problems_solutions,
        reflection: log.reflection,
        teacher_comment: log.teacher_comment,
      };
      if (!originalByLogRef.current[log.id]) {
        originalByLogRef.current[log.id] = serverFields;
      }
      const draft = loadLogDraft<LogFieldKey>(log.id);
      const dirty = new Set<LogFieldKey>(draft?.dirty || []);
      const next = { ...serverFields };
      dirty.forEach((field) => {
        if (draft?.fields[field] != null) next[field] = draft.fields[field];
      });
      dirtyByLogRef.current[log.id] = dirty;
      fieldsRef.current = next;
      setFields(next);
      setRecoveredDraft(dirty.size > 0);
      setSaveError("");
      setSaveStatus("idle");
    }
  }, [log?.id, day]);

  const hasErrors = useMemo(
    () => LOG_FIELDS.some((f) => isOverLimit(fields[f.id], f.maxChars)),
    [fields]
  );

  const saveWorker = useCallback(async ({ logId, payload }: SaveRequest) => {
    setSaveStatus("saving");
    setSaveError("");
    try {
      const updated = await updateLog(logId, payload);
      onUpdated(updated);
      const draft = loadLogDraft<LogFieldKey>(logId);
      if (draft) {
        const dirty = new Set<LogFieldKey>(draft.dirty);
        (Object.keys(payload) as LogFieldKey[]).forEach((field) => {
          if (
            sanitizeRichTextHtml(draft.fields[field] || "") ===
            String(payload[field] || "")
          ) {
            dirty.delete(field);
          }
        });
        dirtyByLogRef.current[logId] = dirty;
        if (dirty.size) {
          storeLogDraft(logId, draft.fields, dirty);
        } else {
          clearLogDraft(logId);
          if (log?.id === logId) setRecoveredDraft(false);
        }
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch (err) {
      setSaveStatus("failed");
      setSaveError(getErrorMessage(err));
      return false;
    }
  }, [log?.id, onUpdated]);

  const enqueueSave = useQueuedSave(saveWorker);

  const findMinimumViolation = (
    field?: LogFieldKey
  ): { fieldLabel: string; currentCount: number } | null => {
    if (mode !== "student" || !log) return null;
    const studentFields: StudentLogField[] = field
      ? LOG_FIELDS.some((item) => item.id === field)
        ? [field as StudentLogField]
        : []
      : LOG_FIELDS.map((item) => item.id);

    for (const key of studentFields) {
      const current = fieldsRef.current[key] || "";
      const count = getPlainTextLength(current);
      const original = originalByLogRef.current[log.id]?.[key] || "";
      const unchangedExisting =
        getPlainTextLength(original) > 0 &&
        sanitizeRichTextHtml(current) === sanitizeRichTextHtml(original);
      if (count < MIN_LOG_CHARS && !unchangedExisting) {
        const definition = LOG_FIELDS.find((item) => item.id === key);
        return {
          fieldLabel: definition?.labelZh || "日志内容",
          currentCount: count,
        };
      }
    }
    return null;
  };

  const handleField = (key: LogFieldKey, value: string) => {
    const next = { ...fieldsRef.current, [key]: value };
    fieldsRef.current = next;
    setFields(next);
    if (log) {
      const dirty =
        dirtyByLogRef.current[log.id] ||
        (dirtyByLogRef.current[log.id] = new Set<LogFieldKey>());
      dirty.add(key);
      storeLogDraft(log.id, next, dirty);
    }
  };

  const saveCurrent = async (
    field?: LogFieldKey,
    redirectAfter = false
  ): Promise<boolean> => {
    if (!log || isReadOnly) return false;
    const violation = findMinimumViolation(field);
    if (violation) {
      setMinimumPrompt(violation);
      setSaveStatus("idle");
      return false;
    }
    const current = fieldsRef.current;
    const payload: Partial<LogFields> = field
      ? { [field]: sanitizeRichTextHtml(current[field]) }
      : mode === "student"
        ? {
            work_content: sanitizeRichTextHtml(current.work_content),
            task_completion: sanitizeRichTextHtml(current.task_completion),
            problems_solutions: sanitizeRichTextHtml(current.problems_solutions),
            reflection: sanitizeRichTextHtml(current.reflection),
          }
        : { teacher_comment: sanitizeRichTextHtml(current.teacher_comment) };

    const saved = await enqueueSave({ logId: log.id, payload });
    if (saved && redirectAfter) router.push(saveRedirectHref);
    return saved;
  };

  const handleFieldBlur = (field: LogFieldKey) => {
    if (!isReadOnly) void saveCurrent(field);
  };

  if (!log) return null;

  const completedCount = logs.filter((l) => l.is_complete).length;
  const commentedCount = logs.filter((l) => l.has_teacher_comment).length;

  return (
    <div className="w-full">
      <LogMinimumModal
        open={minimumPrompt !== null}
        fieldLabel={minimumPrompt?.fieldLabel || "日志内容"}
        currentCount={minimumPrompt?.currentCount || 0}
        minimum={MIN_LOG_CHARS}
        onClose={() => setMinimumPrompt(null)}
      />
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
            {isReadOnly && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                只读浏览
              </span>
            )}
            {isReadOnly && exportMeta && (
              <LogExportButton
                log={log}
                meta={{
                  studentName: exportMeta.studentName,
                  teamName: exportMeta.teamName,
                  day: log.day,
                }}
              />
            )}
            {isReadOnly ? null : <SaveIndicator status={saveStatus} />}
            {saveStatus === "failed" && (
              <Button size="sm" variant="secondary" onClick={() => void saveCurrent()}>
                重试保存
              </Button>
            )}
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
        {recoveredDraft && !isReadOnly && (
          <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
            已恢复上次未成功上传的本地草稿，离开输入框或点击保存后会重新提交。
          </p>
        )}
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
              <div className="flex flex-wrap items-center gap-2">
                {isReadOnly && exportMeta && (
                  <LogExportButton
                    log={log}
                    meta={{
                      studentName: exportMeta.studentName,
                      teamName: exportMeta.teamName,
                      day: log.day,
                    }}
                  />
                )}
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
                  onBlurSave={() => handleFieldBlur(f.id)}
                  disabled={mode === "teacher" || isReadOnly}
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
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                {hasErrors && (
                  <p className="text-xs text-amber-600">
                    部分内容超过建议字数，但仍可正常保存
                  </p>
                )}
                {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                <Button onClick={() => void saveCurrent(undefined, true)}>
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
                onBlurSave={() => handleFieldBlur("teacher_comment")}
                disabled={mode === "student" || isReadOnly}
                large
                helper={
                  mode === "teacher"
                    ? "Provide constructive feedback on the student's work for this day."
                    : isReadOnly
                      ? "Operations view only — editing disabled."
                      : undefined
                }
              />
              {mode === "teacher" && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Button onClick={() => void saveCurrent(undefined, true)}>Save Comment</Button>
                    {saveError && <p className="mt-2 text-xs text-red-600">{saveError}</p>}
                  </div>
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
