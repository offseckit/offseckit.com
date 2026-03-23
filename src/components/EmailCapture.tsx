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
  const [submitted, setSubmitted] = useState(false);
  const msg = MESSAGES[variant];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-sm font-bold text-foreground">
        {msg.heading}
      </h3>
      <p className="mt-1 text-xs text-dracula-comment">{msg.subtext}</p>

      {submitted ? (
        <p className="mt-4 text-sm text-dracula-green">
          Check your email to confirm.
        </p>
      ) : (
        <form
          action="https://buttondown.com/api/emails/embed-subscribe/4252nez"
          method="post"
          target="_blank"
          onSubmit={() => setSubmitted(true)}
          className="mt-4 flex gap-2"
        >
          <input type="hidden" name="embed" value="1" />
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-dracula-purple placeholder:text-dracula-comment/50"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-dracula-pink text-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            {msg.button}
          </button>
        </form>
      )}
    </div>
  );
}
