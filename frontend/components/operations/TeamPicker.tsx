"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { OperationsDashboard } from "@/types/team";

type TeamItem = OperationsDashboard["teams"][number];

interface Props {
  teams: TeamItem[];
  value: string;
  onChange: (teamId: string) => void;
  placeholder?: string;
}

function MemberSlots({ count, max = 5 }: { count: number; max?: number }) {
  const full = count >= max;
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={clsx(
              "h-2 w-2 rounded-full transition-colors",
              i < count ? (full ? "bg-amber-500" : "bg-primary") : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <span
        className={clsx(
          "text-xs font-medium tabular-nums",
          full ? "text-amber-600" : "text-text-secondary"
        )}
      >
        {count}/{max}
      </span>
    </div>
  );
}

export function TeamPicker({ teams, value, onChange, placeholder = "选择队伍" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => String(t.id) === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.project_name.toLowerCase().includes(q) ||
        t.challenge_category.toLowerCase().includes(q) ||
        (t.teacher_name || "").toLowerCase().includes(q)
    );
  }, [teams, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (team: TeamItem) => {
    if (team.member_count >= 5) return;
    onChange(String(team.id));
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "input-field flex w-full items-center justify-between gap-3 text-left",
          open && "border-primary ring-2 ring-primary/20",
          !selected && "text-text-secondary"
        )}
      >
        {selected ? (
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-text-primary">{selected.name}</span>
              <span className="block truncate text-xs text-text-secondary">{selected.project_name}</span>
            </span>
            <MemberSlots count={selected.member_count} />
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
        <svg
          className={clsx("h-4 w-4 shrink-0 text-text-secondary transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
          <div className="border-b border-border bg-gray-50/80 p-3">
            <input
              type="search"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="搜索队伍名、项目、类别、老师…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <p className="mt-2 text-[11px] text-text-secondary">
              {filtered.length} 支队伍 · 已满员队伍不可选
            </p>
          </div>

          <ul className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-text-secondary">没有匹配的队伍</li>
            ) : (
              filtered.map((team) => {
                const full = team.member_count >= 5;
                const active = String(team.id) === value;
                return (
                  <li key={team.id}>
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => pick(team)}
                      className={clsx(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                        full && "cursor-not-allowed opacity-50",
                        !full && !active && "hover:bg-primary-light/60",
                        active && !full && "bg-primary-light ring-1 ring-primary/30"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-text-primary">{team.name}</span>
                          {full && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              已满员
                            </span>
                          )}
                          {active && !full && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              已选
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">{team.project_name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-block rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-accent-purple">
                            {team.challenge_category}
                          </span>
                          {team.teacher_name && (
                            <span className="text-[11px] text-text-secondary">带队：{team.teacher_name}</span>
                          )}
                        </div>
                      </div>
                      <MemberSlots count={team.member_count} />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
