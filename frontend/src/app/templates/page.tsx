"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints, unwrapList } from "@/lib/api";
import type { TemplateResource } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Download, ExternalLink, FileText } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateResource[]>([]);

  useEffect(() => {
    endpoints.templates().then((d) => setTemplates(unwrapList(d))).catch(console.error);
  }, []);

  const grouped = templates.reduce((acc, t) => {
    const stage = t.stage_name || "通用";
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(t);
    return acc;
  }, {} as Record<string, TemplateResource[]>);

  return (
    <DashboardLayout title="文件与模板库" subtitle="Template Library — 康莱德标准模板">
      <div className="space-y-8">
        {Object.entries(grouped).map(([stage, items]) => (
          <div key={stage}>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">{stage}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((t) => (
                <Card key={t.id} hover>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F5F3]">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{t.title}</h4>
                      <p className="text-xs text-[#787876] mt-0.5">{t.category}</p>
                      {t.description && <p className="text-xs text-[#A8A8A6] mt-1">{t.description}</p>}
                      <p className="text-[10px] text-[#A8A8A6] mt-2">
                        {t.uploaded_by_name} · {formatDate(t.updated_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[#F0F0EE]">
                    <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5" /> 下载</Button>
                    {t.external_link && (
                      <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /> 预览</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
