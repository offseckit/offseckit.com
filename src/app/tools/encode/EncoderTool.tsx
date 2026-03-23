"use client";

import { useState, useMemo, useCallback } from "react";
import {
  getOperations,
  runChain,
  detectEncoding,
  type ChainStep,
  type DetectedEncoding,
} from "@/lib/encode";
import CopyButton from "@/components/CopyButton";

let stepCounter = 0;
function nextStepId() {
  return "step-" + ++stepCounter;
}

/* ── URL hash serialization ────────────────────────────────────── */

function serializeToHash(input: string, steps: ChainStep[]) {
  try {
    const state = {
      i: input,
      s: steps.map((s) => s.operationId),
    };
    const json = JSON.stringify(state);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return encoded;
  } catch {
    return "";
  }
}

function deserializeFromHash(
  hash: string
): { input: string; ops: string[] } | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const json = decodeURIComponent(escape(atob(clean)));
    const state = JSON.parse(json);
    if (typeof state.i === "string" && Array.isArray(state.s)) {
      return { input: state.i, ops: state.s as string[] };
    }
    return null;
  } catch {
    return null;
  }
}

function getInitialState(): { input: string; steps: ChainStep[] } {
  if (typeof window !== "undefined") {
    const state = deserializeFromHash(window.location.hash);
    if (state) {
      return {
        input: state.input,
        steps: state.ops.map((operationId) => ({ id: nextStepId(), operationId })),
      };
    }
  }
  return {
    input: "",
    steps: [{ id: nextStepId(), operationId: "base64-encode" }],
  };
}

/* ── Component ─────────────────────────────────────────────────── */

export default function EncoderTool() {
  const operations = getOperations();
  const [initial] = useState(getInitialState);
  const [input, setInput] = useState(initial.input);
  const [steps, setSteps] = useState<ChainStep[]>(initial.steps);
  const [opSearch, setOpSearch] = useState("");
  const [detectedEncodings, setDetectedEncodings] = useState<
    DetectedEncoding[]
  >([]);
  const [showDetected, setShowDetected] = useState(false);

  const { results, error, errorStep } = useMemo(
    () => (input ? runChain(input, steps) : { results: [] }),
    [input, steps]
  );

  const finalOutput = results.length > 0 ? results[results.length - 1] : "";

  const addStep = useCallback((operationId: string) => {
    setSteps((prev) => [...prev, { id: nextStepId(), operationId }]);
  }, []);

  const removeStep = useCallback((index: number) => {
    setSteps((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateStep = useCallback((index: number, operationId: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, operationId } : s))
    );
  }, []);

  const moveStep = useCallback((index: number, direction: -1 | 1) => {
    setSteps((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const swapDirection = useCallback(() => {
    setSteps((prev) => {
      const reversed = [...prev].reverse();
      return reversed.map((step) => {
        const op = operations.find((o) => o.id === step.operationId);
        if (!op) return step;
        const baseName = step.operationId.replace(/-encode|-decode/, "");
        const isEncode =
          step.operationId.endsWith("-encode") ||
          step.operationId.endsWith("-encode-full") ||
          step.operationId.endsWith("-encode-all") ||
          step.operationId.endsWith("-encode-prefixed");

        // Try to find the opposite operation
        let oppositeId: string | undefined;
        if (isEncode) {
          oppositeId = operations.find(
            (o) => o.id === baseName + "-decode"
          )?.id;
        } else if (step.operationId.endsWith("-decode")) {
          oppositeId = operations.find(
            (o) => o.id === baseName + "-encode"
          )?.id;
        } else if (step.operationId === "unicode-escape") {
          oppositeId = "unicode-unescape";
        } else if (step.operationId === "unicode-unescape") {
          oppositeId = "unicode-escape";
        }

        return oppositeId ? { ...step, operationId: oppositeId } : step;
      });
    });
  }, [operations]);

  // Group operations by type for the dropdown
  const groupedOps = useMemo(() => {
    const groups: { label: string; ops: typeof operations }[] = [
      {
        label: "Base64",
        ops: operations.filter(
          (o) => o.id.startsWith("base64-") || o.id.startsWith("base64url")
        ),
      },
      {
        label: "Base32 / Base58",
        ops: operations.filter(
          (o) => o.id.startsWith("base32") || o.id.startsWith("base58")
        ),
      },
      {
        label: "URL",
        ops: operations.filter((o) => o.id.startsWith("url")),
      },
      {
        label: "Hex",
        ops: operations.filter((o) => o.id.startsWith("hex")),
      },
      {
        label: "HTML",
        ops: operations.filter((o) => o.id.startsWith("html")),
      },
      {
        label: "Unicode",
        ops: operations.filter((o) => o.id.startsWith("unicode")),
      },
      {
        label: "Punycode",
        ops: operations.filter((o) => o.id.startsWith("punycode")),
      },
      {
        label: "Binary",
        ops: operations.filter((o) => o.id.startsWith("binary")),
      },
      {
        label: "Decimal / Octal",
        ops: operations.filter(
          (o) => o.id.startsWith("decimal") || o.id.startsWith("octal")
        ),
      },
      {
        label: "Transform",
        ops: operations.filter((o) =>
          ["rot13", "rot47", "reverse", "uppercase", "lowercase"].includes(o.id)
        ),
      },
    ];
    return groups;
  }, [operations]);

  // Filter operations based on search
  const filteredGroupedOps = useMemo(() => {
    if (!opSearch.trim()) return groupedOps;
    const q = opSearch.toLowerCase();
    return groupedOps
      .map((group) => ({
        ...group,
        ops: group.ops.filter(
          (op) =>
            op.name.toLowerCase().includes(q) ||
            op.id.toLowerCase().includes(q) ||
            op.description.toLowerCase().includes(q) ||
            group.label.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.ops.length > 0);
  }, [groupedOps, opSearch]);

  // Quick-action presets
  const presets = [
    { label: "Base64 Encode", ops: ["base64-encode"] },
    { label: "Base64 Decode", ops: ["base64-decode"] },
    { label: "URL Encode", ops: ["url-encode"] },
    { label: "URL Decode", ops: ["url-decode"] },
    { label: "Hex Encode", ops: ["hex-encode"] },
    { label: "Hex Decode", ops: ["hex-decode"] },
    { label: "HTML Encode", ops: ["html-encode"] },
    { label: "Double URL Encode", ops: ["url-encode", "url-encode"] },
    { label: "Base64 + URL", ops: ["base64-encode", "url-encode"] },
  ];

  const applyPreset = useCallback((ops: string[]) => {
    setSteps(ops.map((operationId) => ({ id: nextStepId(), operationId })));
  }, []);

  // Auto-detect encoding
  const handleDetect = useCallback(() => {
    if (!input.trim()) {
      setDetectedEncodings([]);
      setShowDetected(false);
      return;
    }
    const detected = detectEncoding(input);
    setDetectedEncodings(detected);
    setShowDetected(true);
  }, [input]);

  // Share URL
  const handleShare = useCallback(() => {
    const hash = serializeToHash(input, steps);
    if (hash && typeof window !== "undefined") {
      const url = window.location.origin + window.location.pathname + "#" + hash;
      window.history.replaceState(null, "", "#" + hash);
      navigator.clipboard.writeText(url);
    }
  }, [input, steps]);

  // Check which preset matches the current chain
  const activePresetLabel = useMemo(() => {
    const currentOps = steps.map((s) => s.operationId);
    const match = presets.find(
      (p) =>
        p.ops.length === currentOps.length &&
        p.ops.every((op, i) => op === currentOps[i])
    );
    return match?.label ?? null;
  }, [steps, presets]);

  // Determine which options to render in selects
  const selectGroups = filteredGroupedOps.length > 0 ? filteredGroupedOps : groupedOps;

  return (
    <div className="space-y-6">
      {/* Quick presets */}
      <div>
        <label className="block text-xs text-dracula-comment mb-2">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.ops)}
              className={`text-xs px-3 py-1.5 rounded border transition-all ${
                activePresetLabel === p.label
                  ? "border-dracula-purple text-dracula-purple bg-dracula-purple/10 shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                  : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operation chain */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-dracula-comment">
            Operation Chain
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-green transition-all"
              title="Copy shareable URL with current recipe and input"
            >
              Share URL
            </button>
            <button
              onClick={swapDirection}
              className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-cyan transition-all"
              title="Reverse chain and swap encode/decode directions"
            >
              Swap Direction
            </button>
          </div>
        </div>

        {/* Operation search/filter */}
        <div className="mb-2">
          <input
            type="text"
            value={opSearch}
            onChange={(e) => setOpSearch(e.target.value)}
            placeholder="Filter operations... (e.g. base64, url, hex)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-dracula-purple placeholder:text-dracula-comment/50"
          />
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <span className="text-xs text-dracula-comment w-5 text-right shrink-0">
                {i + 1}.
              </span>
              <select
                value={step.operationId}
                onChange={(e) => updateStep(i, e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-dracula-purple bg-surface text-foreground ${
                  errorStep === i
                    ? "border-dracula-red"
                    : "border-border"
                }`}
              >
                {selectGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.ops.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                onClick={() => moveStep(i, -1)}
                disabled={i === 0}
                className="text-xs px-2 py-2 rounded border border-border text-dracula-comment hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveStep(i, 1)}
                disabled={i === steps.length - 1}
                className="text-xs px-2 py-2 rounded border border-border text-dracula-comment hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => removeStep(i)}
                disabled={steps.length <= 1}
                className="text-xs px-2 py-2 rounded border border-border text-dracula-red hover:bg-dracula-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Remove step"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addStep("base64-encode")}
          className="mt-2 text-xs px-3 py-1.5 rounded border border-dashed border-border text-dracula-comment hover:text-dracula-green hover:border-dracula-green transition-all"
        >
          + Add Step
        </button>
      </div>

      {/* Input / Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">
              <span className="text-dracula-pink">#</span> Input
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dracula-comment">
                {new TextEncoder().encode(input).length} bytes
              </span>
              <button
                onClick={handleDetect}
                className="text-xs px-2 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-yellow transition-all"
                title="Auto-detect what encoding the input might be"
              >
                Detect
              </button>
              <button
                onClick={() => {
                  setInput("");
                  setShowDetected(false);
                  setDetectedEncodings([]);
                }}
                className="text-xs px-2 py-1 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (showDetected) setShowDetected(false);
            }}
            placeholder="Enter text to encode or decode..."
            rows={8}
            className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed"
            spellCheck={false}
          />

          {/* Auto-detect results */}
          {showDetected && detectedEncodings.length > 0 && (
            <div className="mt-2 rounded-lg border border-dracula-yellow/30 bg-surface p-3">
              <p className="text-xs text-dracula-yellow mb-2 font-semibold">
                Detected encodings:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedEncodings.map((det, i) => (
                  <button
                    key={det.id + "-" + i}
                    onClick={() =>
                      setSteps([
                        { id: nextStepId(), operationId: det.id },
                      ])
                    }
                    className={`text-xs px-3 py-1.5 rounded border transition-all ${
                      det.confidence === "high"
                        ? "border-dracula-green text-dracula-green hover:bg-dracula-green/10"
                        : det.confidence === "medium"
                        ? "border-dracula-yellow text-dracula-yellow hover:bg-dracula-yellow/10"
                        : "border-dracula-comment text-dracula-comment hover:bg-dracula-comment/10"
                    }`}
                    title={`Confidence: ${det.confidence}`}
                  >
                    {det.name}
                    <span className="ml-1 opacity-60">
                      ({det.confidence})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {showDetected && detectedEncodings.length === 0 && (
            <div className="mt-2 rounded-lg border border-border bg-surface p-3">
              <p className="text-xs text-dracula-comment">
                No encoding patterns detected in the input.
              </p>
            </div>
          )}
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">
              <span className="text-dracula-green">#</span> Output
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dracula-comment">
                {new TextEncoder().encode(finalOutput).length} bytes
              </span>
              <CopyButton text={finalOutput} />
              <button
                onClick={() => {
                  setInput(finalOutput);
                }}
                className="text-xs px-2 py-1 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
                title="Use output as input"
              >
                ↩ Reuse
              </button>
            </div>
          </div>
          <textarea
            value={error && errorStep !== undefined ? `Error at step ${errorStep + 1}: ${error}` : finalOutput}
            readOnly
            rows={8}
            className={`w-full px-4 py-3 rounded-lg border bg-dracula-bg text-sm font-mono resize-y leading-relaxed ${
              error
                ? "border-dracula-red text-dracula-red"
                : "border-border text-dracula-fg"
            }`}
          />
        </div>
      </div>

      {/* Intermediate results for multi-step chains */}
      {steps.length > 1 && results.length > 0 && !error && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            <span className="text-dracula-cyan">#</span> Chain Steps
          </h2>
          <div className="space-y-2">
            {results.map((result, i) => {
              const op = operations.find((o) => o.id === steps[i].operationId);
              return (
                <div
                  key={steps[i].id + "-result"}
                  className="rounded-lg border border-border bg-surface overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-light">
                    <span className="text-xs text-dracula-comment">
                      Step {i + 1}: {op?.name ?? steps[i].operationId}
                    </span>
                    <CopyButton text={result} />
                  </div>
                  <pre className="p-4 text-xs text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-32 overflow-y-auto">
                    <code>{result}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
