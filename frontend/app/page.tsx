"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoadingState } from "@/components/ui";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    router.replace(isAuthenticated() ? "/dashboard" : "/login");
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <LoadingState message="Redirecting..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted">
      <LoadingState message="Redirecting..." />
    </div>
  );
}
