export type ToolStatus = "live" | "coming-soon";

export type ToolCategory =
  | "exploitation"
  | "recon"
  | "encoding"
  | "analysis"
  | "utility";

export interface Tool {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  icon: string;
  keywords: string[];
}

export const tools: Tool[] = [
  {
    slug: "revshell",
    name: "Reverse Shell Generator",
    shortName: "RevShell",
    description:
      "Generate reverse shell one-liners in multiple languages with encoding and obfuscation options.",
    category: "exploitation",
    status: "live",
    icon: "terminal",
    keywords: [
      "reverse shell cheat sheet",
      "reverse shell generator",
      "reverse shell one liner",
    ],
  },
  {
    slug: "encode",
    name: "Encoding/Decoding Multi-Tool",
    shortName: "Encoder",
    description:
      "Encode and decode Base64, URL, Hex, HTML entities, and more. Chain multiple operations together.",
    category: "encoding",
    status: "live",
    icon: "shuffle",
    keywords: ["base64 decode", "URL encoder", "hex to text"],
  },
  {
    slug: "hash",
    name: "Hash Identifier & Generator",
    shortName: "Hash ID",
    description:
      "Identify unknown hash types and generate hashes in MD5, SHA1, SHA256, SHA512, NTLM, and more.",
    category: "analysis",
    status: "live",
    icon: "fingerprint",
    keywords: ["hash identifier", "hash generator online", "what hash is this", "hash type identifier", "MD5 hash generator", "SHA256 hash generator"],
  },
  {
    slug: "jwt",
    name: "JWT Decoder & Analyzer",
    shortName: "JWT",
    description:
      "Decode JWT tokens, inspect headers and payloads, check expiration, and identify weak algorithms.",
    category: "analysis",
    status: "live",
    icon: "key",
    keywords: ["JWT decoder", "decode JWT token online", "JWT token decoder", "JWT analyzer", "JWT debugger", "JSON web token decoder"],
  },
  {
    slug: "nmap",
    name: "Nmap Command Builder",
    shortName: "Nmap",
    description:
      "Visual builder for nmap commands. Select scan types, flags, and scripts with explanations.",
    category: "recon",
    status: "live",
    icon: "radar",
    keywords: ["nmap cheat sheet", "nmap commands", "nmap command generator", "nmap scan types", "nmap flags", "nmap scripts", "nmap tutorial"],
  },
  {
    slug: "xss",
    name: "XSS Payload Generator",
    shortName: "XSS",
    description:
      "Context-aware XSS payload generation with WAF bypass variants and filter evasion techniques.",
    category: "exploitation",
    status: "live",
    icon: "code",
    keywords: [
      "XSS payloads",
      "XSS cheat sheet",
      "cross site scripting payloads",
      "XSS payload generator",
      "XSS filter bypass",
      "XSS WAF bypass",
    ],
  },
  {
    slug: "headers",
    name: "HTTP Header Security Analyzer",
    shortName: "Headers",
    description:
      "Analyze HTTP response headers for security misconfigurations with remediation guidance.",
    category: "analysis",
    status: "live",
    icon: "shield",
    keywords: ["security headers check", "HTTP security headers analyzer", "security headers scanner", "HTTP header checker", "content security policy", "HSTS checker"],
  },
  {
    slug: "cvss",
    name: "CVSS Calculator",
    shortName: "CVSS",
    description:
      "Interactive CVSS 3.1 and 4.0 vector builder with real-time score calculation.",
    category: "analysis",
    status: "live",
    icon: "gauge",
    keywords: ["CVSS calculator", "CVSS 3.1 calculator", "CVSS 4.0 calculator", "CVSS score calculator", "vulnerability scoring", "CVSS vector builder"],
  },
  {
    slug: "subnet",
    name: "Subnet/CIDR Calculator",
    shortName: "Subnet",
    description:
      "Calculate network addresses, broadcast addresses, host ranges, and split subnets from CIDR notation.",
    category: "recon",
    status: "coming-soon",
    icon: "network",
    keywords: ["subnet calculator", "CIDR calculator", "IP range calculator"],
  },
  {
    slug: "cli-format",
    name: "CLI Output Formatter",
    shortName: "CLI Fmt",
    description:
      "Paste terminal output from security tools and generate styled, Dracula-themed screenshots.",
    category: "utility",
    status: "coming-soon",
    icon: "image",
    keywords: [
      "terminal screenshot generator",
      "command output formatter",
    ],
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getLiveTools(): Tool[] {
  return tools.filter((t) => t.status === "live");
}

export function getRelatedTools(slug: string, limit = 3): Tool[] {
  const tool = getToolBySlug(slug);
  if (!tool) return [];
  return tools
    .filter((t) => t.slug !== slug)
    .sort((a, b) => {
      if (a.category === tool.category && b.category !== tool.category)
        return -1;
      if (b.category === tool.category && a.category !== tool.category) return 1;
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return 0;
    })
    .slice(0, limit);
}

export const categoryLabels: Record<ToolCategory, string> = {
  exploitation: "Exploitation",
  recon: "Reconnaissance",
  encoding: "Encoding & Decoding",
  analysis: "Analysis",
  utility: "Utility",
};
