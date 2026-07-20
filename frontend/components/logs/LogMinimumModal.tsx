"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

interface Props {
  open: boolean;
  fieldLabel: string;
  currentCount: number;
  minimum?: number;
  onClose: () => void;
}

export function LogMinimumModal({
  open,
  fieldLabel,
  currentCount,
  minimum = 100,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-minimum-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="关闭提示"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white px-7 py-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
            ✍️
          </div>
          <h2
            id="log-minimum-title"
            className="mt-4 text-xl font-bold text-text-primary"
          >
            不行～今天还学得不够多
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            「{fieldLabel}」还需要再写一点，把今天的过程、思考和收获记录得更具体吧！
          </p>
          <div className="mx-auto mt-5 max-w-xs rounded-xl border border-amber-200 bg-white/80 px-4 py-3">
            <p className="text-sm font-semibold text-amber-700">
              当前 {currentCount} 字 · 至少需要 {minimum} 字
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((currentCount / minimum) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center border-t border-border px-6 py-4">
          <Button onClick={onClose}>继续补充内容</Button>
        </div>
      </div>
    </div>
  );
}
