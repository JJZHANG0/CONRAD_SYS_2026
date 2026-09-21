import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Conrad Team Command Center",
  description: "康莱德队伍管理中心 — Manage every team, milestone, lesson, and deliverable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
