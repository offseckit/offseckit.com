export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  keywords: string[];
  relatedTool?: string;
}

export const posts: BlogPost[] = [
  {
    slug: "reverse-shell-cheat-sheet",
    title: "Reverse Shell Cheat Sheet 2026 — One-Liners for Every Language",
    description:
      "Complete reverse shell cheat sheet with one-liners in Bash, Python, PowerShell, PHP, Ruby, Perl, Netcat, and more. Copy-paste ready for your next pentest.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "reverse shell cheat sheet",
      "reverse shell one liner",
      "bash reverse shell",
      "python reverse shell",
    ],
    relatedTool: "revshell",
  },
  {
    slug: "encoding-decoding-pentest-guide",
    title: "Encoding & Decoding for Pentesters — Base64, URL, Hex, and Beyond",
    description:
      "Practical guide to encoding and decoding techniques used in penetration testing. Covers Base64, URL encoding, Hex, HTML entities, Unicode, and chaining techniques for WAF bypass.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "base64 decode",
      "base64 encode",
      "url encoding pentest",
      "hex encoding",
      "waf bypass encoding",
      "encoding cheat sheet",
    ],
    relatedTool: "encode",
  },
  {
    slug: "hash-identifier-guide",
    title: "Hash Identifier Cheat Sheet 2026 — MD5, SHA, NTLM, and More",
    description:
      "Complete guide to identifying hash types by length and format. Covers MD5, SHA-1, SHA-256, SHA-512, NTLM, SHA-3, and more with examples, hashcat modes, and practical tips for pentesters.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "hash identifier",
      "what hash is this",
      "identify hash type",
      "MD5 hash",
      "NTLM hash",
      "hash cheat sheet",
    ],
    relatedTool: "hash",
  },
  {
    slug: "jwt-decoder-guide",
    title: "JWT Decoder Cheat Sheet 2026 — Decode, Analyze, and Exploit JSON Web Tokens",
    description:
      "Complete guide to decoding and analyzing JWT tokens for pentesters. Covers JWT structure, common vulnerabilities (alg:none, algorithm confusion), security analysis, and practical exploitation tips.",
    date: "2026-03-22",
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
    ],
    relatedTool: "jwt",
  },
  {
    slug: "nmap-cheat-sheet",
    title: "Nmap Cheat Sheet 2026 — Commands, Scan Types, Flags, and NSE Scripts",
    description:
      "Complete nmap cheat sheet for pentesters. Covers scan types, port specification, service detection, NSE scripts, timing templates, firewall evasion, and output options with copy-paste ready examples.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "nmap cheat sheet",
      "nmap commands",
      "nmap scan types",
      "nmap flags",
      "nmap NSE scripts",
      "nmap port scan",
      "nmap tutorial",
      "nmap pentest",
    ],
    relatedTool: "nmap",
  },
  {
    slug: "xss-payload-cheat-sheet",
    title: "XSS Payload Cheat Sheet 2026 — Context-Aware Payloads, WAF Bypass, and Filter Evasion",
    description:
      "Complete XSS payload cheat sheet for pentesters and bug bounty hunters. Covers injection contexts, WAF bypass techniques, encoding tricks, polyglot payloads, and filter evasion with copy-paste ready examples.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "XSS cheat sheet",
      "XSS payloads",
      "cross site scripting payloads",
      "XSS payload list",
      "XSS filter bypass",
      "XSS WAF bypass",
      "XSS encoding",
      "XSS polyglot",
      "XSS pentest",
    ],
    relatedTool: "xss",
  },
];

export function getSortedPosts(): BlogPost[] {
  return [...posts].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    // Same date: reverse insertion order (newest added last in array → show first)
    return posts.indexOf(b) - posts.indexOf(a);
  });
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
