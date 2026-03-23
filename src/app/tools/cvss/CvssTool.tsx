"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calculateCvss31,
  calculateCvss40,
  parseCvss31Vector,
  parseCvss40Vector,
  SEVERITY_COLORS,
  SEVERITY_BG,
  CVSS31_METRIC_GROUPS,
  CVSS40_METRIC_GROUPS,
  VULN_PRESETS,
  SEVERITY_TABLE,
} from "@/lib/cvss";
import type {
  CvssVersion,
  Cvss31Metrics,
  Cvss40Metrics,
  CvssResult,
  MetricGroup,
  MetricDefinition,
} from "@/lib/cvss";
import CopyButton from "@/components/CopyButton";

// ── Default metrics ────────────────────────────────────────────────

const DEFAULT_31: Cvss31Metrics = {
  AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "H", I: "H", A: "H",
};

const DEFAULT_40: Cvss40Metrics = {
  AV: "N", AC: "L", AT: "N", PR: "N", UI: "N",
  VC: "H", VI: "H", VA: "H", SC: "N", SI: "N", SA: "N",
};

/* ── URL hash serialization ────────────────────────────────────── */

function serializeVectorToHash(vector: string): string {
  try {
    return btoa(unescape(encodeURIComponent(vector)));
  } catch {
    return "";
  }
}

function deserializeVectorFromHash(hash: string): string | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const vector = decodeURIComponent(escape(atob(clean)));
    if (vector.startsWith("CVSS:")) return vector;
    return null;
  } catch {
    return null;
  }
}

interface InitialCvssState {
  version: CvssVersion;
  metrics31: Cvss31Metrics;
  metrics40: Cvss40Metrics;
}

function getInitialCvssState(): InitialCvssState {
  if (typeof window !== "undefined") {
    const vector = deserializeVectorFromHash(window.location.hash);
    if (vector) {
      if (vector.startsWith("CVSS:3.1/") || vector.startsWith("CVSS:3.0/")) {
        const parsed = parseCvss31Vector(vector);
        if (parsed) return { version: "3.1", metrics31: parsed, metrics40: DEFAULT_40 };
      } else if (vector.startsWith("CVSS:4.0/")) {
        const parsed = parseCvss40Vector(vector);
        if (parsed) return { version: "4.0", metrics31: DEFAULT_31, metrics40: parsed };
      }
    }
  }
  return { version: "3.1", metrics31: DEFAULT_31, metrics40: DEFAULT_40 };
}

// ── Main component ─────────────────────────────────────────────────

export default function CvssTool() {
  const [initialState] = useState(getInitialCvssState);
  const [version, setVersion] = useState<CvssVersion>(initialState.version);
  const [metrics31, setMetrics31] = useState<Cvss31Metrics>(initialState.metrics31);
  const [metrics40, setMetrics40] = useState<Cvss40Metrics>(initialState.metrics40);
  const [vectorInput, setVectorInput] = useState("");
  const [vectorError, setVectorError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [shared, setShared] = useState(false);

  // Compute result
  const result = useMemo<CvssResult>(() => {
    if (version === "3.1") return calculateCvss31(metrics31);
    return calculateCvss40(metrics40);
  }, [version, metrics31, metrics40]);

  // Update a metric value
  const setMetric = useCallback((key: string, value: string) => {
    if (version === "3.1") {
      setMetrics31((prev) => ({ ...prev, [key]: value }));
    } else {
      setMetrics40((prev) => ({ ...prev, [key]: value }));
    }
  }, [version]);

  // Parse a pasted vector
  const parseVector = useCallback(() => {
    const v = vectorInput.trim();
    if (!v) {
      setVectorError("Paste a CVSS vector string");
      return;
    }

    if (v.startsWith("CVSS:3.1/") || v.startsWith("CVSS:3.0/")) {
      const parsed = parseCvss31Vector(v);
      if (parsed) {
        setMetrics31(parsed);
        setVersion("3.1");
        setVectorError("");
      } else {
        setVectorError("Invalid CVSS 3.1 vector. Ensure all base metrics are present.");
      }
    } else if (v.startsWith("CVSS:4.0/")) {
      const parsed = parseCvss40Vector(v);
      if (parsed) {
        setMetrics40(parsed);
        setVersion("4.0");
        setVectorError("");
      } else {
        setVectorError("Invalid CVSS 4.0 vector. Ensure all base metrics are present.");
      }
    } else {
      setVectorError("Unrecognized vector format. Must start with CVSS:3.1/ or CVSS:4.0/");
    }
  }, [vectorInput]);

  // Load a preset
  const loadPreset = useCallback((cvss31: string, cvss40: string) => {
    if (version === "3.1") {
      const parsed = parseCvss31Vector(cvss31);
      if (parsed) setMetrics31(parsed);
    } else {
      const parsed = parseCvss40Vector(cvss40);
      if (parsed) setMetrics40(parsed);
    }
  }, [version]);

  // Toggle expandable section
  const toggleExpanded = useCallback((name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  // Reset to defaults
  const reset = useCallback(() => {
    if (version === "3.1") setMetrics31(DEFAULT_31);
    else setMetrics40(DEFAULT_40);
    setVectorInput("");
    setVectorError("");
  }, [version]);

  // Share URL
  const handleShare = useCallback(() => {
    const hash = serializeVectorToHash(result.vector);
    if (hash && typeof window !== "undefined") {
      const url = window.location.origin + window.location.pathname + "#" + hash;
      window.history.replaceState(null, "", "#" + hash);
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [result.vector]);

  const metricGroups = version === "3.1" ? CVSS31_METRIC_GROUPS : CVSS40_METRIC_GROUPS;
  const currentMetrics = version === "3.1" ? metrics31 : metrics40;

  return (
    <div className="space-y-6">
      {/* Version tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setVersion("3.1")}
          className={`text-sm px-4 py-2 rounded-lg border transition-all font-semibold ${
            version === "3.1"
              ? "bg-dracula-purple/20 border-dracula-purple text-dracula-purple"
              : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
          }`}
        >
          CVSS 3.1
        </button>
        <button
          onClick={() => setVersion("4.0")}
          className={`text-sm px-4 py-2 rounded-lg border transition-all font-semibold ${
            version === "4.0"
              ? "bg-dracula-purple/20 border-dracula-purple text-dracula-purple"
              : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
          }`}
        >
          CVSS 4.0
        </button>
        <div className="flex-1" />
        <button
          onClick={reset}
          className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
        >
          Reset
        </button>
      </div>

      {/* Score display */}
      <ScoreBanner result={result} />

      {/* Vector string */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> Vector String
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-green transition-all"
              title="Copy shareable URL with current CVSS vector"
            >
              {shared ? "Copied!" : "Share URL"}
            </button>
            <CopyButton text={result.vector} label="Copy" />
          </div>
        </div>
        <code className="text-xs text-dracula-cyan font-mono break-all block">
          {result.vector}
        </code>
      </div>

      {/* Parse vector input */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          <span className="text-dracula-purple">#</span> Parse Vector
        </h2>
        <div className="flex gap-2">
          <input
            value={vectorInput}
            onChange={(e) => { setVectorInput(e.target.value); setVectorError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") parseVector(); }}
            placeholder="Paste CVSS:3.1/... or CVSS:4.0/... vector"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
            spellCheck={false}
          />
          <button
            onClick={parseVector}
            className="text-sm px-4 py-2 rounded-lg border border-dracula-purple text-dracula-purple hover:bg-dracula-purple/10 transition-all"
          >
            Parse
          </button>
        </div>
        {vectorError && (
          <p className="mt-1 text-xs text-dracula-red">{vectorError}</p>
        )}
      </div>

      {/* Metric groups */}
      {metricGroups.map((group) => (
        <MetricGroupPanel
          key={group.name}
          group={group}
          metrics={currentMetrics as unknown as Record<string, string | undefined>}
          onSelect={setMetric}
          expanded={group.expandable ? expanded[group.name] || false : true}
          onToggle={group.expandable ? () => toggleExpanded(group.name) : undefined}
        />
      ))}

      {/* Sub-scores (CVSS 3.1 only) */}
      {version === "3.1" && result.impactScore !== undefined && (
        <SubScores result={result} />
      )}

      {/* Common vulnerability presets */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Common Vulnerability Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {VULN_PRESETS.map((preset) => {
            const vec = version === "3.1" ? preset.cvss31Vector : preset.cvss40Vector;
            const parsed = version === "3.1" ? parseCvss31Vector(vec) : parseCvss40Vector(vec);
            const presetResult = parsed
              ? version === "3.1"
                ? calculateCvss31(parsed as Cvss31Metrics)
                : calculateCvss40(parsed as Cvss40Metrics)
              : null;
            const sev = presetResult ? presetResult.severity : "None";

            return (
              <button
                key={preset.label}
                onClick={() => loadPreset(preset.cvss31Vector, preset.cvss40Vector)}
                className="text-left rounded-lg border border-border bg-surface p-3 hover:border-dracula-purple transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-dracula-green">
                    {preset.label}
                  </span>
                  {presetResult && (
                    <span className={`text-xs font-bold ${SEVERITY_COLORS[sev]}`}>
                      {presetResult.baseScore}
                    </span>
                  )}
                </div>
                <span className="block text-xs text-dracula-comment mt-1">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity reference */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Severity Ratings
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Rating</th>
                <th className="text-left py-2 pr-4">Score Range</th>
              </tr>
            </thead>
            <tbody>
              {SEVERITY_TABLE.map((row) => (
                <tr key={row.rating} className="border-b border-border/50">
                  <td className={`py-2 pr-4 font-semibold ${row.color}`}>
                    {row.rating}
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg font-mono">
                    {row.range}
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

function ScoreBanner({ result }: { result: CvssResult }) {
  const severity = result.severity;
  const bgClass = SEVERITY_BG[severity];
  const textClass = SEVERITY_COLORS[severity];

  return (
    <div className={`rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${bgClass}`}>
      <div className="flex items-center gap-4">
        <div className={`text-4xl font-bold ${textClass}`}>
          {result.baseScore.toFixed(1)}
        </div>
        <div>
          <div className={`text-sm font-semibold ${textClass}`}>{severity}</div>
          <div className="text-xs text-dracula-comment mt-0.5">
            CVSS {result.version} Score
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Score bar visualization */}
        <div className="flex items-center gap-1.5 w-48">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const filled = result.baseScore >= n + 1;
            const partial = !filled && result.baseScore > n;
            let barColor = "bg-dracula-comment/20";
            if (filled || partial) {
              if (n < 4) barColor = "bg-dracula-green";
              else if (n < 7) barColor = "bg-dracula-yellow";
              else if (n < 9) barColor = "bg-dracula-orange";
              else barColor = "bg-dracula-red";
            }
            return (
              <div
                key={n}
                className={`h-3 flex-1 rounded-sm ${barColor} ${partial ? "opacity-50" : ""}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubScores({ result }: { result: CvssResult }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">
        <span className="text-dracula-yellow">#</span> Sub-Scores
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-dracula-comment">Impact</div>
          <div className="text-lg font-bold text-dracula-orange">
            {result.impactScore?.toFixed(1) ?? "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-dracula-comment">Exploitability</div>
          <div className="text-lg font-bold text-dracula-cyan">
            {result.exploitabilityScore?.toFixed(1) ?? "-"}
          </div>
        </div>
        {result.temporalScore !== undefined && (
          <div>
            <div className="text-xs text-dracula-comment">Temporal</div>
            <div className="text-lg font-bold text-dracula-purple">
              {result.temporalScore.toFixed(1)}
            </div>
          </div>
        )}
        {result.environmentalScore !== undefined && (
          <div>
            <div className="text-xs text-dracula-comment">Environmental</div>
            <div className="text-lg font-bold text-dracula-pink">
              {result.environmentalScore.toFixed(1)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricGroupPanel({
  group,
  metrics,
  onSelect,
  expanded,
  onToggle,
}: {
  group: MetricGroup;
  metrics: Record<string, string | undefined>;
  onSelect: (key: string, value: string) => void;
  expanded: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        disabled={!onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${
          onToggle ? "cursor-pointer hover:bg-surface-light" : "cursor-default"
        }`}
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> {group.name}
          </h2>
          <p className="text-xs text-dracula-comment mt-0.5">{group.description}</p>
        </div>
        {onToggle && (
          <span className="text-dracula-comment text-xs ml-4 shrink-0">
            {expanded ? "[-]" : "[+]"}
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
          {group.metrics.map((metric) => (
            <MetricRow
              key={metric.key}
              metric={metric}
              value={String(metrics[metric.key] || "X")}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MetricRow({
  metric,
  value,
  onSelect,
}: {
  metric: MetricDefinition;
  value: string;
  onSelect: (key: string, value: string) => void;
}) {
  const [showDesc, setShowDesc] = useState(false);
  const selectedOption = metric.options.find((o) => o.value === value);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-semibold text-dracula-cyan font-mono">
          {metric.key}
        </span>
        <span className="text-xs text-foreground font-semibold">
          {metric.name}
        </span>
        <button
          onClick={() => setShowDesc(!showDesc)}
          className="text-xs text-dracula-comment hover:text-foreground transition-colors"
          title="Toggle description"
        >
          [?]
        </button>
      </div>
      {showDesc && (
        <p className="text-xs text-dracula-comment mb-2 ml-0.5">
          {metric.description}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {metric.options.map((opt) => {
          const isSelected = opt.value === value;
          // Color by impact: first option is usually highest severity
          let selectedStyle = "bg-dracula-purple/20 border-dracula-purple text-dracula-purple";

          if (isSelected) {
            // Adjust color based on the metric type for visual feedback
            const idx = metric.options.indexOf(opt);
            const total = metric.options.length;
            const hasNotDefined = metric.options[0]?.value === "X";
            const adjustedIdx = hasNotDefined ? idx - 1 : idx;
            const adjustedTotal = hasNotDefined ? total - 1 : total;

            if (opt.value === "X") {
              selectedStyle = "bg-dracula-comment/20 border-dracula-comment text-dracula-comment";
            } else if (adjustedTotal <= 2) {
              selectedStyle = adjustedIdx === 0
                ? "bg-dracula-red/20 border-dracula-red text-dracula-red"
                : "bg-dracula-green/20 border-dracula-green text-dracula-green";
            } else {
              selectedStyle = "bg-dracula-purple/20 border-dracula-purple text-dracula-purple";
            }
          }

          return (
            <button
              key={opt.value}
              onClick={() => onSelect(metric.key, opt.value)}
              className={`text-xs px-3 py-1.5 rounded border transition-all font-mono ${
                isSelected
                  ? selectedStyle
                  : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
              }`}
              title={opt.description}
            >
              <span className="font-semibold">{opt.abbrev}</span>
              <span className="ml-1 hidden sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {selectedOption && (
        <p className="text-xs text-dracula-comment mt-1 ml-0.5">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}
