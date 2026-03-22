"use client";

import { useState, useMemo } from "react";
import {
  decodeJWT,
  analyzeTimestamps,
  analyzeSecurityFindings,
  getExpirationStatus,
  getAlgorithmInfo,
  getClaimDefinition,
  isStandardClaim,
  STANDARD_CLAIMS,
  EXAMPLE_TOKENS,
} from "@/lib/jwt";
import type {
  SecurityFinding,
  TimestampInfo,
  ExpirationStatus,
} from "@/lib/jwt";
import CopyButton from "@/components/CopyButton";

export default function JWTTool() {
  const [input, setInput] = useState("");

  const result = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    try {
      const decoded = decodeJWT(trimmed);
      const timestamps = analyzeTimestamps(decoded.payload);
      const findings = analyzeSecurityFindings(decoded);
      const expiration = getExpirationStatus(decoded.payload);
      return { decoded, timestamps, findings, expiration, error: null };
    } catch (e) {
      return {
        decoded: null,
        timestamps: [],
        findings: [],
        expiration: "no-expiry" as ExpirationStatus,
        error: e instanceof Error ? e.message : "Failed to decode token",
      };
    }
  }, [input]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> JWT Token
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dracula-comment">
              {input.trim().length} chars
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
          placeholder="Paste a JWT token here (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed break-all"
          spellCheck={false}
        />
      </div>

      {/* Error */}
      {result?.error && (
        <div className="rounded-lg border border-dracula-red/50 bg-dracula-red/10 p-4 text-sm text-dracula-red">
          {result.error}
        </div>
      )}

      {/* Decoded output */}
      {result?.decoded && (
        <>
          {/* Expiration badge */}
          <ExpirationBadge status={result.expiration} />

          {/* Header */}
          <JSONPanel
            title="Header"
            color="purple"
            data={result.decoded.header}
            raw={result.decoded.headerRaw}
            renderExtra={<AlgorithmBadge header={result.decoded.header} />}
          />

          {/* Payload */}
          <JSONPanel
            title="Payload"
            color="green"
            data={result.decoded.payload}
            raw={result.decoded.payloadRaw}
            renderExtra={<ClaimAnnotations payload={result.decoded.payload} />}
          />

          {/* Signature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">
                <span className="text-dracula-cyan">#</span> Signature
              </h2>
              <CopyButton text={result.decoded.signature} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <code className="text-xs text-dracula-comment font-mono break-all">
                {result.decoded.signature || "(empty)"}
              </code>
            </div>
          </div>

          {/* Timestamps */}
          {result.timestamps.length > 0 && (
            <TimestampPanel timestamps={result.timestamps} />
          )}

          {/* Security Analysis */}
          {result.findings.length > 0 && (
            <SecurityPanel findings={result.findings} />
          )}
        </>
      )}

      {/* Example tokens */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Example Tokens
        </h2>
        <div className="space-y-2">
          {EXAMPLE_TOKENS.map((example) => (
            <button
              key={example.label}
              onClick={() => setInput(example.token)}
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

      {/* Standard Claims Reference */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Standard JWT Claims (RFC
          7519)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Claim</th>
                <th className="text-left py-2 pr-4">Key</th>
                <th className="text-left py-2 pr-4">Description</th>
                <th className="text-left py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_CLAIMS.map((claim) => (
                <tr key={claim.key} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-dracula-green font-semibold">
                    {claim.name}
                  </td>
                  <td className="py-2 pr-4 text-dracula-purple font-mono">
                    {claim.key}
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">
                    {claim.description}
                  </td>
                  <td className="py-2 text-dracula-comment">{claim.rfc}</td>
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

function ExpirationBadge({ status }: { status: ExpirationStatus }) {
  const config = {
    valid: {
      label: "Valid",
      color: "text-dracula-green border-dracula-green/50 bg-dracula-green/10",
    },
    expired: {
      label: "Expired",
      color: "text-dracula-red border-dracula-red/50 bg-dracula-red/10",
    },
    "not-yet-valid": {
      label: "Not Yet Valid",
      color: "text-dracula-yellow border-dracula-yellow/50 bg-dracula-yellow/10",
    },
    "no-expiry": {
      label: "No Expiration Set",
      color: "text-dracula-orange border-dracula-orange/50 bg-dracula-orange/10",
    },
  };

  const { label, color } = config[status];

  return (
    <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded border ${color}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {label}
    </div>
  );
}

function AlgorithmBadge({ header }: { header: Record<string, unknown> }) {
  const alg = String(header.alg || "");
  if (!alg) return null;

  const info = getAlgorithmInfo(alg);
  if (!info) return null;

  const strengthColors = {
    none: "text-dracula-red",
    weak: "text-dracula-orange",
    acceptable: "text-dracula-yellow",
    strong: "text-dracula-green",
  };

  return (
    <div className="mt-2 text-xs text-dracula-comment">
      <span className={`font-semibold ${strengthColors[info.strength]}`}>
        {info.name}
      </span>
      <span className="mx-1">&mdash;</span>
      <span>{info.description}</span>
      <span className="mx-1">&mdash;</span>
      <span className={strengthColors[info.strength]}>
        {info.strength}
      </span>
    </div>
  );
}

function ClaimAnnotations({ payload }: { payload: Record<string, unknown> }) {
  const annotated = Object.keys(payload).filter(isStandardClaim);
  if (annotated.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {annotated.map((key) => {
        const def = getClaimDefinition(key);
        if (!def) return null;
        return (
          <span
            key={key}
            className="text-xs px-2 py-0.5 rounded bg-dracula-purple/10 text-dracula-purple border border-dracula-purple/30"
            title={def.description}
          >
            {def.key}: {def.name}
          </span>
        );
      })}
    </div>
  );
}

function JSONPanel({
  title,
  color,
  data,
  raw,
  renderExtra,
}: {
  title: string;
  color: string;
  data: Record<string, unknown>;
  raw: string;
  renderExtra?: React.ReactNode;
}) {
  const json = JSON.stringify(data, null, 2);
  const colorClass = `text-dracula-${color}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">
          <span className={colorClass}>#</span> {title}
        </h2>
        <div className="flex items-center gap-2">
          <CopyButton text={json} label="Copy JSON" />
          <CopyButton text={raw} label="Copy Base64" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <pre className="p-4 text-xs text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed font-mono">
          <code>
            <HighlightedJSON json={json} />
          </code>
        </pre>
        {renderExtra && <div className="px-4 pb-3">{renderExtra}</div>}
      </div>
    </div>
  );
}

function HighlightedJSON({ json }: { json: string }) {
  // Escape HTML entities first to prevent XSS from crafted JWT payloads
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Apply syntax highlighting on the escaped string
  const highlighted = escaped.replace(
    /(&quot;|")((?:\\.|[^"\\])*)(&quot;|")\s*:/g,
    '<span class="text-dracula-purple">$1$2$3</span>:'
  ).replace(
    /:\s*(&quot;|")((?:\\.|[^"\\])*)(&quot;|")/g,
    ': <span class="text-dracula-green">$1$2$3</span>'
  ).replace(
    /:\s*(\d+(?:\.\d+)?)/g,
    ': <span class="text-dracula-orange">$1</span>'
  ).replace(
    /:\s*(true|false)/g,
    ': <span class="text-dracula-pink">$1</span>'
  ).replace(
    /:\s*(null)/g,
    ': <span class="text-dracula-comment">$1</span>'
  );

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

function TimestampPanel({ timestamps }: { timestamps: TimestampInfo[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        <span className="text-dracula-yellow">#</span> Timestamps
      </h2>
      <div className="space-y-2">
        {timestamps.map((ts) => (
          <div
            key={ts.claim}
            className="rounded-lg border border-border bg-surface p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
          >
            <div>
              <span className="text-xs font-semibold text-dracula-purple">
                {ts.claim}
              </span>
              <span className="text-xs text-dracula-comment ml-2">
                {ts.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-dracula-fg">
                {ts.date.toISOString()}
              </span>
              <span className="text-xs text-dracula-yellow ml-2 font-semibold">
                {ts.relative}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityPanel({ findings }: { findings: SecurityFinding[] }) {
  const severityConfig = {
    critical: {
      icon: "!",
      border: "border-dracula-red/50",
      bg: "bg-dracula-red/10",
      titleColor: "text-dracula-red",
      badge: "bg-dracula-red text-dracula-bg",
    },
    warning: {
      icon: "!",
      border: "border-dracula-orange/50",
      bg: "bg-dracula-orange/10",
      titleColor: "text-dracula-orange",
      badge: "bg-dracula-orange text-dracula-bg",
    },
    info: {
      icon: "i",
      border: "border-dracula-cyan/50",
      bg: "bg-dracula-cyan/10",
      titleColor: "text-dracula-cyan",
      badge: "bg-dracula-cyan text-dracula-bg",
    },
  };

  const sorted = [...findings].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3">
        <span className="text-dracula-red">#</span> Security Analysis
      </h2>
      <div className="space-y-2">
        {sorted.map((finding, i) => {
          const config = severityConfig[finding.severity];
          return (
            <div
              key={`${finding.title}-${i}`}
              className={`rounded-lg border ${config.border} ${config.bg} p-4`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${config.badge}`}
                >
                  {config.icon}
                </span>
                <span
                  className={`text-sm font-semibold ${config.titleColor}`}
                >
                  {finding.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${config.badge} ml-auto`}
                >
                  {finding.severity}
                </span>
              </div>
              <p className="text-xs text-dracula-comment ml-7">
                {finding.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
