import { isRichTextEmpty } from "@/utils/richText";

export interface PdfQuestion {
  number: number;
  titleEn: string;
  titleZh: string;
  answer: string;
}

export interface PdfDocumentMeta {
  teamName: string;
  projectName: string;
  challengeCategory?: string;
  teacherName?: string;
}

interface PdfLayout {
  title: string;
  subtitle: string;
  accent: string;
  tint: string;
  questionsPerPage: number;
}

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

function textElement(doc: Document, tag: string, className: string, value: string): HTMLElement {
  const element = doc.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function answerParagraphs(html: string): string[] {
  if (!html || isRichTextEmpty(html)) return ["（未填写 / Not provided）"];

  const source = document.createElement("div");
  source.innerHTML = html;
  const blocks = Array.from(source.querySelectorAll("p, li"));
  const paragraphs = blocks.length
    ? blocks.map((block) => {
        const prefix = block.tagName === "LI" ? "• " : "";
        return prefix + (block.textContent || "").trim();
      })
    : [(source.textContent || "").trim()];
  return paragraphs.filter(Boolean).length ? paragraphs.filter(Boolean) : ["（未填写 / Not provided）"];
}

function naturalBreak(characters: string[], limit: number): number {
  const lowerBound = Math.max(1, Math.floor(limit * 0.55));
  for (let index = limit - 1; index >= lowerBound; index -= 1) {
    if (/[。！？.!?；;]/.test(characters[index])) return index + 1;
  }
  for (let index = limit - 1; index >= lowerBound; index -= 1) {
    if (/\s/.test(characters[index])) return index + 1;
  }
  return limit;
}

function mountFrame(): { doc: Document; cleanup: () => void } {
  const iframe = document.createElement("iframe");
  iframe.title = "paged-pdf-export";
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${PAGE_WIDTH}px`,
    height: `${PAGE_HEIGHT}px`,
    opacity: "0.01",
    pointerEvents: "none",
    border: "0",
    zIndex: "2147483647",
  });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error("无法创建 PDF 排版环境");
  }
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: ${PAGE_WIDTH}px; background: #fff; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif; color: #17212d; }
    .pdf-page { display: flex; flex-direction: column; width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px; padding: 38px 46px 34px; background: #fff; overflow: hidden; }
    .pdf-header { flex: none; border-bottom: 2px solid var(--accent); padding-bottom: 16px; margin-bottom: 18px; }
    .brand { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
    .document-title { margin: 8px 0 4px; font-size: 27px; line-height: 1.25; }
    .document-subtitle { color: #657384; font-size: 13px; }
    .metadata { display: flex; flex-wrap: wrap; gap: 5px 20px; margin-top: 13px; font-size: 11px; color: #536274; }
    .metadata strong { color: #26394b; font-weight: 600; }
    .pdf-body { flex: 1; min-height: 0; overflow: hidden; }
    .question { margin-bottom: 13px; border: 1px solid #dce5eb; border-radius: 7px; overflow: hidden; }
    .question-head { display: flex; align-items: baseline; gap: 12px; padding: 9px 13px; background: var(--tint); border-bottom: 1px solid #dce5eb; }
    .question-number { color: var(--accent); font-size: 13px; font-weight: 750; white-space: nowrap; }
    .question-title { font-size: 14px; font-weight: 700; line-height: 1.4; }
    .question-title span { color: #667687; font-size: 12px; font-weight: 400; margin-left: 8px; }
    .answer { padding: 10px 14px 11px; font-size: 13px; line-height: 1.62; overflow-wrap: anywhere; }
    .answer p { margin: 0 0 7px; white-space: pre-wrap; }
    .answer p:last-child { margin-bottom: 0; }
    .pdf-footer { flex: none; display: flex; justify-content: space-between; border-top: 1px solid #dce5eb; padding-top: 10px; margin-top: 12px; color: #7a8795; font-size: 10px; }
  </style></head><body></body></html>`);
  doc.close();
  return { doc, cleanup: () => iframe.remove() };
}

interface PdfPage {
  element: HTMLElement;
  body: HTMLElement;
  questionCount: number;
}

function addPage(doc: Document, meta: PdfDocumentMeta, layout: PdfLayout, pages: PdfPage[]): PdfPage {
  const element = doc.createElement("article");
  element.className = "pdf-page";
  element.style.setProperty("--accent", layout.accent);
  element.style.setProperty("--tint", layout.tint);

  const header = doc.createElement("header");
  header.className = "pdf-header";
  header.append(
    textElement(doc, "div", "brand", "CONRAD CHALLENGE · STEMHUB"),
    textElement(doc, "h1", "document-title", layout.title),
    textElement(doc, "div", "document-subtitle", layout.subtitle),
  );
  const metadata = doc.createElement("div");
  metadata.className = "metadata";
  for (const [label, value] of [
    ["队伍", meta.teamName],
    ["项目", meta.projectName],
    ["赛道", meta.challengeCategory],
    ["导师", meta.teacherName],
  ]) {
    if (!value) continue;
    const item = doc.createElement("span");
    item.append(textElement(doc, "strong", "", `${label}  `), doc.createTextNode(value));
    metadata.appendChild(item);
  }
  header.appendChild(metadata);

  const body = doc.createElement("main");
  body.className = "pdf-body";
  const footer = doc.createElement("footer");
  footer.className = "pdf-footer";
  footer.append(
    textElement(doc, "span", "", "Conrad Challenge · 项目资料"),
    textElement(doc, "span", "page-number", ""),
  );
  element.append(header, body, footer);
  doc.body.appendChild(element);
  const page = { element, body, questionCount: 0 };
  pages.push(page);
  return page;
}

function addQuestion(doc: Document, page: PdfPage, question: PdfQuestion, continuation: boolean): HTMLElement {
  const section = doc.createElement("section");
  section.className = "question";
  const head = doc.createElement("div");
  head.className = "question-head";
  head.appendChild(textElement(doc, "span", "question-number", `Q${question.number}`));
  const title = textElement(doc, "span", "question-title", question.titleEn);
  title.appendChild(textElement(doc, "span", "", `${question.titleZh}${continuation ? " · 续" : ""}`));
  head.appendChild(title);
  const answer = doc.createElement("div");
  answer.className = "answer";
  section.append(head, answer);
  page.body.appendChild(section);
  page.questionCount += 1;
  return answer;
}

function fits(page: PdfPage): boolean {
  return page.body.scrollHeight <= page.body.clientHeight + 1;
}

function maxFittingCharacters(page: PdfPage, answer: HTMLElement, characters: string[]): number {
  let low = 0;
  let high = characters.length;
  const probe = answer.ownerDocument.createElement("p");
  answer.appendChild(probe);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    probe.textContent = characters.slice(0, middle).join("");
    if (fits(page)) low = middle;
    else high = middle - 1;
  }
  probe.remove();
  return low;
}

function layoutPages(doc: Document, meta: PdfDocumentMeta, layout: PdfLayout, questions: PdfQuestion[]): PdfPage[] {
  const pages: PdfPage[] = [];
  let page: PdfPage | undefined;

  questions.forEach((question, index) => {
    if (!page || index % layout.questionsPerPage === 0) {
      page = addPage(doc, meta, layout, pages);
    }
    let answer = addQuestion(doc, page, question, false);
    if (!fits(page)) {
      answer.parentElement?.remove();
      page.questionCount -= 1;
      page = addPage(doc, meta, layout, pages);
      answer = addQuestion(doc, page, question, false);
    }

    for (const paragraph of answerParagraphs(question.answer)) {
      let remaining = paragraph;
      while (remaining) {
        const characters = Array.from(remaining);
        const fitCount = maxFittingCharacters(page, answer, characters);
        if (fitCount === 0 && page.body.children.length === 1 && answer.children.length === 0) {
          throw new Error(`Q${question.number} 的内容无法排入 PDF 页面`);
        }
        if (fitCount === 0 || (fitCount < characters.length && fitCount < 24 && (page.body.children.length > 1 || answer.children.length > 0))) {
          page = addPage(doc, meta, layout, pages);
          answer = addQuestion(doc, page, question, true);
          continue;
        }
        const end = fitCount === characters.length ? fitCount : naturalBreak(characters, fitCount);
        const chunk = characters.slice(0, end).join("");
        answer.appendChild(textElement(doc, "p", "", chunk));
        remaining = characters.slice(end).join("").trimStart();
        if (remaining) {
          page = addPage(doc, meta, layout, pages);
          answer = addQuestion(doc, page, question, true);
        }
      }
    }
  });

  pages.forEach((item, index) => {
    const number = item.element.querySelector(".page-number");
    if (number) number.textContent = `${index + 1} / ${pages.length}`;
  });
  return pages;
}

export async function createPagedDocumentPdf(
  questions: PdfQuestion[],
  meta: PdfDocumentMeta,
  kind: "bmc" | "brief",
): Promise<Blob> {
  const layout: PdfLayout = kind === "bmc"
    ? {
        title: "Lean Canvas · BMC",
        subtitle: "精益画布 · 商业模式画布",
        accent: "#b76519",
        tint: "#fff6e8",
        questionsPerPage: 6,
      }
    : {
        title: "Innovation Brief",
        subtitle: "创新简报",
        accent: "#4f5bb8",
        tint: "#f1f4ff",
        questionsPerPage: 1,
      };
  const { doc, cleanup } = mountFrame();
  try {
    const pages = layoutPages(doc, meta, layout, questions);
    const frame = doc.defaultView?.frameElement as HTMLIFrameElement | null;
    if (frame) frame.style.height = `${pages.length * PAGE_HEIGHT}px`;
    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    for (let index = 0; index < pages.length; index += 1) {
      const rendered = await html2canvas(pages[index].element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        windowWidth: PAGE_WIDTH,
        windowHeight: PAGE_HEIGHT,
      });
      if (!rendered.width || !rendered.height) throw new Error("PDF 页面生成失败");
      if (index > 0) pdf.addPage();
      pdf.addImage(rendered.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, 210, 297);
    }
    return pdf.output("blob");
  } finally {
    cleanup();
  }
}
