"use client";

import { useState, useMemo, useCallback } from "react";
import {
  generatePayloads,
  getAuthBypassPayloads,
  getDefaultConfig,
  DB_TYPES,
  INJECTION_TYPES,
  CONTEXTS,
  COMMENT_STYLES,
  WAF_BYPASSES,
  QUICK_REFERENCE,
} from "@/lib/sqli";
import type {
  SqliConfig,
  DbType,
  InjectionType,
  InjectionContext,
  CommentStyle,
  WafBypass,
  SqliPayload,
} from "@/lib/sqli";
import CopyButton from "@/components/CopyButton";

type Section =
  | "db"
  | "injection"
  | "context"
  | "options"
  | "waf"
  | "payloads"
  | "auth-bypass"
  | "reference";

/* -- URL hash serialization ---------------------------------------- */

function serializeConfigToHash(config: SqliConfig): string {
  try {
    const state = {
      d: config.db,
      i: config.injectionType,
      x: config.context,
      c: config.comment,
      n: config.columns,
      w: config.wafBypass,
      t: config.table,
      k: config.column,
    };
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return "";
  }
}

function deserializeConfigFromHash(hash: string): SqliConfig | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const json = decodeURIComponent(escape(atob(clean)));
    const state = JSON.parse(json);
    if (typeof state.d === "string" && typeof state.i === "string") {
      return {
        db: state.d as DbType,
        injectionType: state.i as InjectionType,
        context: state.x as InjectionContext,
        comment: state.c as CommentStyle,
        columns: state.n ?? 3,
        wafBypass: state.w as WafBypass,
        table: state.t ?? "users",
        column: state.k ?? "password",
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getInitialConfig(): SqliConfig {
  if (typeof window !== "undefined") {
    const parsed = deserializeConfigFromHash(window.location.hash);
    if (parsed) return parsed;
  }
  return getDefaultConfig();
}

export default function SQLiGenerator() {
  const [config, setConfig] = useState<SqliConfig>(getInitialConfig);
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(
    new Set(["db", "injection", "payloads"])
  );
  const [shared, setShared] = useState(false);

  const payloads = useMemo(() => generatePayloads(config), [config]);
  const authPayloads = useMemo(() => getAuthBypassPayloads(config), [config]);

  const toggleSection = useCallback((section: Section) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const update = useCallback(
    <K extends keyof SqliConfig>(key: K, value: SqliConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    setConfig(getDefaultConfig());
  }, []);

  const handleShare = useCallback(() => {
    const hash = serializeConfigToHash(config);
    if (hash && typeof window !== "undefined") {
      const url =
        window.location.origin + window.location.pathname + "#" + hash;
      window.history.replaceState(null, "", "#" + hash);
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [config]);

  return (
    <div className="space-y-6">
      {/* DB Type Selector */}
      <CollapsibleSection
        title="Database Type"
        color="purple"
        section="db"
        expanded={expandedSections.has("db")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DB_TYPES.map((db) => (
            <button
              key={db.id}
              onClick={() => update("db", db.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                config.db === db.id
                  ? "border-dracula-purple bg-dracula-purple/10 shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <span className="text-xs font-semibold text-foreground block">
                {db.name}
              </span>
              <span className="text-xs text-dracula-comment mt-0.5 block">
                {db.description}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Injection Type Selector */}
      <CollapsibleSection
        title="Injection Type"
        color="green"
        section="injection"
        expanded={expandedSections.has("injection")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {INJECTION_TYPES.map((inj) => (
            <button
              key={inj.id}
              onClick={() => update("injectionType", inj.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                config.injectionType === inj.id
                  ? "border-dracula-green bg-dracula-green/10 shadow-[0_0_12px_rgba(80,250,123,0.3)]"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <span className="text-xs font-semibold text-foreground block">
                {inj.name}
              </span>
              <span className="text-xs text-dracula-comment mt-0.5 block">
                {inj.description}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Context & Options */}
      <CollapsibleSection
        title="Injection Context"
        color="cyan"
        section="context"
        expanded={expandedSections.has("context")}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {CONTEXTS.map((ctx) => (
              <label
                key={ctx.id}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  config.context === ctx.id
                    ? "border-dracula-cyan bg-dracula-cyan/10 text-dracula-cyan shadow-[0_0_12px_rgba(139,233,253,0.3)]"
                    : "border-border bg-surface hover:border-dracula-comment"
                }`}
              >
                <input
                  type="radio"
                  name="context"
                  value={ctx.id}
                  checked={config.context === ctx.id}
                  onChange={() => update("context", ctx.id)}
                  className="mt-0.5 accent-dracula-cyan"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">
                      {ctx.name}
                    </span>
                    <code className="text-xs text-dracula-pink">
                      {ctx.example}
                    </code>
                  </div>
                  <p className="text-xs text-dracula-comment mt-0.5">
                    {ctx.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Options: Comment, Columns, Table, Column */}
      <CollapsibleSection
        title="Options"
        color="orange"
        section="options"
        expanded={expandedSections.has("options")}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {/* Comment Style */}
          <div>
            <label className="block text-xs text-dracula-comment mb-1.5">
              Comment Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMMENT_STYLES.map((cs) => (
                <button
                  key={cs.id}
                  onClick={() => update("comment", cs.id)}
                  className={`text-left rounded-lg border p-2 transition-all ${
                    config.comment === cs.id
                      ? "border-dracula-orange bg-dracula-orange/10 shadow-[0_0_12px_rgba(255,184,108,0.3)]"
                      : "border-border bg-surface hover:border-dracula-comment"
                  }`}
                >
                  <span className="text-xs font-mono font-semibold text-foreground block">
                    {cs.id}
                  </span>
                  <span className="text-xs text-dracula-comment mt-0.5 block">
                    {cs.dbs.join(", ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Column Count (for UNION) */}
          {config.injectionType === "union" && (
            <div>
              <label className="block text-xs text-dracula-comment mb-1.5">
                Number of Columns (for UNION payloads)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.columns}
                onChange={(e) =>
                  update(
                    "columns",
                    Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                  )
                }
                className="w-24 px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-orange"
              />
            </div>
          )}

          {/* Target Table */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-dracula-comment mb-1.5">
                Target Table
              </label>
              <input
                type="text"
                value={config.table}
                onChange={(e) => update("table", e.target.value)}
                placeholder="users"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-orange"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs text-dracula-comment mb-1.5">
                Target Column
              </label>
              <input
                type="text"
                value={config.column}
                onChange={(e) => update("column", e.target.value)}
                placeholder="password"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-orange"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* WAF Bypass */}
      <CollapsibleSection
        title="WAF Bypass"
        color="red"
        section="waf"
        expanded={expandedSections.has("waf")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {WAF_BYPASSES.map((waf) => (
            <button
              key={waf.id}
              onClick={() => update("wafBypass", waf.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                config.wafBypass === waf.id
                  ? "border-dracula-red bg-dracula-red/10 shadow-[0_0_12px_rgba(255,85,85,0.3)]"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <span className="text-xs font-semibold text-foreground block">
                {waf.name}
              </span>
              <span className="text-xs text-dracula-comment mt-0.5 block">
                {waf.description}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Generated Payloads */}
      <CollapsibleSection
        title={`Generated Payloads (${payloads.length})`}
        color="green"
        section="payloads"
        expanded={expandedSections.has("payloads")}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-dracula-comment">
              DB: <span className="text-dracula-purple">{DB_TYPES.find((d) => d.id === config.db)?.name}</span>
              {" | "}Type: <span className="text-dracula-green">{INJECTION_TYPES.find((i) => i.id === config.injectionType)?.name}</span>
              {" | "}Context: <span className="text-dracula-cyan">{CONTEXTS.find((c) => c.id === config.context)?.name}</span>
              {config.wafBypass !== "none" && (
                <>{" | "}WAF: <span className="text-dracula-red">{WAF_BYPASSES.find((w) => w.id === config.wafBypass)?.name}</span></>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-green transition-all"
                title="Copy shareable URL with current configuration"
              >
                {shared ? "Copied!" : "Share URL"}
              </button>
              <button
                onClick={reset}
                className="text-xs px-3 py-1 rounded border border-border text-dracula-red hover:bg-dracula-red/10 transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {payloads.length === 0 && (
            <div className="text-center py-8 text-dracula-comment text-sm">
              No payloads available for this configuration.
            </div>
          )}

          {payloads.map((p, i) => (
            <PayloadCard key={i} payload={p} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Auth Bypass Payloads */}
      <CollapsibleSection
        title="Authentication Bypass Payloads"
        color="pink"
        section="auth-bypass"
        expanded={expandedSections.has("auth-bypass")}
        onToggle={toggleSection}
      >
        <p className="text-xs text-dracula-comment mb-3">
          Common SQL injection payloads for bypassing login forms.
          These work across most database types.
        </p>
        <div className="space-y-3">
          {authPayloads.map((p, i) => (
            <PayloadCard key={i} payload={p} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Quick Reference */}
      <CollapsibleSection
        title="Quick Reference"
        color="cyan"
        section="reference"
        expanded={expandedSections.has("reference")}
        onToggle={toggleSection}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Payload</th>
                <th className="text-left py-2 pr-4">Description</th>
                <th className="text-left py-2 pr-4">Context</th>
                <th className="text-left py-2 pr-4">DB</th>
              </tr>
            </thead>
            <tbody>
              {QUICK_REFERENCE.map((ref, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <code className="text-dracula-green font-mono whitespace-nowrap text-xs max-w-[300px] truncate block">
                        {ref.payload}
                      </code>
                      <CopyButton
                        text={ref.payload}
                        label=""
                        className="shrink-0"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">
                    {ref.description}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="text-dracula-purple">{ref.context}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="text-dracula-cyan">{ref.db}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// -- Sub-components ------------------------------------------------

function PayloadCard({ payload }: { payload: SqliPayload }) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-semibold text-foreground">
            {payload.name}
          </span>
          {payload.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 rounded bg-dracula-purple/10 text-dracula-purple"
            >
              {tag}
            </span>
          ))}
        </div>
        <CopyButton text={payload.payload} />
      </div>
      <div className="relative">
        <pre className="px-4 py-3 text-sm text-dracula-green overflow-x-auto whitespace-pre-wrap break-all leading-relaxed font-mono bg-dracula-bg">
          <code>{payload.payload}</code>
        </pre>
      </div>
      <div className="px-4 py-2 border-t border-border/50">
        <p className="text-xs text-dracula-comment">{payload.description}</p>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  color,
  section,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  color: string;
  section: Section;
  expanded: boolean;
  onToggle: (section: Section) => void;
  children: React.ReactNode;
}) {
  const colorClass = `text-dracula-${color}`;

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={() => onToggle(section)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light transition-colors"
      >
        <h2 className="text-sm font-semibold text-foreground">
          <span className={colorClass}>#</span> {title}
        </h2>
        <span className="text-xs text-dracula-comment">
          {expanded ? "[-]" : "[+]"}
        </span>
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
