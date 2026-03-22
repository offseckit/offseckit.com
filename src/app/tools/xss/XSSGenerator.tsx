"use client";

import { useState, useMemo, useCallback } from "react";
import {
  generatePayloads,
  getPolyglotPayloads,
  getDefaultConfig,
  CONTEXTS,
  ACTIONS,
  ENCODINGS,
  WAF_PROFILES,
  QUICK_REFERENCE,
} from "@/lib/xss";
import type {
  XssConfig,
  InjectionContext,
  XssAction,
  EncodingType,
  WafProfile,
  XssPayload,
} from "@/lib/xss";
import CopyButton from "@/components/CopyButton";

type Section = "context" | "action" | "encoding" | "waf" | "filters" | "payloads" | "polyglots" | "reference";

export default function XSSGenerator() {
  const [config, setConfig] = useState<XssConfig>(getDefaultConfig());
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(
    new Set(["context", "action", "payloads"])
  );

  const payloads = useMemo(() => generatePayloads(config), [config]);
  const polyglots = useMemo(
    () => {
      const js = config.action === "custom" ? (config.customJs || "alert(1)") : (config.action === "alert" ? "alert(1)" : config.action === "console" ? "console.log(1)" : "alert(1)");
      return getPolyglotPayloads(js);
    },
    [config.action, config.customJs]
  );

  const toggleSection = useCallback((section: Section) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const update = useCallback(
    <K extends keyof XssConfig>(key: K, value: XssConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    setConfig(getDefaultConfig());
  }, []);

  const contextInfo = CONTEXTS.find((c) => c.id === config.context);

  return (
    <div className="space-y-6">
      {/* Context Selector */}
      <CollapsibleSection
        title="Injection Context"
        color="purple"
        section="context"
        expanded={expandedSections.has("context")}
        onToggle={toggleSection}
      >
        <div className="space-y-2">
          {CONTEXTS.map((ctx) => (
            <label
              key={ctx.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                config.context === ctx.id
                  ? "border-dracula-purple bg-dracula-purple/5"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <input
                type="radio"
                name="context"
                value={ctx.id}
                checked={config.context === ctx.id}
                onChange={() => update("context", ctx.id as InjectionContext)}
                className="mt-0.5 accent-dracula-purple"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">
                    {ctx.name}
                  </span>
                  <code className="text-xs text-dracula-cyan">{ctx.example}</code>
                </div>
                <p className="text-xs text-dracula-comment mt-0.5">
                  {ctx.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Action Selector */}
      <CollapsibleSection
        title="Payload Action"
        color="green"
        section="action"
        expanded={expandedSections.has("action")}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACTIONS.map((act) => (
              <button
                key={act.id}
                onClick={() => update("action", act.id as XssAction)}
                className={`text-left rounded-lg border p-3 transition-all ${
                  config.action === act.id
                    ? "border-dracula-green bg-dracula-green/5"
                    : "border-border bg-surface hover:border-dracula-comment"
                }`}
              >
                <span className="text-xs font-semibold text-foreground block">
                  {act.name}
                </span>
                <span className="text-xs text-dracula-comment mt-0.5 block">
                  {act.description}
                </span>
              </button>
            ))}
          </div>
          {config.action === "custom" && (
            <div>
              <label className="block text-xs text-dracula-comment mb-1.5">
                Custom JavaScript
              </label>
              <input
                type="text"
                value={config.customJs}
                onChange={(e) => update("customJs", e.target.value)}
                placeholder="alert(document.domain)"
                className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-green"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Encoding */}
      <CollapsibleSection
        title="Encoding"
        color="cyan"
        section="encoding"
        expanded={expandedSections.has("encoding")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ENCODINGS.map((enc) => (
            <button
              key={enc.id}
              onClick={() => update("encoding", enc.id as EncodingType)}
              className={`text-left rounded-lg border p-2 transition-all ${
                config.encoding === enc.id
                  ? "border-dracula-cyan bg-dracula-cyan/5"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <span className="text-xs font-semibold text-foreground block">
                {enc.name}
              </span>
              <span className="text-xs text-dracula-comment mt-0.5 block">
                {enc.description}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* WAF Bypass */}
      <CollapsibleSection
        title="WAF Bypass Profile"
        color="orange"
        section="waf"
        expanded={expandedSections.has("waf")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {WAF_PROFILES.map((waf) => (
            <button
              key={waf.id}
              onClick={() => update("wafProfile", waf.id as WafProfile)}
              className={`text-left rounded-lg border p-3 transition-all ${
                config.wafProfile === waf.id
                  ? "border-dracula-orange bg-dracula-orange/5"
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

      {/* Blocked Characters Filter */}
      <CollapsibleSection
        title="Blocked Characters"
        color="red"
        section="filters"
        expanded={expandedSections.has("filters")}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-dracula-comment mb-1.5">
              Characters that are filtered/blocked (payloads using these will be hidden)
            </label>
            <input
              type="text"
              value={config.blockedChars}
              onChange={(e) => update("blockedChars", e.target.value)}
              placeholder={'e.g., <>"\'()'}
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["<>", "\"'", "()", "script", "on", "alert"].map((chars) => (
              <button
                key={chars}
                onClick={() => {
                  const current = config.blockedChars;
                  const newChars = [...chars].filter((c) => !current.includes(c)).join("");
                  update("blockedChars", current + newChars);
                }}
                className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-red transition-all"
              >
                Block: {chars}
              </button>
            ))}
            <button
              onClick={() => update("blockedChars", "")}
              className="text-xs px-3 py-1.5 rounded border border-border text-dracula-red hover:bg-dracula-red/10 transition-all"
            >
              Clear
            </button>
          </div>
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
          {contextInfo && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-dracula-comment">
                Context: <span className="text-dracula-purple">{contextInfo.name}</span>
                {config.encoding !== "none" && (
                  <> | Encoding: <span className="text-dracula-cyan">{ENCODINGS.find((e) => e.id === config.encoding)?.name}</span></>
                )}
                {config.wafProfile !== "none" && (
                  <> | WAF: <span className="text-dracula-orange">{WAF_PROFILES.find((w) => w.id === config.wafProfile)?.name}</span></>
                )}
              </p>
              <button
                onClick={reset}
                className="text-xs px-3 py-1 rounded border border-border text-dracula-red hover:bg-dracula-red/10 transition-all"
              >
                Reset
              </button>
            </div>
          )}

          {payloads.length === 0 && (
            <div className="text-center py-8 text-dracula-comment text-sm">
              No payloads match the current filters. Try removing blocked characters or changing the context.
            </div>
          )}

          {payloads.map((p, i) => (
            <PayloadCard key={i} payload={p} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Polyglot Payloads */}
      <CollapsibleSection
        title="Polyglot Payloads"
        color="pink"
        section="polyglots"
        expanded={expandedSections.has("polyglots")}
        onToggle={toggleSection}
      >
        <p className="text-xs text-dracula-comment mb-3">
          Polyglot payloads work across multiple injection contexts. Use when you are unsure of the exact context.
        </p>
        <div className="space-y-3">
          {polyglots.map((p, i) => (
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
                      <CopyButton text={ref.payload} label="" className="shrink-0" />
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">{ref.description}</td>
                  <td className="py-2 pr-4">
                    <span className="text-dracula-purple">{ref.context}</span>
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

// ── Sub-components ────────────────────────────────────────────────

function PayloadCard({ payload }: { payload: XssPayload }) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-semibold text-foreground">{payload.name}</span>
          {payload.requiresInteraction && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-dracula-yellow/10 text-dracula-yellow border border-dracula-yellow/20">
              interaction
            </span>
          )}
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
