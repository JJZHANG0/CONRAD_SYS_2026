import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, hover, padding = "md" }: CardProps) {
  const paddings = { sm: "p-4", md: "p-5", lg: "p-6" };
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E8E6] bg-white shadow-card",
        paddings[padding],
        hover && "transition-all duration-200 hover:shadow-soft hover:border-[#D8D8D6]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
        {subtitle && <p className="text-xs text-[#787876] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#787876] uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-[#1A1A1A] mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-[#787876] mt-1">{sub}</p>}
          {trend && (
            <p className={cn("text-xs mt-1 font-medium", trend.positive ? "text-emerald-600" : "text-red-500")}>
              {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F3] text-[#787876]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
