"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Card, TextArea, SaveIndicator, Button, ProgressBar } from "@/components/ui";
import { BRIEF_QUESTIONS, BRIEF_TOTAL_WORD_LIMIT, type InnovationBrief } from "@/types/brief";
import type { SaveStatus } from "@/types/log";
import { updateBrief } from "@/lib/briefApi";
import { debounceSave, isOverWordLimit, wordCount } from "@/utils/completion";
import { isRichTextEmpty } from "@/utils/richText";

export function InnovationBriefForm({ brief, teamName, projectName, canEdit, onUpdated, backHref, backLabel }: {
  brief: InnovationBrief; teamName: string; projectName: string;
  canEdit: boolean; onUpdated: (b: InnovationBrief) => void;
  backHref?: string; backLabel?: string;
}) {
  const [data, setData] = useState(brief);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const totalWords = useMemo(
    () => BRIEF_QUESTIONS.reduce((sum, q) => sum + wordCount(String(data[q.id] || "")), 0),
    [data]
  );

  const hasErrors =
    BRIEF_QUESTIONS.some((q) => isOverWordLimit(String(data[q.id] || ""), q.maxWords)) ||
    totalWords > BRIEF_TOTAL_WORD_LIMIT;

  const save = useCallback(async () => {
    if (hasErrors || !canEdit) return;
    setSaveStatus("saving");
    try {
      const payload: Record<string, string> = {};
      BRIEF_QUESTIONS.forEach((q) => { payload[q.id] = String(data[q.id] || ""); });
      const updated = await updateBrief(brief.team, payload as Partial<InnovationBrief>);
      setData((prev) => ({
        ...prev,
        completion_count: updated.completion_count,
        completion_rate: updated.completion_rate,
        updated_at: updated.updated_at,
      }));
      onUpdated({ ...updated, ...Object.fromEntries(BRIEF_QUESTIONS.map((q) => [q.id, data[q.id]])) });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch { setSaveStatus("failed"); }
  }, [data, brief.team, hasErrors, canEdit, onUpdated]);

  const debouncedSave = useMemo(() => debounceSave(save, 1500), [save]);

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
            <SaveIndicator status={saveStatus} />
            <p className="mt-1 text-sm font-medium">{data.completion_count} / 10 completed</p>
            <ProgressBar value={data.completion_count} max={10} />
            <p className={`mt-2 text-xs tabular-nums ${totalWords > BRIEF_TOTAL_WORD_LIMIT ? "text-red-500" : "text-text-secondary"}`}>
              Total: {totalWords} / {BRIEF_TOTAL_WORD_LIMIT} words
            </p>
          </div>
        </div>
      </Card>

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
                labelEn="" labelZh="" helper={q.helper}
                value={val} maxWords={q.maxWords}
                onChange={(v) => { setData((prev) => ({ ...prev, [q.id]: v })); }}
                onBlurSave={() => debouncedSave()}
                disabled={!canEdit}
                large
                error={overSection ? "Word limit exceeded" : undefined}
              />
            </Card>
          );
        })}
      </div>
      {canEdit && <Button className="mt-6" onClick={save} disabled={hasErrors}>Save Brief</Button>}
    </div>
  );
}
