"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { Button, Input } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#F5F5F3] subtle-grid overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-violet-500/5" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white font-bold">
              C
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">Conrad Ops</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold text-[#1A1A1A] leading-tight tracking-tight">
              Conrad Team<br />Command Center
            </h1>
            <p className="mt-4 text-[#787876] text-lg leading-relaxed">
              Manage every team, milestone, lesson, and deliverable in one calm workspace.
            </p>
            <div className="mt-8 flex gap-6">
              {[
                { label: "队伍管理", value: "8+" },
                { label: "阶段追踪", value: "6" },
                { label: "评分维度", value: "20+" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-2xl font-semibold text-accent">{item.value}</p>
                  <p className="text-xs text-[#787876] mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#A8A8A6]">2026-2027 Conrad Challenge Season</p>
        </div>

        {/* Decorative nodes */}
        <div className="absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-accent/30" />
        <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-violet-400/40" />
        <div className="absolute bottom-1/3 right-1/5 h-3 w-3 rounded-full bg-accent/20" />
      </div>

      {/* Right login form */}
      <div className="flex flex-1 items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1A1A1A]">欢迎回来</h2>
            <p className="text-sm text-[#787876] mt-1">登录康莱德队伍管理中心</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#787876] mb-1.5 block">账号</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#787876] mb-1.5 block">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>

            <p className="text-center text-xs text-[#A8A8A6]">
              演示账号：admin / admin123
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
