import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-light shadow-sm",
    secondary: "bg-white border border-[#E8E8E6] text-[#1A1A1A] hover:bg-[#F5F5F3]",
    ghost: "text-[#787876] hover:text-[#1A1A1A] hover:bg-[#F5F5F3]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-9 px-4 text-sm rounded-xl",
    lg: "h-11 px-6 text-sm rounded-xl",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[#E8E8E6] bg-white px-3.5 text-sm",
        "placeholder:text-[#A8A8A6] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
        "transition-all duration-150",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[#E8E8E6] bg-white px-3.5 py-2.5 text-sm min-h-[100px]",
        "placeholder:text-[#A8A8A6] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
        "transition-all duration-150 resize-y",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-xl border border-[#E8E8E6] bg-white px-3 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
