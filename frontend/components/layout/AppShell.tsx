"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, LogOut, Radar } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { Button, LoadingState } from "@/components/ui";

export function TopNav() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const roleLabel = user?.role === "operations" ? "运营" : user?.role === "teacher" ? "导师" : "学生";
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7fbfc]/72 shadow-[0_8px_28px_rgba(17,49,62,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 text-text-primary">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary text-white shadow-sm">
            <Radar size={19} strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Conrad Command</span>
            <span className="block truncate text-[10px] font-medium text-text-secondary">STEMHUB OPERATIONS</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-border hover:bg-white/70 hover:text-text-primary sm:inline-flex"
          >
            <LayoutDashboard size={15} /> 工作台
          </Link>
          {user && (
            <div className="hidden border-l border-border/80 pl-3 text-right sm:block">
              <span className="block text-xs font-semibold text-text-primary">{user.display_name}</span>
              <span className="block text-[10px] text-text-secondary">{roleLabel}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2.5"
            title="退出登录"
            onClick={async () => { await logout(); router.push("/login"); }}
          >
            <LogOut size={15} /> <span className="hidden sm:inline">退出</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="app-surface min-h-screen">
      <TopNav />
      <main className={clsx("mx-auto px-4 py-6 sm:px-6 sm:py-8", wide ? "max-w-7xl" : "max-w-6xl")}>{children}</main>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized, loadUser } = useAuthStore();
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (!initialized) {
      loadUser().then((u) => {
        if (!u) {
          clearTokens();
          setAuthFailed(true);
          router.replace("/login");
        }
      });
    }
  }, [initialized, loadUser, router]);

  if (authFailed) return null;

  if (!initialized || !user) {
    return (
      <div className="app-surface min-h-screen">
        <LoadingState message="Loading your account..." />
      </div>
    );
  }

  return <>{children}</>;
}
