"use client";

import { useState, useMemo } from "react";
import { getShells, encodeBase64, encodeUrl } from "@/lib/revshells";
import CopyButton from "@/components/CopyButton";

type Encoding = "raw" | "base64" | "url" | "double-url";

export default function RevShellGenerator() {
  const shells = getShells();
  const [selectedLang, setSelectedLang] = useState("bash");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [ip, setIp] = useState("10.10.10.10");
  const [port, setPort] = useState("4444");
  const [encoding, setEncoding] = useState<Encoding>("raw");

  const lang = shells.find((s) => s.id === selectedLang) ?? shells[0];
  const variant = lang.variants[selectedVariant] ?? lang.variants[0];

  const rawCommand = useMemo(
    () => variant.command(ip, port),
    [variant, ip, port]
  );

  const encodedCommand = useMemo(() => {
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
  }, [rawCommand, encoding]);

  const listenerCommand = lang.listener.replace("{port}", port);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* IP */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            IP Address
          </label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="10.10.10.10"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          />
        </div>

        {/* Port */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            Port
          </label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="4444"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs text-dracula-comment mb-1.5">
            Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              setSelectedVariant(0);
            }}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-dracula-purple"
          >
            {shells.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
          {lang.variants.map((v, i) => (
            <button
              key={v.name}
              onClick={() => setSelectedVariant(i)}
              className={`text-xs px-3 py-1.5 rounded border transition-all ${
                selectedVariant === i
                  ? "border-dracula-purple text-dracula-purple bg-dracula-purple/10"
                  : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-comment"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reverse Shell Command */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">
            <span className="text-dracula-pink">#</span> Reverse Shell
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
          <CopyButton text={encodedCommand} />
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
            <span className="text-dracula-green">#</span> Listener
          </h2>
          <CopyButton text={listenerCommand} />
        </div>
        <div className="relative rounded-lg border border-border bg-dracula-bg overflow-hidden">
          <pre className="p-4 text-sm text-dracula-fg overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            <code>{listenerCommand}</code>
          </pre>
        </div>
      </div>

      {/* Quick Reference: all shells */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          <span className="text-dracula-cyan">#</span> All {lang.name} Variants
        </h2>
        <div className="space-y-3">
          {lang.variants.map((v, i) => {
            if (i === selectedVariant) return null;
            const cmd = v.command(ip, port);
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
    </div>
  );
}
