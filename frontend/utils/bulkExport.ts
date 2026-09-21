import JSZip from "jszip";
import { saveAs } from "file-saver";
import { fetchLeanCanvas } from "@/lib/bmcApi";
import { fetchBrief } from "@/lib/briefApi";
import type { OperationsDashboard } from "@/types/team";
import {
  createBmcDocxBlob,
  createBmcPdfBlob,
  type BmcExportMeta,
} from "@/utils/bmcExport";
import {
  createBriefDocxBlob,
  createBriefPdfBlob,
  type BriefExportMeta,
} from "@/utils/briefExport";

export type BulkDocumentKind = "bmc" | "brief";
export type BulkDocumentFormat = "docx" | "pdf";

export interface BulkExportProgress {
  completed: number;
  total: number;
  teamName: string;
  phase: "rendering" | "packing";
}

function safeFilename(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, "_").trim() || "Team";
}

function dateStamp(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function exportAllTeamDocuments(
  teams: OperationsDashboard["teams"],
  kind: BulkDocumentKind,
  format: BulkDocumentFormat,
  onProgress?: (progress: BulkExportProgress) => void,
): Promise<void> {
  if (!teams.length) throw new Error("当前没有可导出的队伍");

  const zip = new JSZip();
  const label = kind === "bmc" ? "Lean_Canvas_BMC" : "Innovation_Brief";

  for (let index = 0; index < teams.length; index += 1) {
    const team = teams[index];
    onProgress?.({
      completed: index,
      total: teams.length,
      teamName: team.name,
      phase: "rendering",
    });

    const meta: BmcExportMeta | BriefExportMeta = {
      teamName: team.name,
      projectName: team.project_name,
      challengeCategory: team.challenge_category,
      teacherName: team.teacher_name,
    };

    try {
      const blob = kind === "bmc"
        ? format === "pdf"
          ? await createBmcPdfBlob(await fetchLeanCanvas(team.id), meta)
          : await createBmcDocxBlob(await fetchLeanCanvas(team.id), meta)
        : format === "pdf"
          ? await createBriefPdfBlob(await fetchBrief(team.id), meta)
          : await createBriefDocxBlob(await fetchBrief(team.id), meta);

      const order = String(index + 1).padStart(2, "0");
      zip.file(`${order}_${safeFilename(team.name)}_${label}.${format}`, blob);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "未知错误";
      throw new Error(`「${team.name}」生成失败：${detail}`);
    }

    onProgress?.({
      completed: index + 1,
      total: teams.length,
      teamName: team.name,
      phase: "rendering",
    });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  onProgress?.({
    completed: teams.length,
    total: teams.length,
    teamName: "",
    phase: "packing",
  });
  const archive = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 3 },
  });
  saveAs(
    archive,
    `Conrad_All_Teams_${label}_${format.toUpperCase()}_${dateStamp()}.zip`,
  );
}
