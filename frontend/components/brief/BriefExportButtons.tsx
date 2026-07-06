"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { InnovationBrief } from "@/types/brief";
import { exportBriefDocx, exportBriefPdf, type BriefExportMeta } from "@/utils/briefExport";

interface Props {
  brief: InnovationBrief;
  meta: BriefExportMeta;
}

export function BriefExportButtons({ brief, meta }: Props) {
  const [loading, setLoading] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState("");

  const run = async (format: "pdf" | "docx") => {
    setLoading(format);
    setError("");
    try {
      if (format === "pdf") {
        await exportBriefPdf(brief, meta);
      } else {
        await exportBriefDocx(brief, meta);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "导出失败，请重试";
      setError(message.includes("失败") || message.includes("无法") ? message : "导出失败，请重试");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary-light/40 p-4">
      <p className="mb-1 text-sm font-semibold text-text-primary">运营导出 · Operations Export</p>
      <p className="mb-3 text-xs text-text-secondary">选择格式下载当前队伍的 Innovation Brief</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={!!loading}
          onClick={() => run("pdf")}
        >
          {loading === "pdf" ? "生成 PDF…" : "导出 PDF（推荐）"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!!loading}
          onClick={() => run("docx")}
        >
          {loading === "docx" ? "生成 Word…" : "导出 Word (.docx)"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
