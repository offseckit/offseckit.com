"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export default function CopyButton({
  text,
  className = "",
  label = "Copy",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-3 py-1.5 rounded border transition-all ${
        copied
          ? "border-dracula-green text-dracula-green bg-dracula-green/10"
          : "border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple bg-surface"
      } ${className}`}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
