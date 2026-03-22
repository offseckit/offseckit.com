"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calculateSubnet,
  splitSubnet,
  containsIp,
  buildCidrReference,
  COMMON_PRESETS,
  formatNumber,
} from "@/lib/subnet";
import type { SubnetResult, SubnetSplit, CidrRefEntry } from "@/lib/subnet";
import CopyButton from "@/components/CopyButton";

// ── Main component ─────────────────────────────────────────────────

export default function SubnetTool() {
  const [input, setInput] = useState("192.168.1.0/24");
  const [splitCount, setSplitCount] = useState(4);
  const [showSplit, setShowSplit] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [containsInput, setContainsInput] = useState("");
  const [containsResult, setContainsResult] = useState<boolean | null | "invalid">(null);

  // Calculate subnet from input
  const result = useMemo<SubnetResult | null>(() => {
    return calculateSubnet(input);
  }, [input]);

  // Split results
  const splits = useMemo<SubnetSplit[] | null>(() => {
    if (!showSplit || !result) return null;
    return splitSubnet(result.cidr, splitCount);
  }, [showSplit, result, splitCount]);

  // CIDR reference table
  const cidrRef = useMemo<CidrRefEntry[]>(() => buildCidrReference(), []);

  // Load a preset
  const loadPreset = useCallback((cidr: string) => {
    setInput(cidr);
    setContainsResult(null);
    setContainsInput("");
  }, []);

  // Check IP containment
  const checkContains = useCallback(() => {
    if (!result || !containsInput.trim()) {
      setContainsResult("invalid");
      return;
    }
    const res = containsIp(result.cidr, containsInput.trim());
    if (res === null) {
      setContainsResult("invalid");
    } else {
      setContainsResult(res);
    }
  }, [result, containsInput]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">
          <span className="text-dracula-pink">#</span> CIDR Input
        </h2>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setContainsResult(null);
            }}
            placeholder="192.168.1.0/24"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
            spellCheck={false}
          />
          {result && <CopyButton text={result.cidr} label="Copy CIDR" />}
        </div>
        {!result && input.trim() && (
          <p className="mt-1 text-xs text-dracula-red">
            Invalid CIDR notation. Use format: 192.168.1.0/24
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Main results grid */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              <span className="text-dracula-green">#</span> Network Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <ResultRow label="Network Address" value={result.networkAddress} />
              <ResultRow label="Broadcast Address" value={result.broadcastAddress} />
              <ResultRow label="Subnet Mask" value={result.subnetMask} />
              <ResultRow label="Wildcard Mask" value={result.wildcardMask} />
              <ResultRow label="First Usable Host" value={result.firstHost} />
              <ResultRow label="Last Usable Host" value={result.lastHost} />
              <ResultRow
                label="Total Addresses"
                value={formatNumber(result.totalAddresses)}
                noCopy
              />
              <ResultRow
                label="Usable Hosts"
                value={formatNumber(result.usableHosts)}
                noCopy
              />
              <ResultRow label="CIDR Notation" value={result.cidr} />
              <ResultRow label="Prefix Length" value={`/${result.prefix}`} noCopy />
              <ResultRow
                label="IP Class"
                value={result.ipClass}
                noCopy
              />
              <ResultRow
                label="Private Address"
                value={result.isPrivate ? "Yes (RFC 1918)" : "No (Public)"}
                noCopy
              />
            </div>
          </div>

          {/* Binary representation */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              <span className="text-dracula-cyan">#</span> Binary Representation
            </h2>
            <div className="space-y-2">
              <BinaryRow label="Network" value={result.networkBinary} prefix={result.prefix} />
              <BinaryRow label="Mask" value={result.maskBinary} prefix={result.prefix} />
            </div>
          </div>

          {/* IP Contains Check */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">
              <span className="text-dracula-purple">#</span> IP Address Lookup
            </h2>
            <p className="text-xs text-dracula-comment mb-2">
              Check if an IP address falls within {result.cidr}
            </p>
            <div className="flex gap-2">
              <input
                value={containsInput}
                onChange={(e) => {
                  setContainsInput(e.target.value);
                  setContainsResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") checkContains();
                }}
                placeholder="192.168.1.100"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
                spellCheck={false}
              />
              <button
                onClick={checkContains}
                className="text-sm px-4 py-2 rounded-lg border border-dracula-purple text-dracula-purple hover:bg-dracula-purple/10 transition-all"
              >
                Check
              </button>
            </div>
            {containsResult !== null && containsResult !== "invalid" && (
              <p
                className={`mt-1 text-xs ${
                  containsResult ? "text-dracula-green" : "text-dracula-red"
                }`}
              >
                {containsResult
                  ? `${containsInput.trim()} is within ${result.cidr}`
                  : `${containsInput.trim()} is NOT within ${result.cidr}`}
              </p>
            )}
            {containsResult === "invalid" && (
              <p className="mt-1 text-xs text-dracula-red">
                Invalid IP address. Use format: 192.168.1.100
              </p>
            )}
          </div>

          {/* Subnet Splitting */}
          <div>
            <button
              onClick={() => setShowSplit(!showSplit)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <span className="text-dracula-orange">#</span> Subnet Splitting
              <span className="text-dracula-comment text-xs ml-2">
                {showSplit ? "[-]" : "[+]"}
              </span>
            </button>
            {showSplit && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-dracula-comment">
                    Split {result.cidr} into:
                  </label>
                  <select
                    value={splitCount}
                    onChange={(e) => setSplitCount(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg border border-border bg-dracula-bg text-dracula-fg text-sm font-mono focus:outline-none focus:border-dracula-purple"
                  >
                    {[2, 4, 8, 16, 32, 64, 128, 256].map((n) => {
                      const newPrefix = result.prefix + Math.log2(n);
                      if (newPrefix > 32) return null;
                      return (
                        <option key={n} value={n}>
                          {n} subnets (/{newPrefix})
                        </option>
                      );
                    })}
                  </select>
                </div>
                {splits && splits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-dracula-comment">
                          <th className="text-left py-2 pr-3">#</th>
                          <th className="text-left py-2 pr-3">Subnet</th>
                          <th className="text-left py-2 pr-3">Range</th>
                          <th className="text-left py-2 pr-3">Broadcast</th>
                          <th className="text-right py-2">Hosts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {splits.map((s, i) => (
                          <tr
                            key={s.cidr}
                            className="border-b border-border/50 hover:bg-surface-light transition-colors"
                          >
                            <td className="py-2 pr-3 text-dracula-comment">
                              {i + 1}
                            </td>
                            <td className="py-2 pr-3 font-mono text-dracula-cyan">
                              <span className="inline-flex items-center gap-1">
                                {s.cidr}
                                <CopyButton text={s.cidr} label="" className="px-1.5 py-0.5" />
                              </span>
                            </td>
                            <td className="py-2 pr-3 font-mono text-dracula-fg">
                              {s.firstHost} - {s.lastHost}
                            </td>
                            <td className="py-2 pr-3 font-mono text-dracula-comment">
                              {s.broadcastAddress}
                            </td>
                            <td className="py-2 text-right text-dracula-green">
                              {formatNumber(s.usableHosts)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-dracula-comment">
                    Cannot split /{result.prefix} into {splitCount} subnets (would exceed /32).
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Common Presets */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Common Network Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {COMMON_PRESETS.map((preset) => (
            <button
              key={preset.cidr}
              onClick={() => loadPreset(preset.cidr)}
              className="text-left rounded-lg border border-border bg-surface p-3 hover:border-dracula-purple transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-dracula-green">
                  {preset.label}
                </span>
                <span className="text-xs font-mono text-dracula-cyan">
                  {preset.cidr}
                </span>
              </div>
              <span className="block text-xs text-dracula-comment mt-1">
                {preset.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CIDR Reference Table */}
      <div>
        <button
          onClick={() => setShowRef(!showRef)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="text-dracula-yellow">#</span> CIDR Reference Table
          <span className="text-dracula-comment text-xs ml-2">
            {showRef ? "[-]" : "[+]"}
          </span>
        </button>
        {showRef && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-dracula-comment">
                  <th className="text-left py-2 pr-4">Prefix</th>
                  <th className="text-left py-2 pr-4">Subnet Mask</th>
                  <th className="text-left py-2 pr-4">Wildcard Mask</th>
                  <th className="text-right py-2 pr-4">Total IPs</th>
                  <th className="text-right py-2">Usable Hosts</th>
                </tr>
              </thead>
              <tbody>
                {cidrRef.map((entry) => (
                  <tr
                    key={entry.prefix}
                    className={`border-b border-border/50 cursor-pointer hover:bg-surface-light transition-colors ${
                      result && result.prefix === entry.prefix
                        ? "bg-dracula-purple/10"
                        : ""
                    }`}
                    onClick={() => {
                      if (result) {
                        loadPreset(`${result.networkAddress}/${entry.prefix}`);
                      }
                    }}
                  >
                    <td className="py-2 pr-4 font-mono text-dracula-cyan">
                      /{entry.prefix}
                    </td>
                    <td className="py-2 pr-4 font-mono text-dracula-fg">
                      {entry.mask}
                    </td>
                    <td className="py-2 pr-4 font-mono text-dracula-comment">
                      {entry.wildcard}
                    </td>
                    <td className="py-2 pr-4 text-right text-dracula-fg">
                      {formatNumber(entry.totalAddresses)}
                    </td>
                    <td className="py-2 text-right text-dracula-green">
                      {formatNumber(entry.usableHosts)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  noCopy,
}: {
  label: string;
  value: string;
  noCopy?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30">
      <span className="text-xs text-dracula-comment">{label}</span>
      <span className="flex items-center gap-1.5 text-xs font-mono text-dracula-fg">
        {value}
        {!noCopy && <CopyButton text={value} label="" className="px-1.5 py-0.5" />}
      </span>
    </div>
  );
}

function BinaryRow({
  label,
  value,
  prefix,
}: {
  label: string;
  value: string;
  prefix: number;
}) {
  // Color the network portion vs host portion
  // Binary string is "xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx" (35 chars with dots)
  // Map prefix bits to character positions
  const bits = value.replace(/\./g, "");
  const networkBits = bits.slice(0, prefix);
  const hostBits = bits.slice(prefix);

  // Reconstruct with dots for display
  const fullColored = (networkBits + hostBits).split("");
  const octets: React.ReactNode[][] = [[], [], [], []];
  for (let i = 0; i < 32; i++) {
    const octet = Math.floor(i / 8);
    const isNetwork = i < prefix;
    octets[octet].push(
      <span
        key={i}
        className={isNetwork ? "text-dracula-cyan" : "text-dracula-comment"}
      >
        {fullColored[i]}
      </span>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-dracula-comment w-16 shrink-0 pt-0.5">
        {label}
      </span>
      <code className="text-xs font-mono break-all">
        {octets.map((octet, i) => (
          <span key={i}>
            {i > 0 && <span className="text-dracula-comment">.</span>}
            {octet}
          </span>
        ))}
      </code>
    </div>
  );
}
