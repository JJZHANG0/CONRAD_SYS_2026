"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  FileText,
  LoaderCircle,
  PackageOpen,
  TriangleAlert,
} from "lucide-react";
import { Button, Card, ProgressBar } from "@/components/ui";
import type { OperationsDashboard } from "@/types/team";
import {
  exportAllTeamDocuments,
  type BulkDocumentFormat,
  type BulkDocumentKind,
  type BulkExportProgress,
} from "@/utils/bulkExport";

type ExportKey = `${BulkDocumentKind}-${BulkDocumentFormat}`;

interface Props {
  teams: OperationsDashboard["teams"];
}

const EXPORTS: Array<{
  key: ExportKey;
  kind: BulkDocumentKind;
  format: BulkDocumentFormat;
  label: string;
}> = [
  { key: "bmc-docx", kind: "bmc", format: "docx", label: "BMC · Word ZIP" },
  { key: "bmc-pdf", kind: "bmc", format: "pdf", label: "BMC · PDF ZIP" },
  { key: "brief-docx", kind: "brief", format: "docx", label: "IB · Word ZIP" },
  { key: "brief-pdf", kind: "brief", format: "pdf", label: "IB · PDF ZIP" },
];

export function BulkDocumentExport({ teams }: Props) {
  const [active, setActive] = useState<ExportKey | null>(null);
  const [progress, setProgress] = useState<BulkExportProgress | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<ExportKey | null>(null);

  const run = async (
    key: ExportKey,
    kind: BulkDocumentKind,
    format: BulkDocumentFormat,
  ) => {
    setActive(key);
    setCompleted(null);
    setError("");
    setProgress(null);
    try {
      await exportAllTeamDocuments(teams, kind, format, setProgress);
      setCompleted(key);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "批量导出失败，请重试");
    } finally {
      setActive(null);
    }
  };

  const percent = progress?.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Card className="h-full !p-5">
      <div className="flex items-start gap-3">
        <span className="icon-tile icon-tile-amber" aria-hidden="true">
          <PackageOpen size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-text-primary">全队文档中心</h2>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            每次生成一个 ZIP，包含当前全部 {teams.length} 支队伍。
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EXPORTS.map((item) => {
          const isActive = active === item.key;
          const isDone = completed === item.key;
          return (
            <Button
              key={item.key}
              variant="secondary"
              size="sm"
              className="justify-start gap-2"
              disabled={active !== null}
              title={`下载全部队伍的 ${item.label}`}
              onClick={() => void run(item.key, item.kind, item.format)}
            >
              {isActive ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : isDone ? (
                <CheckCircle2 size={15} className="text-emerald-600" />
              ) : item.format === "pdf" ? (
                <Archive size={15} />
              ) : (
                <FileText size={15} />
              )}
              {item.label}
            </Button>
          );
        })}
      </div>

      {progress && active && (
        <div className="mt-4 rounded-lg border border-border/80 bg-white/55 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
            <span className="truncate">
              {progress.phase === "packing" ? "正在压缩 ZIP…" : `正在生成：${progress.teamName}`}
            </span>
            <span className="shrink-0 tabular-nums">{percent}%</span>
          </div>
          <ProgressBar value={progress.completed} max={progress.total} />
        </div>
      )}

      {completed && !active && (
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={14} /> ZIP 已生成并开始下载
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-rose-700">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </Card>
  );
}
