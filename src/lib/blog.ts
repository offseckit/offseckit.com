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
  {
    slug: "security-headers-guide",
    title: "HTTP Security Headers Cheat Sheet 2026 — HSTS, CSP, X-Frame-Options, and More",
    description:
      "Complete guide to HTTP security headers for pentesters and developers. Covers HSTS, Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy, OWASP recommendations, deprecated headers, and remediation guidance.",
    date: "2026-03-22",
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
    ],
    relatedTool: "headers",
  },
  {
    slug: "cvss-calculator-guide",
    title: "CVSS Calculator Cheat Sheet 2026 — CVSS 3.1 vs 4.0 Scoring Guide for Pentesters",
    description:
      "Complete guide to CVSS vulnerability scoring for pentesters and security analysts. Covers CVSS 3.1 and 4.0 differences, base/temporal/environmental metrics, score calculation, common vulnerability scores, and practical tips for writing pentest reports.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "CVSS calculator",
      "CVSS 3.1 vs 4.0",
      "CVSS scoring guide",
      "vulnerability scoring",
      "CVSS cheat sheet",
      "CVSS base score",
      "pentest report scoring",
    ],
    relatedTool: "cvss",
  },
  {
    slug: "subnet-calculator-guide",
    title: "Subnet Calculator Cheat Sheet 2026 — CIDR Notation, Subnet Masks, and IP Ranges for Pentesters",
    description:
      "Complete guide to subnetting for pentesters and network engineers. Covers CIDR notation, subnet masks, wildcard masks, subnet splitting, RFC 1918 private ranges, and practical tips for scope verification and network enumeration.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "subnet calculator",
      "CIDR cheat sheet",
      "subnet mask chart",
      "CIDR notation guide",
      "IP subnetting",
      "wildcard mask",
      "pentest subnet",
    ],
    relatedTool: "subnet",
  },
  {
    slug: "cli-output-formatter-guide",
    title: "Terminal Screenshot Guide 2026 — Generate Beautiful CLI Output Images for Pentest Reports",
    description:
      "Complete guide to generating professional terminal screenshots for pentest reports, documentation, and blog posts. Covers ANSI color codes, terminal themes, export options, and tips for making security tool output look great.",
    date: "2026-03-22",
    author: "4252nez",
    keywords: [
      "terminal screenshot generator",
      "CLI output formatter",
      "terminal to image",
      "ANSI color codes",
      "pentest report screenshots",
      "terminal beautifier",
      "code screenshot tool",
    ],
    relatedTool: "cli-format",
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
