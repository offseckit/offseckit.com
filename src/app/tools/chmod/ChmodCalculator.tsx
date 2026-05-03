"use client";

import { useCallback, useMemo, useState } from "react";
import {
  applySymbolic,
  clampMode,
  explainOctalDigits,
  getBitBreakdown,
  getWarnings,
  hasPerm,
  hasSpecial,
  parseOctal,
  parseRwxString,
  PRESETS,
  setPerm,
  setSpecial,
  toOctal,
  toRwxString,
  toSymbolicDelta,
  toSymbolicEquals,
} from "@/lib/chmod";
import type { Perm, SpecialBit, Who } from "@/lib/chmod";
import CopyButton from "@/components/CopyButton";

// ── URL hash ───────────────────────────────────────────────────────

function parseHashMode(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  // Accept "mode=755" or "755" or "0755" or "4755"
  const match = raw.match(/(?:mode=)?([0-7]{1,4})/);
  if (!match) return null;
  return parseOctal(match[1]);
}

// ── Component ──────────────────────────────────────────────────────

interface ModeState {
  mode: number;
  octalInput: string;
  rwxInput: string;
}

function fromMode(mode: number): ModeState {
  const m = clampMode(mode);
  return {
    mode: m,
    octalInput: toOctal(m),
    rwxInput: toRwxString(m),
  };
}

function getInitialState(): ModeState {
  if (typeof window !== "undefined") {
    const fromHash = parseHashMode();
    if (fromHash !== null) return fromMode(fromHash);
  }
  return fromMode(0o755);
}

export default function ChmodCalculator() {
  const [state, setState] = useState<ModeState>(getInitialState);
  const { mode, octalInput, rwxInput } = state;

  const [filename, setFilename] = useState("file");
  const [octalError, setOctalError] = useState("");
  const [rwxError, setRwxError] = useState("");
  const [symbolicInput, setSymbolicInput] = useState("");
  const [symbolicError, setSymbolicError] = useState("");
  const [shared, setShared] = useState(false);

  // Single mode setter that keeps inputs and errors consistent.
  const updateMode = useCallback((next: number) => {
    setState(fromMode(next));
    setOctalError("");
    setRwxError("");
  }, []);

  // Derived outputs
  const rwx = useMemo(() => toRwxString(mode), [mode]);
  const octal = useMemo(() => toOctal(mode), [mode]);
  const equalsForm = useMemo(() => toSymbolicEquals(mode), [mode]);
  const deltaForm = useMemo(() => toSymbolicDelta(mode), [mode]);
  const warnings = useMemo(() => getWarnings(mode), [mode]);
  const bitRows = useMemo(() => getBitBreakdown(mode), [mode]);
  const digitRows = useMemo(() => explainOctalDigits(mode), [mode]);

  const safeFilename = useMemo(() => {
    const trimmed = filename.trim() || "file";
    // Quote if it contains shell-significant chars
    if (/[^A-Za-z0-9._\-/]/.test(trimmed)) {
      return `'${trimmed.replace(/'/g, "'\\''")}'`;
    }
    return trimmed;
  }, [filename]);

  const chmodOctalCmd = `chmod ${octal} ${safeFilename}`;
  const chmodEqualsCmd = `chmod ${equalsForm} ${safeFilename}`;
  const chmodDeltaCmd = `chmod ${deltaForm} ${safeFilename}`;

  // ── Handlers ───────────────────────────────────────────────────

  const togglePerm = useCallback((who: Who, perm: Perm) => {
    setState((s) => {
      const next = setPerm(s.mode, who, perm, !hasPerm(s.mode, who, perm));
      return fromMode(next);
    });
    setOctalError("");
    setRwxError("");
  }, []);

  const toggleSpecial = useCallback((bit: SpecialBit) => {
    setState((s) => {
      const next = setSpecial(s.mode, bit, !hasSpecial(s.mode, bit));
      return fromMode(next);
    });
    setOctalError("");
    setRwxError("");
  }, []);

  const onOctalInput = useCallback((value: string) => {
    if (!value.trim()) {
      setState((s) => ({ ...s, octalInput: value }));
      setOctalError("");
      return;
    }
    const parsed = parseOctal(value);
    if (parsed === null) {
      setState((s) => ({ ...s, octalInput: value }));
      setOctalError("Enter 3 or 4 octal digits (each 0-7), e.g. 755 or 4755");
      return;
    }
    // Valid input — sync mode and the rwx mirror, keep typed octal as-is.
    setState({
      mode: parsed,
      octalInput: value,
      rwxInput: toRwxString(parsed),
    });
    setOctalError("");
    setRwxError("");
  }, []);

  const onRwxInput = useCallback((value: string) => {
    if (!value.trim()) {
      setState((s) => ({ ...s, rwxInput: value }));
      setRwxError("");
      return;
    }
    const parsed = parseRwxString(value);
    if (parsed === null) {
      setState((s) => ({ ...s, rwxInput: value }));
      setRwxError("Enter 9 chars like rwxr-xr-x or 10 chars with leading -/d");
      return;
    }
    setState({
      mode: parsed,
      octalInput: toOctal(parsed),
      rwxInput: value,
    });
    setOctalError("");
    setRwxError("");
  }, []);

  const applySymbolicNotation = useCallback(() => {
    const v = symbolicInput.trim();
    if (!v) {
      setSymbolicError("Enter notation like u+x, go-w, a=rw");
      return;
    }
    try {
      const result = applySymbolic(mode, v);
      updateMode(result.mode);
      setSymbolicError("");
      setSymbolicInput("");
    } catch (err) {
      setSymbolicError(err instanceof Error ? err.message : "Invalid notation");
    }
  }, [mode, symbolicInput, updateMode]);

  const applyPreset = useCallback(
    (presetMode: number) => {
      updateMode(presetMode);
    },
    [updateMode],
  );

  const reset = useCallback(() => {
    updateMode(0o755);
    setSymbolicInput("");
    setSymbolicError("");
  }, [updateMode]);

  const handleShare = useCallback(() => {
    if (typeof window === "undefined") return;
    const hash = `#mode=${octal}`;
    window.history.replaceState(null, "", hash);
    const url = window.location.origin + window.location.pathname + hash;
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [octal]);

  // ── UI ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Headline display */}
      <div className="rounded-lg border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-dracula-comment uppercase tracking-wider">Octal</div>
            <div className="text-3xl font-bold text-dracula-green font-mono">{octal}</div>
          </div>
          <div>
            <div className="text-xs text-dracula-comment uppercase tracking-wider">Symbolic</div>
            <div className="text-3xl font-bold text-dracula-cyan font-mono">{rwx}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-green transition-all"
            title="Copy a shareable URL with this mode"
          >
            {shared ? "Copied!" : "Share URL"}
          </button>
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded border border-border text-dracula-comment hover:text-foreground transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Permission grid */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-pink">#</span> Permission Grid
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dracula-comment text-xs">
                <th className="text-left py-2 pr-4 font-normal">Who</th>
                <th className="text-center py-2 px-2 font-normal">Read (4)</th>
                <th className="text-center py-2 px-2 font-normal">Write (2)</th>
                <th className="text-center py-2 px-2 font-normal">Execute (1)</th>
                <th className="text-center py-2 px-2 font-normal">Octal</th>
              </tr>
            </thead>
            <tbody>
              {(["owner", "group", "other"] as Who[]).map((who) => {
                const r = hasPerm(mode, who, "read");
                const w = hasPerm(mode, who, "write");
                const x = hasPerm(mode, who, "execute");
                const sum = (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
                return (
                  <tr key={who} className="border-t border-border/50">
                    <td className="py-2 pr-4 font-mono text-dracula-pink capitalize">{who}</td>
                    <td className="text-center py-2 px-2">
                      <PermCheckbox
                        checked={r}
                        onChange={() => togglePerm(who, "read")}
                        label={`${who} read`}
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <PermCheckbox
                        checked={w}
                        onChange={() => togglePerm(who, "write")}
                        label={`${who} write`}
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <PermCheckbox
                        checked={x}
                        onChange={() => togglePerm(who, "execute")}
                        label={`${who} execute`}
                      />
                    </td>
                    <td className="text-center py-2 px-2 font-mono text-dracula-green">{sum}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Special bits */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Special bits
            </h3>
            <span className="text-xs text-dracula-comment font-mono">leading digit</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <SpecialBitToggle
              label="Setuid (4000)"
              detail="Binary runs as file owner"
              checked={hasSpecial(mode, "setuid")}
              onChange={() => toggleSpecial("setuid")}
            />
            <SpecialBitToggle
              label="Setgid (2000)"
              detail="Binary runs as file group / dir inherits group"
              checked={hasSpecial(mode, "setgid")}
              onChange={() => toggleSpecial("setgid")}
            />
            <SpecialBitToggle
              label="Sticky (1000)"
              detail="Only owner can delete files in dir"
              checked={hasSpecial(mode, "sticky")}
              onChange={() => toggleSpecial("sticky")}
            />
          </div>
        </div>
      </div>

      {/* Direct inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            <span className="text-dracula-purple">#</span> Octal Input
          </h2>
          <input
            value={octalInput}
            onChange={(e) => onOctalInput(e.target.value)}
            placeholder="755 or 4755"
            spellCheck={false}
            inputMode="numeric"
            maxLength={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
          />
          {octalError && (
            <p className="mt-1 text-xs text-dracula-red">{octalError}</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            <span className="text-dracula-purple">#</span> Symbolic Input (rwx)
          </h2>
          <input
            value={rwxInput}
            onChange={(e) => onRwxInput(e.target.value)}
            placeholder="rwxr-xr-x or -rwxr-xr-x"
            spellCheck={false}
            maxLength={10}
            className="w-full px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
          />
          {rwxError && (
            <p className="mt-1 text-xs text-dracula-red">{rwxError}</p>
          )}
        </div>
      </div>

      {/* POSIX symbolic notation parser */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          <span className="text-dracula-purple">#</span> Apply POSIX Notation
        </h2>
        <p className="text-xs text-dracula-comment mb-2">
          Apply changes to the current mode. Try{" "}
          <code className="text-dracula-cyan">u+x</code>,{" "}
          <code className="text-dracula-cyan">go-w</code>,{" "}
          <code className="text-dracula-cyan">a=rw</code>, or{" "}
          <code className="text-dracula-cyan">u=rwx,go=rx</code>.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={symbolicInput}
            onChange={(e) => {
              setSymbolicInput(e.target.value);
              setSymbolicError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySymbolicNotation();
            }}
            placeholder="e.g. u+x,go-w"
            spellCheck={false}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
          />
          <button
            onClick={applySymbolicNotation}
            disabled={!symbolicInput.trim()}
            className="text-sm px-4 py-2 rounded-lg border border-dracula-purple text-dracula-purple hover:bg-dracula-purple/10 transition-all disabled:bg-surface-light disabled:cursor-not-allowed disabled:text-dracula-comment disabled:border-border"
          >
            Apply
          </button>
        </div>
        {symbolicError && (
          <p className="mt-1 text-xs text-dracula-red">{symbolicError}</p>
        )}
      </div>

      {/* Filename + chmod commands */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-yellow">#</span> chmod Commands
        </h2>
        <div className="mb-3">
          <label className="block text-xs text-dracula-comment mb-1">Target file or path</label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="file"
            spellCheck={false}
            className="w-full px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
          />
        </div>
        <CommandRow label="Octal" command={chmodOctalCmd} />
        <CommandRow label="Symbolic (=)" command={chmodEqualsCmd} />
        <CommandRow label="Symbolic (+)" command={chmodDeltaCmd} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-orange">#</span> Warnings &amp; Context
          </h2>
          {warnings.map((w, i) => {
            const colors =
              w.level === "danger"
                ? "border-dracula-red/60 bg-dracula-red/5"
                : w.level === "warn"
                  ? "border-dracula-orange/60 bg-dracula-orange/5"
                  : "border-dracula-cyan/60 bg-dracula-cyan/5";
            const titleColor =
              w.level === "danger"
                ? "text-dracula-red"
                : w.level === "warn"
                  ? "text-dracula-orange"
                  : "text-dracula-cyan";
            return (
              <div key={i} className={`rounded-lg border p-3 ${colors}`}>
                <div className={`text-sm font-semibold ${titleColor}`}>{w.title}</div>
                <p className="text-xs text-dracula-comment mt-1">{w.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Presets */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Common Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESETS.map((preset) => {
            const isCurrent = mode === preset.mode;
            return (
              <button
                key={preset.octal}
                onClick={() => applyPreset(preset.mode)}
                className={`text-left rounded-lg border p-3 transition-all ${
                  isCurrent
                    ? "border-dracula-green bg-dracula-green/10"
                    : "border-border bg-surface hover:border-dracula-purple"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-dracula-green font-mono">
                    {preset.octal}
                  </span>
                  <span className="text-xs text-dracula-comment font-mono">
                    {toRwxString(preset.mode)}
                  </span>
                </div>
                <span className="block text-sm text-foreground font-semibold mt-1">
                  {preset.label}
                </span>
                <span className="block text-xs text-dracula-comment mt-1">
                  {preset.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Octal digit breakdown */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-yellow">#</span> Octal Digit Breakdown
        </h2>
        <p className="text-xs text-dracula-comment mb-3">
          Each octal digit is the sum of read (4), write (2), and execute (1).
          The leading digit packs setuid (4), setgid (2), and sticky (1).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-dracula-comment border-b border-border">
                <th className="text-left py-2 pr-4">Position</th>
                <th className="text-left py-2 pr-4">Digit</th>
                <th className="text-left py-2 pr-4">Components</th>
                <th className="text-left py-2 pr-4">rwx</th>
              </tr>
            </thead>
            <tbody>
              {digitRows.map((row) => (
                <tr key={row.label} className="border-b border-border/50">
                  <td className="py-2 pr-4 capitalize text-foreground">{row.label}</td>
                  <td className="py-2 pr-4 font-mono text-dracula-green">{row.octal}</td>
                  <td className="py-2 pr-4 text-dracula-comment font-mono">
                    {row.components.length ? row.components.join(" + ") : "-"}
                  </td>
                  <td className="py-2 pr-4 font-mono text-dracula-cyan">{row.rwx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bit-by-bit reference */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-yellow">#</span> Bit Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-dracula-comment border-b border-border">
                <th className="text-left py-2 pr-4">Set</th>
                <th className="text-left py-2 pr-4">Octal</th>
                <th className="text-left py-2 pr-4">Bit</th>
                <th className="text-left py-2 pr-4">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {bitRows.map((row) => (
                <tr
                  key={row.label}
                  className={`border-b border-border/50 ${row.set ? "" : "opacity-50"}`}
                >
                  <td className="py-2 pr-4 font-mono">
                    {row.set ? (
                      <span className="text-dracula-green">[x]</span>
                    ) : (
                      <span className="text-dracula-comment">[ ]</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono text-dracula-green">
                    {row.octal.replace(/^0+(?=\d)/, "") || "0"}
                  </td>
                  <td className="py-2 pr-4 text-foreground">{row.label}</td>
                  <td className="py-2 pr-4 text-dracula-comment">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pentest privesc panel */}
      <div className="rounded-lg border border-dracula-purple/40 bg-dracula-purple/5 p-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          <span className="text-dracula-purple">#</span> Pentest Privilege-Escalation Hunting
        </h2>
        <p className="text-xs text-dracula-comment mb-3">
          When you land on a target host, hunt for misconfigured permissions
          that lead to privilege escalation. Run these from the lowest-privilege
          shell you have.
        </p>
        <div className="space-y-2">
          <CommandRow
            label="Setuid binaries"
            command="find / -perm -4000 -type f 2>/dev/null"
          />
          <CommandRow
            label="Setgid binaries"
            command="find / -perm -2000 -type f 2>/dev/null"
          />
          <CommandRow
            label="World-writable dirs without sticky"
            command={`find / -perm -2 -type d -not -perm -1000 2>/dev/null`}
          />
          <CommandRow
            label="World-writable files"
            command="find / -perm -2 -type f -not -path '/proc/*' 2>/dev/null"
          />
          <CommandRow
            label="Files writable by current user"
            command="find / -writable -not -path '/proc/*' 2>/dev/null"
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function PermCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onChange}
      aria-label={label}
      aria-pressed={checked}
      className={`w-9 h-9 rounded border transition-all font-mono text-sm font-bold ${
        checked
          ? "border-dracula-green bg-dracula-green/15 text-dracula-green"
          : "border-border bg-dracula-bg text-dracula-comment hover:border-dracula-purple"
      }`}
    >
      {checked ? "x" : "-"}
    </button>
  );
}

function SpecialBitToggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={`text-left rounded-lg border p-2.5 transition-all ${
        checked
          ? "border-dracula-orange bg-dracula-orange/10"
          : "border-border bg-dracula-bg hover:border-dracula-purple"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold font-mono ${
            checked ? "text-dracula-orange" : "text-foreground"
          }`}
        >
          {label}
        </span>
        <span
          className={`text-xs font-mono ${
            checked ? "text-dracula-orange" : "text-dracula-comment"
          }`}
        >
          {checked ? "[x]" : "[ ]"}
        </span>
      </div>
      <span className="block text-xs text-dracula-comment mt-1">{detail}</span>
    </button>
  );
}

function CommandRow({ label, command }: { label: string; command: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 last:mb-0">
      <div className="text-xs text-dracula-comment uppercase tracking-wider w-32 shrink-0">
        {label}
      </div>
      <code className="flex-1 text-xs text-dracula-cyan font-mono bg-dracula-bg border border-border rounded px-3 py-1.5 break-all">
        {command}
      </code>
      <CopyButton text={command} label="Copy" />
    </div>
  );
}
