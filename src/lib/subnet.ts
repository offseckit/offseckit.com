/**
 * Subnet/CIDR calculator logic.
 *
 * All calculations are IPv4 only. Uses pure bitwise math —
 * no external dependencies.
 */

// ── Types ─────────────────────────────────────────────────────────

export interface SubnetResult {
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
  prefix: number;
  ipClass: string;
  networkBinary: string;
  maskBinary: string;
  isPrivate: boolean;
}

export interface SubnetSplit {
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  usableHosts: number;
}

export interface CidrRefEntry {
  prefix: number;
  mask: string;
  wildcard: string;
  totalAddresses: number;
  usableHosts: number;
}

// ── Core Calculations ─────────────────────────────────────────────

/**
 * Parse an IPv4 address string to a 32-bit unsigned integer.
 */
export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255 || part !== String(n)) return null;
    result = (result * 256 + n) >>> 0;
  }
  return result;
}

/**
 * Convert a 32-bit unsigned integer to dotted-decimal string.
 */
export function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

/**
 * Convert a 32-bit integer to a dotted binary string (4 octets separated by dots).
 */
export function intToBinary(n: number): string {
  return [
    ((n >>> 24) & 0xff).toString(2).padStart(8, "0"),
    ((n >>> 16) & 0xff).toString(2).padStart(8, "0"),
    ((n >>> 8) & 0xff).toString(2).padStart(8, "0"),
    (n & 0xff).toString(2).padStart(8, "0"),
  ].join(".");
}

/**
 * Build a subnet mask from a prefix length (0-32).
 */
export function prefixToMask(prefix: number): number {
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

/**
 * Determine the classful IP class for a given IP integer.
 */
export function getIpClass(ip: number): string {
  const firstOctet = (ip >>> 24) & 0xff;
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (Multicast)";
  return "E (Reserved)";
}

/**
 * Check if an IP address falls within private ranges (RFC 1918 + loopback + link-local).
 */
export function isPrivateIp(ip: number): boolean {
  const first = (ip >>> 24) & 0xff;
  const second = (ip >>> 16) & 0xff;
  // 10.0.0.0/8
  if (first === 10) return true;
  // 172.16.0.0/12
  if (first === 172 && second >= 16 && second <= 31) return true;
  // 192.168.0.0/16
  if (first === 192 && second === 168) return true;
  // 127.0.0.0/8
  if (first === 127) return true;
  // 169.254.0.0/16
  if (first === 169 && second === 254) return true;
  return false;
}

/**
 * Parse a CIDR string (e.g. "192.168.1.0/24") and return full subnet info.
 * Returns null on invalid input.
 */
export function calculateSubnet(input: string): SubnetResult | null {
  const trimmed = input.trim();

  // Support "ip/prefix" or "ip mask" formats
  let ipStr: string;
  let prefix: number;

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length !== 2) return null;
    ipStr = parts[0];
    prefix = parseInt(parts[1], 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
  } else {
    // Try plain IP — assume /32
    ipStr = trimmed;
    prefix = 32;
  }

  const ipInt = ipToInt(ipStr);
  if (ipInt === null) return null;

  const mask = prefixToMask(prefix);
  const wildcard = (~mask) >>> 0;
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalAddresses = Math.pow(2, 32 - prefix);

  let firstHost: number;
  let lastHost: number;
  let usableHosts: number;

  if (prefix === 32) {
    firstHost = network;
    lastHost = network;
    usableHosts = 1;
  } else if (prefix === 31) {
    // Point-to-point link (RFC 3021)
    firstHost = network;
    lastHost = broadcast;
    usableHosts = 2;
  } else {
    firstHost = (network + 1) >>> 0;
    lastHost = (broadcast - 1) >>> 0;
    usableHosts = totalAddresses - 2;
  }

  return {
    cidr: `${intToIp(network)}/${prefix}`,
    networkAddress: intToIp(network),
    broadcastAddress: intToIp(broadcast),
    subnetMask: intToIp(mask),
    wildcardMask: intToIp(wildcard),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    totalAddresses,
    usableHosts: Math.max(0, usableHosts),
    prefix,
    ipClass: getIpClass(network),
    networkBinary: intToBinary(network),
    maskBinary: intToBinary(mask),
    isPrivate: isPrivateIp(network),
  };
}

/**
 * Split a CIDR network into N equal subnets.
 * N must be a power of 2 and the resulting prefix must be <= 32.
 */
export function splitSubnet(cidr: string, count: number): SubnetSplit[] | null {
  const result = calculateSubnet(cidr);
  if (!result) return null;

  // count must be power of 2
  if (count < 2 || (count & (count - 1)) !== 0) return null;

  const bitsNeeded = Math.log2(count);
  const newPrefix = result.prefix + bitsNeeded;
  if (newPrefix > 32) return null;

  const network = ipToInt(result.networkAddress)!;
  const subnetSize = Math.pow(2, 32 - newPrefix);
  const subnets: SubnetSplit[] = [];

  for (let i = 0; i < count; i++) {
    const subNet = (network + i * subnetSize) >>> 0;
    const subBroadcast = (subNet + subnetSize - 1) >>> 0;

    let firstHost: number;
    let lastHost: number;
    let usableHosts: number;

    if (newPrefix === 32) {
      firstHost = subNet;
      lastHost = subNet;
      usableHosts = 1;
    } else if (newPrefix === 31) {
      firstHost = subNet;
      lastHost = subBroadcast;
      usableHosts = 2;
    } else {
      firstHost = (subNet + 1) >>> 0;
      lastHost = (subBroadcast - 1) >>> 0;
      usableHosts = subnetSize - 2;
    }

    subnets.push({
      cidr: `${intToIp(subNet)}/${newPrefix}`,
      networkAddress: intToIp(subNet),
      broadcastAddress: intToIp(subBroadcast),
      firstHost: intToIp(firstHost),
      lastHost: intToIp(lastHost),
      usableHosts: Math.max(0, usableHosts),
    });
  }

  return subnets;
}

/**
 * Check if an IP address is contained within a CIDR range.
 */
export function containsIp(cidr: string, ip: string): boolean | null {
  const result = calculateSubnet(cidr);
  if (!result) return null;

  const ipInt = ipToInt(ip);
  if (ipInt === null) return null;

  const networkInt = ipToInt(result.networkAddress)!;
  const broadcastInt = ipToInt(result.broadcastAddress)!;

  return ipInt >= networkInt && ipInt <= broadcastInt;
}

// ── CIDR Reference Table ──────────────────────────────────────────

export function buildCidrReference(): CidrRefEntry[] {
  const entries: CidrRefEntry[] = [];
  for (let prefix = 0; prefix <= 32; prefix++) {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const total = Math.pow(2, 32 - prefix);
    const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : total - 2;

    entries.push({
      prefix,
      mask: intToIp(mask),
      wildcard: intToIp(wildcard),
      totalAddresses: total,
      usableHosts: Math.max(0, usable),
    });
  }
  return entries;
}

// ── Common Network Presets ────────────────────────────────────────

export const COMMON_PRESETS = [
  { cidr: "10.0.0.0/8", label: "Class A Private", description: "10.0.0.0 - 10.255.255.255" },
  { cidr: "172.16.0.0/12", label: "Class B Private", description: "172.16.0.0 - 172.31.255.255" },
  { cidr: "192.168.0.0/16", label: "Class C Private", description: "192.168.0.0 - 192.168.255.255" },
  { cidr: "192.168.1.0/24", label: "Common LAN", description: "256 addresses, 254 usable" },
  { cidr: "10.10.10.0/24", label: "CTF/Lab Range", description: "Common in CTF challenges" },
  { cidr: "192.168.1.0/25", label: "Half /24", description: "128 addresses, 126 usable" },
  { cidr: "192.168.1.0/26", label: "Quarter /24", description: "64 addresses, 62 usable" },
  { cidr: "192.168.1.0/27", label: "Small Subnet", description: "32 addresses, 30 usable" },
  { cidr: "192.168.1.0/28", label: "Mini Subnet", description: "16 addresses, 14 usable" },
  { cidr: "192.168.1.0/30", label: "Point-to-Point", description: "4 addresses, 2 usable" },
];

/**
 * Format a large number with commas (e.g. 16777216 -> "16,777,216").
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
