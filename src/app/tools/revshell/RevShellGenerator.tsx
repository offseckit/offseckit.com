"use client";

import { useState, useCallback } from "react";
import {
  getReverseShells,
  getBindShells,
  encodeBase64,
  encodeUrl,
  TARGET_SHELLS,
  TTY_UPGRADES,
} from "@/lib/revshells";
import type { ShellLanguage, TargetOS, ShellType } from "@/lib/revshells";
import CopyButton from "@/components/CopyButton";

type Encoding = "raw" | "base64" | "url" | "double-url";
type OSFilter = TargetOS | "all";

const LS_KEY_IP = "osk-revshell-ip";
const LS_KEY_PORT = "osk-revshell-port";

/* ── URL hash serialization ────────────────────────────────────── */

interface RevShellState {
  l: string;       // selectedLang
  v: number;       // selectedVariant
  ip: string;
  p: string;       // port
  e: Encoding;     // encoding
  ts: string;      // targetShell
  st: ShellType;   // shellType
}

function serializeToHash(state: RevShellState): string {
  try {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return "";
  }
}

function deserializeFromHash(hash: string): RevShellState | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const json = decodeURIComponent(escape(atob(clean)));
    const state = JSON.parse(json);
    if (typeof state.l === "string" && typeof state.ip === "string") {
      return state as RevShellState;
    }
    return null;
  } catch {
    return null;
  }
}

function getInitialHashState(): RevShellState | null {
  if (typeof window !== "undefined") {
    return deserializeFromHash(window.location.hash);
  }
  return null;
}

function filterByOS(shells: ShellLanguage[], filter: OSFilter): ShellLanguage[] {
  if (filter === "all") return shells;
  return shells.filter((s) => s.os === filter || s.os === "all");
}

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage not available
  }
}

export default function RevShellGenerator() {
  const reverseShells = getReverseShells();
  const bindShells = getBindShells();

  const [hashState] = useState(getInitialHashState);
  const [shellType, setShellType] = useState<ShellType>(hashState?.st ?? "reverse");
  const [osFilter, setOSFilter] = useState<OSFilter>("all");
  const [selectedLang, setSelectedLang] = useState(hashState?.l ?? "bash");
  const [selectedVariant, setSelectedVariant] = useState(hashState?.v ?? 0);
  const [ip, setIp] = useState(() => hashState?.ip ?? readLS(LS_KEY_IP) ?? "10.10.10.10");
  const [port, setPort] = useState(() => hashState?.p ?? readLS(LS_KEY_PORT) ?? "4444");
  const [encoding, setEncoding] = useState<Encoding>(hashState?.e ?? "raw");
  const [targetShell, setTargetShell] = useState(hashState?.ts ?? "/bin/bash");
  const [shared, setShared] = useState(false);

  // Persist IP/port on change
  const handleIpChange = (value: string) => {
    setIp(value);
    writeLS(LS_KEY_IP, value);
  };

  const handlePortChange = (value: string) => {
    setPort(value);
    writeLS(LS_KEY_PORT, value);
  };

  const handleShare = useCallback(() => {
    const hash = serializeToHash({
      l: selectedLang,
      v: selectedVariant,
      ip,
      p: port,
      e: encoding,
      ts: targetShell,
      st: shellType,
    });
    if (hash && typeof window !== "undefined") {
      const url = window.location.origin + window.location.pathname + "#" + hash;
      window.history.replaceState(null, "", "#" + hash);
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [selectedLang, selectedVariant, ip, port, encoding, targetShell, shellType]);

  const allShells = shellType === "reverse" ? reverseShells : bindShells;
  const filteredShells = filterByOS(allShells, osFilter);

  // Derive effective selected language: if current selection is not in filtered list, use first
  const effectiveLang = filteredShells.find((s) => s.id === selectedLang) ?? filteredShells[0];
  const effectiveVariantIdx =
    effectiveLang && selectedVariant < effectiveLang.variants.length
      ? selectedVariant
      : 0;
  const variant = effectiveLang?.variants[effectiveVariantIdx] ?? effectiveLang?.variants[0];

  const rawCommand = variant ? variant.command(ip, port, targetShell) : "";

  const encodedCommand = (() => {
    switch (encoding) {
      case "base64":
        return encodeBase64(rawCommand);
      case "url":
        return encodeUrl(rawCommand);
      case "double-url":
        return encodeUrl(encodeUrl(rawCommand));
      default:
        return rawCommand;
    }
  })();

  const listenerCommand = effectiveLang
    ? effectiveLang.listener.replace("{port}", port).replace("{ip}", ip)
    : "";

  const handleLangChange = (langId: string) => {
    setSelectedLang(langId);
    setSelectedVariant(0);
  };

  const incrementPort = () => {
    const next = String(Math.min(65535, (parseInt(port) || 4444) + 1));
    setPort(next);
    writeLS(LS_KEY_PORT, next);
  };

  if (!effectiveLang) return null;

  return (
    <div className="space-y-6">
      {/* Shell Type + OS Filter */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Shell Type Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => { setShellType("reverse"); setSelectedLang(reverseShells[0].id); setSelectedVariant(0); }}
            className={`text-xs px-4 py-2 transition-all border-r border-border ${
              shellType === "reverse"
                ? "bg-dracula-purple/20 text-dracula-purple shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                : "bg-surface text-dracula-comment hover:text-foreground"
            }`}
          >
            Reverse Shell
          </button>
          <button
            onClick={() => { setShellType("bind"); setSelectedLang(bindShells[0].id); setSelectedVariant(0); }}
            className={`text-xs px-4 py-2 transition-all ${
              shellType === "bind"
                ? "bg-dracula-purple/20 text-dracula-purple shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                : "bg-surface text-dracula-comment hover:text-foreground"
            }`}
          >
            Bind Shell
          </button>
        </div>

        {/* OS Filter */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "linux", "windows"] as const).map((os) => (
            <button
              key={os}
              onClick={() => setOSFilter(os)}
              className={`text-xs px-3 py-2 transition-all ${
                os !== "windows" ? "border-r border-border" : ""
              } ${
                osFilter === os
                  ? "bg-dracula-cyan/20 text-dracula-cyan shadow-[0_0_12px_rgba(139,233,253,0.3)]"
                  : "bg-surface text-dracula-comment hover:text-foreground"
              }`}
            >
              {os === "all" ? "All" : os === "linux" ? "Linux" : "Windows"}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* IP */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            {shellType === "reverse" ? "Attacker IP" : "Target IP"}
          </label>
          <input
            type="text"
            value={ip}
            onChange={(e) => handleIpChange(e.target.value)}
            placeholder="10.10.10.10"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          />
        </div>

        {/* Port */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            Port
            {parseInt(port) > 0 && parseInt(port) < 1024 && (
              <span className="ml-2 text-dracula-yellow">
                (requires root/sudo)
              </span>
            )}
          </label>
          <div className="flex">
            <input
              type="text"
              value={port}
              onChange={(e) => handlePortChange(e.target.value)}
              placeholder="4444"
              className="w-full px-3 py-2 rounded-l-lg border border-r-0 border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
            />
            <button
              onClick={incrementPort}
              className="px-2.5 rounded-r-lg border border-border bg-surface text-dracula-comment hover:text-foreground hover:border-dracula-purple transition-all text-sm"
              title="Increment port"
            >
              +1
            </button>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            Language
          </label>
          <select
            value={effectiveLang.id}
            onChange={(e) => handleLangChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          >
            {filteredShells.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Shell */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            Target Shell
          </label>
          <select
            value={targetShell}
            onChange={(e) => setTargetShell(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          >
            {TARGET_SHELLS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Encoding */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            Encoding
          </label>
          <select
            value={encoding}
            onChange={(e) => setEncoding(e.target.value as Encoding)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          >
            <option value="raw">None (Raw)</option>
            <option value="base64">Base64</option>
            <option value="url">URL Encode</option>
            <option value="double-url">Double URL Encode</option>
          </select>
        </div>
      </div>

      {/* Variant tabs */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {effectiveLang.variants.map((v, i) => (
            <button
              key={v.name}
              onClick={() => setSelectedVariant(i)}
              className={`text-xs px-3 py-1.5 rounded border transition-all ${
                effectiveVariantIdx === i
                  ? "border-dracula-purple text-dracula-purple bg-dracula-purple/10 shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                  : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-comment"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Shell Command */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span>{" "}
            {shellType === "reverse" ? "Reverse" : "Bind"} Shell
            {encoding !== "raw" && (
              <span className="text-dracula-comment font-normal ml-2">
                ({encoding === "base64"
                  ? "Base64"
                  : encoding === "url"
                  ? "URL Encoded"
                  : "Double URL Encoded"})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-green transition-all"
              title="Copy shareable URL with current configuration"
            >
              {shared ? "Copied!" : "Share URL"}
            </button>
            <CopyButton text={encodedCommand} />
          </div>
        </div>
        <div className="relative rounded-lg border border-border bg-dracula-bg overflow-hidden">
          <pre className="p-4 text-sm text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            <code>{encodedCommand}</code>
          </pre>
        </div>
      </div>

      {/* Listener Command */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-green">#</span>{" "}
            {shellType === "reverse" ? "Listener" : "Connect"}
          </h2>
          <CopyButton text={listenerCommand} />
        </div>
        <div className="relative rounded-lg border border-border bg-dracula-bg overflow-hidden">
          <pre className="p-4 text-sm text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            <code>{listenerCommand}</code>
          </pre>
        </div>
      </div>

      {/* Quick Reference: all variants for selected language */}
      {effectiveLang.variants.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">
            <span className="text-dracula-cyan">#</span> All {effectiveLang.name} Variants
          </h2>
          <div className="space-y-3">
            {effectiveLang.variants.map((v, i) => {
              if (i === effectiveVariantIdx) return null;
              const cmd = v.command(ip, port, targetShell);
              return (
                <div
                  key={v.name}
                  className="rounded-lg border border-border bg-surface overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-light">
                    <span className="text-xs text-dracula-comment">
                      {v.name}
                    </span>
                    <CopyButton text={cmd} />
                  </div>
                  <pre className="p-4 text-xs text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    <code>{cmd}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TTY Upgrade / Stabilization */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-orange">#</span> TTY Shell Upgrade /
          Stabilization
        </h2>
        <p className="text-xs text-dracula-comment mb-4">
          After catching a reverse shell, upgrade to a fully interactive TTY for
          proper job control, tab completion, and arrow key support.
        </p>
        <div className="space-y-3">
          {TTY_UPGRADES.map((upgrade) => (
            <div
              key={upgrade.name}
              className="rounded-lg border border-border bg-surface overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-light">
                <span className="text-xs text-dracula-comment">
                  {upgrade.name}
                </span>
                <CopyButton text={upgrade.command} />
              </div>
              <pre className="p-4 text-xs text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                <code>{upgrade.command}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
