"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, LogOut } from "lucide-react";
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
        <Link href="/dashboard" className="flex min-w-0 items-center" aria-label="Conrad Challenge 工作台">
          <span className="relative block h-[46px] w-[138px] shrink-0 sm:h-[54px] sm:w-[174px]">
            <Image
              src="/conrad-challenge-logo-transparent.png"
              alt="Conrad Challenge"
              fill
              priority
              sizes="(max-width: 640px) 138px, 174px"
              className="object-contain object-left"
            />
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
            <div className="hidden h-8 items-center gap-2 border-l border-border/80 pl-3 sm:flex">
              <span className="text-xs font-semibold leading-none text-text-primary">{user.display_name}</span>
              <span className="rounded-md border border-primary/15 bg-primary-light/70 px-1.5 py-1 text-[10px] font-medium leading-none text-primary">
                {roleLabel}
              </span>
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
