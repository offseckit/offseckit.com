/**
 * JWT decoding and analysis logic.
 * All operations run client-side — no API routes, no external calls.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface DecodedJWT {
  raw: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
}

export interface SecurityFinding {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
}

export interface TimestampInfo {
  claim: string;
  label: string;
  value: number;
  date: Date;
  relative: string;
}

// ── Standard claims reference ──────────────────────────────────────

export interface ClaimDefinition {
  name: string;
  key: string;
  description: string;
  rfc: string;
}

export const STANDARD_CLAIMS: ClaimDefinition[] = [
  { name: "Issuer", key: "iss", description: "Principal that issued the JWT", rfc: "RFC 7519 4.1.1" },
  { name: "Subject", key: "sub", description: "Principal that is the subject of the JWT", rfc: "RFC 7519 4.1.2" },
  { name: "Audience", key: "aud", description: "Recipients that the JWT is intended for", rfc: "RFC 7519 4.1.3" },
  { name: "Expiration Time", key: "exp", description: "Time after which the JWT must not be accepted", rfc: "RFC 7519 4.1.4" },
  { name: "Not Before", key: "nbf", description: "Time before which the JWT must not be accepted", rfc: "RFC 7519 4.1.5" },
  { name: "Issued At", key: "iat", description: "Time at which the JWT was issued", rfc: "RFC 7519 4.1.6" },
  { name: "JWT ID", key: "jti", description: "Unique identifier for the JWT", rfc: "RFC 7519 4.1.7" },
];

// ── Known algorithms ───────────────────────────────────────────────

export interface AlgorithmInfo {
  name: string;
  type: "HMAC" | "RSA" | "ECDSA" | "EdDSA" | "none" | "other";
  strength: "none" | "weak" | "acceptable" | "strong";
  description: string;
}

const ALGORITHMS: Record<string, AlgorithmInfo> = {
  none: { name: "none", type: "none", strength: "none", description: "No digital signature or MAC — unsigned token" },
  HS256: { name: "HS256", type: "HMAC", strength: "acceptable", description: "HMAC using SHA-256 — symmetric key" },
  HS384: { name: "HS384", type: "HMAC", strength: "acceptable", description: "HMAC using SHA-384 — symmetric key" },
  HS512: { name: "HS512", type: "HMAC", strength: "strong", description: "HMAC using SHA-512 — symmetric key" },
  RS256: { name: "RS256", type: "RSA", strength: "strong", description: "RSASSA-PKCS1-v1_5 using SHA-256 — asymmetric key" },
  RS384: { name: "RS384", type: "RSA", strength: "strong", description: "RSASSA-PKCS1-v1_5 using SHA-384 — asymmetric key" },
  RS512: { name: "RS512", type: "RSA", strength: "strong", description: "RSASSA-PKCS1-v1_5 using SHA-512 — asymmetric key" },
  ES256: { name: "ES256", type: "ECDSA", strength: "strong", description: "ECDSA using P-256 and SHA-256 — asymmetric key" },
  ES384: { name: "ES384", type: "ECDSA", strength: "strong", description: "ECDSA using P-384 and SHA-384 — asymmetric key" },
  ES512: { name: "ES512", type: "ECDSA", strength: "strong", description: "ECDSA using P-521 and SHA-512 — asymmetric key" },
  PS256: { name: "PS256", type: "RSA", strength: "strong", description: "RSASSA-PSS using SHA-256 — asymmetric key" },
  PS384: { name: "PS384", type: "RSA", strength: "strong", description: "RSASSA-PSS using SHA-384 — asymmetric key" },
  PS512: { name: "PS512", type: "RSA", strength: "strong", description: "RSASSA-PSS using SHA-512 — asymmetric key" },
  EdDSA: { name: "EdDSA", type: "EdDSA", strength: "strong", description: "Edwards-curve Digital Signature Algorithm — asymmetric key" },
};

export function getAlgorithmInfo(alg: string): AlgorithmInfo | null {
  // Case-insensitive lookup for "none" variants
  if (alg.toLowerCase() === "none") {
    return ALGORITHMS["none"];
  }
  return ALGORITHMS[alg] || null;
}

// ── Base64URL helpers ──────────────────────────────────────────────

function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";

  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    // Fallback for binary data
    return atob(base64);
  }
}

// ── Decode ─────────────────────────────────────────────────────────

export function decodeJWT(token: string): DecodedJWT {
  const trimmed = token.trim();
  const parts = trimmed.split(".");

  if (parts.length !== 3) {
    throw new Error(`Invalid JWT: expected 3 parts separated by dots, got ${parts.length}`);
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch {
    throw new Error("Invalid JWT header: could not decode or parse as JSON");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new Error("Invalid JWT payload: could not decode or parse as JSON");
  }

  return {
    raw: trimmed,
    header,
    payload,
    signature: signatureB64,
    headerRaw: headerB64,
    payloadRaw: payloadB64,
  };
}

// ── Timestamp analysis ─────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  if (absDiff < 60) return diff >= 0 ? "in a few seconds" : "a few seconds ago";
  if (absDiff < 3600) {
    const mins = Math.floor(absDiff / 60);
    return diff >= 0 ? `in ${mins} minute${mins > 1 ? "s" : ""}` : `${mins} minute${mins > 1 ? "s" : ""} ago`;
  }
  if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    return diff >= 0 ? `in ${hours} hour${hours > 1 ? "s" : ""}` : `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(absDiff / 86400);
  if (days < 365) {
    return diff >= 0 ? `in ${days} day${days > 1 ? "s" : ""}` : `${days} day${days > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(days / 365);
  return diff >= 0 ? `in ${years} year${years > 1 ? "s" : ""}` : `${years} year${years > 1 ? "s" : ""} ago`;
}

export function analyzeTimestamps(payload: Record<string, unknown>): TimestampInfo[] {
  const timestampClaims: { key: string; label: string }[] = [
    { key: "iat", label: "Issued At" },
    { key: "exp", label: "Expiration" },
    { key: "nbf", label: "Not Before" },
  ];

  const results: TimestampInfo[] = [];

  for (const { key, label } of timestampClaims) {
    const value = payload[key];
    if (typeof value === "number") {
      const date = new Date(value * 1000);
      results.push({
        claim: key,
        label,
        value,
        date,
        relative: formatRelativeTime(value),
      });
    }
  }

  return results;
}

// ── Expiration status ──────────────────────────────────────────────

export type ExpirationStatus = "valid" | "expired" | "not-yet-valid" | "no-expiry";

export function getExpirationStatus(payload: Record<string, unknown>): ExpirationStatus {
  const now = Date.now() / 1000;

  const nbf = payload.nbf;
  if (typeof nbf === "number" && now < nbf) {
    return "not-yet-valid";
  }

  const exp = payload.exp;
  if (typeof exp === "number") {
    return now > exp ? "expired" : "valid";
  }

  return "no-expiry";
}

// ── Security analysis ──────────────────────────────────────────────

export function analyzeSecurityFindings(decoded: DecodedJWT): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const { header, payload } = decoded;
  const alg = String(header.alg || "");

  // Check for alg: none
  if (alg.toLowerCase() === "none") {
    findings.push({
      severity: "critical",
      title: 'Algorithm set to "none"',
      description:
        'The token uses alg: "none", meaning it has no cryptographic signature. An attacker can modify the payload without detection. This is a known JWT vulnerability (CVE-2015-9235).',
    });
  }

  // Check for empty signature with non-none algorithm
  if (decoded.signature === "" && alg.toLowerCase() !== "none") {
    findings.push({
      severity: "critical",
      title: "Empty signature with signed algorithm",
      description:
        `The token specifies algorithm "${alg}" but has an empty signature. This may indicate an alg:none bypass attempt where the algorithm was changed but the signature was stripped.`,
    });
  }

  // Check for weak HMAC algorithms
  if (alg === "HS256") {
    findings.push({
      severity: "info",
      title: "Symmetric signing algorithm (HS256)",
      description:
        "HS256 uses a shared secret key for both signing and verification. If the secret is weak or leaked, an attacker can forge tokens. Consider asymmetric algorithms (RS256, ES256) for better key separation.",
    });
  }

  // Check for missing expiration
  if (payload.exp === undefined) {
    findings.push({
      severity: "warning",
      title: "No expiration claim (exp)",
      description:
        "This token has no expiration time. Tokens without expiration remain valid indefinitely, which increases the risk if the token is compromised. Set a reasonable exp value.",
    });
  }

  // Check for very long expiry (>30 days)
  if (typeof payload.exp === "number" && typeof payload.iat === "number") {
    const lifetimeSeconds = payload.exp - payload.iat;
    const lifetimeDays = lifetimeSeconds / 86400;
    if (lifetimeDays > 30) {
      findings.push({
        severity: "warning",
        title: `Long token lifetime (${Math.round(lifetimeDays)} days)`,
        description:
          `This token has a lifetime of ${Math.round(lifetimeDays)} days (from iat to exp). Long-lived tokens increase the window of opportunity for attackers. Consider shorter lifetimes with refresh tokens.`,
      });
    }
  }

  // Check for missing issuer
  if (payload.iss === undefined) {
    findings.push({
      severity: "info",
      title: "No issuer claim (iss)",
      description:
        "The token has no issuer (iss) claim. Without an issuer, the consuming application cannot validate the token's origin. Consider adding an iss claim.",
    });
  }

  // Check for missing audience
  if (payload.aud === undefined) {
    findings.push({
      severity: "info",
      title: "No audience claim (aud)",
      description:
        "The token has no audience (aud) claim. Without an audience, any service could accept this token. Consider adding an aud claim to restrict token usage.",
    });
  }

  // Check for iat in the future
  if (typeof payload.iat === "number") {
    const now = Date.now() / 1000;
    if (payload.iat > now + 60) {
      findings.push({
        severity: "warning",
        title: "Token issued in the future",
        description:
          "The iat (issued at) timestamp is in the future, which may indicate clock skew between the issuing server and your system, or token manipulation.",
      });
    }
  }

  // Check for unknown algorithm
  if (alg && !getAlgorithmInfo(alg)) {
    findings.push({
      severity: "info",
      title: `Unknown algorithm: ${alg}`,
      description:
        `The algorithm "${alg}" is not a standard JOSE algorithm. This may indicate a custom implementation or a typo in the algorithm header.`,
    });
  }

  // Check for privilege-related claims
  const privilegeClaims = ["admin", "role", "roles", "scope", "permissions", "is_admin", "isAdmin", "is_superuser"];
  const foundPrivilege = privilegeClaims.filter((c) => payload[c] !== undefined);
  if (foundPrivilege.length > 0) {
    findings.push({
      severity: "info",
      title: `Privilege claims detected: ${foundPrivilege.join(", ")}`,
      description:
        "This token contains claims related to user privileges or roles. If the token can be forged (e.g., via weak signing), these claims could be manipulated for privilege escalation.",
    });
  }

  return findings;
}

// ── Detect if a claim is a known standard claim ────────────────────

export function isStandardClaim(key: string): boolean {
  return STANDARD_CLAIMS.some((c) => c.key === key);
}

export function getClaimDefinition(key: string): ClaimDefinition | undefined {
  return STANDARD_CLAIMS.find((c) => c.key === key);
}

// ── Example tokens for testing ─────────────────────────────────────

export const EXAMPLE_TOKENS = [
  {
    label: "Typical HS256 token",
    description: "Standard token with common claims",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  },
  {
    label: "Token with admin claim",
    description: "Contains role/admin claims (privilege check)",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJhZG1pbiI6dHJ1ZSwicm9sZSI6InN1cGVyYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjJ9.bold-signature-here",
  },
  {
    label: 'alg: "none" (unsigned)',
    description: "Token with no algorithm — a known vulnerability",
    token: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.",
  },
];
