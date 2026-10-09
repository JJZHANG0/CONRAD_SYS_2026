"use client";

import { useState } from "react";
import { LockKeyhole, LoaderCircle, LockKeyholeOpen } from "lucide-react";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/apiClient";
import { updateTeamContentLocks } from "@/lib/teamApi";

interface DocumentLockControlProps {
  teamId: number;
  kind: "bmc" | "brief";
  locked: boolean;
  onChanged: (locked: boolean) => void;
}

export function DocumentLockControl({
  teamId,
  kind,
  locked,
  onChanged,
}: DocumentLockControlProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const label = kind === "bmc" ? "BMC" : "IB";

  const toggleLock = async () => {
    const nextLocked = !locked;
    const confirmed = window.confirm(
      nextLocked
        ? `确认将 ${label} 设为定稿吗？定稿后任何人都无法修改，运营老师解锁后才能继续编辑。`
        : `确认解锁 ${label} 吗？解锁后学生和教练可继续修改内容。`
    );
    if (!confirmed) return;

    setUpdating(true);
    setError("");
    try {
      const result = await updateTeamContentLocks(teamId, {
        [kind === "bmc" ? "bmc_locked" : "innovation_brief_locked"]: nextLocked,
      });
      onChanged(kind === "bmc" ? result.bmc_locked : result.innovation_brief_locked);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white/65 p-3 text-left shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${locked ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
            {locked ? <LockKeyhole size={16} /> : <LockKeyholeOpen size={16} />}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-primary">
              {locked ? `${label} 已定稿` : `${label} 尚未定稿`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              {locked ? "当前内容已锁定，所有人只读" : "仅运营老师可以设为定稿"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={locked ? "secondary" : "primary"}
          onClick={toggleLock}
          disabled={updating}
          className="gap-1.5"
        >
          {updating ? <LoaderCircle size={14} className="animate-spin" /> : locked ? <LockKeyholeOpen size={14} /> : <LockKeyhole size={14} />}
          {locked ? "解锁修改" : "设为定稿"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
