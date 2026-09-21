"use client";

import { DashboardLayout } from "@/components/layout/sidebar";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const settingsSections = [
  {
    title: "用户管理",
    desc: "管理系统用户账号与基本信息",
    items: ["添加用户", "编辑角色", "禁用账号"],
  },
  {
    title: "角色权限",
    desc: "Super Admin / 项目经理 / 教务 / 导师 / 查看者",
    items: ["Super Admin: 全部权限", "项目经理: 队伍与评分", "教务: 课堂记录", "导师: 交付物上传"],
  },
  {
    title: "评分规则",
    desc: "导师评分与队伍评分维度配置",
    items: ["A-E 五维评分", "12项队伍维度", "等级自动计算"],
  },
  {
    title: "赛季设置",
    desc: "当前赛季：2026-2027 Conrad Challenge",
    items: ["赛季名称", "阶段时间", "交付物模板"],
  },
  {
    title: "通知提醒",
    desc: "交付物到期、反馈逾期、风险预警",
    items: ["邮件通知", "系统提醒", "周报推送"],
  },
  {
    title: "数据导出",
    desc: "导出评分报告与队伍数据",
    items: ["导师评分报告", "队伍数据 CSV", "交付物清单"],
  },
];

export default function SettingsPage() {
  return (
    <DashboardLayout title="系统设置" subtitle="Settings — 系统配置与管理">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => (
          <Card key={section.title} hover>
            <CardHeader title={section.title} subtitle={section.desc} />
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item} className="text-sm text-[#787876] flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" className="mt-4">配置</Button>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
