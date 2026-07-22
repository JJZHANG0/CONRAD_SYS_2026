"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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

function fieldsFromLog(log?: DailyLog): LogFields {
  return {
    work_content: log?.work_content || "",
    task_completion: log?.task_completion || "",
    problems_solutions: log?.problems_solutions || "",
    reflection: log?.reflection || "",
    teacher_comment: log?.teacher_comment || "",
  };
}

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
  const firstDay = logs.some((item) => item.day === initialDay)
    ? initialDay
    : (logs[0]?.day ?? initialDay);
  const [day, setDay] = useState(firstDay);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [minimumPrompt, setMinimumPrompt] = useState<{
    fieldLabel: string;
    currentCount: number;
  } | null>(null);
  const log = logs.find((item) => item.day === day);
  const isReadOnly = mode === "operations";

  const initialFields = fieldsFromLog(log);
  const [fields, setFields] = useState<LogFields>(initialFields);
  const [editorSession, setEditorSession] = useState(0);
  const fieldsRef = useRef<LogFields>(initialFields);
  const fieldsByLogRef = useRef<Record<number, LogFields>>(
    log ? { [log.id]: initialFields } : {}
  );
  const dirtyByLogRef = useRef<Record<number, Set<LogFieldKey>>>({});
  const originalByLogRef = useRef<Record<number, LogFields>>({});
  const activeLogIdRef = useRef<number | null>(log?.id ?? null);
  const displayedLogIdRef = useRef<number | null>(null);

  const displayLog = useCallback((targetLog: DailyLog) => {
    const serverFields = fieldsFromLog(targetLog);
    if (!originalByLogRef.current[targetLog.id]) {
      originalByLogRef.current[targetLog.id] = serverFields;
    }
    const draft = loadLogDraft<LogFieldKey>(targetLog.id);
    const dirty = new Set<LogFieldKey>(draft?.dirty || []);
    const next = { ...serverFields };
    dirty.forEach((field) => {
      if (draft?.fields[field] != null) next[field] = draft.fields[field];
    });

    activeLogIdRef.current = targetLog.id;
    displayedLogIdRef.current = targetLog.id;
    fieldsByLogRef.current[targetLog.id] = next;
    dirtyByLogRef.current[targetLog.id] = dirty;
    fieldsRef.current = next;
    setFields(next);
    // RichTextEditor is intentionally uncontrolled, so each log needs a fresh
    // editor mount after its exact server/draft snapshot has been selected.
    setEditorSession((value) => value + 1);
    setRecoveredDraft(dirty.size > 0);
    setMinimumPrompt(null);
    setSaveError("");
    setSaveStatus("idle");
  }, []);

  useLayoutEffect(() => {
    if (log && displayedLogIdRef.current !== log.id) {
      displayLog(log);
    }
  }, [displayLog, log]);

  const hasErrors = useMemo(
    () => LOG_FIELDS.some((f) => isOverLimit(fields[f.id], f.maxChars)),
    [fields]
  );

  const saveWorker = useCallback(async ({ logId, payload }: SaveRequest) => {
    if (activeLogIdRef.current === logId) {
      setSaveStatus("saving");
      setSaveError("");
    }
    try {
      const updated = await updateLog(logId, payload);
      onUpdated(updated);
      originalByLogRef.current[logId] = fieldsFromLog(updated);
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
          if (activeLogIdRef.current === logId) setRecoveredDraft(false);
        }
      }
      if (activeLogIdRef.current === logId) {
        setSaveStatus("saved");
        setTimeout(() => {
          if (activeLogIdRef.current === logId) setSaveStatus("idle");
        }, 2000);
      }
      return true;
    } catch (err) {
      if (activeLogIdRef.current === logId) {
        setSaveStatus("failed");
        setSaveError(getErrorMessage(err));
      }
      return false;
    }
  }, [onUpdated]);

  const enqueueSave = useQueuedSave(saveWorker);

  const findMinimumViolation = (
    logId: number,
    current: LogFields,
    field?: LogFieldKey
  ): { fieldLabel: string; currentCount: number } | null => {
    if (mode !== "student") return null;
    const studentFields: StudentLogField[] = field
      ? LOG_FIELDS.some((item) => item.id === field)
        ? [field as StudentLogField]
        : []
      : LOG_FIELDS.map((item) => item.id);

    for (const key of studentFields) {
      const currentValue = current[key] || "";
      const count = getPlainTextLength(currentValue);
      const original = originalByLogRef.current[logId]?.[key] || "";
      const unchangedExisting =
        getPlainTextLength(original) > 0 &&
        sanitizeRichTextHtml(currentValue) === sanitizeRichTextHtml(original);
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

  const handleField = (logId: number, key: LogFieldKey, value: string) => {
    const current =
      fieldsByLogRef.current[logId] ||
      (activeLogIdRef.current === logId ? fieldsRef.current : undefined);
    if (!current) return;

    const next = { ...current, [key]: value };
    fieldsByLogRef.current[logId] = next;
    if (activeLogIdRef.current === logId) {
      fieldsRef.current = next;
      setFields(next);
    }
    const dirty =
      dirtyByLogRef.current[logId] ||
      (dirtyByLogRef.current[logId] = new Set<LogFieldKey>());
    dirty.add(key);
    storeLogDraft(logId, next, dirty);
  };

  const saveLog = async (
    logId: number,
    field?: LogFieldKey,
    redirectAfter = false
  ): Promise<boolean> => {
    if (isReadOnly) return false;
    const current = fieldsByLogRef.current[logId];
    if (!current) return false;
    const violation = findMinimumViolation(logId, current, field);
    if (violation) {
      if (activeLogIdRef.current === logId) {
        setMinimumPrompt(violation);
        setSaveStatus("idle");
      }
      return false;
    }
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

    const saved = await enqueueSave({ logId, payload });
    if (saved && redirectAfter) router.push(saveRedirectHref);
    return saved;
  };

  const handleFieldBlur = (logId: number, field: LogFieldKey) => {
    if (!isReadOnly) void saveLog(logId, field);
  };

  const handleDayChange = (nextDay: number) => {
    if (nextDay === day) return;
    const targetLog = logs.find((item) => item.day === nextDay);
    if (!targetLog) return;
    displayLog(targetLog);
    setDay(nextDay);
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void saveLog(log.id)}
              >
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
                    onClick={() => handleDayChange(d)}
                    disabled={!l}
                    className={clsx(
                      "flex min-w-[72px] shrink-0 items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all lg:min-w-0 lg:w-full",
                      active
                        ? "bg-primary text-white shadow-sm"
                        : l
                          ? "bg-gray-50 text-text-secondary hover:bg-primary-light hover:text-primary"
                          : "cursor-not-allowed bg-gray-50 text-gray-300"
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
                  key={`${log.id}-${editorSession}-${f.id}`}
                  labelEn={f.labelEn}
                  labelZh={f.labelZh}
                  helper={f.helper}
                  value={fields[f.id]}
                  maxChars={f.maxChars}
                  onChange={(v) => handleField(log.id, f.id, v)}
                  onBlurSave={() => handleFieldBlur(log.id, f.id)}
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
                <Button onClick={() => void saveLog(log.id, undefined, true)}>
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
                key={`${log.id}-${editorSession}-teacher_comment`}
                labelEn="Teacher Comment"
                labelZh="老师评语"
                value={fields.teacher_comment}
                maxChars={800}
                onChange={(v) => handleField(log.id, "teacher_comment", v)}
                onBlurSave={() => handleFieldBlur(log.id, "teacher_comment")}
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
                    <Button onClick={() => void saveLog(log.id, undefined, true)}>
                      Save Comment
                    </Button>
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
