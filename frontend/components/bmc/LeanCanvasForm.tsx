"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, TextArea, SaveIndicator, Button, ProgressBar } from "@/components/ui";
import { BmcExportButtons } from "@/components/bmc/BmcExportButtons";
import { ModuleOpsTools, reviewCardClass } from "@/components/forms/ModuleOpsTools";
import { BMC_QUESTIONS, type LeanCanvas } from "@/types/bmc";
import type { BmcExportMeta } from "@/utils/bmcExport";
import type { SaveStatus } from "@/types/log";
import type { FieldReviewStatus } from "@/types/review";
import { updateLeanCanvas, updateLeanCanvasReview } from "@/lib/bmcApi";
import { getErrorMessage } from "@/lib/apiClient";
import { useDebouncedAutoSave, useSyncedFormState } from "@/hooks/useFormAutoSave";
import { useSaveMutex } from "@/hooks/useSaveMutex";
import { isOverWordLimit } from "@/utils/completion";
import { buildSingleFieldPayload, buildTextFormPayload } from "@/utils/formPayload";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@/utils/richText";
import clsx from "clsx";

export function LeanCanvasForm({
  canvas,
  teamName,
  projectName,
  canEdit,
  canExport,
  canReview,
  exportMeta,
  onUpdated,
  backHref,
  backLabel,
  saveRedirectHref = "/dashboard",
}: {
  canvas: LeanCanvas;
  teamName: string;
  projectName: string;
  canEdit: boolean;
  canExport?: boolean;
  canReview?: boolean;
  exportMeta?: BmcExportMeta;
  onUpdated: (c: LeanCanvas) => void;
  backHref?: string;
  backLabel?: string;
  saveRedirectHref?: string;
}) {
  const router = useRouter();
  const { data, setData, dataRef } = useSyncedFormState(canvas);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const pendingFieldRef = useRef<keyof LeanCanvas | null>(null);

  const hasErrors = BMC_QUESTIONS.some((q) => isOverWordLimit(String(data[q.id] || ""), q.maxWords));

  const saveRaw = useCallback(
    async (redirectAfter = false, options?: { allowInvalid?: boolean }) => {
      if (!canEdit) return false;

      const current = dataRef.current;
      const invalid = BMC_QUESTIONS.some((q) =>
        isOverWordLimit(String(current[q.id] || ""), q.maxWords)
      );
      if (!options?.allowInvalid && invalid) return false;

      setSaveStatus("saving");
      setSaveError("");
      try {
        const fieldId = pendingFieldRef.current;
        pendingFieldRef.current = null;
        const payload =
          !redirectAfter && fieldId
            ? buildSingleFieldPayload(fieldId, current, sanitizeRichTextHtml)
            : buildTextFormPayload(
                BMC_QUESTIONS.map((q) => q.id),
                current,
                sanitizeRichTextHtml
              );
        const updated = await updateLeanCanvas(canvas.team, payload as Partial<LeanCanvas>);
        const merged = {
          ...updated,
          ...Object.fromEntries(BMC_QUESTIONS.map((q) => [q.id, current[q.id]])),
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
    },
    [canvas.team, canEdit, dataRef, onUpdated, router, saveRedirectHref, setData]
  );

  const save = useSaveMutex(saveRaw);
  const { scheduleAutoSave } = useDebouncedAutoSave(save);

  const handleReviewChange = async (field: string, status: FieldReviewStatus) => {
    const updated = await updateLeanCanvasReview(canvas.team, field, status);
    setData((prev) => ({ ...prev, field_reviews: updated.field_reviews || {} }));
    onUpdated({ ...dataRef.current, field_reviews: updated.field_reviews || {} });
  };

  const reviews = data.field_reviews || {};
  const passCount = Object.values(reviews).filter((s) => s === "pass").length;
  const failCount = Object.values(reviews).filter((s) => s === "fail").length;

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

      <Card className="mb-6" borderTop="yellow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Lean Canvas · BMC
            </span>
            <h1 className="mt-2 text-2xl font-bold">{teamName}</h1>
            <p className="text-text-secondary">{projectName}</p>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-text-secondary">
              Briefly answer these essential questions about the innovation, the market, and the business model.
              <br />
              请简要回答以下关于创新方案、市场机会与商业模式的核心问题。
            </p>
          </div>
          <div className="text-right">
            {!canEdit && (
              <span className="mb-2 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                只读浏览
              </span>
            )}
            {canReview && (
              <p className="mb-2 text-xs text-text-secondary">
                评审：
                <span className="ml-1 font-medium text-emerald-700">{passCount} 合格</span>
                <span className="mx-1 text-border">·</span>
                <span className="font-medium text-rose-700">{failCount} 不合格</span>
              </p>
            )}
            {canEdit && <SaveIndicator status={saveStatus} />}
            <p className="mt-1 text-sm font-medium">{data.completion_count} / 12 completed</p>
            <ProgressBar value={data.completion_count} max={12} />
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
          <BmcExportButtons canvas={data} meta={exportMeta} />
        </div>
      )}

      <div className="space-y-4">
        {BMC_QUESTIONS.map((q) => {
          const val = String(data[q.id] || "");
          const done = !isRichTextEmpty(val);
          const overSection = isOverWordLimit(val, q.maxWords);
          const review = reviews[q.id];
          return (
            <Card
              key={q.id}
              borderTop={done ? "yellow" : "blue"}
              className={clsx("!p-5", canReview && reviewCardClass(review))}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-50 text-sm font-bold text-amber-700">
                    Q{q.q}
                  </span>
                  <div>
                    <p className="font-medium">{q.titleEn}</p>
                    <p className="text-xs text-text-secondary">{q.titleZh}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {q.maxWords} words max
                  </span>
                  {canReview && review === "pass" && (
                    <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      合格
                    </span>
                  )}
                  {canReview && review === "fail" && (
                    <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                      不合格
                    </span>
                  )}
                </div>
              </div>
              {canReview && (
                <div className="mb-3">
                  <ModuleOpsTools
                    titleEn={q.titleEn}
                    titleZh={q.titleZh}
                    htmlContent={val}
                    reviewStatus={review || null}
                    onReviewChange={(status) => handleReviewChange(q.id, status)}
                  />
                </div>
              )}
              <p className="mb-2 text-xs text-text-secondary">{q.helper}</p>
              <p className="mb-3 text-xs text-text-secondary/80">{q.helperZh}</p>
              <TextArea
                key={q.id}
                labelEn=""
                labelZh=""
                value={val}
                maxWords={q.maxWords}
                onChange={(v) => {
                  setData((prev) => ({ ...prev, [q.id]: v }));
                }}
                onBlurSave={() => {
                  pendingFieldRef.current = q.id;
                  scheduleAutoSave(true);
                }}
                disabled={!canEdit}
                large
                error={overSection ? "Word limit exceeded" : undefined}
              />
            </Card>
          );
        })}
      </div>
      {canEdit && (
        <Button className="mt-6" onClick={() => save(true, { allowInvalid: true })}>
          Save Lean Canvas
        </Button>
      )}
    </div>
  );
}
