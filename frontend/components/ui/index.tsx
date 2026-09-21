import clsx from "clsx";
export { TextArea } from "./RichTextEditor";

export function Card({ children, className, hover, borderTop }: {
  children: React.ReactNode; className?: string; hover?: boolean;
  borderTop?: "blue" | "purple" | "yellow";
}) {
  return (
    <div className={clsx(
      "glass-panel rounded-xl p-5 card-shadow sm:p-6",
      hover && "card-hover cursor-pointer",
      borderTop === "blue" && "border-top-blue",
      borderTop === "purple" && "border-top-purple",
      borderTop === "yellow" && "border-top-yellow",
      className
    )}>{children}</div>
  );
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: {
  variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: "border border-primary bg-primary text-white shadow-sm hover:border-[#096c84] hover:bg-[#096c84]",
    secondary: "border border-border bg-white/72 text-text-primary hover:border-primary/35 hover:bg-white",
    ghost: "border border-transparent bg-transparent text-text-secondary hover:border-border/80 hover:bg-white/55 hover:text-text-primary",
  };
  const s = { sm: "min-h-8 px-3 py-1.5 text-xs", md: "min-h-10 px-4 py-2.5 text-sm" };
  return (
    <button className={clsx("inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-55", v[variant], s[size], className)} {...props}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    complete: "bg-green-50 text-green-700 border-green-200",
    incomplete: "bg-amber-50 text-amber-700 border-amber-200",
    commented: "bg-purple-50 text-purple-700 border-purple-200",
    pending: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const label: Record<string, string> = {
    complete: "Completed", incomplete: "In Progress", commented: "Commented", pending: "Pending",
  };
  return (
    <span className={clsx("inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium", map[status] || map.pending)}>
      {label[status] || status}
    </span>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-text-secondary"><span>{label}</span><span>{value}/{max}</span></div>}
      <div className="h-1.5 overflow-hidden rounded-full bg-[#dfe9ed]">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "blue" | "purple" | "yellow" }) {
  const bg = {
    blue: "border-cyan-200/70 bg-cyan-50/55",
    purple: "border-violet-200/70 bg-violet-50/45",
    yellow: "border-amber-200/70 bg-amber-50/55",
  };
  return (
    <div className={clsx("rounded-lg border border-border bg-white/55 p-4", accent && bg[accent])}>
      <p className="text-xl font-semibold tabular-nums text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

export function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "failed" }) {
  if (status === "idle") return null;
  const m = { saving: "Saving...", saved: "Saved ✓", failed: "Save failed" };
  const c = { saving: "text-amber-600", saved: "text-green-600", failed: "text-red-500" };
  return <span className={clsx("text-xs font-medium", c[status])}>{m[status]}</span>;
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      <p className="mt-3 text-sm text-text-secondary">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-medium text-text-primary">{title}</p>
      {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
    </div>
  );
}
