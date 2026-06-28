import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STEMHUB CONRAD CHALLENGE SYS.",
  description: "康莱德队伍学习日志与创新简报管理系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
