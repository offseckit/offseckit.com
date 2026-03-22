/**
 * Nmap command builder logic.
 * All operations run client-side — no API routes, no external calls.
 */

// ── Types ──────────────────────────────────────────────────────────

export type ScanType =
  | "syn"
  | "connect"
  | "udp"
  | "null"
  | "fin"
  | "xmas"
  | "ack"
  | "window"
  | "maimon"
  | "idle"
  | "sctp-init"
  | "ip-protocol";

export type TimingTemplate = 0 | 1 | 2 | 3 | 4 | 5;

export type OutputFormat = "normal" | "xml" | "grepable" | "all";

export interface ScanTypeInfo {
  id: ScanType;
  flag: string;
  name: string;
  description: string;
  requiresRoot: boolean;
  noiseLevel: number; // 1-5
}

export interface TimingInfo {
  template: TimingTemplate;
  name: string;
  description: string;
  noiseLevel: number;
}

export interface NseScript {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface NseCategory {
  id: string;
  name: string;
  description: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: Partial<NmapConfig>;
}

export interface EvasionOptions {
  fragment: boolean;
  mtu: string;
  decoys: string;
  sourcePort: string;
  dataLength: string;
  ttl: string;
  spoofMac: string;
  badChecksum: boolean;
}

export interface NmapConfig {
  target: string;
  scanType: ScanType;
  portSpec: string;
  portMode: "default" | "custom" | "top" | "all" | "fast";
  topPorts: string;
  serviceVersion: boolean;
  osDetection: boolean;
  defaultScripts: boolean;
  aggressive: boolean;
  timing: TimingTemplate;
  outputFormat: OutputFormat | "";
  outputFile: string;
  verbose: boolean;
  debug: boolean;
  openOnly: boolean;
  reason: boolean;
  noPing: boolean;
  traceroute: boolean;
  ipv6: boolean;
  nseScripts: string[];
  nseCategories: string[];
  evasion: EvasionOptions;
}

// ── Data ───────────────────────────────────────────────────────────

export const SCAN_TYPES: ScanTypeInfo[] = [
  {
    id: "syn",
    flag: "-sS",
    name: "SYN Scan (Stealth)",
    description:
      "Default and most popular scan. Sends SYN packets without completing the TCP handshake, making it harder to detect. Requires root/sudo.",
    requiresRoot: true,
    noiseLevel: 2,
  },
  {
    id: "connect",
    flag: "-sT",
    name: "TCP Connect",
    description:
      "Completes the full TCP handshake. Slower and more detectable than SYN but works without root privileges. Use when SYN scan is not an option.",
    requiresRoot: false,
    noiseLevel: 3,
  },
  {
    id: "udp",
    flag: "-sU",
    name: "UDP Scan",
    description:
      "Scans UDP ports. Much slower than TCP scans because UDP is connectionless. Essential for finding services like DNS, SNMP, and DHCP.",
    requiresRoot: true,
    noiseLevel: 2,
  },
  {
    id: "null",
    flag: "-sN",
    name: "NULL Scan",
    description:
      "Sends packets with no TCP flags set. Can bypass some non-stateful firewalls and packet filters. Does not work against Windows hosts.",
    requiresRoot: true,
    noiseLevel: 1,
  },
  {
    id: "fin",
    flag: "-sF",
    name: "FIN Scan",
    description:
      "Sends packets with only the FIN flag. Can bypass some firewalls that only filter SYN packets. Does not work against Windows hosts.",
    requiresRoot: true,
    noiseLevel: 1,
  },
  {
    id: "xmas",
    flag: "-sX",
    name: "Xmas Scan",
    description:
      "Sets FIN, PSH, and URG flags, lighting the packet up like a Christmas tree. Can bypass some firewalls. Does not work against Windows hosts.",
    requiresRoot: true,
    noiseLevel: 1,
  },
  {
    id: "ack",
    flag: "-sA",
    name: "ACK Scan",
    description:
      "Sends ACK packets. Cannot determine open ports, but maps firewall rules to identify which ports are filtered vs unfiltered.",
    requiresRoot: true,
    noiseLevel: 2,
  },
  {
    id: "window",
    flag: "-sW",
    name: "Window Scan",
    description:
      "Similar to ACK scan but examines the TCP Window field to differentiate open from closed ports on some systems.",
    requiresRoot: true,
    noiseLevel: 2,
  },
  {
    id: "maimon",
    flag: "-sM",
    name: "Maimon Scan",
    description:
      "Sends FIN/ACK packets. Similar to NULL, FIN, and Xmas scans but uses a different flag combination. Named after researcher Uriel Maimon.",
    requiresRoot: true,
    noiseLevel: 1,
  },
  {
    id: "idle",
    flag: "-sI",
    name: "Idle Scan",
    description:
      "The stealthiest scan type. Uses a zombie host to scan the target without sending packets from your IP. Slow but extremely difficult to detect.",
    requiresRoot: true,
    noiseLevel: 0,
  },
  {
    id: "sctp-init",
    flag: "-sY",
    name: "SCTP INIT Scan",
    description:
      "Scans SCTP ports using INIT chunks. Similar to TCP SYN scan but for the SCTP protocol used in telecom networks.",
    requiresRoot: true,
    noiseLevel: 2,
  },
  {
    id: "ip-protocol",
    flag: "-sO",
    name: "IP Protocol Scan",
    description:
      "Determines which IP protocols (TCP, UDP, ICMP, IGMP, etc.) are supported by the target. Not a port scan.",
    requiresRoot: true,
    noiseLevel: 2,
  },
];

export const TIMING_TEMPLATES: TimingInfo[] = [
  {
    template: 0,
    name: "Paranoid",
    description:
      "Extremely slow. Sends one probe at a time with 5-minute wait. For IDS evasion during authorized engagements.",
    noiseLevel: 1,
  },
  {
    template: 1,
    name: "Sneaky",
    description:
      "Slow, 15-second wait between probes. For IDS evasion when you have time.",
    noiseLevel: 1,
  },
  {
    template: 2,
    name: "Polite",
    description:
      "Slows down to consume less bandwidth and target resources. 0.4-second wait between probes.",
    noiseLevel: 2,
  },
  {
    template: 3,
    name: "Normal",
    description:
      "Default timing. Balances speed and stealth. Suitable for most scans.",
    noiseLevel: 3,
  },
  {
    template: 4,
    name: "Aggressive",
    description:
      "Faster scanning. Assumes a reliable, fast network. Good for internal network pentests.",
    noiseLevel: 4,
  },
  {
    template: 5,
    name: "Insane",
    description:
      "Fastest possible. Sacrifices accuracy for speed. May overwhelm slow networks or miss open ports.",
    noiseLevel: 5,
  },
];

export const NSE_CATEGORIES: NseCategory[] = [
  { id: "default", name: "Default", description: "Safe scripts run by -sC. General-purpose discovery and enumeration." },
  { id: "safe", name: "Safe", description: "Scripts that are safe to run against production targets without causing disruption." },
  { id: "vuln", name: "Vuln", description: "Check for specific known vulnerabilities like Heartbleed, EternalBlue, etc." },
  { id: "discovery", name: "Discovery", description: "Discover additional information about the target (DNS, SNMP, LDAP, etc.)." },
  { id: "auth", name: "Auth", description: "Test for authentication vulnerabilities and enumerate credentials." },
  { id: "brute", name: "Brute", description: "Brute-force authentication for various services (SSH, FTP, HTTP, etc.)." },
  { id: "exploit", name: "Exploit", description: "Attempt to exploit known vulnerabilities. Use with caution." },
  { id: "intrusive", name: "Intrusive", description: "Scripts that may crash the target, consume resources, or are otherwise risky." },
  { id: "broadcast", name: "Broadcast", description: "Discover hosts on the local network via broadcast requests." },
  { id: "malware", name: "Malware", description: "Check for signs of malware infection on the target." },
];

export const POPULAR_SCRIPTS: NseScript[] = [
  { id: "http-title", name: "http-title", description: "Show the title of web pages on open HTTP ports", category: "discovery" },
  { id: "ssl-heartbleed", name: "ssl-heartbleed", description: "Detect the OpenSSL Heartbleed vulnerability (CVE-2014-0160)", category: "vuln" },
  { id: "smb-os-discovery", name: "smb-os-discovery", description: "Determine OS, computer name, and domain via SMB", category: "discovery" },
  { id: "smb-vuln-ms17-010", name: "smb-vuln-ms17-010", description: "Check for EternalBlue/MS17-010 vulnerability", category: "vuln" },
  { id: "http-enum", name: "http-enum", description: "Enumerate common web directories and files", category: "discovery" },
  { id: "dns-brute", name: "dns-brute", description: "Brute-force DNS subdomain enumeration", category: "discovery" },
  { id: "ftp-anon", name: "ftp-anon", description: "Check if FTP server allows anonymous login", category: "auth" },
  { id: "ssh-brute", name: "ssh-brute", description: "Brute-force SSH login credentials", category: "brute" },
  { id: "http-vuln-cve2017-5638", name: "http-vuln-cve2017-5638", description: "Check for Apache Struts2 RCE (CVE-2017-5638)", category: "vuln" },
  { id: "ssl-enum-ciphers", name: "ssl-enum-ciphers", description: "Enumerate SSL/TLS cipher suites and protocols", category: "discovery" },
  { id: "vuln", name: "vuln", description: "Run all vulnerability detection scripts", category: "vuln" },
  { id: "http-methods", name: "http-methods", description: "Enumerate allowed HTTP methods (GET, POST, PUT, DELETE, etc.)", category: "discovery" },
  { id: "smb-enum-shares", name: "smb-enum-shares", description: "Enumerate SMB shares and their permissions", category: "discovery" },
  { id: "banner", name: "banner", description: "Grab service banners from open ports", category: "discovery" },
  { id: "http-robots.txt", name: "http-robots.txt", description: "Retrieve and display robots.txt entries", category: "discovery" },
  { id: "mysql-empty-password", name: "mysql-empty-password", description: "Check for MySQL with empty root password", category: "auth" },
  { id: "http-sql-injection", name: "http-sql-injection", description: "Crawl web pages looking for SQL injection vulnerabilities", category: "vuln" },
  { id: "http-shellshock", name: "http-shellshock", description: "Check for Shellshock vulnerability in CGI scripts", category: "vuln" },
];

export const PRESETS: Preset[] = [
  {
    id: "quick-recon",
    name: "Quick Recon",
    description: "Fast initial reconnaissance. Top 100 ports with service version detection.",
    config: {
      scanType: "syn",
      portMode: "fast",
      serviceVersion: true,
      osDetection: false,
      defaultScripts: false,
      timing: 4,
      openOnly: true,
    },
  },
  {
    id: "full-port",
    name: "Full Port Scan",
    description: "Scan all 65535 TCP ports. Good for thorough enumeration after initial recon.",
    config: {
      scanType: "syn",
      portMode: "all",
      serviceVersion: true,
      osDetection: false,
      defaultScripts: false,
      timing: 4,
      openOnly: true,
    },
  },
  {
    id: "stealth",
    name: "Stealth Scan",
    description: "Low-noise scan for environments with IDS/IPS. Slow but harder to detect.",
    config: {
      scanType: "syn",
      portMode: "default",
      serviceVersion: false,
      osDetection: false,
      defaultScripts: false,
      timing: 2,
      openOnly: true,
    },
  },
  {
    id: "vuln-scan",
    name: "Vulnerability Scan",
    description: "Run vulnerability detection scripts against discovered services.",
    config: {
      scanType: "syn",
      portMode: "default",
      serviceVersion: true,
      osDetection: true,
      defaultScripts: true,
      timing: 4,
      nseCategories: ["vuln"],
      openOnly: true,
    },
  },
  {
    id: "aggressive",
    name: "Aggressive Scan",
    description: "Maximum information gathering. OS detection, version detection, scripts, and traceroute.",
    config: {
      scanType: "syn",
      portMode: "default",
      serviceVersion: false,
      osDetection: false,
      aggressive: true,
      defaultScripts: false,
      timing: 4,
    },
  },
  {
    id: "udp-scan",
    name: "UDP Scan",
    description: "Scan top UDP ports for services like DNS, SNMP, NTP, and DHCP.",
    config: {
      scanType: "udp",
      portMode: "top",
      topPorts: "100",
      serviceVersion: true,
      osDetection: false,
      defaultScripts: false,
      timing: 4,
      openOnly: true,
    },
  },
];

// ── Default config ─────────────────────────────────────────────────

export function getDefaultConfig(): NmapConfig {
  return {
    target: "",
    scanType: "syn",
    portSpec: "",
    portMode: "default",
    topPorts: "100",
    serviceVersion: false,
    osDetection: false,
    defaultScripts: false,
    aggressive: false,
    timing: 3,
    outputFormat: "",
    outputFile: "scan_results",
    verbose: false,
    debug: false,
    openOnly: false,
    reason: false,
    noPing: false,
    traceroute: false,
    ipv6: false,
    nseScripts: [],
    nseCategories: [],
    evasion: {
      fragment: false,
      mtu: "",
      decoys: "",
      sourcePort: "",
      dataLength: "",
      ttl: "",
      spoofMac: "",
      badChecksum: false,
    },
  };
}

// ── Command builder ────────────────────────────────────────────────

export function buildCommand(config: NmapConfig): string {
  const parts: string[] = ["nmap"];

  // Scan type (skip if aggressive mode handles it)
  if (!config.aggressive) {
    const scanInfo = SCAN_TYPES.find((s) => s.id === config.scanType);
    if (scanInfo && config.scanType !== "syn") {
      // -sS is default for root, only include non-default
      parts.push(scanInfo.flag);
    } else if (config.scanType === "syn") {
      parts.push("-sS");
    }
  }

  // Port specification
  switch (config.portMode) {
    case "custom":
      if (config.portSpec.trim()) {
        parts.push("-p", config.portSpec.trim());
      }
      break;
    case "top":
      if (config.topPorts.trim()) {
        parts.push("--top-ports", config.topPorts.trim());
      }
      break;
    case "all":
      parts.push("-p-");
      break;
    case "fast":
      parts.push("-F");
      break;
    // "default" = nmap default (top 1000), no flag needed
  }

  // Aggressive mode (-A covers -sV, -O, -sC, --traceroute)
  if (config.aggressive) {
    parts.push("-A");
  } else {
    if (config.serviceVersion) parts.push("-sV");
    if (config.osDetection) parts.push("-O");
    if (config.defaultScripts) parts.push("-sC");
    if (config.traceroute) parts.push("--traceroute");
  }

  // NSE scripts
  const scriptParts: string[] = [];
  if (config.nseCategories.length > 0) {
    scriptParts.push(...config.nseCategories);
  }
  if (config.nseScripts.length > 0) {
    scriptParts.push(...config.nseScripts);
  }
  if (scriptParts.length > 0) {
    parts.push("--script", scriptParts.join(","));
  }

  // Timing
  if (config.timing !== 3) {
    parts.push(`-T${config.timing}`);
  }

  // Host discovery
  if (config.noPing) parts.push("-Pn");

  // IPv6
  if (config.ipv6) parts.push("-6");

  // Output
  if (config.openOnly) parts.push("--open");
  if (config.verbose) parts.push("-v");
  if (config.debug) parts.push("-d");
  if (config.reason) parts.push("--reason");

  // Evasion
  const ev = config.evasion;
  if (ev.fragment) {
    if (ev.mtu.trim()) {
      parts.push("--mtu", ev.mtu.trim());
    } else {
      parts.push("-f");
    }
  }
  if (ev.decoys.trim()) parts.push("-D", ev.decoys.trim());
  if (ev.sourcePort.trim()) parts.push("--source-port", ev.sourcePort.trim());
  if (ev.dataLength.trim()) parts.push("--data-length", ev.dataLength.trim());
  if (ev.ttl.trim()) parts.push("--ttl", ev.ttl.trim());
  if (ev.spoofMac.trim()) parts.push("--spoof-mac", ev.spoofMac.trim());
  if (ev.badChecksum) parts.push("--badsum");

  // Output format
  if (config.outputFormat && config.outputFile.trim()) {
    const fname = config.outputFile.trim();
    switch (config.outputFormat) {
      case "normal":
        parts.push("-oN", fname);
        break;
      case "xml":
        parts.push("-oX", `${fname}.xml`);
        break;
      case "grepable":
        parts.push("-oG", fname);
        break;
      case "all":
        parts.push("-oA", fname);
        break;
    }
  }

  // Target (always last)
  if (config.target.trim()) {
    parts.push(config.target.trim());
  } else {
    parts.push("<target>");
  }

  return parts.join(" ");
}

// ── Noise level calculator ─────────────────────────────────────────

export function calculateNoiseLevel(config: NmapConfig): number {
  let noise = 0;

  // Base noise from scan type
  const scanInfo = SCAN_TYPES.find((s) => s.id === config.scanType);
  if (scanInfo) noise += scanInfo.noiseLevel;

  // Timing adds noise
  const timingInfo = TIMING_TEMPLATES.find((t) => t.template === config.timing);
  if (timingInfo) noise += timingInfo.noiseLevel;

  // Feature flags
  if (config.serviceVersion) noise += 1;
  if (config.osDetection) noise += 1;
  if (config.defaultScripts) noise += 1;
  if (config.aggressive) noise += 2;
  if (config.traceroute) noise += 1;

  // Port range
  if (config.portMode === "all") noise += 2;
  else if (config.portMode === "fast") noise += 0;

  // NSE scripts add noise
  if (config.nseCategories.includes("brute")) noise += 3;
  if (config.nseCategories.includes("exploit")) noise += 3;
  if (config.nseCategories.includes("intrusive")) noise += 3;
  if (config.nseCategories.includes("vuln")) noise += 1;

  // Evasion reduces noise
  const ev = config.evasion;
  if (ev.fragment) noise -= 1;
  if (ev.decoys.trim()) noise -= 1;
  if (ev.badChecksum) noise -= 1;

  // Clamp to 1-5 range
  return Math.max(1, Math.min(5, Math.round(noise / 3)));
}
