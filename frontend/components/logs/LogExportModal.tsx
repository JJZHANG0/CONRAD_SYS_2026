"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui";
import type { DailyLog } from "@/types/log";
import { formatDailyLogExport, type LogExportMeta } from "@/utils/logExport";

interface Props {
  open: boolean;
  onClose: () => void;
  log: DailyLog;
  meta: LogExportMeta;
}

export function LogExportModal({ open, onClose, log, meta }: Props) {
  const [copied, setCopied] = useState(false);
  const text = formatDailyLogExport(log, meta);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open, log.id, meta.day]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [text]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-export-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="border-b border-border bg-gradient-to-r from-primary-light/80 via-white to-purple-50 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Operations Export · 运营导出
              </p>
              <h2 id="log-export-title" className="mt-1 text-xl font-bold text-text-primary">
                今日总结 Log 记录
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Day {meta.day} · {meta.studentName} · {meta.teamName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xl leading-none text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-border bg-slate-50/80 p-5">
            <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed text-text-primary">
              {text}
            </pre>
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            点击下方按钮复制全文，可直接粘贴到飞书、微信或文档中使用。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-white px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button
            onClick={() => void handleCopy()}
            className={clsx(copied && "bg-green-600 hover:bg-green-700")}
          >
            {copied ? "已复制 ✓" : "一键复制文本"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ExportButtonProps {
  log: DailyLog;
  meta: LogExportMeta;
  className?: string;
}

export function LogExportButton({ log, meta, className }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">📋</span>
        导出当日 Log
      </Button>
      <LogExportModal open={open} onClose={() => setOpen(false)} log={log} meta={meta} />
    </>
  );
}
