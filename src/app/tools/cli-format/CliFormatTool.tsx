"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  parseAnsi,
  getTheme,
  backgroundToCSS,
  THEMES,
  BACKGROUND_PRESETS,
  PRESET_EXAMPLES,
  DEFAULT_OPTIONS,
} from "@/lib/cli-format";
import type {
  FormatOptions,
  ParsedLine,
  StyledSegment,
  BackgroundStyle,
} from "@/lib/cli-format";
import CopyButton from "@/components/CopyButton";

// ── Main component ─────────────────────────────────────────────────

export default function CliFormatTool() {
  const [input, setInput] = useState(PRESET_EXAMPLES[0].content);
  const [options, setOptions] = useState<FormatOptions>({
    ...DEFAULT_OPTIONS,
    windowTitle: PRESET_EXAMPLES[0].title,
  });
  const [exporting, setExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const theme = useMemo(() => getTheme(options.theme), [options.theme]);

  const parsed = useMemo<ParsedLine[]>(
    () => parseAnsi(input, theme),
    [input, theme]
  );

  const updateOption = useCallback(
    <K extends keyof FormatOptions>(key: K, value: FormatOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const loadPreset = useCallback(
    (index: number) => {
      const preset = PRESET_EXAMPLES[index];
      setInput(preset.content);
      updateOption("windowTitle", preset.title);
    },
    [updateOption]
  );

  // ── Export to PNG ──────────────────────────────────────────────

  const exportPNG = useCallback(async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);

    try {
      const canvas = await renderToCanvas(
        parsed,
        theme,
        options
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Failed to create blob");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `terminal-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }, [parsed, theme, options, exporting]);

  // ── Copy to Clipboard ─────────────────────────────────────────

  const copyToClipboard = useCallback(async () => {
    if (!previewRef.current) return;

    try {
      const canvas = await renderToCanvas(parsed, theme, options);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Failed to create blob");

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [parsed, theme, options]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          <span className="text-dracula-pink">#</span> Terminal Output
        </h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your terminal output here... (supports ANSI escape codes)"
          rows={10}
          className="w-full px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y"
          spellCheck={false}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-dracula-comment py-1">Presets:</span>
          {PRESET_EXAMPLES.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(i)}
              className="text-xs px-2.5 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          <span className="text-dracula-green">#</span> Options
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Theme */}
          <div>
            <label className="block text-xs text-dracula-comment mb-1">
              Theme
            </label>
            <select
              value={options.theme}
              onChange={(e) => updateOption("theme", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
            >
              {THEMES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Window Title */}
          <div>
            <label className="block text-xs text-dracula-comment mb-1">
              Window Title
            </label>
            <input
              value={options.windowTitle}
              onChange={(e) => updateOption("windowTitle", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
              spellCheck={false}
            />
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs text-dracula-comment mb-1">
              Font Size: {options.fontSize}px
            </label>
            <input
              type="range"
              min={10}
              max={24}
              value={options.fontSize}
              onChange={(e) => updateOption("fontSize", Number(e.target.value))}
              className="w-full accent-dracula-purple"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="block text-xs text-dracula-comment mb-1">
              Padding: {options.padding}px
            </label>
            <input
              type="range"
              min={8}
              max={64}
              step={4}
              value={options.padding}
              onChange={(e) => updateOption("padding", Number(e.target.value))}
              className="w-full accent-dracula-purple"
            />
          </div>

          {/* Show Dots */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDots"
              checked={options.showDots}
              onChange={(e) => updateOption("showDots", e.target.checked)}
              className="accent-dracula-purple"
            />
            <label
              htmlFor="showDots"
              className="text-xs text-dracula-comment cursor-pointer"
            >
              Window dots (traffic lights)
            </label>
          </div>

          {/* Line Numbers */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lineNumbers"
              checked={options.lineNumbers}
              onChange={(e) => updateOption("lineNumbers", e.target.checked)}
              className="accent-dracula-purple"
            />
            <label
              htmlFor="lineNumbers"
              className="text-xs text-dracula-comment cursor-pointer"
            >
              Line numbers
            </label>
          </div>
        </div>

        {/* Background */}
        <div className="mt-4">
          <label className="block text-xs text-dracula-comment mb-2">
            Background
          </label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => updateOption("background", preset.style)}
                className={`text-xs px-3 py-1.5 rounded border transition-all ${
                  bgMatch(options.background, preset.style)
                    ? "border-dracula-purple text-dracula-purple"
                    : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm mr-1.5 align-middle border border-border"
                  style={{ background: backgroundToCSS(preset.style) }}
                />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-cyan">#</span> Preview
          </h2>
          <div className="flex gap-2">
            <CopyButton text={input} label="Copy Text" />
            <button
              onClick={copyToClipboard}
              className={`text-xs px-3 py-1.5 rounded border transition-all ${
                copySuccess
                  ? "border-dracula-green text-dracula-green bg-dracula-green/10"
                  : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple bg-surface"
              }`}
            >
              {copySuccess ? "Copied!" : "Copy Image"}
            </button>
            <button
              onClick={exportPNG}
              disabled={exporting}
              className="text-xs px-3 py-1.5 rounded border border-dracula-purple text-dracula-purple hover:bg-dracula-purple/10 transition-all disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Download PNG"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            ref={previewRef}
            className="inline-block rounded-lg"
            style={{
              padding:
                options.background.type !== "none" ? `${options.padding}px` : 0,
              background: backgroundToCSS(options.background),
              minWidth: "100%",
            }}
          >
            <TerminalWindow
              lines={parsed}
              theme={theme}
              options={options}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Terminal Window ───────────────────────────────────────────────

function TerminalWindow({
  lines,
  theme,
  options,
}: {
  lines: ParsedLine[];
  theme: ReturnType<typeof getTheme>;
  options: FormatOptions;
}) {
  const lineNumWidth = options.lineNumbers
    ? `${String(lines.length).length * 0.6 + 1.2}em`
    : "0";

  return (
    <div
      className="rounded-lg overflow-hidden shadow-2xl"
      style={{
        backgroundColor: theme.bg,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: `${options.fontSize}px`,
        lineHeight: 1.5,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center px-4 py-2 select-none"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      >
        {options.showDots && (
          <div className="flex gap-2 mr-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#ff5f56" }}
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#ffbd2e" }}
            />
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#27c93f" }}
            />
          </div>
        )}
        <span
          className="flex-1 text-center text-xs opacity-60"
          style={{ color: theme.fg }}
        >
          {options.windowTitle}
        </span>
        {options.showDots && <div className="w-14" />}
      </div>

      {/* Content */}
      <div className="px-4 py-3 overflow-x-auto">
        <pre className="m-0 whitespace-pre" style={{ color: theme.fg }}>
          {lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex">
              {options.lineNumbers && (
                <span
                  className="select-none text-right pr-3 shrink-0"
                  style={{
                    color: theme.brightBlack,
                    width: lineNumWidth,
                    opacity: 0.5,
                  }}
                >
                  {lineIdx + 1}
                </span>
              )}
              <span>
                {line.segments.map((seg, segIdx) => (
                  <SegmentSpan
                    key={segIdx}
                    segment={seg}
                    defaultFg={theme.fg}
                  />
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ── Segment Span ─────────────────────────────────────────────────

function SegmentSpan({
  segment,
  defaultFg,
}: {
  segment: StyledSegment;
  defaultFg: string;
}) {
  if (!segment.text) return null;

  const style: React.CSSProperties = {};
  if (segment.fg) style.color = segment.fg;
  if (segment.bg) style.backgroundColor = segment.bg;
  if (segment.bold) style.fontWeight = "bold";
  if (segment.italic) style.fontStyle = "italic";
  if (segment.dim) style.opacity = 0.5;

  const decorations: string[] = [];
  if (segment.underline) decorations.push("underline");
  if (segment.strikethrough) decorations.push("line-through");
  if (decorations.length > 0) style.textDecoration = decorations.join(" ");

  // Use default fg if no custom color and no styles that modify color
  if (!segment.fg && !segment.dim) {
    style.color = defaultFg;
  }

  return <span style={style}>{segment.text}</span>;
}

// ── Canvas Renderer ──────────────────────────────────────────────

async function renderToCanvas(
  lines: ParsedLine[],
  theme: ReturnType<typeof getTheme>,
  options: FormatOptions
): Promise<HTMLCanvasElement> {
  const scale = 2; // retina
  const fontSize = options.fontSize * scale;
  const lineHeight = fontSize * 1.5;
  const padding = options.padding * scale;
  const contentPadX = 16 * scale;
  const contentPadY = 12 * scale;
  const titleBarHeight = 32 * scale;
  const dotSize = 6 * scale;
  const dotGap = 8 * scale;

  // Measure text width
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  measureCtx.font = `${fontSize}px "JetBrains Mono", monospace`;

  // Calculate max line width
  let maxWidth = 0;
  const lineNumWidth = options.lineNumbers
    ? measureCtx.measureText(String(lines.length) + "  ").width
    : 0;

  for (const line of lines) {
    let lineWidth = 0;
    for (const seg of line.segments) {
      const font = seg.bold
        ? `bold ${fontSize}px "JetBrains Mono", monospace`
        : `${fontSize}px "JetBrains Mono", monospace`;
      measureCtx.font = font;
      lineWidth += measureCtx.measureText(seg.text).width;
    }
    maxWidth = Math.max(maxWidth, lineWidth);
  }

  const terminalWidth = maxWidth + lineNumWidth + contentPadX * 2;
  const terminalHeight =
    titleBarHeight + lines.length * lineHeight + contentPadY * 2;

  const hasBg = options.background.type !== "none";
  const canvasWidth = hasBg
    ? terminalWidth + padding * 2
    : terminalWidth;
  const canvasHeight = hasBg
    ? terminalHeight + padding * 2
    : terminalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;

  // Background
  if (hasBg) {
    if (options.background.type === "solid") {
      ctx.fillStyle = options.background.color;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (options.background.type === "gradient") {
      const { from, to, angle } = options.background;
      const rad = (angle * Math.PI) / 180;
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const len = Math.sqrt(cx * cx + cy * cy);
      const x0 = cx - Math.cos(rad) * len;
      const y0 = cy - Math.sin(rad) * len;
      const x1 = cx + Math.cos(rad) * len;
      const y1 = cy + Math.sin(rad) * len;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, from);
      grad.addColorStop(1, to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  // Terminal window
  const termX = hasBg ? padding : 0;
  const termY = hasBg ? padding : 0;

  // Rounded rectangle
  const radius = 12 * scale;
  drawRoundedRect(ctx, termX, termY, terminalWidth, terminalHeight, radius);
  ctx.fillStyle = theme.bg;
  ctx.fill();

  // Title bar background
  drawRoundedRectTop(
    ctx,
    termX,
    termY,
    terminalWidth,
    titleBarHeight,
    radius
  );
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fill();

  // Dots
  if (options.showDots) {
    const dotsY = termY + titleBarHeight / 2;
    const dotsStartX = termX + 16 * scale;
    const dotColors = ["#ff5f56", "#ffbd2e", "#27c93f"];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(dotsStartX + i * (dotSize + dotGap), dotsY, dotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = dotColors[i];
      ctx.fill();
    }
  }

  // Title text
  if (options.windowTitle) {
    ctx.font = `${fontSize * 0.75}px "JetBrains Mono", monospace`;
    ctx.fillStyle = theme.fg;
    ctx.globalAlpha = 0.6;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      options.windowTitle,
      termX + terminalWidth / 2,
      termY + titleBarHeight / 2
    );
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  // Content
  const contentX = termX + contentPadX;
  const contentY = termY + titleBarHeight + contentPadY;
  ctx.textBaseline = "top";

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const y = contentY + lineIdx * lineHeight;
    let x = contentX;

    // Line number
    if (options.lineNumbers) {
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = theme.brightBlack;
      ctx.globalAlpha = 0.5;
      const numStr = String(lineIdx + 1);
      const numTextWidth = measureCtx.measureText(numStr).width;
      ctx.fillText(numStr, x + lineNumWidth - numTextWidth - 6 * scale, y);
      ctx.globalAlpha = 1;
      x += lineNumWidth;
    }

    for (const seg of line.segments) {
      if (!seg.text) continue;

      const fontWeight = seg.bold ? "bold " : "";
      const fontStyle = seg.italic ? "italic " : "";
      ctx.font = `${fontStyle}${fontWeight}${fontSize}px "JetBrains Mono", monospace`;

      const segWidth = ctx.measureText(seg.text).width;

      // Background
      if (seg.bg) {
        ctx.fillStyle = seg.bg;
        ctx.fillRect(x, y, segWidth, lineHeight);
      }

      // Text
      ctx.fillStyle = seg.fg || theme.fg;
      if (seg.dim) ctx.globalAlpha = 0.5;
      ctx.fillText(seg.text, x, y + (lineHeight - fontSize) / 2);
      if (seg.dim) ctx.globalAlpha = 1;

      // Underline
      if (seg.underline) {
        ctx.strokeStyle = seg.fg || theme.fg;
        ctx.lineWidth = scale;
        ctx.beginPath();
        ctx.moveTo(x, y + lineHeight - 2 * scale);
        ctx.lineTo(x + segWidth, y + lineHeight - 2 * scale);
        ctx.stroke();
      }

      // Strikethrough
      if (seg.strikethrough) {
        ctx.strokeStyle = seg.fg || theme.fg;
        ctx.lineWidth = scale;
        ctx.beginPath();
        ctx.moveTo(x, y + lineHeight / 2);
        ctx.lineTo(x + segWidth, y + lineHeight / 2);
        ctx.stroke();
      }

      x += segWidth;
    }
  }

  return canvas;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawRoundedRectTop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Helpers ──────────────────────────────────────────────────────

function bgMatch(a: BackgroundStyle, b: BackgroundStyle): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "none") return true;
  if (a.type === "solid" && b.type === "solid") return a.color === b.color;
  if (a.type === "gradient" && b.type === "gradient")
    return a.from === b.from && a.to === b.to && a.angle === b.angle;
  return false;
}
