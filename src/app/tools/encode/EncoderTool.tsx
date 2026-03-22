"use client";

import { useState, useMemo, useCallback } from "react";
import {
  getOperations,
  runChain,
  type ChainStep,
} from "@/lib/encode";
import CopyButton from "@/components/CopyButton";

let stepCounter = 0;
function nextStepId() {
  return "step-" + ++stepCounter;
}

export default function EncoderTool() {
  const operations = getOperations();
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<ChainStep[]>([
    { id: nextStepId(), operationId: "base64-encode" },
  ]);

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

        return oppositeId
          ? { ...step, operationId: oppositeId }
          : step;
      });
    });
  }, [operations]);

  // Group operations by type for the dropdown
  const groupedOps = useMemo(() => {
    const groups: { label: string; ops: typeof operations }[] = [
      {
        label: "Base64",
        ops: operations.filter((o) => o.id.startsWith("base64")),
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
          ["rot13", "reverse", "uppercase", "lowercase"].includes(o.id)
        ),
      },
    ];
    return groups;
  }, [operations]);

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
              className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple transition-all"
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
          <button
            onClick={swapDirection}
            className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-cyan transition-all"
            title="Reverse chain and swap encode/decode directions"
          >
            Swap Direction
          </button>
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
                {groupedOps.map((group) => (
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
            placeholder="Enter text to encode or decode..."
            rows={8}
            className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed"
            spellCheck={false}
          />
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
