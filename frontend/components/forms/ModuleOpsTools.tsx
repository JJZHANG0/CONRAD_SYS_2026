"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui";
import { openGoogleTranslatePage, translateText } from "@/lib/translateApi";
import { stripHtml } from "@/utils/richText";
import type { FieldReviewStatus } from "@/types/review";

interface Props {
  titleEn: string;
  titleZh: string;
  htmlContent: string;
  canReview?: boolean;
  reviewStatus?: FieldReviewStatus;
  onReviewChange?: (status: FieldReviewStatus) => Promise<void>;
}

export function ModuleOpsTools({
  titleEn,
  titleZh,
  htmlContent,
  canReview = false,
  reviewStatus,
  onReviewChange,
}: Props) {
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    if (!translateOpen) {
      setTranslated("");
      setTranslateError("");
      setCopied(false);
    }
  }, [translateOpen]);

  useEffect(() => {
    if (!translateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTranslateOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [translateOpen]);

  const handleTranslate = useCallback(async () => {
    const plain = stripHtml(htmlContent);
    if (!plain) {
      setTranslateError("该模块暂无内容可翻译");
      setTranslateOpen(true);
      return;
    }
    setTranslateOpen(true);
    setTranslating(true);
    setTranslateError("");
    setTranslated("");
    try {
      const result = await translateText(htmlContent);
      setTranslated(result);
    } catch {
      setTranslateError(
        "浏览器无法自动翻译（网络可能未连通 Google）。可点下方「用谷歌翻译打开」查看中文。"
      );
    } finally {
      setTranslating(false);
    }
  }, [htmlContent]);

  const handleCopy = useCallback(async () => {
    if (!translated) return;
    try {
      await navigator.clipboard.writeText(translated);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = translated;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [translated]);

  const setReview = async (next: FieldReviewStatus) => {
    if (reviewBusy || !canReview || !onReviewChange) return;
    setReviewBusy(true);
    try {
      // Toggle off if clicking the already-selected status
      const status = reviewStatus === next ? null : next;
      await onReviewChange(status);
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleTranslate()}
          disabled={translating}
        >
          {translating ? "翻译中…" : "译成中文"}
        </Button>
        {canReview && onReviewChange && (
          <>
            <button
              type="button"
              disabled={reviewBusy}
              onClick={() => void setReview("pass")}
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                reviewStatus === "pass"
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              合格
            </button>
            <button
              type="button"
              disabled={reviewBusy}
              onClick={() => void setReview("fail")}
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                reviewStatus === "fail"
                  ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              )}
            >
              不合格
            </button>
          </>
        )}
      </div>

      {translateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="module-translate-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={() => setTranslateOpen(false)}
            aria-label="Close"
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
            <div className="border-b border-border bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    EN → 中文 · 模块翻译
                  </p>
                  <h2 id="module-translate-title" className="mt-1 text-xl font-bold text-text-primary">
                    {titleZh || titleEn}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">{titleEn}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTranslateOpen(false)}
                  className="rounded-lg px-2 py-1 text-xl leading-none text-text-secondary hover:bg-gray-100"
                  aria-label="Close dialog"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {translating && (
                <p className="text-sm text-text-secondary">正在翻译，请稍候…</p>
              )}
              {translateError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {translateError}
                </p>
              )}
              {!translating && !translateError && translated && (
                <div className="rounded-xl border border-border bg-slate-50/80 p-5">
                  <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-text-primary">
                    {translated}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="secondary" onClick={() => setTranslateOpen(false)}>
                关闭
              </Button>
              {(translateError || !translated) && !translating && (
                <Button
                  variant="secondary"
                  onClick={() => openGoogleTranslatePage(htmlContent)}
                >
                  用谷歌翻译打开
                </Button>
              )}
              <Button onClick={() => void handleCopy()} disabled={!translated || translating}>
                {copied ? "已复制 ✓" : "一键复制中文"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function reviewCardClass(status?: FieldReviewStatus): string {
  if (status === "pass") {
    return "!border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200";
  }
  if (status === "fail") {
    return "!border-rose-300 bg-rose-50/40 ring-1 ring-rose-200";
  }
  return "";
}
