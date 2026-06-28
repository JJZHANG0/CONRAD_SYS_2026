import clsx from "clsx";
export { TextArea } from "./RichTextEditor";

export function Card({ children, className, hover, borderTop }: {
  children: React.ReactNode; className?: string; hover?: boolean;
  borderTop?: "blue" | "purple" | "yellow";
}) {
  return (
    <div className={clsx(
      "rounded-2xl border border-border bg-white p-6 card-shadow",
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
    primary: "bg-primary text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-text-primary border border-border hover:bg-gray-50",
    ghost: "bg-transparent text-text-secondary hover:bg-gray-100",
  };
  const s = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm" };
  return (
    <button className={clsx("inline-flex items-center justify-center rounded-xl font-medium transition-all", v[variant], s[size], className)} {...props}>
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
    <span className={clsx("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", map[status] || map.pending)}>
      {label[status] || status}
    </span>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-text-secondary"><span>{label}</span><span>{value}/{max}</span></div>}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "blue" | "purple" | "yellow" }) {
  const bg = { blue: "bg-primary-light", purple: "bg-purple-50", yellow: "bg-yellow-50" };
  return (
    <div className={clsx("rounded-2xl border border-border p-4", accent && bg[accent])}>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
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
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
