"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, BookOpen, Star,
  ClipboardList, AlertTriangle, Calendar, FolderOpen,
  Trophy, BarChart3, Settings, LogOut, Search, Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "总览", icon: LayoutDashboard },
  { href: "/teams", label: "队伍管理", icon: Users },
  { href: "/deliverables", label: "交付物", icon: FileText },
  { href: "/lessons", label: "课堂记录", icon: BookOpen },
  { href: "/teacher-evaluation", label: "导师评分", icon: Star },
  { href: "/team-scoring", label: "队伍评分", icon: ClipboardList },
  { href: "/risks", label: "风险看板", icon: AlertTriangle },
  { href: "/calendar", label: "课程日历", icon: Calendar },
  { href: "/templates", label: "模板库", icon: FolderOpen },
  { href: "/teacher-ranking", label: "导师排行", icon: Trophy },
  { href: "/analytics", label: "数据分析", icon: BarChart3 },
  { href: "/settings", label: "系统设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#E8E8E6] bg-white">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-[#E8E8E6]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-xs font-bold">
          C
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">Conrad Ops</p>
          <p className="text-[10px] text-[#787876]">Team Command Center</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-accent/8 text-accent"
                  : "text-[#787876] hover:bg-[#F5F5F3] hover:text-[#1A1A1A]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E8E8E6] p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[#787876] hover:bg-[#F5F5F3] hover:text-[#1A1A1A] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E8E8E6] bg-white/80 backdrop-blur-md px-8">
      <div>
        <h1 className="text-lg font-semibold text-[#1A1A1A]">{title}</h1>
        {subtitle && <p className="text-xs text-[#787876]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A8A6]" />
          <input
            placeholder="搜索队伍、导师、交付物..."
            className="h-9 w-64 rounded-xl border border-[#E8E8E6] bg-[#F5F5F3] pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E8E6] hover:bg-[#F5F5F3] transition-colors">
          <Bell className="h-4 w-4 text-[#787876]" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white text-sm font-medium">
          管
        </div>
      </div>
    </header>
  );
}

export function DashboardLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Sidebar />
      <div className="pl-[240px]">
        <Header title={title} subtitle={subtitle} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-[#787876] mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-accent transition-colors">{item.label}</Link>
          ) : (
            <span className="text-[#1A1A1A] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
