"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { endpoints, unwrapList } from "@/lib/api";
import type { CalendarEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<"week" | "month">("week");

  useEffect(() => {
    endpoints.calendar().then((d) => setEvents(unwrapList(d))).catch(console.error);
  }, []);

  const grouped = events.reduce((acc, e) => {
    const day = new Date(e.start_time).toLocaleDateString("zh-CN", { weekday: "long", month: "short", day: "numeric" });
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <DashboardLayout title="课程日历" subtitle="Calendar — 课程安排与提醒">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">2027年3月</span>
          <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "week" ? "primary" : "secondary"} size="sm" onClick={() => setView("week")}>周视图</Button>
          <Button variant={view === "month" ? "primary" : "secondary"} size="sm" onClick={() => setView("month")}>月视图</Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day}>
            <p className="text-xs font-medium text-[#787876] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> {day}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dayEvents.map((event) => (
                <Card key={event.id} hover padding="sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{event.team_name}</p>
                      <p className="text-xs text-[#787876] mt-0.5">{event.topic}</p>
                    </div>
                    {event.feedback_submitted ? (
                      <StatusBadge status="approved" />
                    ) : (
                      <StatusBadge status="pending" />
                    )}
                  </div>
                  <div className="mt-2 text-xs text-[#A8A8A6]">
                    {formatDateTime(event.start_time)} · {event.mentor_name}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && (
        <Card><p className="text-center text-[#787876] py-12">暂无课程安排</p></Card>
      )}
    </DashboardLayout>
  );
}
