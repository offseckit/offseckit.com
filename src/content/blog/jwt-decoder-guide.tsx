import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "jwt-decoder-guide",
  title: "JWT Decoder Cheat Sheet 2026 — Decode, Analyze, and Exploit JSON Web Tokens",
  description:
    "Complete guide to decoding and analyzing JWT tokens for pentesters. Covers JWT structure, common vulnerabilities (alg:none, algorithm confusion), security analysis, and practical exploitation tips.",
  date: "2026-03-14",
  author: "4252nez",
  keywords: [
    "JWT decoder",
    "decode JWT token",
    "JWT vulnerabilities",
    "JWT security",
    "alg none vulnerability",
    "JWT pentest",
    "JSON web token",
    "JWT cheat sheet",
    "JWT algorithm confusion",
    "JWT exploitation",
  ],
  relatedTool: "jwt",
};

export function Content() {
  return (
    <>
      <p>
        JSON Web Tokens (JWTs) are everywhere in modern web applications. Every
        time you authenticate to an API, there&apos;s a good chance a JWT is
        involved. For pentesters and bug bounty hunters, understanding JWT
        structure and common vulnerabilities is essential.
      </p>
      <p>
        This guide covers how to decode JWTs, analyze them for security issues,
        and identify exploitation opportunities. Use our{" "}
        <a href="/tools/jwt">JWT Decoder &amp; Analyzer</a> to decode and
        analyze tokens instantly in your browser.
      </p>

      <h2>JWT Structure</h2>
      <p>
        A JWT consists of three Base64URL-encoded parts separated by dots:
      </p>
      <pre>
        <code>{`HEADER.PAYLOAD.SIGNATURE

# Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`}</code>
      </pre>
      <ul>
        <li>
          <strong>Header</strong> — specifies the signing algorithm (e.g.,
          HS256, RS256) and token type
        </li>
        <li>
          <strong>Payload</strong> — contains claims (user data, permissions,
          expiration)
        </li>
        <li>
          <strong>Signature</strong> — cryptographic signature for integrity
          verification
        </li>
      </ul>
      <p>
        Anyone can decode the header and payload — they are only Base64URL
        encoded, not encrypted. The signature is what prevents tampering.
      </p>

      <h2>Decoding a JWT</h2>
      <p>
        Decoding a JWT is as simple as Base64URL-decoding the first two parts:
      </p>
      <pre>
        <code>{`# Command line (Linux/macOS)
echo -n "eyJhbGciOiJIUzI1NiJ9" | base64 -d
# Output: {"alg":"HS256"}

# Python
import base64, json
header = "eyJhbGciOiJIUzI1NiJ9"
json.loads(base64.urlsafe_b64decode(header + "=="))

# Or use the OffSecKit CLI
osk jwt decode eyJhbGciOiJIUzI1NiIs...`}</code>
      </pre>

      <h2>Standard JWT Claims</h2>
      <p>
        RFC 7519 defines seven registered claims. Understanding these is
        critical for security analysis:
      </p>
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>iss</td>
            <td>Issuer</td>
            <td>Who issued the token</td>
          </tr>
          <tr>
            <td>sub</td>
            <td>Subject</td>
            <td>Who the token is about</td>
          </tr>
          <tr>
            <td>aud</td>
            <td>Audience</td>
            <td>Who should accept the token</td>
          </tr>
          <tr>
            <td>exp</td>
            <td>Expiration</td>
            <td>When the token expires (Unix timestamp)</td>
          </tr>
          <tr>
            <td>nbf</td>
            <td>Not Before</td>
            <td>Token is not valid before this time</td>
          </tr>
          <tr>
            <td>iat</td>
            <td>Issued At</td>
            <td>When the token was issued</td>
          </tr>
          <tr>
            <td>jti</td>
            <td>JWT ID</td>
            <td>Unique identifier for the token</td>
          </tr>
        </tbody>
      </table>

      <h2>JWT Vulnerabilities for Pentesters</h2>

      <h3>1. Algorithm &quot;none&quot; Attack (CVE-2015-9235)</h3>
      <p>
        The most famous JWT vulnerability. If a server accepts tokens with{" "}
        <code>alg: &quot;none&quot;</code>, an attacker can modify the payload
        and strip the signature entirely:
      </p>
      <pre>
        <code>{`# Original header: {"alg": "HS256", "typ": "JWT"}
# Modified header: {"alg": "none", "typ": "JWT"}

# Base64URL encode the modified header and desired payload,
# then append an empty signature:
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.
eyJzdWIiOiIxMjM0NTY3ODkwIiwiYWRtaW4iOnRydWV9.`}</code>
      </pre>
      <p>
        Some libraries also accept case variations like &quot;None&quot;,
        &quot;NONE&quot;, or &quot;nOnE&quot;.
      </p>

      <h3>2. Algorithm Confusion (RS256 to HS256)</h3>
      <p>
        If a server uses RS256 (asymmetric), an attacker may be able to change
        the algorithm to HS256 (symmetric) and sign the token with the RSA
        public key as the HMAC secret. The server would then verify the HMAC
        signature using its RSA public key, which the attacker already knows.
      </p>
      <pre>
        <code>{`# Attack flow:
# 1. Obtain the server's RSA public key (often in /.well-known/jwks.json)
# 2. Change the JWT header alg from RS256 to HS256
# 3. Modify the payload (e.g., change role to admin)
# 4. Sign the modified token using the public key as the HMAC secret
# 5. Send the forged token to the server`}</code>
      </pre>

      <h3>3. Weak HMAC Secrets</h3>
      <p>
        HS256 tokens signed with weak secrets can be brute-forced. Use hashcat
        or john to crack them:
      </p>
      <pre>
        <code>{`# Crack JWT secret with hashcat
hashcat -m 16500 jwt.txt wordlist.txt

# Crack with john
john jwt.txt --wordlist=wordlist.txt --format=HMAC-SHA256`}</code>
      </pre>

      <h3>4. Missing Expiration</h3>
      <p>
        Tokens without an <code>exp</code> claim never expire. If stolen, they
        can be used indefinitely. Always check for expiration during assessments.
      </p>

      <h3>5. Privilege Escalation via Claim Tampering</h3>
      <p>
        Look for claims like <code>admin</code>, <code>role</code>,{" "}
        <code>scope</code>, or <code>permissions</code> in the payload. If
        you can forge the token (via any of the above attacks), these claims are
        your escalation targets.
      </p>

      <h2>JWT Signing Algorithms</h2>
      <table>
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HS256/384/512</td>
            <td>HMAC (symmetric)</td>
            <td>
              Same key signs and verifies. Brute-forceable if key is weak.
            </td>
          </tr>
          <tr>
            <td>RS256/384/512</td>
            <td>RSA (asymmetric)</td>
            <td>
              Private key signs, public key verifies. More secure for
              distributed systems.
            </td>
          </tr>
          <tr>
            <td>ES256/384/512</td>
            <td>ECDSA (asymmetric)</td>
            <td>Elliptic curve variant. Smaller keys, same security level.</td>
          </tr>
          <tr>
            <td>PS256/384/512</td>
            <td>RSA-PSS (asymmetric)</td>
            <td>Probabilistic RSA signatures. More robust than PKCS1.</td>
          </tr>
          <tr>
            <td>EdDSA</td>
            <td>Edwards-curve (asymmetric)</td>
            <td>Modern, fast, and secure. Uses Ed25519/Ed448 curves.</td>
          </tr>
        </tbody>
      </table>

      <h2>Security Checklist</h2>
      <p>
        When reviewing JWT implementations during a pentest, check for:
      </p>
      <ol>
        <li>
          <strong>Algorithm enforcement</strong> — Does the server enforce a
          specific algorithm, or does it trust the <code>alg</code> header?
        </li>
        <li>
          <strong>None algorithm</strong> — Does the server accept{" "}
          <code>alg: &quot;none&quot;</code>?
        </li>
        <li>
          <strong>Algorithm confusion</strong> — Can you switch from RS256 to
          HS256?
        </li>
        <li>
          <strong>Secret strength</strong> — Is the HMAC secret brute-forceable?
        </li>
        <li>
          <strong>Expiration</strong> — Is <code>exp</code> present and
          reasonable?
        </li>
        <li>
          <strong>Audience validation</strong> — Does the server check{" "}
          <code>aud</code>?
        </li>
        <li>
          <strong>Claim tampering</strong> — Can you escalate via role/admin
          claims?
        </li>
        <li>
          <strong>Token reuse</strong> — Can expired or revoked tokens still be
          used?
        </li>
      </ol>

      <h2>CLI Version</h2>
      <p>
        Prefer working from the terminal? Install the CLI version via pip:
      </p>
      <pre>
        <code>pip install offseckit</code>
      </pre>
      <p>Decode and analyze JWTs directly from your terminal:</p>
      <pre>
        <code>{`# Decode a JWT
osk jwt decode eyJhbGciOiJIUzI1NiIs...

# Security analysis
osk jwt analyze eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0...

# Pipe from clipboard (macOS)
pbpaste | osk jwt decode

# Output as JSON for scripting
osk jwt decode --json-output eyJhbGciOiJIUzI1NiIs...

# List supported algorithms
osk jwt algorithms`}</code>
      </pre>
      <p>
        Source code and documentation on{" "}
        <a href="https://github.com/offseckit/jwt">GitHub</a>.
      </p>

      <h2>Quick Reference</h2>
      <p>
        Use our <a href="/tools/jwt">JWT Decoder &amp; Analyzer</a> to
        instantly decode JWT tokens, inspect headers and payloads, check
        expiration status, and identify security weaknesses. All processing
        happens in your browser, making it safe to decode tokens from live
        engagements.
      </p>
    </>
  );
}
