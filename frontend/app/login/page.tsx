"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Card, Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/apiClient";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="app-surface flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[430px]">
        <div className="mb-7">
          <div className="relative h-[68px] w-[258px] overflow-hidden">
            <Image
              src="/conrad-challenge-logo.png"
              alt="Conrad Challenge"
              fill
              priority
              sizes="258px"
              className="object-cover object-center mix-blend-multiply"
            />
          </div>
          <p className="mt-3 text-xs font-semibold text-primary">STEMHUB OPERATIONS</p>
          <h1 className="mt-1 text-xl font-semibold text-text-primary">项目运营指挥中心</h1>
        </div>
        <Card className="glass-strong !p-6 sm:!p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary">登录系统</h2>
            <p className="mt-1 text-sm text-text-secondary">队伍进度、学习日志与创新材料管理</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">姓名 / Name</label>
              <div className="relative">
                <UserRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input className="input-field !pl-10" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入中文姓名或账号" autoComplete="username" required />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text-secondary">密码 / Password</label>
              <div className="relative">
                <LockKeyhole size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input type="password" className="input-field !pl-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" autoComplete="current-password" required />
              </div>
            </div>
            {error && <p className="rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "正在登录…" : "进入工作台"} {!loading && <ArrowRight size={16} />}
            </Button>
          </form>
        </Card>
        <div className="mt-5 flex items-center justify-between text-[11px] text-text-secondary">
          <span>2026-2027 SEASON</span>
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> SYSTEM ONLINE</span>
        </div>
      </div>
    </div>
  );
}
