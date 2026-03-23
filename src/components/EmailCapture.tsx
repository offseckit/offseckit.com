"use client";

import { useState } from "react";

interface EmailCaptureProps {
  variant?: "blog" | "tools" | "tool-page";
}

const MESSAGES = {
  blog: {
    heading: "More cheat sheets like this, straight to your inbox.",
    subtext: "One email per launch. No spam, no fluff.",
    button: "Subscribe",
  },
  tools: {
    heading: "Get notified when we ship new tools.",
    subtext: "No spam — just tool launches.",
    button: "Notify Me",
  },
  "tool-page": {
    heading: "New tools added regularly.",
    subtext: "Get notified.",
    button: "Subscribe",
  },
};

export default function EmailCapture({ variant = "tools" }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const msg = MESSAGES[variant];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("embed", "1");

      const res = await fetch(
        "https://buttondown.com/api/emails/embed-subscribe/4252nez",
        { method: "POST", body: formData, mode: "no-cors" }
      );

      // no-cors means we can't read the response, but if it didn't throw it went through
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-sm font-bold text-foreground">
        {msg.heading}
      </h3>
      <p className="mt-1 text-xs text-dracula-comment">{msg.subtext}</p>

      {status === "success" ? (
        <p className="mt-4 text-sm text-dracula-green">
          You&apos;re in. Check your email to confirm.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-dracula-purple placeholder:text-dracula-comment/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2 rounded-lg bg-dracula-pink text-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
          >
            {status === "loading" ? "..." : msg.button}
          </button>
          {status === "error" && (
            <span className="text-xs text-dracula-red self-center">Failed. Try again.</span>
          )}
        </form>
      )}
    </div>
  );
}
