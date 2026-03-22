/**
 * HTTP header security analysis logic.
 * All operations run client-side — no API routes, no external calls.
 *
 * Analyzes pasted HTTP response headers for security misconfigurations.
 * The user copies headers from curl -I, Burp, browser DevTools, etc.
 */

// ── Types ──────────────────────────────────────────────────────────

export type Severity = "pass" | "warn" | "fail" | "info";
export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface ParsedHeader {
  name: string;
  value: string;
  /** The original-case header name as pasted */
  rawName: string;
}

export interface HeaderCheck {
  header: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation?: string;
  /** The current value found (if any) */
  currentValue?: string;
}

export interface CSPDirective {
  name: string;
  values: string[];
}

export interface CSPFinding {
  severity: Severity;
  directive: string;
  description: string;
}

export interface AnalysisResult {
  headers: ParsedHeader[];
  checks: HeaderCheck[];
  cspFindings: CSPFinding[];
  grade: Grade;
  score: number;
  summary: { pass: number; warn: number; fail: number; info: number };
}

// ── Security headers to check ──────────────────────────────────────

export interface SecurityHeaderDef {
  name: string;
  description: string;
  recommended: string;
  reference: string;
}

export const SECURITY_HEADERS: SecurityHeaderDef[] = [
  {
    name: "Strict-Transport-Security",
    description: "Enforces HTTPS connections, preventing protocol downgrade attacks and cookie hijacking.",
    recommended: "max-age=63072000; includeSubDomains; preload",
    reference: "RFC 6797",
  },
  {
    name: "Content-Security-Policy",
    description: "Mitigates XSS and data injection attacks by specifying allowed content sources.",
    recommended: "default-src 'self'; form-action 'self'; object-src 'none'; frame-ancestors 'none'",
    reference: "W3C CSP Level 3",
  },
  {
    name: "X-Frame-Options",
    description: "Prevents clickjacking by controlling whether the page can be embedded in frames.",
    recommended: "DENY",
    reference: "RFC 7034",
  },
  {
    name: "X-Content-Type-Options",
    description: "Prevents MIME-type sniffing, forcing the browser to respect the declared Content-Type.",
    recommended: "nosniff",
    reference: "OWASP",
  },
  {
    name: "Referrer-Policy",
    description: "Controls how much referrer information is shared when navigating away from the page.",
    recommended: "no-referrer",
    reference: "W3C Referrer Policy",
  },
  {
    name: "Permissions-Policy",
    description: "Controls which browser features and APIs can be used (camera, microphone, geolocation, etc.).",
    recommended: "geolocation=(), camera=(), microphone=()",
    reference: "W3C Permissions Policy",
  },
  {
    name: "Cross-Origin-Opener-Policy",
    description: "Isolates the browsing context to prevent cross-origin attacks like Spectre.",
    recommended: "same-origin",
    reference: "HTML Spec",
  },
  {
    name: "Cross-Origin-Embedder-Policy",
    description: "Prevents loading cross-origin resources that don't grant permission, enabling SharedArrayBuffer.",
    recommended: "require-corp",
    reference: "HTML Spec",
  },
  {
    name: "Cross-Origin-Resource-Policy",
    description: "Prevents other origins from loading this resource, protecting against cross-origin leaks.",
    recommended: "same-origin",
    reference: "Fetch Spec",
  },
  {
    name: "X-Permitted-Cross-Domain-Policies",
    description: "Controls whether Adobe Flash and PDF can load data from the domain.",
    recommended: "none",
    reference: "OWASP",
  },
  {
    name: "X-DNS-Prefetch-Control",
    description: "Controls DNS prefetching to prevent information leakage about links on the page.",
    recommended: "off",
    reference: "MDN",
  },
  {
    name: "Cache-Control",
    description: "Controls caching behavior. Sensitive pages should prevent caching to avoid data leakage.",
    recommended: "no-store, max-age=0",
    reference: "RFC 7234",
  },
];

// ── Deprecated headers ─────────────────────────────────────────────

export interface DeprecatedHeaderDef {
  name: string;
  reason: string;
  replacement?: string;
}

export const DEPRECATED_HEADERS: DeprecatedHeaderDef[] = [
  {
    name: "X-XSS-Protection",
    reason: "Deprecated by all major browsers. Can introduce XSS vulnerabilities in older browsers. Use Content-Security-Policy instead.",
    replacement: "Content-Security-Policy",
  },
  {
    name: "Expect-CT",
    reason: "Deprecated since June 2021. Certificate Transparency is now enforced by default in all major browsers.",
  },
  {
    name: "Public-Key-Pins",
    reason: "Deprecated and removed from all browsers. Could cause permanent denial of service if misconfigured. Use Certificate Transparency instead.",
  },
  {
    name: "Feature-Policy",
    reason: "Renamed to Permissions-Policy. Feature-Policy is no longer supported by browsers.",
    replacement: "Permissions-Policy",
  },
  {
    name: "Pragma",
    reason: "HTTP/1.0 relic. Use Cache-Control instead for HTTP/1.1+ clients.",
    replacement: "Cache-Control",
  },
];

// ── Information leakage headers ────────────────────────────────────

export interface LeakageHeaderDef {
  name: string;
  description: string;
}

export const LEAKAGE_HEADERS: LeakageHeaderDef[] = [
  { name: "Server", description: "Reveals web server software and version (e.g., Apache/2.4.41, nginx/1.18.0)." },
  { name: "X-Powered-By", description: "Reveals server-side framework or language (e.g., PHP/7.4, Express, ASP.NET)." },
  { name: "X-AspNet-Version", description: "Reveals the exact ASP.NET version running on the server." },
  { name: "X-AspNetMvc-Version", description: "Reveals the ASP.NET MVC framework version." },
  { name: "X-Generator", description: "Reveals the CMS or site generator (e.g., WordPress 6.4, Drupal)." },
  { name: "X-Drupal-Cache", description: "Reveals the site is running Drupal CMS." },
  { name: "X-Varnish", description: "Reveals Varnish cache is in use and may expose internal request IDs." },
  { name: "Via", description: "May reveal proxy/gateway infrastructure and internal hostnames." },
];

// ── Parse raw headers ──────────────────────────────────────────────

export function parseHeaders(raw: string): ParsedHeader[] {
  const lines = raw.split(/\r?\n/);
  const headers: ParsedHeader[] = [];

  for (const line of lines) {
    // Skip empty lines and HTTP status lines
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^HTTP\/[\d.]+\s+\d+/.test(trimmed)) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const rawName = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (!rawName) continue;

    headers.push({
      name: rawName.toLowerCase(),
      value,
      rawName,
    });
  }

  return headers;
}

// ── CSP analysis ───────────────────────────────────────────────────

export function parseCSP(value: string): CSPDirective[] {
  const directives: CSPDirective[] = [];
  const parts = value.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const tokens = trimmed.split(/\s+/);
    const name = tokens[0].toLowerCase();
    const values = tokens.slice(1);

    directives.push({ name, values });
  }

  return directives;
}

export function analyzeCSP(value: string): CSPFinding[] {
  const findings: CSPFinding[] = [];
  const directives = parseCSP(value);
  const directiveMap = new Map(directives.map((d) => [d.name, d.values]));

  // Check for unsafe-inline
  for (const [name, values] of directiveMap) {
    if (values.includes("'unsafe-inline'")) {
      findings.push({
        severity: "warn",
        directive: name,
        description: `'unsafe-inline' in ${name} allows inline scripts/styles, reducing XSS protection. Use nonce or hash-based allowlisting instead.`,
      });
    }
  }

  // Check for unsafe-eval
  for (const [name, values] of directiveMap) {
    if (values.includes("'unsafe-eval'")) {
      findings.push({
        severity: "warn",
        directive: name,
        description: `'unsafe-eval' in ${name} allows eval() and similar functions, enabling code injection attacks.`,
      });
    }
  }

  // Check for wildcard sources
  for (const [name, values] of directiveMap) {
    if (values.includes("*")) {
      findings.push({
        severity: "fail",
        directive: name,
        description: `Wildcard (*) in ${name} allows loading resources from any origin, defeating the purpose of CSP.`,
      });
    }
  }

  // Check for data: URIs
  for (const [name, values] of directiveMap) {
    if (values.includes("data:")) {
      const concern = name === "script-src" || name === "default-src" ? "fail" : "warn";
      findings.push({
        severity: concern,
        directive: name,
        description: `data: URI scheme in ${name} can be used to inject arbitrary content${name.includes("script") || name === "default-src" ? ", including scripts" : ""}.`,
      });
    }
  }

  // Check for http: sources in script-src or default-src
  for (const [name, values] of directiveMap) {
    if (name === "script-src" || name === "default-src") {
      const httpSources = values.filter((v) => v.startsWith("http:"));
      if (httpSources.length > 0) {
        findings.push({
          severity: "warn",
          directive: name,
          description: `HTTP sources in ${name} allow loading scripts over unencrypted connections, vulnerable to MITM attacks: ${httpSources.join(", ")}`,
        });
      }
    }
  }

  // Check for missing default-src
  if (!directiveMap.has("default-src")) {
    findings.push({
      severity: "warn",
      directive: "default-src",
      description: "Missing default-src directive. Without a fallback, some resource types may not be restricted.",
    });
  }

  // Check for missing object-src
  if (!directiveMap.has("object-src") && !directiveMap.has("default-src")) {
    findings.push({
      severity: "warn",
      directive: "object-src",
      description: "Missing object-src directive. Flash/Java applet embeds are not restricted, which can lead to XSS.",
    });
  }

  // Check for missing base-uri
  if (!directiveMap.has("base-uri")) {
    findings.push({
      severity: "info",
      directive: "base-uri",
      description: "Missing base-uri directive. An attacker could inject a <base> tag to hijack relative URLs.",
    });
  }

  // Check for missing form-action
  if (!directiveMap.has("form-action")) {
    findings.push({
      severity: "info",
      directive: "form-action",
      description: "Missing form-action directive. Forms could submit data to arbitrary destinations.",
    });
  }

  // Check for missing frame-ancestors
  if (!directiveMap.has("frame-ancestors")) {
    findings.push({
      severity: "info",
      directive: "frame-ancestors",
      description: "Missing frame-ancestors directive. The page may be embedded in frames by any origin (clickjacking risk). Consider using frame-ancestors 'none' or 'self'.",
    });
  }

  // Check for overly permissive default-src
  const defaultSrc = directiveMap.get("default-src");
  if (defaultSrc && defaultSrc.length === 0) {
    findings.push({
      severity: "info",
      directive: "default-src",
      description: "default-src has no sources specified, which implicitly blocks everything. This is secure but may break functionality.",
    });
  }

  return findings;
}

// ── Header value checks ────────────────────────────────────────────

function checkHSTS(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "Strict-Transport-Security",
    title: "HSTS",
    currentValue: value,
  };

  const maxAgeMatch = value.match(/max-age=(\d+)/i);
  if (!maxAgeMatch) {
    return {
      ...base,
      severity: "fail",
      description: "HSTS header is present but missing max-age directive.",
      recommendation: "max-age=63072000; includeSubDomains; preload",
    };
  }

  const maxAge = parseInt(maxAgeMatch[1], 10);
  if (maxAge < 31536000) {
    return {
      ...base,
      severity: "warn",
      description: `HSTS max-age is ${maxAge} seconds (${Math.round(maxAge / 86400)} days). OWASP recommends at least 1 year (31536000 seconds).`,
      recommendation: "max-age=63072000; includeSubDomains; preload",
    };
  }

  const hasIncludeSubDomains = /includeSubDomains/i.test(value);
  const hasPreload = /preload/i.test(value);

  if (!hasIncludeSubDomains) {
    return {
      ...base,
      severity: "warn",
      description: "HSTS is set but missing includeSubDomains. Subdomains are not protected from downgrade attacks.",
      recommendation: `max-age=${maxAge}; includeSubDomains; preload`,
    };
  }

  if (!hasPreload) {
    return {
      ...base,
      severity: "info",
      description: "HSTS is properly configured but missing the preload directive. Consider adding preload for inclusion in browser preload lists.",
    };
  }

  return {
    ...base,
    severity: "pass",
    description: "HSTS is properly configured with includeSubDomains and preload.",
  };
}

function checkXFrameOptions(value: string): HeaderCheck {
  const upper = value.toUpperCase().trim();
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "X-Frame-Options",
    title: "X-Frame-Options",
    currentValue: value,
  };

  if (upper === "DENY") {
    return {
      ...base,
      severity: "pass",
      description: "X-Frame-Options is set to DENY, preventing all framing.",
    };
  }

  if (upper === "SAMEORIGIN") {
    return {
      ...base,
      severity: "pass",
      description: "X-Frame-Options is set to SAMEORIGIN, allowing framing only from the same origin.",
    };
  }

  if (upper.startsWith("ALLOW-FROM")) {
    return {
      ...base,
      severity: "warn",
      description: "ALLOW-FROM is not supported by modern browsers. Use Content-Security-Policy frame-ancestors instead.",
      recommendation: "DENY",
    };
  }

  return {
    ...base,
    severity: "fail",
    description: `Unrecognized X-Frame-Options value: "${value}". Use DENY or SAMEORIGIN.`,
    recommendation: "DENY",
  };
}

function checkXContentTypeOptions(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "X-Content-Type-Options",
    title: "X-Content-Type-Options",
    currentValue: value,
  };

  if (value.trim().toLowerCase() === "nosniff") {
    return {
      ...base,
      severity: "pass",
      description: "X-Content-Type-Options is correctly set to nosniff.",
    };
  }

  return {
    ...base,
    severity: "fail",
    description: `X-Content-Type-Options has invalid value "${value}". Only "nosniff" is valid.`,
    recommendation: "nosniff",
  };
}

function checkReferrerPolicy(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "Referrer-Policy",
    title: "Referrer-Policy",
    currentValue: value,
  };

  const secure = [
    "no-referrer",
    "same-origin",
    "strict-origin",
    "strict-origin-when-cross-origin",
  ];
  const risky = [
    "unsafe-url",
    "no-referrer-when-downgrade",
  ];

  const policies = value.split(",").map((p) => p.trim().toLowerCase());
  const lastPolicy = policies[policies.length - 1];

  if (secure.includes(lastPolicy)) {
    return {
      ...base,
      severity: "pass",
      description: `Referrer-Policy is set to "${lastPolicy}", which limits referrer information exposure.`,
    };
  }

  if (lastPolicy === "origin" || lastPolicy === "origin-when-cross-origin") {
    return {
      ...base,
      severity: "warn",
      description: `Referrer-Policy "${lastPolicy}" sends the origin on cross-origin requests. Consider strict-origin-when-cross-origin or no-referrer for better privacy.`,
      recommendation: "no-referrer",
    };
  }

  if (risky.includes(lastPolicy)) {
    return {
      ...base,
      severity: "fail",
      description: `Referrer-Policy "${lastPolicy}" sends full URL information to other origins, leaking sensitive path and query data.`,
      recommendation: "no-referrer",
    };
  }

  return {
    ...base,
    severity: "warn",
    description: `Unrecognized Referrer-Policy: "${value}".`,
    recommendation: "no-referrer",
  };
}

function checkCacheControl(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "Cache-Control",
    title: "Cache-Control",
    currentValue: value,
  };

  const lower = value.toLowerCase();
  const hasNoStore = lower.includes("no-store");
  const hasNoCache = lower.includes("no-cache");
  const hasPrivate = lower.includes("private");

  if (hasNoStore) {
    return {
      ...base,
      severity: "pass",
      description: "Cache-Control includes no-store, preventing sensitive data from being cached.",
    };
  }

  if (hasNoCache && hasPrivate) {
    return {
      ...base,
      severity: "warn",
      description: "Cache-Control uses no-cache and private, but no-store is recommended for pages with sensitive data.",
      recommendation: "no-store, max-age=0",
    };
  }

  if (hasPrivate) {
    return {
      ...base,
      severity: "warn",
      description: "Cache-Control is set to private (not shared caches), but sensitive pages should use no-store.",
      recommendation: "no-store, max-age=0",
    };
  }

  return {
    ...base,
    severity: "info",
    description: "Cache-Control does not prevent caching. If this page contains sensitive data, consider adding no-store.",
    recommendation: "no-store, max-age=0",
  };
}

function checkCOOP(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "Cross-Origin-Opener-Policy",
    title: "COOP",
    currentValue: value,
  };

  const lower = value.trim().toLowerCase();
  if (lower === "same-origin") {
    return { ...base, severity: "pass", description: "COOP is set to same-origin, isolating the browsing context." };
  }
  if (lower === "same-origin-allow-popups") {
    return { ...base, severity: "warn", description: "COOP allows popups to retain opener reference. Consider same-origin for full isolation." };
  }
  if (lower === "unsafe-none") {
    return { ...base, severity: "warn", description: "COOP is set to unsafe-none, providing no cross-origin isolation.", recommendation: "same-origin" };
  }
  return { ...base, severity: "info", description: `COOP has value: "${value}".` };
}

function checkCOEP(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "Cross-Origin-Embedder-Policy",
    title: "COEP",
    currentValue: value,
  };

  const lower = value.trim().toLowerCase();
  if (lower === "require-corp") {
    return { ...base, severity: "pass", description: "COEP requires cross-origin resources to grant permission via CORP or CORS." };
  }
  if (lower === "credentialless") {
    return { ...base, severity: "pass", description: "COEP uses credentialless mode, stripping credentials from cross-origin requests." };
  }
  if (lower === "unsafe-none") {
    return { ...base, severity: "warn", description: "COEP is set to unsafe-none, not enforcing cross-origin resource restrictions.", recommendation: "require-corp" };
  }
  return { ...base, severity: "info", description: `COEP has value: "${value}".` };
}

function checkCORP(value: string): HeaderCheck {
  const base: Omit<HeaderCheck, "severity" | "description"> = {
    header: "Cross-Origin-Resource-Policy",
    title: "CORP",
    currentValue: value,
  };

  const lower = value.trim().toLowerCase();
  if (lower === "same-origin") {
    return { ...base, severity: "pass", description: "CORP restricts resource loading to same-origin only." };
  }
  if (lower === "same-site") {
    return { ...base, severity: "pass", description: "CORP restricts resource loading to same-site." };
  }
  if (lower === "cross-origin") {
    return { ...base, severity: "warn", description: "CORP allows cross-origin loading. Consider same-origin for better isolation.", recommendation: "same-origin" };
  }
  return { ...base, severity: "info", description: `CORP has value: "${value}".` };
}

// ── Main analysis function ─────────────────────────────────────────

export function analyzeHeaders(raw: string): AnalysisResult {
  const headers = parseHeaders(raw);
  const headerMap = new Map<string, string>();

  // Build a map of lowercase header name -> value
  for (const h of headers) {
    headerMap.set(h.name, h.value);
  }

  const checks: HeaderCheck[] = [];
  let cspFindings: CSPFinding[] = [];

  // ── Check required security headers ──
  for (const def of SECURITY_HEADERS) {
    const value = headerMap.get(def.name.toLowerCase());

    if (!value) {
      checks.push({
        header: def.name,
        severity: def.name === "Cache-Control" || def.name === "X-DNS-Prefetch-Control" || def.name === "X-Permitted-Cross-Domain-Policies" ? "info" : "fail",
        title: def.name,
        description: `Missing ${def.name} header. ${def.description}`,
        recommendation: def.recommended,
      });
      continue;
    }

    // Per-header value analysis
    const lowerName = def.name.toLowerCase();
    switch (lowerName) {
      case "strict-transport-security":
        checks.push(checkHSTS(value));
        break;
      case "content-security-policy":
        checks.push({
          header: def.name,
          severity: "pass",
          title: def.name,
          description: "Content-Security-Policy header is present. See detailed CSP analysis below.",
          currentValue: value.length > 200 ? value.substring(0, 200) + "..." : value,
        });
        cspFindings = analyzeCSP(value);
        break;
      case "x-frame-options":
        checks.push(checkXFrameOptions(value));
        break;
      case "x-content-type-options":
        checks.push(checkXContentTypeOptions(value));
        break;
      case "referrer-policy":
        checks.push(checkReferrerPolicy(value));
        break;
      case "cache-control":
        checks.push(checkCacheControl(value));
        break;
      case "cross-origin-opener-policy":
        checks.push(checkCOOP(value));
        break;
      case "cross-origin-embedder-policy":
        checks.push(checkCOEP(value));
        break;
      case "cross-origin-resource-policy":
        checks.push(checkCORP(value));
        break;
      case "permissions-policy": {
        checks.push({
          header: def.name,
          severity: "pass",
          title: def.name,
          description: "Permissions-Policy header is present, restricting browser feature access.",
          currentValue: value.length > 200 ? value.substring(0, 200) + "..." : value,
        });
        break;
      }
      default:
        // Generic present check for remaining headers
        checks.push({
          header: def.name,
          severity: "pass",
          title: def.name,
          description: `${def.name} header is present.`,
          currentValue: value,
        });
    }
  }

  // ── Check deprecated headers ──
  for (const dep of DEPRECATED_HEADERS) {
    const value = headerMap.get(dep.name.toLowerCase());
    if (value) {
      checks.push({
        header: dep.name,
        severity: "warn",
        title: `Deprecated: ${dep.name}`,
        description: dep.reason,
        currentValue: value,
        recommendation: dep.replacement ? `Remove ${dep.name} and use ${dep.replacement} instead.` : `Remove ${dep.name}.`,
      });
    }
  }

  // ── Check information leakage headers ──
  for (const leak of LEAKAGE_HEADERS) {
    const value = headerMap.get(leak.name.toLowerCase());
    if (value) {
      checks.push({
        header: leak.name,
        severity: "info",
        title: `Info Disclosure: ${leak.name}`,
        description: `${leak.description} Current value: "${value}". Remove or obfuscate this header to reduce fingerprinting surface.`,
        currentValue: value,
        recommendation: `Remove the ${leak.name} header from responses.`,
      });
    }
  }

  // Adjust CSP severity if there are critical CSP findings
  if (cspFindings.some((f) => f.severity === "fail")) {
    const cspCheck = checks.find((c) => c.header === "Content-Security-Policy" && c.severity === "pass");
    if (cspCheck) {
      cspCheck.severity = "warn";
      cspCheck.description = "Content-Security-Policy is present but has security issues. See detailed CSP analysis below.";
    }
  }

  // ── Calculate score and grade ──
  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const check of checks) {
    summary[check.severity]++;
  }

  const score = calculateScore(checks, cspFindings);
  const grade = scoreToGrade(score);

  return { headers, checks, cspFindings, grade, score, summary };
}

// ── Scoring ────────────────────────────────────────────────────────

function calculateScore(checks: HeaderCheck[], cspFindings: CSPFinding[]): number {
  // Score out of 100
  // Core security headers are weighted more heavily
  const coreHeaders = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ];

  let score = 100;

  for (const check of checks) {
    const isCore = coreHeaders.includes(check.header);

    if (check.severity === "fail") {
      score -= isCore ? 15 : 5;
    } else if (check.severity === "warn") {
      // Deprecated and info-disclosure warns are lighter
      const isDep = DEPRECATED_HEADERS.some((d) => d.name === check.header);
      const isLeak = LEAKAGE_HEADERS.some((l) => l.name === check.header);
      if (isDep || isLeak) {
        score -= 3;
      } else {
        score -= isCore ? 8 : 3;
      }
    }
  }

  // Deduct for CSP findings
  for (const f of cspFindings) {
    if (f.severity === "fail") score -= 5;
    else if (f.severity === "warn") score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreToGrade(score: number): Grade {
  if (score >= 95) return "A+";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

// ── Example headers for testing ────────────────────────────────────

export const EXAMPLE_HEADERS = [
  {
    label: "Well-configured site",
    description: "Most security headers present and properly configured",
    headers: `HTTP/2 200
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), camera=(), microphone=(), payment=()
cross-origin-opener-policy: same-origin
cross-origin-embedder-policy: require-corp
cross-origin-resource-policy: same-origin
cache-control: no-store, max-age=0
x-dns-prefetch-control: off
x-permitted-cross-domain-policies: none`,
  },
  {
    label: "Poorly configured site",
    description: "Missing critical headers, deprecated headers present, info leakage",
    headers: `HTTP/1.1 200 OK
Server: Apache/2.4.41 (Ubuntu)
X-Powered-By: PHP/7.4.3
X-XSS-Protection: 1; mode=block
Pragma: no-cache
Content-Type: text/html; charset=UTF-8
Cache-Control: public, max-age=3600`,
  },
  {
    label: "Weak CSP example",
    description: "CSP with unsafe-inline, unsafe-eval, and wildcard sources",
    headers: `HTTP/2 200
content-type: text/html
strict-transport-security: max-age=86400
content-security-policy: default-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src *
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff`,
  },
];
