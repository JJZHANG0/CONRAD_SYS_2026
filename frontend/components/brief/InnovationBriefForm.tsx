"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, TextArea, SaveIndicator, Button, ProgressBar } from "@/components/ui";
import { BriefExportButtons } from "@/components/brief/BriefExportButtons";
import { BRIEF_QUESTIONS, BRIEF_TOTAL_WORD_LIMIT, type InnovationBrief } from "@/types/brief";
import type { BriefExportMeta } from "@/utils/briefExport";
import type { SaveStatus } from "@/types/log";
import { updateBrief } from "@/lib/briefApi";
import { getErrorMessage } from "@/lib/apiClient";
import { useDebouncedAutoSave, useSyncedFormState } from "@/hooks/useFormAutoSave";
import { isOverWordLimit, wordCount } from "@/utils/completion";
import { buildTextFormPayload } from "@/utils/formPayload";
import { isRichTextEmpty } from "@/utils/richText";

export function InnovationBriefForm({ brief, teamName, projectName, canEdit, canExport, exportMeta, onUpdated, backHref, backLabel, saveRedirectHref = "/dashboard" }: {
  brief: InnovationBrief; teamName: string; projectName: string;
  canEdit: boolean; canExport?: boolean; exportMeta?: BriefExportMeta;
  onUpdated: (b: InnovationBrief) => void;
  backHref?: string; backLabel?: string;
  saveRedirectHref?: string;
}) {
  const router = useRouter();
  const { data, setData, dataRef } = useSyncedFormState(brief);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");

  const totalWords = useMemo(
    () => BRIEF_QUESTIONS.reduce((sum, q) => sum + wordCount(String(data[q.id] || "")), 0),
    [data]
  );

  const hasErrors =
    BRIEF_QUESTIONS.some((q) => isOverWordLimit(String(data[q.id] || ""), q.maxWords)) ||
    totalWords > BRIEF_TOTAL_WORD_LIMIT;

  const save = useCallback(async (redirectAfter = false, options?: { allowInvalid?: boolean }) => {
    if (!canEdit) return false;

    const current = dataRef.current;
    const invalid =
      BRIEF_QUESTIONS.some((q) => isOverWordLimit(String(current[q.id] || ""), q.maxWords)) ||
      BRIEF_QUESTIONS.reduce((sum, q) => sum + wordCount(String(current[q.id] || "")), 0) > BRIEF_TOTAL_WORD_LIMIT;
    if (!options?.allowInvalid && invalid) return false;

    setSaveStatus("saving");
    setSaveError("");
    try {
      const payload = buildTextFormPayload(
        BRIEF_QUESTIONS.map((q) => q.id),
        current
      );
      const updated = await updateBrief(brief.team, payload as Partial<InnovationBrief>);
      const merged = {
        ...updated,
        ...Object.fromEntries(BRIEF_QUESTIONS.map((q) => [q.id, current[q.id]])),
      };
      setData(merged);
      onUpdated(merged);
      if (redirectAfter) {
        router.push(saveRedirectHref);
        return true;
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return true;
    } catch (err) {
      setSaveStatus("failed");
      setSaveError(getErrorMessage(err));
      return false;
    }
  }, [brief.team, canEdit, dataRef, onUpdated, router, saveRedirectHref, setData]);

  const { scheduleAutoSave } = useDebouncedAutoSave(save);

  const handleManualSave = () => {
    void save(true, { allowInvalid: true });
  };

  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
        >
          <span aria-hidden="true">←</span>
          {backLabel || "Back"}
        </Link>
      )}

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-accent-purple">Innovation Brief</span>
            <h1 className="mt-2 text-2xl font-bold">{teamName}</h1>
            <p className="text-text-secondary">{projectName}</p>
            <p className="mt-2 text-xs text-text-secondary">
              Combined limit: {BRIEF_TOTAL_WORD_LIMIT.toLocaleString()} words · 全文合计上限 {BRIEF_TOTAL_WORD_LIMIT.toLocaleString()} 词
            </p>
          </div>
          <div className="text-right">
            {!canEdit && (
              <span className="mb-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                只读浏览
              </span>
            )}
            {canEdit && <SaveIndicator status={saveStatus} />}
            <p className="mt-1 text-sm font-medium">{data.completion_count} / 10 completed</p>
            <ProgressBar value={data.completion_count} max={10} />
            <p className={`mt-2 text-xs tabular-nums ${totalWords > BRIEF_TOTAL_WORD_LIMIT ? "text-red-500" : "text-text-secondary"}`}>
              Total: {totalWords} / {BRIEF_TOTAL_WORD_LIMIT} words
            </p>
            {hasErrors && canEdit && (
              <p className="mt-2 text-xs text-amber-600">部分题目超出字数限制，内容仍会保存，请尽快修改</p>
            )}
            {saveError && (
              <p className="mt-2 text-xs text-red-600">{saveError}</p>
            )}
          </div>
        </div>
      </Card>

      {canExport && exportMeta && (
        <div className="mb-6">
          <BriefExportButtons brief={data} meta={exportMeta} />
        </div>
      )}

      <div className="space-y-4">
        {BRIEF_QUESTIONS.map((q) => {
          const val = String(data[q.id] || "");
          const done = !isRichTextEmpty(val);
          const overSection = isOverWordLimit(val, q.maxWords);
          return (
            <Card key={q.id} borderTop={done ? "purple" : "yellow"} className="!p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-sm font-bold text-accent-purple">Q{q.q}</span>
                  <div>
                    <p className="font-medium">{q.titleEn}</p>
                    <p className="text-xs text-text-secondary">{q.titleZh}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  {q.maxWords} words max
                </span>
              </div>
              <TextArea
                key={q.id}
                labelEn="" labelZh="" helper={q.helper}
                value={val} maxWords={q.maxWords}
                onChange={(v) => { setData((prev) => ({ ...prev, [q.id]: v })); }}
                onBlurSave={() => scheduleAutoSave(true)}
                disabled={!canEdit}
                large
                error={overSection ? "Word limit exceeded" : undefined}
              />
            </Card>
          );
        })}
      </div>
      {canEdit && (
        <Button className="mt-6" onClick={handleManualSave}>
          Save Brief
        </Button>
      )}
    </div>
  );
}
