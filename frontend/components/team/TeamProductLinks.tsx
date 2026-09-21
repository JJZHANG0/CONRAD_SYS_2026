"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  CheckCircle2,
  ExternalLink,
  Globe2,
  Link2,
  Play,
  Save,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { getErrorMessage } from "@/lib/apiClient";
import { updateTeamProductLinks } from "@/lib/teamApi";
import type { TeamProductLinks } from "@/types/team";

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

export function TeamProductLink({
  kind,
  url,
  compact = false,
}: {
  kind: "website" | "video";
  url?: string;
  compact?: boolean;
}) {
  const isWebsite = kind === "website";
  const label = isWebsite ? "产品网站" : "产品视频";
  const Icon = isWebsite ? Globe2 : Play;
  const normalizedUrl = url ? normalizeUrl(url) : "";
  const className = clsx(
    "flex min-w-0 items-center gap-2 rounded-lg border border-white/70 bg-white/60 text-left shadow-[0_4px_14px_rgba(18,48,63,0.04)]",
    compact ? "min-h-9 px-2.5 py-2" : "min-h-12 px-3.5 py-3"
  );

  if (!normalizedUrl) {
    return (
      <span className={clsx(className, "text-text-secondary/75")}>
        <Icon size={compact ? 14 : 16} className="shrink-0" />
        <span className="min-w-0">
          <span className={clsx("block font-medium", compact ? "text-[10px]" : "text-xs")}>{label}</span>
          <span className={clsx("block truncate", compact ? "text-[10px]" : "text-xs")}>待添加</span>
        </span>
      </span>
    );
  }

  return (
    <a
      href={normalizedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(className, "pointer-events-auto text-text-primary transition hover:border-primary/30 hover:bg-white")}
      title={`打开${label}`}
      onClick={(event) => event.stopPropagation()}
    >
      <Icon size={compact ? 14 : 16} className="shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className={clsx("block font-medium", compact ? "text-[10px]" : "text-xs")}>{label}</span>
        <span className={clsx("block truncate text-text-secondary", compact ? "text-[10px]" : "text-xs")}>打开链接</span>
      </span>
      <ExternalLink size={compact ? 12 : 14} className="shrink-0 text-text-secondary" />
    </a>
  );
}

function LinkInput({
  id,
  label,
  value,
  onChange,
  kind,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: "website" | "video";
}) {
  const Icon = kind === "website" ? Globe2 : Play;
  const normalizedUrl = value ? normalizeUrl(value) : "";

  return (
    <div className="block min-w-0">
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-text-primary">{label}</label>
      <span className="relative block">
        <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          id={id}
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={kind === "website" ? "https://your-product.com" : "https://video-platform.com/..."}
          className="input-field !h-11 !pl-10 !pr-11 text-sm"
        />
        {normalizedUrl && (
          <a
            href={normalizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary transition hover:bg-surface-muted hover:text-primary"
            title={`打开${label}`}
            aria-label={`打开${label}`}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </span>
    </div>
  );
}

export function TeamProductLinksPanel({
  teamId,
  links,
  canEdit,
  onSaved,
}: {
  teamId: number;
  links: TeamProductLinks;
  canEdit: boolean;
  onSaved: (links: TeamProductLinks) => void;
}) {
  const [websiteUrl, setWebsiteUrl] = useState(links.product_website_url || "");
  const [videoUrl, setVideoUrl] = useState(links.product_video_url || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setWebsiteUrl(links.product_website_url || "");
    setVideoUrl(links.product_video_url || "");
  }, [links.product_website_url, links.product_video_url]);

  const normalized = useMemo(() => ({
    product_website_url: normalizeUrl(websiteUrl),
    product_video_url: normalizeUrl(videoUrl),
  }), [videoUrl, websiteUrl]);
  const hasChanges =
    normalized.product_website_url !== (links.product_website_url || "") ||
    normalized.product_video_url !== (links.product_video_url || "");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const result = await updateTeamProductLinks(teamId, normalized);
      setWebsiteUrl(result.product_website_url);
      setVideoUrl(result.product_video_url);
      onSaved(result);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 !p-5 sm:!p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="icon-tile" aria-hidden="true"><Link2 size={17} /></span>
          <div>
            <h2 className="font-semibold text-text-primary">产品展示</h2>
            <p className="mt-1 text-xs text-text-secondary">网站与演示视频</p>
          </div>
        </div>
        {!canEdit && (
          <span className="rounded-md border border-border bg-white/55 px-2.5 py-1 text-[11px] text-text-secondary">只读</span>
        )}
      </div>

      {canEdit ? (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <LinkInput id={`team-${teamId}-website`} label="产品网站" value={websiteUrl} onChange={setWebsiteUrl} kind="website" />
            <LinkInput id={`team-${teamId}-video`} label="产品视频" value={videoUrl} onChange={setVideoUrl} kind="video" />
          </div>
          <div className="mt-4 flex min-h-10 flex-wrap items-center justify-end gap-3">
            {error && <p className="mr-auto text-xs text-red-600">{error}</p>}
            {saved && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 size={14} /> 已保存</span>}
            <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
              <Save size={15} /> {saving ? "保存中…" : "保存链接"}
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TeamProductLink kind="website" url={links.product_website_url} />
          <TeamProductLink kind="video" url={links.product_video_url} />
        </div>
      )}
    </Card>
  );
}
