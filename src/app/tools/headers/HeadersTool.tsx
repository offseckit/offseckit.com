"use client";

import { useState, useMemo } from "react";
import {
  analyzeHeaders,
  SECURITY_HEADERS,
  EXAMPLE_HEADERS,
} from "@/lib/headers";
import type {
  HeaderCheck,
  CSPFinding,
  Grade,
  Severity,
} from "@/lib/headers";
import CopyButton from "@/components/CopyButton";

export default function HeadersTool() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    try {
      const analysis = analyzeHeaders(trimmed);
      if (analysis.headers.length === 0) {
        return { analysis: null, error: "No valid headers found. Paste HTTP response headers in \"Header-Name: value\" format, one per line." };
      }
      return { analysis, error: null };
    } catch (e) {
      return {
        analysis: null,
        error: e instanceof Error ? e.message : "Failed to parse headers",
      };
    }
  }, [input]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> Paste Response Headers
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dracula-comment">
              {input.trim().split("\n").filter((l) => l.trim()).length} lines
            </span>
            <button
              onClick={() => setInput("")}
              className="text-xs px-2 py-1 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Paste HTTP response headers here. Example:\n\nHTTP/2 200\ncontent-type: text/html\nstrict-transport-security: max-age=31536000\nx-frame-options: DENY\nx-content-type-options: nosniff`}
          rows={8}
          className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-dracula-comment">
          Copy headers from <code className="text-dracula-cyan">curl -sI https://example.com</code>, Burp Suite, or browser DevTools (Network tab &rarr; Response Headers).
        </p>
      </div>

      {/* Error */}
      {result?.error && (
        <div className="rounded-lg border border-dracula-red/50 bg-dracula-red/10 p-4 text-sm text-dracula-red">
          {result.error}
        </div>
      )}

      {/* Results */}
      {result?.analysis && (
        <>
          {/* Grade & Summary */}
          <GradeBanner
            grade={result.analysis.grade}
            score={result.analysis.score}
            summary={result.analysis.summary}
          />

          {/* Parsed Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                <span className="text-dracula-purple">#</span> Parsed Headers ({result.analysis.headers.length})
              </h2>
              <CopyButton
                text={result.analysis.headers.map((h) => `${h.rawName}: ${h.value}`).join("\n")}
                label="Copy All"
              />
            </div>
            <div className="rounded-lg border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-dracula-comment">
                      <th className="text-left py-2 px-4">Header</th>
                      <th className="text-left py-2 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.analysis.headers.map((h, i) => (
                      <tr key={`${h.rawName}-${i}`} className="border-b border-border/50">
                        <td className="py-2 px-4 text-dracula-cyan font-semibold whitespace-nowrap font-mono">
                          {h.rawName}
                        </td>
                        <td className="py-2 px-4 text-dracula-fg font-mono break-all">
                          {h.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Security Checks */}
          <SecurityChecksPanel checks={result.analysis.checks} />

          {/* CSP Analysis */}
          {result.analysis.cspFindings.length > 0 && (
            <CSPPanel findings={result.analysis.cspFindings} />
          )}
        </>
      )}

      {/* Example Headers */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Example Headers
        </h2>
        <div className="space-y-2">
          {EXAMPLE_HEADERS.map((example) => (
            <button
              key={example.label}
              onClick={() => setInput(example.headers)}
              className="block w-full text-left rounded-lg border border-border bg-surface p-3 hover:border-dracula-purple transition-all"
            >
              <span className="text-xs font-semibold text-dracula-green">
                {example.label}
              </span>
              <span className="block text-xs text-dracula-comment mt-1">
                {example.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Security Headers Reference */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Recommended Security Headers (OWASP)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Header</th>
                <th className="text-left py-2 pr-4">Description</th>
                <th className="text-left py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              {SECURITY_HEADERS.map((h) => (
                <tr key={h.name} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-dracula-cyan font-semibold font-mono whitespace-nowrap">
                    {h.name}
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">
                    {h.description}
                  </td>
                  <td className="py-2 text-dracula-comment whitespace-nowrap">
                    {h.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function GradeBanner({
  grade,
  score,
  summary,
}: {
  grade: Grade;
  score: number;
  summary: { pass: number; warn: number; fail: number; info: number };
}) {
  const gradeColors: Record<Grade, string> = {
    "A+": "text-dracula-green border-dracula-green/50 bg-dracula-green/10",
    A: "text-dracula-green border-dracula-green/50 bg-dracula-green/10",
    B: "text-dracula-yellow border-dracula-yellow/50 bg-dracula-yellow/10",
    C: "text-dracula-orange border-dracula-orange/50 bg-dracula-orange/10",
    D: "text-dracula-red border-dracula-red/50 bg-dracula-red/10",
    F: "text-dracula-red border-dracula-red/50 bg-dracula-red/10",
  };

  return (
    <div className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${gradeColors[grade]}`}>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{grade}</div>
        <div>
          <div className="text-sm font-semibold">Score: {score}/100</div>
          <div className="text-xs opacity-80 mt-0.5">Security Header Analysis</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-dracula-green" />
          {summary.pass} pass
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-dracula-orange" />
          {summary.warn} warn
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-dracula-red" />
          {summary.fail} fail
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-dracula-cyan" />
          {summary.info} info
        </span>
      </div>
    </div>
  );
}

function SecurityChecksPanel({ checks }: { checks: HeaderCheck[] }) {
  const severityConfig: Record<
    Severity,
    { icon: string; border: string; bg: string; titleColor: string; badge: string }
  > = {
    pass: {
      icon: "\u2713",
      border: "border-dracula-green/30",
      bg: "bg-dracula-green/5",
      titleColor: "text-dracula-green",
      badge: "bg-dracula-green text-dracula-bg",
    },
    warn: {
      icon: "!",
      border: "border-dracula-orange/50",
      bg: "bg-dracula-orange/10",
      titleColor: "text-dracula-orange",
      badge: "bg-dracula-orange text-dracula-bg",
    },
    fail: {
      icon: "\u2717",
      border: "border-dracula-red/50",
      bg: "bg-dracula-red/10",
      titleColor: "text-dracula-red",
      badge: "bg-dracula-red text-dracula-bg",
    },
    info: {
      icon: "i",
      border: "border-dracula-cyan/30",
      bg: "bg-dracula-cyan/5",
      titleColor: "text-dracula-cyan",
      badge: "bg-dracula-cyan text-dracula-bg",
    },
  };

  const order: Severity[] = ["fail", "warn", "pass", "info"];
  const sorted = [...checks].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        <span className="text-dracula-red">#</span> Security Analysis
      </h2>
      <div className="space-y-2">
        {sorted.map((check, i) => {
          const config = severityConfig[check.severity];
          return (
            <div
              key={`${check.header}-${i}`}
              className={`rounded-lg border ${config.border} ${config.bg} p-4`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${config.badge}`}
                >
                  {config.icon}
                </span>
                <span className={`text-sm font-semibold ${config.titleColor}`}>
                  {check.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${config.badge} ml-auto`}
                >
                  {check.severity}
                </span>
              </div>
              <p className="text-xs text-dracula-comment ml-7">
                {check.description}
              </p>
              {check.currentValue && (
                <div className="ml-7 mt-2 flex items-start gap-2">
                  <span className="text-xs text-dracula-comment shrink-0">Value:</span>
                  <code className="text-xs text-dracula-fg font-mono break-all">
                    {check.currentValue}
                  </code>
                </div>
              )}
              {check.recommendation && (
                <div className="ml-7 mt-2 flex items-start gap-2">
                  <span className="text-xs text-dracula-green shrink-0">Fix:</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <code className="text-xs text-dracula-green font-mono break-all">
                      {check.header}: {check.recommendation}
                    </code>
                    <CopyButton
                      text={`${check.header}: ${check.recommendation}`}
                      label="Copy"
                      className="shrink-0"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CSPPanel({ findings }: { findings: CSPFinding[] }) {
  const severityConfig: Record<
    Severity,
    { border: string; bg: string; titleColor: string; badge: string }
  > = {
    pass: {
      border: "border-dracula-green/30",
      bg: "bg-dracula-green/5",
      titleColor: "text-dracula-green",
      badge: "bg-dracula-green text-dracula-bg",
    },
    warn: {
      border: "border-dracula-orange/50",
      bg: "bg-dracula-orange/10",
      titleColor: "text-dracula-orange",
      badge: "bg-dracula-orange text-dracula-bg",
    },
    fail: {
      border: "border-dracula-red/50",
      bg: "bg-dracula-red/10",
      titleColor: "text-dracula-red",
      badge: "bg-dracula-red text-dracula-bg",
    },
    info: {
      border: "border-dracula-cyan/30",
      bg: "bg-dracula-cyan/5",
      titleColor: "text-dracula-cyan",
      badge: "bg-dracula-cyan text-dracula-bg",
    },
  };

  const order: Severity[] = ["fail", "warn", "info", "pass"];
  const sorted = [...findings].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        <span className="text-dracula-yellow">#</span> CSP Directive Analysis
      </h2>
      <div className="space-y-2">
        {sorted.map((finding, i) => {
          const config = severityConfig[finding.severity];
          return (
            <div
              key={`${finding.directive}-${i}`}
              className={`rounded-lg border ${config.border} ${config.bg} p-3`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold font-mono ${config.titleColor}`}>
                  {finding.directive}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${config.badge} ml-auto`}>
                  {finding.severity}
                </span>
              </div>
              <p className="text-xs text-dracula-comment mt-1">
                {finding.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
