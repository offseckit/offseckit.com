import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import JWTTool from "./JWTTool";

const tool = getToolBySlug("jwt")!;

export const metadata: Metadata = {
  title: "JWT Decoder & Analyzer - Decode JWT Tokens Online | OffSecKit",
  description:
    "Decode and analyze JWT tokens instantly. Inspect headers, payloads, check expiration, identify weak algorithms, and detect security issues. Free, 100% client-side.",
  keywords: [
    "JWT decoder",
    "decode JWT token online",
    "JWT token decoder",
    "JWT analyzer",
    "JWT debugger",
    "JSON web token decoder",
    "JWT security analyzer",
    "JWT expiration check",
    "JWT header decoder",
    "JWT payload viewer",
    "JWT alg none",
    "JWT token inspector",
    "decode JWT online free",
    "JWT claims viewer",
  ],
  openGraph: {
    title: "JWT Decoder & Analyzer - Free Online | OffSecKit",
    description:
      "Decode JWT tokens, inspect headers and payloads, check expiration, and identify weak algorithms. 100% client-side.",
    url: "https://offseckit.com/tools/jwt",
  },
};

const faq = [
  {
    question: "What is a JWT (JSON Web Token)?",
    answer:
      "A JSON Web Token (JWT) is a compact, URL-safe token format defined in RFC 7519. It consists of three Base64URL-encoded parts separated by dots: a header (specifying the algorithm), a payload (containing claims about the user or session), and a signature (for verifying the token's integrity). JWTs are widely used for authentication and authorization in web applications and APIs.",
  },
  {
    question: "How does JWT decoding work?",
    answer:
      "JWT decoding splits the token at the two dot separators, then Base64URL-decodes the first two parts (header and payload) to reveal the JSON data inside. The third part is the cryptographic signature. Decoding only reveals the data — it does not verify the signature. Anyone can decode a JWT; verification requires the signing key.",
  },
  {
    question: "Is my JWT token sent to any server?",
    answer:
      "No. All decoding and analysis runs 100% in your browser using JavaScript. No data is transmitted to any server. This makes it safe to decode tokens containing sensitive claims, session data, or credentials during penetration testing engagements.",
  },
  {
    question: "What security issues does the analyzer detect?",
    answer:
      'The security analyzer checks for: the "none" algorithm vulnerability (CVE-2015-9235), empty signatures with signed algorithms, missing expiration claims, excessively long token lifetimes (>30 days), missing issuer and audience claims, tokens issued in the future (clock skew), and privilege-related claims (admin, role, scope) that could be targets for escalation.',
  },
  {
    question: 'What is the JWT "alg: none" vulnerability?',
    answer:
      'The "alg: none" vulnerability occurs when a server accepts JWT tokens with the algorithm set to "none", effectively treating them as valid without any signature verification. An attacker can modify the payload (e.g., change user roles or IDs) and strip the signature. This was a widespread vulnerability in early JWT library implementations (CVE-2015-9235).',
  },
  {
    question: "What is the difference between HS256 and RS256?",
    answer:
      "HS256 (HMAC-SHA256) is a symmetric algorithm — the same secret key is used to both sign and verify the token. RS256 (RSA-SHA256) is asymmetric — a private key signs the token and a separate public key verifies it. RS256 is generally preferred in distributed systems because the verification key can be shared publicly without compromising signing capability.",
  },
];

export default function JWTPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/jwt">
      <JWTTool />
    </ToolLayout>
  );
}
