"use client";

import { useState, useMemo, useCallback } from "react";
import {
  buildCommand,
  calculateNoiseLevel,
  getDefaultConfig,
  SCAN_TYPES,
  TIMING_TEMPLATES,
  NSE_CATEGORIES,
  POPULAR_SCRIPTS,
  PRESETS,
} from "@/lib/nmap";
import type { NmapConfig, ScanType, TimingTemplate, OutputFormat } from "@/lib/nmap";
import CopyButton from "@/components/CopyButton";

type Section = "presets" | "scan" | "ports" | "detection" | "scripts" | "timing" | "output" | "evasion";

/* ── URL hash serialization ────────────────────────────────────── */

function serializeConfigToHash(config: NmapConfig): string {
  try {
    const json = JSON.stringify(config);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return "";
  }
}

function deserializeConfigFromHash(hash: string): NmapConfig | null {
  try {
    const clean = hash.replace(/^#/, "");
    if (!clean) return null;
    const json = decodeURIComponent(escape(atob(clean)));
    const state = JSON.parse(json);
    if (typeof state.target === "string" && typeof state.scanType === "string") {
      return state as NmapConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function getInitialConfig(): NmapConfig {
  if (typeof window !== "undefined") {
    const parsed = deserializeConfigFromHash(window.location.hash);
    if (parsed) return parsed;
  }
  return getDefaultConfig();
}

export default function NmapBuilder() {
  const [config, setConfig] = useState<NmapConfig>(getInitialConfig);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(
    new Set(["presets", "scan", "ports", "detection"])
  );
  const [shared, setShared] = useState(false);

  const command = useMemo(() => buildCommand(config), [config]);
  const noiseLevel = useMemo(() => calculateNoiseLevel(config), [config]);

  const toggleSection = useCallback((section: Section) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const update = useCallback(
    <K extends keyof NmapConfig>(key: K, value: NmapConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
      setActivePreset(null);
    },
    []
  );

  const updateEvasion = useCallback(
    <K extends keyof NmapConfig["evasion"]>(
      key: K,
      value: NmapConfig["evasion"][K]
    ) => {
      setConfig((prev) => ({
        ...prev,
        evasion: { ...prev.evasion, [key]: value },
      }));
    },
    []
  );

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setConfig((prev) => {
      const base = getDefaultConfig();
      return {
        ...base,
        target: prev.target,
        ...preset.config,
        evasion: { ...base.evasion, ...(preset.config.evasion || {}) },
        nseScripts: preset.config.nseScripts || [],
        nseCategories: preset.config.nseCategories || [],
      };
    });
    setExpandedSections(new Set(["presets", "scan", "ports", "detection"]));
  }, []);

  const toggleScript = useCallback((scriptId: string) => {
    setConfig((prev) => {
      const scripts = prev.nseScripts.includes(scriptId)
        ? prev.nseScripts.filter((s) => s !== scriptId)
        : [...prev.nseScripts, scriptId];
      return { ...prev, nseScripts: scripts };
    });
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    setConfig((prev) => {
      const cats = prev.nseCategories.includes(catId)
        ? prev.nseCategories.filter((c) => c !== catId)
        : [...prev.nseCategories, catId];
      return { ...prev, nseCategories: cats };
    });
  }, []);

  const reset = useCallback(() => {
    setConfig(getDefaultConfig());
    setActivePreset(null);
  }, []);

  const handleShare = useCallback(() => {
    const hash = serializeConfigToHash(config);
    if (hash && typeof window !== "undefined") {
      const url = window.location.origin + window.location.pathname + "#" + hash;
      window.history.replaceState(null, "", "#" + hash);
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [config]);

  const scanInfo = SCAN_TYPES.find((s) => s.id === config.scanType);

  return (
    <div className="space-y-6">
      {/* Target input */}
      <div>
        <label className="block text-xs text-dracula-comment mb-1.5">
          Target (IP, hostname, CIDR, or range)
        </label>
        <input
          type="text"
          value={config.target}
          onChange={(e) => update("target", e.target.value)}
          placeholder="10.10.10.10 or 192.168.1.0/24 or scanme.nmap.org"
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-purple"
          spellCheck={false}
        />
      </div>

      {/* Command output */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-green">#</span> Command
          </h2>
          <div className="flex items-center gap-3">
            <NoiseIndicator level={noiseLevel} />
            <button
              onClick={handleShare}
              className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-green transition-all"
              title="Copy shareable URL with current configuration"
            >
              {shared ? "Copied!" : "Share URL"}
            </button>
            <CopyButton text={command} />
          </div>
        </div>
        <div className="relative rounded-lg border border-border bg-dracula-bg overflow-hidden">
          <pre className="p-4 text-sm text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed font-mono">
            <code>{command}</code>
          </pre>
        </div>
        {scanInfo?.requiresRoot && (
          <p className="mt-1.5 text-xs text-dracula-orange">
            Requires root/sudo privileges
          </p>
        )}
      </div>

      {/* Presets */}
      <CollapsibleSection
        title="Presets"
        color="pink"
        section="presets"
        expanded={expandedSections.has("presets")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                activePreset === preset.id
                  ? "border-dracula-purple bg-dracula-purple/10 shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                  : "border-border bg-surface hover:border-dracula-purple"
              }`}
            >
              <span className={`text-xs font-semibold ${
                activePreset === preset.id ? "text-dracula-purple" : "text-dracula-green"
              }`}>
                {preset.name}
              </span>
              <span className="block text-xs text-dracula-comment mt-1">
                {preset.description}
              </span>
            </button>
          ))}
          <button
            onClick={reset}
            className="text-left rounded-lg border border-border bg-surface p-3 hover:border-dracula-red transition-all"
          >
            <span className="text-xs font-semibold text-dracula-red">
              Reset
            </span>
            <span className="block text-xs text-dracula-comment mt-1">
              Clear all options and start fresh.
            </span>
          </button>
        </div>
      </CollapsibleSection>

      {/* Scan Type */}
      <CollapsibleSection
        title="Scan Type"
        color="purple"
        section="scan"
        expanded={expandedSections.has("scan")}
        onToggle={toggleSection}
      >
        <div className="space-y-2">
          {SCAN_TYPES.map((st) => (
            <label
              key={st.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                config.scanType === st.id
                  ? "border-dracula-purple bg-dracula-purple/10 text-dracula-purple shadow-[0_0_12px_rgba(189,147,249,0.3)]"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <input
                type="radio"
                name="scanType"
                value={st.id}
                checked={config.scanType === st.id}
                onChange={() => update("scanType", st.id as ScanType)}
                className="mt-0.5 accent-dracula-purple"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {st.name}
                  </span>
                  <code className="text-xs text-dracula-cyan">{st.flag}</code>
                  {st.requiresRoot && (
                    <span className="text-xs text-dracula-orange">root</span>
                  )}
                </div>
                <p className="text-xs text-dracula-comment mt-0.5">
                  {st.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Port Specification */}
      <CollapsibleSection
        title="Port Specification"
        color="cyan"
        section="ports"
        expanded={expandedSections.has("ports")}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "default", label: "Default (Top 1000)" },
                { id: "fast", label: "Fast (-F, Top 100)" },
                { id: "all", label: "All Ports (-p-)" },
                { id: "top", label: "Top N Ports" },
                { id: "custom", label: "Custom" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => update("portMode", opt.id)}
                className={`text-xs px-3 py-1.5 rounded border transition-all ${
                  config.portMode === opt.id
                    ? "border-dracula-cyan text-dracula-cyan bg-dracula-cyan/10 shadow-[0_0_12px_rgba(139,233,253,0.3)]"
                    : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-comment"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {config.portMode === "custom" && (
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Port specification (e.g., 22,80,443 or 1-1000 or U:53,T:25)
              </label>
              <input
                type="text"
                value={config.portSpec}
                onChange={(e) => update("portSpec", e.target.value)}
                placeholder="22,80,443,8080"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-cyan"
                spellCheck={false}
              />
            </div>
          )}
          {config.portMode === "top" && (
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Number of top ports
              </label>
              <input
                type="text"
                value={config.topPorts}
                onChange={(e) => update("topPorts", e.target.value)}
                placeholder="100"
                className="w-48 px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-cyan"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Detection & Discovery */}
      <CollapsibleSection
        title="Detection & Discovery"
        color="green"
        section="detection"
        expanded={expandedSections.has("detection")}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Toggle
            checked={config.aggressive}
            onChange={(v) => update("aggressive", v)}
            label="Aggressive Mode"
            flag="-A"
            description="Enables OS detection, version detection, script scanning, and traceroute in one flag."
          />
          <Toggle
            checked={config.serviceVersion}
            onChange={(v) => update("serviceVersion", v)}
            label="Service Version"
            flag="-sV"
            description="Probe open ports to determine service and version info."
            disabled={config.aggressive}
          />
          <Toggle
            checked={config.osDetection}
            onChange={(v) => update("osDetection", v)}
            label="OS Detection"
            flag="-O"
            description="Identify the target operating system using TCP/IP fingerprinting."
            disabled={config.aggressive}
          />
          <Toggle
            checked={config.defaultScripts}
            onChange={(v) => update("defaultScripts", v)}
            label="Default Scripts"
            flag="-sC"
            description="Run default NSE scripts for additional enumeration."
            disabled={config.aggressive}
          />
          <Toggle
            checked={config.traceroute}
            onChange={(v) => update("traceroute", v)}
            label="Traceroute"
            flag="--traceroute"
            description="Trace the network path to each discovered host."
            disabled={config.aggressive}
          />
          <Toggle
            checked={config.noPing}
            onChange={(v) => update("noPing", v)}
            label="Skip Ping"
            flag="-Pn"
            description="Treat all hosts as online. Skips host discovery. Useful when ICMP is blocked."
          />
          <Toggle
            checked={config.ipv6}
            onChange={(v) => update("ipv6", v)}
            label="IPv6"
            flag="-6"
            description="Enable IPv6 scanning."
          />
        </div>
      </CollapsibleSection>

      {/* NSE Scripts */}
      <CollapsibleSection
        title="NSE Scripts"
        color="yellow"
        section="scripts"
        expanded={expandedSections.has("scripts")}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold text-dracula-comment mb-2">
              Script Categories
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NSE_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-start gap-2 rounded-lg border p-2 cursor-pointer transition-all ${
                    config.nseCategories.includes(cat.id)
                      ? "border-dracula-yellow bg-dracula-yellow/5"
                      : "border-border bg-surface hover:border-dracula-comment"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.nseCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="mt-0.5 accent-dracula-yellow"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground">
                      {cat.name}
                    </span>
                    <p className="text-xs text-dracula-comment mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Popular Scripts */}
          <div>
            <h3 className="text-xs font-semibold text-dracula-comment mb-2">
              Popular Scripts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_SCRIPTS.map((script) => (
                <label
                  key={script.id}
                  className={`flex items-start gap-2 rounded-lg border p-2 cursor-pointer transition-all ${
                    config.nseScripts.includes(script.id)
                      ? "border-dracula-yellow bg-dracula-yellow/5"
                      : "border-border bg-surface hover:border-dracula-comment"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.nseScripts.includes(script.id)}
                    onChange={() => toggleScript(script.id)}
                    className="mt-0.5 accent-dracula-yellow"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-dracula-green">
                        {script.name}
                      </code>
                      <span className="text-xs text-dracula-comment">
                        ({script.category})
                      </span>
                    </div>
                    <p className="text-xs text-dracula-comment mt-0.5">
                      {script.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Timing & Performance */}
      <CollapsibleSection
        title="Timing & Performance"
        color="orange"
        section="timing"
        expanded={expandedSections.has("timing")}
        onToggle={toggleSection}
      >
        <div className="space-y-2">
          {TIMING_TEMPLATES.map((t) => (
            <label
              key={t.template}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                config.timing === t.template
                  ? "border-dracula-orange bg-dracula-orange/10 shadow-[0_0_12px_rgba(255,184,108,0.3)]"
                  : "border-border bg-surface hover:border-dracula-comment"
              }`}
            >
              <input
                type="radio"
                name="timing"
                value={t.template}
                checked={config.timing === t.template}
                onChange={() => update("timing", t.template as TimingTemplate)}
                className="mt-0.5 accent-dracula-orange"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    T{t.template}: {t.name}
                  </span>
                </div>
                <p className="text-xs text-dracula-comment mt-0.5">
                  {t.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Output Options */}
      <CollapsibleSection
        title="Output Options"
        color="cyan"
        section="output"
        expanded={expandedSections.has("output")}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle
              checked={config.verbose}
              onChange={(v) => update("verbose", v)}
              label="Verbose"
              flag="-v"
              description="Increase output verbosity."
            />
            <Toggle
              checked={config.debug}
              onChange={(v) => update("debug", v)}
              label="Debug"
              flag="-d"
              description="Increase debugging level."
            />
            <Toggle
              checked={config.openOnly}
              onChange={(v) => update("openOnly", v)}
              label="Open Ports Only"
              flag="--open"
              description="Only show open ports in output."
            />
            <Toggle
              checked={config.reason}
              onChange={(v) => update("reason", v)}
              label="Show Reason"
              flag="--reason"
              description="Show the reason each port is in a particular state."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Output Format
              </label>
              <select
                value={config.outputFormat}
                onChange={(e) =>
                  update("outputFormat", e.target.value as OutputFormat | "")
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-cyan"
              >
                <option value="">None</option>
                <option value="normal">Normal (-oN)</option>
                <option value="xml">XML (-oX)</option>
                <option value="grepable">Grepable (-oG)</option>
                <option value="all">All Formats (-oA)</option>
              </select>
            </div>
            {config.outputFormat && (
              <div>
                <label className="block text-xs text-dracula-comment mb-1">
                  Output Filename
                </label>
                <input
                  type="text"
                  value={config.outputFile}
                  onChange={(e) => update("outputFile", e.target.value)}
                  placeholder="scan_results"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-cyan"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Firewall/IDS Evasion */}
      <CollapsibleSection
        title="Firewall/IDS Evasion"
        color="red"
        section="evasion"
        expanded={expandedSections.has("evasion")}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle
              checked={config.evasion.fragment}
              onChange={(v) => updateEvasion("fragment", v)}
              label="Fragment Packets"
              flag="-f"
              description="Split packets into tiny fragments to bypass packet filters."
            />
            <Toggle
              checked={config.evasion.badChecksum}
              onChange={(v) => updateEvasion("badChecksum", v)}
              label="Bad Checksums"
              flag="--badsum"
              description="Send packets with invalid checksums. Real hosts ignore them, but some firewalls respond."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.evasion.fragment && (
              <div>
                <label className="block text-xs text-dracula-comment mb-1">
                  Custom MTU (optional, overrides -f)
                </label>
                <input
                  type="text"
                  value={config.evasion.mtu}
                  onChange={(e) => updateEvasion("mtu", e.target.value)}
                  placeholder="e.g., 24"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
                  spellCheck={false}
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Decoys (-D)
              </label>
              <input
                type="text"
                value={config.evasion.decoys}
                onChange={(e) => updateEvasion("decoys", e.target.value)}
                placeholder="RND:5 or 10.0.0.1,10.0.0.2,ME"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
                spellCheck={false}
              />
              <p className="text-xs text-dracula-comment mt-1">
                Use decoy IPs to obscure the scan source. RND:5 generates 5 random decoys.
              </p>
            </div>
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Source Port (--source-port)
              </label>
              <input
                type="text"
                value={config.evasion.sourcePort}
                onChange={(e) => updateEvasion("sourcePort", e.target.value)}
                placeholder="53 or 80"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
                spellCheck={false}
              />
              <p className="text-xs text-dracula-comment mt-1">
                Spoof source port. Port 53 (DNS) or 80 (HTTP) may bypass firewalls.
              </p>
            </div>
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Extra Data Length (--data-length)
              </label>
              <input
                type="text"
                value={config.evasion.dataLength}
                onChange={(e) => updateEvasion("dataLength", e.target.value)}
                placeholder="25"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                TTL (--ttl)
              </label>
              <input
                type="text"
                value={config.evasion.ttl}
                onChange={(e) => updateEvasion("ttl", e.target.value)}
                placeholder="64"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs text-dracula-comment mb-1">
                Spoof MAC (--spoof-mac)
              </label>
              <input
                type="text"
                value={config.evasion.spoofMac}
                onChange={(e) => updateEvasion("spoofMac", e.target.value)}
                placeholder="0 or AA:BB:CC:DD:EE:FF or Apple"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono focus:outline-none focus:border-dracula-red"
                spellCheck={false}
              />
              <p className="text-xs text-dracula-comment mt-1">
                Use 0 for random, a vendor name, or a specific MAC address.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Quick Reference */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> Common Scan Profiles
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-dracula-comment">
                <th className="text-left py-2 pr-4">Command</th>
                <th className="text-left py-2 pr-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {QUICK_REFERENCE.map((ref) => (
                <tr key={ref.command} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    <code className="text-dracula-green font-mono whitespace-nowrap">
                      {ref.command}
                    </code>
                  </td>
                  <td className="py-2 pr-4 text-dracula-fg">
                    {ref.description}
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

function Toggle({
  checked,
  onChange,
  label,
  flag,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  flag: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-2 rounded-lg border p-2 transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed border-border bg-surface"
          : checked
          ? "border-dracula-green bg-dracula-green/5 cursor-pointer"
          : "border-border bg-surface hover:border-dracula-comment cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          if (!disabled) onChange(e.target.checked);
        }}
        disabled={disabled}
        className="mt-0.5 accent-dracula-green"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <code className="text-xs text-dracula-cyan">{flag}</code>
        </div>
        <p className="text-xs text-dracula-comment mt-0.5">{description}</p>
      </div>
    </label>
  );
}

function NoiseIndicator({ level }: { level: number }) {
  const labels = ["", "Quiet", "Low", "Normal", "Loud", "Very Loud"];
  const colors = [
    "",
    "text-dracula-green",
    "text-dracula-green",
    "text-dracula-yellow",
    "text-dracula-orange",
    "text-dracula-red",
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dracula-comment">Noise:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-2 h-3 rounded-sm ${
              i <= level
                ? level <= 2
                  ? "bg-dracula-green"
                  : level <= 3
                  ? "bg-dracula-yellow"
                  : "bg-dracula-red"
                : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold ${colors[level]}`}>
        {labels[level]}
      </span>
    </div>
  );
}

// ── Quick reference data ───────────────────────────────────────────

const QUICK_REFERENCE = [
  { command: "nmap -sS -T4 --top-ports 100 <target>", description: "Quick TCP SYN scan of top 100 ports" },
  { command: "nmap -sS -p- -T4 --open <target>", description: "Full port scan showing only open ports" },
  { command: "nmap -sS -sV -sC -O <target>", description: "Version detection, default scripts, and OS fingerprinting" },
  { command: "nmap -A -T4 <target>", description: "Aggressive scan with all detection features" },
  { command: "nmap -sU --top-ports 100 <target>", description: "UDP scan of top 100 ports" },
  { command: "nmap -sS -T2 -f --source-port 53 <target>", description: "Stealth scan with fragmentation and source port spoofing" },
  { command: "nmap --script vuln <target>", description: "Run vulnerability detection scripts" },
  { command: "nmap -sn 192.168.1.0/24", description: "Ping sweep to discover live hosts (no port scan)" },
];
