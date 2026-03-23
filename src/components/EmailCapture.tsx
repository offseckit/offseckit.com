"use client";

import { useState } from "react";

export default function EmailCapture() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="text-sm font-bold text-foreground">
        New security tools dropping regularly.
      </h3>
      <p className="mt-1 text-xs text-dracula-comment">No spam, just tools.</p>

      {submitted ? (
        <p className="mt-4 text-sm text-dracula-green">
          Check your email to confirm.
        </p>
      ) : (
        <form
          action="https://buttondown.com/api/emails/embed-subscribe/PLACEHOLDER_USERNAME"
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
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
