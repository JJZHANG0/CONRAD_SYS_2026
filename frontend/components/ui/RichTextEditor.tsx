"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { countWords, getPlainTextLength, isRichTextEmpty, normalizeRichText } from "@/utils/richText";

const COLORS = [
  { name: "默认", value: "#111827" },
  { name: "蓝色", value: "#2563EB" },
  { name: "紫色", value: "#7C3AED" },
  { name: "橙色", value: "#EA580C" },
];

interface RichTextEditorProps {
  labelEn?: string;
  labelZh?: string;
  value: string;
  onChange: (v: string) => void;
  onBlurSave?: () => void;
  maxChars?: number;
  maxWords?: number;
  helper?: string;
  error?: string;
  disabled?: boolean;
  large?: boolean;
}

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        "flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
        "text-text-secondary hover:bg-gray-100 hover:text-text-primary"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  labelEn = "",
  labelZh = "",
  value,
  onChange,
  onBlurSave,
  maxChars,
  maxWords,
  helper,
  error,
  disabled = false,
  large = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const useWords = maxWords != null;
  const [count, setCount] = useState(() =>
    useWords ? countWords(value) : getPlainTextLength(value)
  );
  const limit = useWords ? maxWords! : (maxChars ?? 0);
  const over = limit > 0 && count > limit;
  const showLabel = labelEn || labelZh;

  // Uncontrolled: load HTML once per mount (parent uses key= to remount on day switch)
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el || disabled) return;
    el.innerHTML = value || "";
    setCount(useWords ? countWords(value) : getPlainTextLength(value));
    // value intentionally omitted — remount via key when external content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, useWords]);

  const notifyChange = useCallback(
    (normalize = false) => {
      const el = editorRef.current;
      if (!el) return;
      const html = normalize ? normalizeRichText(el.innerHTML) : el.innerHTML;
      if (normalize && html !== el.innerHTML) {
        el.innerHTML = html;
      }
      setCount(useWords ? countWords(html) : getPlainTextLength(html));
      onChangeRef.current(html);
    },
    [useWords]
  );

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    notifyChange(false);
  };

  const [colorOpen, setColorOpen] = useState(false);

  if (disabled) {
    return (
      <div className="space-y-1.5">
        {showLabel && (
          <label className="block text-sm font-medium text-text-primary">
            {labelEn}
            {labelEn && labelZh && " "}
            {labelZh && <span className="font-normal text-text-secondary">{labelZh}</span>}
          </label>
        )}
        {helper && <p className="text-xs leading-relaxed text-text-secondary">{helper}</p>}
        <div
          className={clsx(
            "rich-content rounded-xl border border-border bg-gray-50 px-4 py-4 text-[15px] leading-relaxed text-text-primary",
            large ? "min-h-[220px]" : "min-h-[160px]"
          )}
          dangerouslySetInnerHTML={{
            __html: isRichTextEmpty(value)
              ? '<p class="text-text-secondary italic">—</p>'
              : value,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <label className="block text-sm font-medium text-text-primary">
          {labelEn}
          {labelEn && labelZh && " "}
          {labelZh && <span className="font-normal text-text-secondary">{labelZh}</span>}
        </label>
      )}
      {helper && <p className="text-xs leading-relaxed text-text-secondary">{helper}</p>}

      <div
        className={clsx(
          "overflow-hidden rounded-xl border bg-white",
          over || error ? "border-red-400" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-gray-50/80 px-2 py-1.5">
          <ToolbarBtn title="Bold 加粗" onClick={() => exec("bold")}>
            <span className="font-bold">B</span>
          </ToolbarBtn>
          <ToolbarBtn title="Italic 斜体" onClick={() => exec("italic")}>
            <span className="italic">I</span>
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarBtn title="Bullet list 列点" onClick={() => exec("insertUnorderedList")}>
            <span>•≡</span>
          </ToolbarBtn>
          <ToolbarBtn title="Numbered list 编号" onClick={() => exec("insertOrderedList")}>
            <span>1.</span>
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <div className="relative">
            <ToolbarBtn title="Text color 文字颜色" onClick={() => setColorOpen((o) => !o)}>
              <span className="flex items-center gap-1">
                <span className="text-base">A</span>
                <span className="h-1 w-3 rounded-full bg-primary" />
              </span>
            </ToolbarBtn>
            {colorOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-xl border border-border bg-white p-2 shadow-lg">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec("foreColor", c.value);
                      setColorOpen(false);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs font-bold hover:scale-110"
                    style={{ color: c.value }}
                  >
                    A
                  </button>
                ))}
              </div>
            )}
          </div>
          <ToolbarBtn title="Remove format 清除格式" onClick={() => exec("removeFormat")}>
            <span className="text-xs">⌫</span>
          </ToolbarBtn>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => notifyChange(false)}
          onBlur={() => {
            notifyChange(true);
            onBlurSave?.();
          }}
          data-placeholder="Start typing here…"
          className={clsx(
            "rich-editor px-4 py-4 text-[15px] leading-relaxed text-text-primary outline-none",
            large ? "min-h-[220px]" : "min-h-[180px]"
          )}
        />
      </div>

      <div className="flex justify-between text-xs">
        {error && <span className="text-red-500">{error}</span>}
        <span className={clsx("ml-auto tabular-nums", over ? "text-red-500" : "text-text-secondary")}>
          {count}/{limit} {useWords ? "words" : "chars"}
        </span>
      </div>
    </div>
  );
}

export function TextArea(props: RichTextEditorProps) {
  return <RichTextEditor {...props} />;
}
