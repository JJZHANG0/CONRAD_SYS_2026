"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, Input, Textarea, Select } from "@/components/ui/button";
import { endpoints, unwrapList } from "@/lib/api";
import type { LessonRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Star } from "lucide-react";

const SCORE_ITEMS = [
  { key: "准时上课", max: 1 }, { key: "备课充分", max: 2 },
  { key: "课堂目标清晰", max: 1 }, { key: "学生互动有效", max: 1 },
  { key: "项目推进明显", max: 2 }, { key: "课后任务明确", max: 1 },
  { key: "课后反馈及时", max: 1 }, { key: "沟通配合度", max: 1 },
];

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    endpoints.lessons().then((d) => setLessons(unwrapList(d))).catch(console.error);
  }, []);

  return (
    <DashboardLayout title="课堂记录" subtitle="Lesson Records — 教务课堂管理">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-[#787876]">共 {lessons.length} 条课堂记录</p>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "收起表单" : "+ 新建课堂记录"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader title="新建课堂记录" subtitle="分区填写，体验舒适" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-xs font-medium text-[#787876] uppercase tracking-wide">基本信息</p>
              <div><label className="text-xs text-[#787876] mb-1 block">队伍</label><Select><option>选择队伍</option></Select></div>
              <div><label className="text-xs text-[#787876] mb-1 block">上课时间</label><Input type="datetime-local" /></div>
              <div><label className="text-xs text-[#787876] mb-1 block">授课导师</label><Select><option>选择导师</option></Select></div>
              <div><label className="text-xs text-[#787876] mb-1 block">课程主题</label><Input placeholder="本节课主题" /></div>
              <div><label className="text-xs text-[#787876] mb-1 block">本节课目标</label><Textarea placeholder="本节课计划完成的目标" /></div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-medium text-[#787876] uppercase tracking-wide">课堂情况</p>
              <div><label className="text-xs text-[#787876] mb-1 block">实际完成内容</label><Textarea /></div>
              <div><label className="text-xs text-[#787876] mb-1 block">学生课堂表现</label><Textarea /></div>
              <div><label className="text-xs text-[#787876] mb-1 block">课后任务</label><Textarea /></div>
              <div><label className="text-xs text-[#787876] mb-1 block">下节课计划</label><Textarea /></div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[#E8E8E6]">
            <p className="text-xs font-medium text-[#787876] uppercase tracking-wide mb-4">教务评分 (10分制)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SCORE_ITEMS.map((item) => (
                <div key={item.key} className="rounded-xl bg-[#F5F5F3] p-3">
                  <p className="text-xs text-[#787876]">{item.key}</p>
                  <p className="text-xs text-[#A8A8A6]">满分 {item.max}分</p>
                  <Input type="number" min={0} max={item.max} className="mt-2 h-8" placeholder="0" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button>保存记录</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} hover>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{lesson.topic}</h3>
                  <StatusBadge status={lesson.mentor_feedback_status} />
                </div>
                <p className="text-xs text-[#787876]">
                  {lesson.team_name} · {lesson.mentor_name} · {formatDateTime(lesson.lesson_time)}
                </p>
              </div>
              {lesson.admin_score && (
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="h-4 w-4 text-amber-500" />
                  {lesson.admin_score}/10
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-[#F5F5F3] p-3">
                <p className="text-[#787876] mb-1">完成内容</p>
                <p>{lesson.completed_content || "—"}</p>
              </div>
              <div className="rounded-lg bg-[#F5F5F3] p-3">
                <p className="text-[#787876] mb-1">学生表现</p>
                <p>{lesson.student_performance || "—"}</p>
              </div>
              <div className="rounded-lg bg-[#F5F5F3] p-3">
                <p className="text-[#787876] mb-1">课后任务</p>
                <p>{lesson.homework || "—"}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
