"use client";

import { useState, useMemo, useCallback } from "react";
import {
  generateWordlist,
  encodeConfigToHash,
  decodeConfigFromHash,
  DEFAULT_CONFIG,
  LEET_MAPPINGS,
  ALL_SYMBOLS,
  ALL_SUFFIXES,
  type WordlistConfig,
} from "@/lib/wordlist";
import CopyButton from "@/components/CopyButton";

const CASE_OPTIONS = [
  { id: "original", label: "Original" },
  { id: "lower", label: "lowercase" },
  { id: "upper", label: "UPPERCASE" },
  { id: "capitalize", label: "Capitalize" },
  { id: "toggle", label: "tOgGlE" },
];

const NUMBER_RANGES = [
  { id: "0-9", label: "0-9" },
  { id: "00-99", label: "00-99" },
  { id: "years", label: "Years" },
];

const SEPARATOR_OPTIONS = [
  { id: "", label: "none" },
  { id: "_", label: "_" },
  { id: "-", label: "-" },
  { id: ".", label: "." },
];

const PREVIEW_LIMIT = 200;

function getInitialConfig(): WordlistConfig {
  if (typeof window !== "undefined" && window.location.hash.length > 1) {
    const hash = window.location.hash.slice(1);
    const decoded = decodeConfigFromHash(hash);
    if (decoded) {
      return { ...DEFAULT_CONFIG, ...decoded, baseWords: decoded.baseWords || [] };
    }
  }
  return { ...DEFAULT_CONFIG, baseWords: [] };
}

function getInitialText(): string {
  if (typeof window !== "undefined" && window.location.hash.length > 1) {
    const hash = window.location.hash.slice(1);
    const decoded = decodeConfigFromHash(hash);
    if (decoded && decoded.baseWords && decoded.baseWords.length > 0) {
      return decoded.baseWords.join("\n");
    }
  }
  return "";
}

export default function WordlistGenerator() {
  const [config, setConfig] = useState<WordlistConfig>(getInitialConfig);
  const [baseWordsText, setBaseWordsText] = useState(getInitialText);
  const [showAll, setShowAll] = useState(false);

  // Derive base words from text and merge into config for generation
  const baseWords = useMemo(
    () =>
      baseWordsText
        .split("\n")
        .map((w) => w.trim())
        .filter((w) => w.length > 0),
    [baseWordsText]
  );

  const fullConfig = useMemo(
    () => ({ ...config, baseWords }),
    [config, baseWords]
  );

  const wordlist = useMemo(() => generateWordlist(fullConfig), [fullConfig]);

  const previewWords = useMemo(
    () => (showAll ? wordlist : wordlist.slice(0, PREVIEW_LIMIT)),
    [wordlist, showAll]
  );

  const updateConfig = useCallback(
    (updates: Partial<WordlistConfig>) => {
      setConfig((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const toggleArrayItem = useCallback(
    (key: keyof WordlistConfig, value: string) => {
      setConfig((prev) => {
        const arr = prev[key] as string[];
        const next = arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value];
        return { ...prev, [key]: next };
      });
    },
    []
  );

  const handleDownload = useCallback(() => {
    if (wordlist.length === 0) return;
    const blob = new Blob([wordlist.join("\n") + "\n"], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wordlist.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [wordlist]);

  const handleShare = useCallback(() => {
    const hash = encodeConfigToHash(fullConfig);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url);
  }, [fullConfig]);

  return (
    <div className="space-y-6">
      {/* Base Words Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> Base Words
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dracula-comment">
              {baseWords.length} word{baseWords.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setBaseWordsText("")}
              className="text-xs px-2 py-1 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={baseWordsText}
          onChange={(e) => setBaseWordsText(e.target.value)}
          placeholder={"Enter base words (one per line)\ne.g.:\npassword\nadmin\ncompany\njohn\n2024"}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple resize-y leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Mutation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Case Variations */}
        <MutationSection
          title="Case Variations"
          color="purple"
          enabled={config.enableCaseVariations}
          onToggle={(v) => updateConfig({ enableCaseVariations: v })}
        >
          <div className="flex flex-wrap gap-2">
            {CASE_OPTIONS.map((opt) => (
              <ToggleChip
                key={opt.id}
                label={opt.label}
                active={config.caseVariations.includes(opt.id)}
                onClick={() => toggleArrayItem("caseVariations", opt.id)}
                color="purple"
              />
            ))}
          </div>
        </MutationSection>

        {/* Leet Speak */}
        <MutationSection
          title="Leet Speak"
          color="green"
          enabled={config.enableLeet}
          onToggle={(v) => updateConfig({ enableLeet: v })}
        >
          <div className="flex flex-wrap gap-2">
            {LEET_MAPPINGS.map((m) => (
              <ToggleChip
                key={m.char}
                label={`${m.char} → ${m.replacements.join("/")}`}
                active={config.leetMappings.includes(m.char)}
                onClick={() => toggleArrayItem("leetMappings", m.char)}
                color="green"
              />
            ))}
          </div>
        </MutationSection>

        {/* Append Numbers */}
        <MutationSection
          title="Append Numbers"
          color="cyan"
          enabled={config.enableNumbers}
          onToggle={(v) => updateConfig({ enableNumbers: v })}
        >
          <div className="flex flex-wrap gap-2">
            {NUMBER_RANGES.map((r) => (
              <ToggleChip
                key={r.id}
                label={r.label}
                active={config.numberRanges.includes(r.id)}
                onClick={() => toggleArrayItem("numberRanges", r.id)}
                color="cyan"
              />
            ))}
          </div>
          {config.numberRanges.includes("years") && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={config.customYearStart}
                onChange={(e) =>
                  updateConfig({ customYearStart: parseInt(e.target.value) || 2020 })
                }
                className="w-20 px-2 py-1 rounded border border-border bg-dracula-bg text-dracula-fg text-xs font-mono focus:outline-none focus:border-dracula-cyan"
              />
              <span className="text-xs text-dracula-comment">to</span>
              <input
                type="number"
                value={config.customYearEnd}
                onChange={(e) =>
                  updateConfig({ customYearEnd: parseInt(e.target.value) || 2026 })
                }
                className="w-20 px-2 py-1 rounded border border-border bg-dracula-bg text-dracula-fg text-xs font-mono focus:outline-none focus:border-dracula-cyan"
              />
            </div>
          )}
        </MutationSection>

        {/* Append Symbols */}
        <MutationSection
          title="Append Symbols"
          color="orange"
          enabled={config.enableSymbols}
          onToggle={(v) => updateConfig({ enableSymbols: v })}
        >
          <div className="flex flex-wrap gap-2">
            {ALL_SYMBOLS.map((s) => (
              <ToggleChip
                key={s}
                label={s}
                active={config.symbols.includes(s)}
                onClick={() => toggleArrayItem("symbols", s)}
                color="orange"
              />
            ))}
          </div>
        </MutationSection>

        {/* Common Suffixes */}
        <MutationSection
          title="Common Suffixes"
          color="yellow"
          enabled={config.enableSuffixes}
          onToggle={(v) => updateConfig({ enableSuffixes: v })}
        >
          <div className="flex flex-wrap gap-2">
            {ALL_SUFFIXES.map((s) => (
              <ToggleChip
                key={s}
                label={s}
                active={config.suffixes.includes(s)}
                onClick={() => toggleArrayItem("suffixes", s)}
                color="yellow"
              />
            ))}
          </div>
        </MutationSection>

        {/* Combine Words */}
        <MutationSection
          title="Combine Words"
          color="pink"
          enabled={config.enableCombine}
          onToggle={(v) => updateConfig({ enableCombine: v })}
        >
          <div className="flex flex-wrap gap-2">
            {SEPARATOR_OPTIONS.map((s) => (
              <ToggleChip
                key={`sep-${s.id}`}
                label={s.label}
                active={config.separators.includes(s.id)}
                onClick={() => toggleArrayItem("separators", s.id)}
                color="pink"
              />
            ))}
          </div>
          {baseWords.length < 2 && (
            <p className="text-xs text-dracula-comment mt-2">
              Add 2+ base words to enable combinations.
            </p>
          )}
        </MutationSection>
      </div>

      {/* Output */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-green">#</span> Generated Wordlist
            <span className="text-xs text-dracula-comment ml-2">
              {wordlist.length.toLocaleString()} word{wordlist.length !== 1 ? "s" : ""}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={wordlist.length === 0}
              className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Share URL
            </button>
            <CopyButton
              text={wordlist.join("\n")}
              label="Copy All"
              className={wordlist.length === 0 ? "opacity-40 cursor-not-allowed" : ""}
            />
            <button
              onClick={handleDownload}
              disabled={wordlist.length === 0}
              className="text-xs px-3 py-1.5 rounded border border-dracula-green text-dracula-green hover:bg-dracula-green/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download .txt
            </button>
          </div>
        </div>

        {wordlist.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-sm text-dracula-comment">
              Enter base words and enable mutation options to generate a wordlist.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="max-h-96 overflow-y-auto p-4">
              <pre className="text-xs text-dracula-fg font-mono leading-relaxed whitespace-pre-wrap break-all">
                {previewWords.join("\n")}
              </pre>
            </div>
            {wordlist.length > PREVIEW_LIMIT && !showAll && (
              <div className="border-t border-border px-4 py-2 bg-surface-light">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-dracula-cyan hover:underline"
                >
                  Showing {PREVIEW_LIMIT} of {wordlist.length.toLocaleString()} — click
                  to show all (may be slow)
                </button>
              </div>
            )}
            {showAll && wordlist.length > PREVIEW_LIMIT && (
              <div className="border-t border-border px-4 py-2 bg-surface-light">
                <button
                  onClick={() => setShowAll(false)}
                  className="text-xs text-dracula-cyan hover:underline"
                >
                  Collapse preview
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick presets */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Quick Presets
        </h2>
        <div className="flex flex-wrap gap-2">
          <PresetButton
            label="Basic Mutations"
            onClick={() => {
              setConfig({
                ...DEFAULT_CONFIG,
                baseWords: baseWords,
                enableCaseVariations: true,
                caseVariations: ["original", "lower", "upper", "capitalize"],
                enableSuffixes: true,
                suffixes: ["123", "1234", "!", "1"],
              });
            }}
          />
          <PresetButton
            label="Full Leet"
            onClick={() => {
              setConfig({
                ...DEFAULT_CONFIG,
                baseWords: baseWords,
                enableLeet: true,
                leetMappings: LEET_MAPPINGS.map((m) => m.char),
                enableCaseVariations: true,
                caseVariations: ["original", "lower", "capitalize"],
              });
            }}
          />
          <PresetButton
            label="Year + Symbols"
            onClick={() => {
              setConfig({
                ...DEFAULT_CONFIG,
                baseWords: baseWords,
                enableCaseVariations: true,
                caseVariations: ["original", "capitalize"],
                enableNumbers: true,
                numberRanges: ["years"],
                customYearStart: 2020,
                customYearEnd: 2026,
                enableSymbols: true,
                symbols: ["!", "@", "#"],
              });
            }}
          />
          <PresetButton
            label="Aggressive"
            onClick={() => {
              setConfig({
                ...DEFAULT_CONFIG,
                baseWords: baseWords,
                enableLeet: true,
                leetMappings: ["a", "e", "i", "o", "s"],
                enableCaseVariations: true,
                caseVariations: ["original", "lower", "upper", "capitalize"],
                enableNumbers: true,
                numberRanges: ["0-9", "years"],
                customYearStart: 2020,
                customYearEnd: 2026,
                enableSymbols: true,
                symbols: ["!", "@", "#", "$"],
                enableSuffixes: true,
                suffixes: ["123", "1234", "!", "1", "01"],
              });
            }}
          />
          <PresetButton
            label="Reset"
            onClick={() => {
              setConfig({
                ...DEFAULT_CONFIG,
                baseWords: baseWords,
              });
            }}
          />
        </div>
      </div>

      {/* Leet Speak Reference */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Leet Speak Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Character</th>
                <th className="text-left py-2 pr-4">Replacements</th>
                <th className="text-left py-2">Example</th>
              </tr>
            </thead>
            <tbody>
              {LEET_MAPPINGS.map((m) => (
                <tr key={m.char} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-dracula-green font-semibold">
                    {m.char}
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">
                    {m.replacements.join(", ")}
                  </td>
                  <td className="py-2 text-dracula-comment">
                    p{m.char}ssword → p{m.replacements[0]}ssword
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

// ── Subcomponents ───────────────────────────────────────────────────

const COLOR_CLASSES: Record<string, { text: string; border: string; bg: string; borderHalf: string; bgLight: string }> = {
  purple: {
    text: "text-dracula-purple",
    border: "border-dracula-purple",
    bg: "bg-dracula-purple/10",
    borderHalf: "border-dracula-purple/50",
    bgLight: "bg-dracula-purple/5",
  },
  green: {
    text: "text-dracula-green",
    border: "border-dracula-green",
    bg: "bg-dracula-green/10",
    borderHalf: "border-dracula-green/50",
    bgLight: "bg-dracula-green/5",
  },
  cyan: {
    text: "text-dracula-cyan",
    border: "border-dracula-cyan",
    bg: "bg-dracula-cyan/10",
    borderHalf: "border-dracula-cyan/50",
    bgLight: "bg-dracula-cyan/5",
  },
  orange: {
    text: "text-dracula-orange",
    border: "border-dracula-orange",
    bg: "bg-dracula-orange/10",
    borderHalf: "border-dracula-orange/50",
    bgLight: "bg-dracula-orange/5",
  },
  yellow: {
    text: "text-dracula-yellow",
    border: "border-dracula-yellow",
    bg: "bg-dracula-yellow/10",
    borderHalf: "border-dracula-yellow/50",
    bgLight: "bg-dracula-yellow/5",
  },
  pink: {
    text: "text-dracula-pink",
    border: "border-dracula-pink",
    bg: "bg-dracula-pink/10",
    borderHalf: "border-dracula-pink/50",
    bgLight: "bg-dracula-pink/5",
  },
};

function MutationSection({
  title,
  color,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  color: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.purple;
  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        enabled
          ? `${c.borderHalf} ${c.bgLight}`
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground">
          <span className={c.text}>#</span> {title}
        </h3>
        <button
          onClick={() => onToggle(!enabled)}
          className={`text-xs px-3 py-1 rounded border transition-all ${
            enabled
              ? `${c.border} ${c.text} ${c.bg}`
              : "border-border text-dracula-comment hover:text-foreground"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </button>
      </div>
      {enabled && children}
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.purple;
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded border transition-all ${
        active
          ? `${c.border} ${c.text} ${c.bg}`
          : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-comment"
      }`}
    >
      {label}
    </button>
  );
}

function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple transition-all"
    >
      {label}
    </button>
  );
}
