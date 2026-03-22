"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  identifyHash,
  generateHash,
  getGeneratorAlgorithms,
  HASH_TYPES,
} from "@/lib/hash";
import CopyButton from "@/components/CopyButton";

type Tab = "identify" | "generate";

export default function HashTool() {
  const [tab, setTab] = useState<Tab>("identify");

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("identify")}
          className={`text-sm px-4 py-2 rounded-lg border transition-all ${
            tab === "identify"
              ? "border-dracula-purple text-dracula-purple bg-dracula-purple/10"
              : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
          }`}
        >
          Identify Hash
        </button>
        <button
          onClick={() => setTab("generate")}
          className={`text-sm px-4 py-2 rounded-lg border transition-all ${
            tab === "generate"
              ? "border-dracula-green text-dracula-green bg-dracula-green/10"
              : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-green"
          }`}
        >
          Generate Hash
        </button>
      </div>

      {tab === "identify" ? <IdentifyPanel /> : <GeneratePanel />}

      {/* Reference table */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Hash Type Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Algorithm</th>
                <th className="text-left py-2 pr-4">Length (hex)</th>
                <th className="text-left py-2 pr-4">Bits</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {HASH_TYPES.map((h) => (
                <tr key={h.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-dracula-green font-semibold">
                    {h.name}
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">{h.length}</td>
                  <td className="py-2 pr-4 text-dracula-fg">
                    {(h.length / 2) * 8}
                  </td>
                  <td className="py-2 text-dracula-comment">{h.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function IdentifyPanel() {
  const [input, setInput] = useState("");

  const results = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return [];
    return identifyHash(trimmed);
  }, [input]);

  const confidenceColor = (c: string) => {
    switch (c) {
      case "high":
        return "text-dracula-green";
      case "medium":
        return "text-dracula-yellow";
      case "low":
        return "text-dracula-orange";
      default:
        return "text-dracula-comment";
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> Hash to Identify
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
          placeholder="Paste a hash to identify (e.g., 5d41402abc4b2a76b9719d911017c592)"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Results */}
      {input.trim() && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            <span className="text-dracula-green">#</span> Results
          </h2>
          {results.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-4 text-sm text-dracula-comment">
              No matching hash types found. Verify the input is a valid hash
              string.
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((match, i) => (
                <div
                  key={`${match.type.id}-${i}`}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {match.type.name}
                    </span>
                    <span
                      className={`text-xs font-semibold ${confidenceColor(
                        match.confidence
                      )}`}
                    >
                      {match.confidence} confidence
                    </span>
                  </div>
                  <p className="text-xs text-dracula-comment">{match.reason}</p>
                  <p className="text-xs text-dracula-comment mt-1">
                    {match.type.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Example hashes */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Example Hashes
        </h2>
        <div className="space-y-2">
          {HASH_TYPES.slice(0, 5).map((h) => (
            <button
              key={h.id}
              onClick={() => setInput(h.example)}
              className="block w-full text-left rounded-lg border border-border bg-surface p-3 hover:border-dracula-purple transition-all"
            >
              <span className="text-xs font-semibold text-dracula-green">
                {h.name}
              </span>
              <code className="block text-xs text-dracula-comment mt-1 font-mono truncate">
                {h.example}
              </code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeneratePanel() {
  const algorithms = getGeneratorAlgorithms();
  const [input, setInput] = useState("");
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>([
    "md5",
    "sha1",
    "sha256",
    "ntlm",
  ]);
  const [results, setResults] = useState<
    { id: string; name: string; hash: string }[]
  >([]);
  const [generating, setGenerating] = useState(false);

  const toggleAlgo = useCallback((id: string) => {
    setSelectedAlgos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedAlgos(algorithms.map((a) => a.id));
  }, [algorithms]);

  const generate = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || selectedAlgos.length === 0) return;

    setGenerating(true);
    try {
      const hashResults = await Promise.all(
        selectedAlgos.map(async (id) => {
          const algo = algorithms.find((a) => a.id === id);
          const hash = await generateHash(id, trimmed);
          return { id, name: algo?.name ?? id, hash };
        })
      );
      setResults(hashResults);
    } catch {
      setResults([]);
    }
    setGenerating(false);
  }, [input, selectedAlgos, algorithms]);

  // Auto-generate on input/algo change
  useEffect(() => {
    if (input.trim()) {
      generate();
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, selectedAlgos]);

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> Text to Hash
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
          placeholder="Enter text to generate hashes..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Algorithm selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-dracula-comment">
            Algorithms
          </label>
          <button
            onClick={selectAll}
            className="text-xs px-2 py-1 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
          >
            Select All
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {algorithms.map((algo) => (
            <button
              key={algo.id}
              onClick={() => toggleAlgo(algo.id)}
              className={`text-xs px-3 py-1.5 rounded border transition-all ${
                selectedAlgos.includes(algo.id)
                  ? "border-dracula-green text-dracula-green bg-dracula-green/10"
                  : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple"
              }`}
            >
              {algo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            <span className="text-dracula-green">#</span> Generated Hashes
            {generating && (
              <span className="text-xs text-dracula-comment ml-2">
                generating...
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-surface overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-light">
                  <span className="text-xs text-dracula-green font-semibold">
                    {r.name}
                  </span>
                  <CopyButton text={r.hash} />
                </div>
                <pre className="p-4 text-xs text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed font-mono">
                  <code>{r.hash}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
