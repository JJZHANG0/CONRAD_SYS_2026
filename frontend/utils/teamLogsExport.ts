import type { DailyLog } from "@/types/log";
import type { TeamDetail, TeamMember } from "@/types/team";
import { stripHtml } from "@/utils/richText";

export interface StudentLogsBundle {
  member: TeamMember;
  logs: DailyLog[];
}

const PAGE_WIDTH_PX = 794;

function safeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "Team_Logs";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plain(value: string): string {
  return escapeHtml(stripHtml(value) || "（暂无内容）");
}

function formatDate(): string {
  return new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const baseStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #fff;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Microsoft YaHei", "Noto Sans SC", sans-serif;
  }
  .block { width: ${PAGE_WIDTH_PX}px; padding: 22px 28px; background: #fff; }
  p { margin: 0; }
`;

function coverHtml(team: TeamDetail, bundles: StudentLogsBundle[]): string {
  const totalLogs = bundles.reduce((sum, b) => sum + b.logs.length, 0);
  const completed = bundles.reduce(
    (sum, b) => sum + b.logs.filter((log) => log.is_complete).length,
    0
  );
  const comments = bundles.reduce(
    (sum, b) => sum + b.logs.filter((log) => log.has_teacher_comment).length,
    0
  );
  return `
    <div class="block">
      <div class="cover">
        <p class="brand">CONRAD CHALLENGE · STEMHUB</p>
        <h1>全队每日学习日志汇总</h1>
        <p class="subtitle">Team Daily Logs & Teacher Comments</p>
        <div class="meta">
          <div><span>队伍 / Team</span><strong>${escapeHtml(team.name)}</strong></div>
          <div><span>项目 / Project</span><strong>${escapeHtml(team.project_name || "—")}</strong></div>
          <div><span>赛道 / Category</span><strong>${escapeHtml(team.challenge_category || "—")}</strong></div>
          <div><span>带队老师 / Teacher</span><strong>${escapeHtml(team.teacher.display_name || "—")}</strong></div>
          <div><span>学生人数 / Members</span><strong>${bundles.length}</strong></div>
          <div><span>导出时间 / Exported</span><strong>${escapeHtml(formatDate())}</strong></div>
        </div>
      </div>
      <div class="summary">
        <div><strong>${completed}/${totalLogs}</strong><span>已完成日志</span></div>
        <div><strong>${comments}/${totalLogs}</strong><span>老师已评语</span></div>
        <div><strong>${bundles.length}</strong><span>汇总学生</span></div>
      </div>
    </div>
    <style>
      ${baseStyles}
      .cover {
        min-height: 570px; border-radius: 20px; padding: 54px 46px;
        color: white; background: linear-gradient(135deg, #2563eb, #4f46e5 55%, #7c3aed);
      }
      .brand { font-size: 12px; letter-spacing: .16em; opacity: .86; }
      h1 { margin: 78px 0 8px; font-size: 38px; line-height: 1.25; }
      .subtitle { font-size: 18px; opacity: .9; }
      .meta {
        display: grid; grid-template-columns: 1fr 1fr; gap: 18px 30px;
        margin-top: 54px; padding: 24px; border-radius: 14px;
        background: rgba(255,255,255,.13);
      }
      .meta span { display: block; margin-bottom: 4px; font-size: 11px; opacity: .78; }
      .meta strong { font-size: 14px; font-weight: 600; }
      .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 20px; }
      .summary div { padding: 18px; text-align: center; border: 1px solid #dbeafe; border-radius: 14px; background:#eff6ff; }
      .summary strong { display:block; color:#2563eb; font-size:24px; }
      .summary span { color:#64748b; font-size:11px; }
    </style>
  `;
}

function studentHeaderHtml(bundle: StudentLogsBundle, index: number): string {
  const { student, student_role } = bundle.member;
  const complete = bundle.logs.filter((log) => log.is_complete).length;
  const comments = bundle.logs.filter((log) => log.has_teacher_comment).length;
  return `
    <div class="block">
      <div class="student-head">
        <div class="number">${String(index + 1).padStart(2, "0")}</div>
        <div class="identity">
          <p class="eyebrow">STUDENT LOG COLLECTION · 学生日志汇总</p>
          <h2>${escapeHtml(student.display_name)}</h2>
          <p class="details">${escapeHtml(
            [student.grade, student.school, student_role].filter(Boolean).join(" · ") || "—"
          )}</p>
        </div>
        <div class="counts">
          <span><strong>${complete}/5</strong> 日志完成</span>
          <span><strong>${comments}/5</strong> 老师评语</span>
        </div>
      </div>
    </div>
    <style>
      ${baseStyles}
      .student-head {
        display:flex; align-items:center; gap:18px; padding:22px 24px;
        border-radius:16px; color:white; background:linear-gradient(135deg,#1e40af,#4338ca);
      }
      .number {
        display:flex; align-items:center; justify-content:center; width:54px; height:54px;
        border-radius:14px; background:rgba(255,255,255,.16); font-size:20px; font-weight:700;
      }
      .identity { flex:1; }
      .eyebrow { font-size:9px; letter-spacing:.12em; opacity:.75; }
      h2 { margin:4px 0 2px; font-size:24px; }
      .details { font-size:11px; opacity:.82; }
      .counts { display:flex; gap:10px; }
      .counts span { min-width:82px; padding:10px; text-align:center; border-radius:10px; background:rgba(255,255,255,.12); font-size:10px; }
      .counts strong { display:block; margin-bottom:2px; font-size:15px; }
    </style>
  `;
}

const sections: Array<{ key: keyof DailyLog; title: string }> = [
  { key: "work_content", title: "Student Log · 学生日志" },
  {
    key: "task_completion",
    title: "Pending Tasks / Tomorrow's Plan · 待完成任务 / 明日计划",
  },
  {
    key: "problems_solutions",
    title: "Problems & Solutions · 遇到问题与解决方法",
  },
  { key: "reflection", title: "Reflection · 当日收获与反思" },
  { key: "teacher_comment", title: "Teacher Comment · 老师评语" },
];

function logHtml(log: DailyLog): string {
  const sectionHtml = sections
    .map(({ key, title }) => {
      const isComment = key === "teacher_comment";
      return `
        <section class="${isComment ? "comment" : ""}">
          <h3>${escapeHtml(title)}</h3>
          <p>${plain(String(log[key] || ""))}</p>
        </section>
      `;
    })
    .join("");

  return `
    <div class="block">
      <article class="log-card">
        <header>
          <div>
            <span class="day">DAY ${log.day}</span>
            <h2>第 ${log.day} 天学习日志</h2>
          </div>
          <div class="status">
            <span class="${log.is_complete ? "ok" : "pending"}">${log.is_complete ? "日志已完成" : "日志未完成"}</span>
            <span class="${log.has_teacher_comment ? "commented" : "pending"}">${log.has_teacher_comment ? "老师已评语" : "暂无评语"}</span>
          </div>
        </header>
        ${sectionHtml}
      </article>
    </div>
    <style>
      ${baseStyles}
      .log-card { overflow:hidden; border:1px solid #dbe3ef; border-radius:15px; }
      header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 20px; background:#f8fafc; border-bottom:3px solid #2563eb; }
      .day { color:#2563eb; font-size:10px; font-weight:700; letter-spacing:.12em; }
      h2 { margin:3px 0 0; font-size:19px; }
      .status { display:flex; gap:7px; }
      .status span { padding:5px 9px; border-radius:999px; font-size:9px; font-weight:600; }
      .ok { color:#047857; background:#d1fae5; }
      .commented { color:#6d28d9; background:#ede9fe; }
      .pending { color:#64748b; background:#e2e8f0; }
      section { padding:15px 20px; border-bottom:1px solid #e8edf4; }
      section:last-child { border-bottom:0; }
      section h3 { margin:0 0 7px; color:#334155; font-size:11px; }
      section p { color:#0f172a; font-size:12px; line-height:1.75; white-space:pre-wrap; overflow-wrap:anywhere; }
      section.comment { background:#faf5ff; border-left:4px solid #7c3aed; }
      section.comment h3 { color:#6d28d9; }
    </style>
  `;
}

async function renderBlock(html: string): Promise<HTMLCanvasElement> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "team-logs-pdf-renderer");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${PAGE_WIDTH_PX}px`,
    border: "none",
    opacity: "0.01",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) throw new Error("无法创建 PDF 渲染环境");
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
    doc.close();

    const root = doc.querySelector(".block") as HTMLElement | null;
    if (!root) throw new Error("PDF 内容加载失败");
    iframe.style.height = `${root.scrollHeight + 10}px`;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const html2canvas = (await import("html2canvas")).default;
    return await html2canvas(root, {
      scale: 1.25,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: PAGE_WIDTH_PX,
      windowWidth: PAGE_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }
}

export async function exportTeamLogsPdf(
  team: TeamDetail,
  bundles: StudentLogsBundle[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 8;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentBottom = pageHeight - 12;
  let y = margin;
  let hasContent = false;

  const blocks = [
    coverHtml(team, bundles),
    ...bundles.flatMap((bundle, index) => [
      studentHeaderHtml(bundle, index),
      ...[1, 2, 3, 4, 5].map((day) => {
        const log = bundle.logs.find((item) => item.day === day);
        return logHtml(
          log || {
            id: -day,
            team: team.id,
            student: bundle.member.student.id,
            day,
            work_content: "",
            task_completion: "",
            problems_solutions: "",
            reflection: "",
            teacher_comment: "",
            teacher_comment_updated_at: null,
            is_complete: false,
            has_teacher_comment: false,
            updated_at: "",
          }
        );
      }),
    ]),
  ];

  for (let index = 0; index < blocks.length; index += 1) {
    const canvas = await renderBlock(blocks[index]);
    const image = canvas.toDataURL("image/jpeg", 0.9);
    const imageHeight = (canvas.height * contentWidth) / canvas.width;

    if (hasContent && y + Math.min(imageHeight, contentBottom - margin) > contentBottom) {
      pdf.addPage();
      y = margin;
    }
    hasContent = true;

    let consumed = 0;
    while (consumed < imageHeight) {
      const available = contentBottom - y;
      pdf.addImage(image, "JPEG", margin, y - consumed, contentWidth, imageHeight);
      const used = Math.min(available, imageHeight - consumed);
      consumed += used;
      y += used;
      if (consumed < imageHeight) {
        pdf.addPage();
        y = margin;
      }
    }
    y += 3;
    onProgress?.(index + 1, blocks.length);
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Conrad Log System  |  ${page} / ${pages}`, pageWidth / 2, pageHeight - 5, {
      align: "center",
    });
  }

  pdf.save(`${safeFilename(team.name)}_全队每日日志汇总.pdf`);
}
