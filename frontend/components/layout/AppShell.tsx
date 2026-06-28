"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuthStore } from "@/store/authStore";
import { isAuthenticated, clearTokens } from "@/lib/auth";
import { Button, LoadingState } from "@/components/ui";

export function TopNav() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-text-primary">
          Conrad <span className="text-primary">Log</span> System
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-text-primary">{user.display_name}</span>
              <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs capitalize text-primary">{user.role}</span>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.push("/login"); }}>Logout</Button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <TopNav />
      <main className={clsx("mx-auto px-6 py-8", wide ? "max-w-7xl" : "max-w-6xl")}>{children}</main>
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
      <div className="min-h-screen bg-surface-muted">
        <LoadingState message="Loading your account..." />
      </div>
    );
  }

  return <>{children}</>;
}
