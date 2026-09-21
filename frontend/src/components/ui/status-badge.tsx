import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const VALID_VARIANTS = [
  "normal", "attention", "critical", "completed", "in_progress",
  "overdue", "needs_revision", "approved", "submitted", "not_started",
  "default", "S", "A", "B", "C", "D",
] as const;

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        normal: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
        attention: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
        critical: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
        completed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
        in_progress: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
        overdue: "bg-red-50 text-red-600 ring-1 ring-red-200/60",
        needs_revision: "bg-orange-50 text-orange-700 ring-1 ring-orange-200/60",
        approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
        submitted: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
        not_started: "bg-gray-50 text-gray-600 ring-1 ring-gray-200/60",
        default: "bg-gray-50 text-gray-600 ring-1 ring-gray-200/60",
        S: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
        A: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
        B: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
        C: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
        D: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const labels: Record<string, string> = {
  normal: "正常推进",
  attention: "需要关注",
  critical: "需要介入",
  completed: "已完成",
  in_progress: "进行中",
  overdue: "已逾期",
  needs_revision: "需修改",
  approved: "已通过",
  submitted: "已提交",
  not_started: "未开始",
  open: "待处理",
  resolved: "已解决",
  pending: "待提交",
  S: "S级",
  A: "A级",
  B: "B级",
  C: "C级",
  D: "D级",
};

function toVariant(status: string): BadgeVariant {
  if (VALID_VARIANTS.includes(status as typeof VALID_VARIANTS[number])) {
    return status as BadgeVariant;
  }
  return "default";
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span className={cn(badgeVariants({ variant: toVariant(status) }), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {labels[status] || status}
    </span>
  );
}

export function RiskDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    normal: "bg-emerald-500",
    attention: "bg-amber-500",
    critical: "bg-red-500",
  };
  return <span className={cn("h-2 w-2 rounded-full", colors[status] || "bg-gray-400")} />;
}
