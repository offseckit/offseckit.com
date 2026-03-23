import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "security-headers-guide",
  title: "HTTP Security Headers Cheat Sheet 2026 — HSTS, CSP, X-Frame-Options, and More",
  description:
    "Complete guide to HTTP security headers for pentesters and developers. Covers HSTS, Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy, OWASP recommendations, deprecated headers, and remediation guidance.",
  date: "2026-03-19",
  author: "4252nez",
  keywords: [
    "HTTP security headers",
    "security headers cheat sheet",
    "HSTS header",
    "Content-Security-Policy",
    "CSP cheat sheet",
    "X-Frame-Options",
    "security headers check",
    "OWASP security headers",
    "HTTP header security",
    "missing security headers",
  ],
  relatedTool: "headers",
};

export function Content() {
  return (
    <>
      <p>
        HTTP security headers are your first line of defense against common web
        attacks. Properly configured headers protect against XSS, clickjacking,
        MIME-type sniffing, protocol downgrade attacks, and cross-origin data
        leaks. Yet many production sites are missing critical headers or have
        them misconfigured.
      </p>
      <p>
        Use our <a href="/tools/headers">HTTP Header Security Analyzer</a> to
        paste response headers from curl, Burp, or DevTools and get instant
        analysis with remediation guidance, or keep reading for the full
        reference.
      </p>

      <h2>Essential Security Headers</h2>
      <p>
        The OWASP Secure Headers Project defines the authoritative list of
        recommended security headers. These are the headers every web application
        should implement.
      </p>

      <h3>Strict-Transport-Security (HSTS)</h3>
      <p>
        HSTS tells browsers to only connect over HTTPS, preventing protocol
        downgrade attacks and cookie hijacking. Once a browser sees this header,
        it refuses HTTP connections for the specified duration.
      </p>
      <pre><code>Strict-Transport-Security: max-age=63072000; includeSubDomains; preload</code></pre>
      <ul>
        <li><strong>max-age</strong> — Duration in seconds (OWASP recommends 2 years: 63072000)</li>
        <li><strong>includeSubDomains</strong> — Extends protection to all subdomains</li>
        <li><strong>preload</strong> — Allows inclusion in browser preload lists for first-visit protection</li>
      </ul>

      <h3>Content-Security-Policy (CSP)</h3>
      <p>
        CSP is the most powerful security header. It tells the browser which
        content sources are allowed, mitigating XSS and data injection attacks.
        A well-configured CSP can prevent most XSS exploitation even when
        vulnerabilities exist in the application.
      </p>
      <pre><code>{`Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`}</code></pre>
      <p>Key directives:</p>
      <table>
        <thead>
          <tr>
            <th>Directive</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>default-src</td>
            <td>Fallback for all resource types</td>
          </tr>
          <tr>
            <td>script-src</td>
            <td>Controls JavaScript sources</td>
          </tr>
          <tr>
            <td>style-src</td>
            <td>Controls CSS sources</td>
          </tr>
          <tr>
            <td>img-src</td>
            <td>Controls image sources</td>
          </tr>
          <tr>
            <td>object-src</td>
            <td>Controls Flash/Java embeds (set to none)</td>
          </tr>
          <tr>
            <td>frame-ancestors</td>
            <td>Controls who can embed this page (clickjacking prevention)</td>
          </tr>
          <tr>
            <td>base-uri</td>
            <td>Restricts base tag URLs</td>
          </tr>
          <tr>
            <td>form-action</td>
            <td>Restricts form submission targets</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Avoid these dangerous values:</strong> <code>{"'unsafe-inline'"}</code> (allows
        inline scripts), <code>{"'unsafe-eval'"}</code> (allows eval()), <code>*</code> (wildcard
        allows any origin), <code>data:</code> (allows data URIs in script-src).
      </p>

      <h3>X-Frame-Options</h3>
      <p>
        Prevents clickjacking by controlling whether the page can be embedded in
        iframes, frames, or objects.
      </p>
      <pre><code>X-Frame-Options: DENY</code></pre>
      <ul>
        <li><strong>DENY</strong> — No framing allowed from any origin</li>
        <li><strong>SAMEORIGIN</strong> — Only same-origin framing allowed</li>
        <li><strong>ALLOW-FROM</strong> — Deprecated, not supported in modern browsers</li>
      </ul>

      <h3>X-Content-Type-Options</h3>
      <p>
        Prevents MIME-type sniffing. Without this header, browsers may interpret
        files as a different content type than declared, potentially executing
        malicious content.
      </p>
      <pre><code>X-Content-Type-Options: nosniff</code></pre>

      <h3>Referrer-Policy</h3>
      <p>
        Controls how much referrer information is included when navigating away
        from the page. Sensitive URLs with tokens or session IDs in query
        parameters can leak through the Referer header.
      </p>
      <pre><code>Referrer-Policy: no-referrer</code></pre>
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Security</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>no-referrer</td>
            <td>Most secure — sends nothing</td>
          </tr>
          <tr>
            <td>strict-origin-when-cross-origin</td>
            <td>Good — origin only on cross-origin</td>
          </tr>
          <tr>
            <td>same-origin</td>
            <td>Good — referrer only for same-origin</td>
          </tr>
          <tr>
            <td>unsafe-url</td>
            <td>Dangerous — sends full URL everywhere</td>
          </tr>
        </tbody>
      </table>

      <h3>Permissions-Policy</h3>
      <p>
        Controls which browser features and APIs the page can use. Disabling
        unused features reduces the attack surface.
      </p>
      <pre><code>{`Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=()`}</code></pre>

      <h2>Cross-Origin Isolation Headers</h2>
      <p>
        Modern browsers support cross-origin isolation headers that protect
        against Spectre-class attacks and cross-origin data leaks.
      </p>
      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Recommended Value</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cross-Origin-Opener-Policy</td>
            <td>same-origin</td>
            <td>Isolates browsing context</td>
          </tr>
          <tr>
            <td>Cross-Origin-Embedder-Policy</td>
            <td>require-corp</td>
            <td>Requires cross-origin resource permission</td>
          </tr>
          <tr>
            <td>Cross-Origin-Resource-Policy</td>
            <td>same-origin</td>
            <td>Prevents cross-origin resource loading</td>
          </tr>
        </tbody>
      </table>

      <h2>Deprecated Headers to Remove</h2>
      <p>
        These headers are no longer supported by modern browsers and should be
        removed from your responses:
      </p>
      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Reason</th>
            <th>Replacement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>X-XSS-Protection</td>
            <td>Deprecated by all browsers; can introduce XSS in older browsers</td>
            <td>Content-Security-Policy</td>
          </tr>
          <tr>
            <td>Expect-CT</td>
            <td>Certificate Transparency enforced by default since 2021</td>
            <td>None needed</td>
          </tr>
          <tr>
            <td>Public-Key-Pins (HPKP)</td>
            <td>Removed from all browsers; can cause permanent DoS</td>
            <td>Certificate Transparency</td>
          </tr>
          <tr>
            <td>Feature-Policy</td>
            <td>Renamed</td>
            <td>Permissions-Policy</td>
          </tr>
        </tbody>
      </table>

      <h2>Information Leakage Headers</h2>
      <p>
        These headers reveal information about your server infrastructure and
        should be removed or obfuscated:
      </p>
      <ul>
        <li><strong>Server</strong> — Reveals web server software and version (e.g., Apache/2.4.41)</li>
        <li><strong>X-Powered-By</strong> — Reveals framework (e.g., PHP/7.4, Express, ASP.NET)</li>
        <li><strong>X-AspNet-Version</strong> — Reveals exact .NET version</li>
        <li><strong>X-Generator</strong> — Reveals CMS (e.g., WordPress 6.4)</li>
      </ul>
      <p>
        Attackers use this information to find known vulnerabilities in specific
        software versions. Always remove or mask these headers in production.
      </p>

      <h2>How to Check Headers</h2>
      <p>
        The fastest way to check response headers is with curl:
      </p>
      <pre><code>curl -sI https://example.com</code></pre>
      <p>
        Copy the output and paste it into our{" "}
        <a href="/tools/headers">Header Security Analyzer</a> for instant
        analysis with grades, CSP evaluation, and copy-paste remediation values.
        The analysis runs 100% in your browser — no data is sent anywhere.
      </p>
      <p>
        For CLI usage, pipe directly to the analyzer:
      </p>
      <pre><code>curl -sI https://example.com | osk headers analyze</code></pre>

      <h2>Quick Reference</h2>
      <p>
        Copy this complete set of recommended security headers for your web
        server:
      </p>
      <pre><code>{`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), camera=(), microphone=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
Cache-Control: no-store, max-age=0
X-DNS-Prefetch-Control: off
X-Permitted-Cross-Domain-Policies: none`}</code></pre>
    </>
  );
}
