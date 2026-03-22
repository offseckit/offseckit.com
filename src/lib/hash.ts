/**
 * Hash identification and generation logic.
 * All operations run client-side using the Web Crypto API and pure JS fallbacks.
 */

export interface HashType {
  id: string;
  name: string;
  length: number; // hex character length
  prefix?: string;
  description: string;
  example: string;
}

export const HASH_TYPES: HashType[] = [
  {
    id: "md5",
    name: "MD5",
    length: 32,
    description: "128-bit hash, widely used but cryptographically broken",
    example: "5d41402abc4b2a76b9719d911017c592",
  },
  {
    id: "sha1",
    name: "SHA-1",
    length: 40,
    description: "160-bit hash, deprecated for security use",
    example: "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
  },
  {
    id: "sha256",
    name: "SHA-256",
    length: 64,
    description: "256-bit hash from the SHA-2 family",
    example: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  },
  {
    id: "sha384",
    name: "SHA-384",
    length: 96,
    description: "384-bit hash from the SHA-2 family",
    example: "59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f",
  },
  {
    id: "sha512",
    name: "SHA-512",
    length: 128,
    description: "512-bit hash from the SHA-2 family",
    example: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043",
  },
  {
    id: "ntlm",
    name: "NTLM",
    length: 32,
    description: "Windows NT LAN Manager hash (MD4 of UTF-16LE input)",
    example: "a4f49c406510bdcab6824ee7c30fd852",
  },
  {
    id: "sha3-256",
    name: "SHA3-256",
    length: 64,
    description: "256-bit hash from the SHA-3 (Keccak) family",
    example: "3338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392",
  },
  {
    id: "sha3-512",
    name: "SHA3-512",
    length: 128,
    description: "512-bit hash from the SHA-3 (Keccak) family",
    example: "840006653e9ac9e95117a15c915caab81662918e925de9e004f774ff82d7079a40d4d27b1b372657c61d46d470304c88c788b3a4527ad074d1dccbee5dbaa99a",
  },
];

/** Patterns for hash identification */
export interface HashMatch {
  type: HashType;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Identify a hash string by its format, length, and character set.
 */
export function identifyHash(input: string): HashMatch[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const matches: HashMatch[] = [];

  // Check for common prefixed formats
  // $NT$ or similar NTLM prefixes
  if (/^\$NT\$/i.test(trimmed)) {
    const hashPart = trimmed.slice(4);
    if (/^[a-f0-9]{32}$/i.test(hashPart)) {
      const ntlm = HASH_TYPES.find((h) => h.id === "ntlm")!;
      matches.push({
        type: ntlm,
        confidence: "high",
        reason: "32 hex chars with $NT$ prefix",
      });
      return matches;
    }
  }

  // Strip common prefixes for analysis
  let clean = trimmed;
  if (clean.startsWith("0x") || clean.startsWith("0X")) {
    clean = clean.slice(2);
  }

  // Must be valid hex
  if (!/^[a-f0-9]+$/i.test(clean)) {
    // Check for Base64-encoded hashes (common in some formats)
    if (/^[A-Za-z0-9+/]+=*$/.test(trimmed) && trimmed.length >= 24) {
      try {
        const decoded = atob(trimmed);
        const hexLen = decoded.length * 2;
        const possibleTypes = HASH_TYPES.filter((h) => h.length === hexLen);
        for (const t of possibleTypes) {
          matches.push({
            type: t,
            confidence: "low",
            reason: `Possible Base64-encoded ${t.name} (${decoded.length} bytes decoded)`,
          });
        }
      } catch {
        // not valid base64
      }
    }
    return matches;
  }

  const hexLen = clean.length;

  // Match by length
  for (const hashType of HASH_TYPES) {
    if (hashType.length === hexLen) {
      let confidence: "high" | "medium" | "low" = "medium";
      let reason = `${hexLen} hex characters`;

      // Higher confidence for unique lengths
      const sameLength = HASH_TYPES.filter((h) => h.length === hexLen);
      if (sameLength.length === 1) {
        confidence = "high";
        reason = `${hexLen} hex characters (unique length for ${hashType.name})`;
      } else if (hexLen === 32) {
        // MD5 vs NTLM — both are 32 chars
        // NTLM is more common in Windows environments
        reason = `${hexLen} hex characters — could be ${sameLength.map((h) => h.name).join(" or ")}`;
      } else if (hexLen === 64) {
        // SHA-256 vs SHA3-256
        reason = `${hexLen} hex characters — could be ${sameLength.map((h) => h.name).join(" or ")}`;
      } else if (hexLen === 128) {
        // SHA-512 vs SHA3-512
        reason = `${hexLen} hex characters — could be ${sameLength.map((h) => h.name).join(" or ")}`;
      }

      matches.push({ type: hashType, confidence, reason });
    }
  }

  return matches;
}

/**
 * MD4 implementation for NTLM hash generation.
 * NTLM = MD4(UTF-16LE(password))
 */
function md4(buffer: Uint8Array): Uint8Array {
  const len = buffer.length;

  // Pre-processing: adding padding bits
  const bitLen = len * 8;
  const paddedLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(buffer);
  padded[len] = 0x80;

  // Append length in bits as 64-bit little-endian
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, bitLen, true);
  view.setUint32(paddedLen - 4, 0, true);

  // Initialize hash values
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  function rotl(x: number, n: number): number {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
  }

  // Process each 64-byte block
  for (let offset = 0; offset < paddedLen; offset += 64) {
    const X: number[] = [];
    for (let i = 0; i < 16; i++) {
      X[i] = view.getUint32(offset + i * 4, true);
    }

    let a = a0, b = b0, c = c0, d = d0;

    // Round 1
    const r1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const s1 = [3, 7, 11, 19];
    for (let i = 0; i < 16; i++) {
      const f = (b & c) | (~b & d);
      const k = r1[i];
      const val = (a + ((f >>> 0) & 0xffffffff) + X[k]) >>> 0;
      const rot = rotl(val, s1[i % 4]);
      [a, b, c, d] = [d, rot, b, c];
    }

    // Round 2
    const r2 = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
    const s2 = [3, 5, 9, 13];
    for (let i = 0; i < 16; i++) {
      const f = (b & c) | (b & d) | (c & d);
      const k = r2[i];
      const val = (a + ((f >>> 0) & 0xffffffff) + X[k] + 0x5a827999) >>> 0;
      const rot = rotl(val, s2[i % 4]);
      [a, b, c, d] = [d, rot, b, c];
    }

    // Round 3
    const r3 = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
    const s3 = [3, 9, 11, 15];
    for (let i = 0; i < 16; i++) {
      const f = b ^ c ^ d;
      const k = r3[i];
      const val = (a + ((f >>> 0) & 0xffffffff) + X[k] + 0x6ed9eba1) >>> 0;
      const rot = rotl(val, s3[i % 4]);
      [a, b, c, d] = [d, rot, b, c];
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const result = new Uint8Array(16);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, a0, true);
  rv.setUint32(4, b0, true);
  rv.setUint32(8, c0, true);
  rv.setUint32(12, d0, true);
  return result;
}

/**
 * Generate an NTLM hash (MD4 of UTF-16LE encoded input).
 */
export function generateNTLM(input: string): string {
  // Convert to UTF-16LE
  const utf16 = new Uint8Array(input.length * 2);
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    utf16[i * 2] = code & 0xff;
    utf16[i * 2 + 1] = (code >> 8) & 0xff;
  }
  const hash = md4(utf16);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a hash using the Web Crypto API (or NTLM fallback).
 */
export async function generateHash(
  algorithm: string,
  input: string
): Promise<string> {
  if (algorithm === "ntlm") {
    return generateNTLM(input);
  }

  const algoMap: Record<string, string> = {
    md5: "MD5",
    sha1: "SHA-1",
    sha256: "SHA-256",
    sha384: "SHA-384",
    sha512: "SHA-512",
    "sha3-256": "SHA3-256",
    "sha3-512": "SHA3-512",
  };

  // MD5 is not available in Web Crypto; use a pure-JS implementation
  if (algorithm === "md5") {
    return md5(input);
  }

  const cryptoAlgo = algoMap[algorithm];
  if (!cryptoAlgo) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const encoded = new TextEncoder().encode(input);

  // SHA3 is not available in Web Crypto in all browsers
  if (algorithm === "sha3-256" || algorithm === "sha3-512") {
    return sha3(input, algorithm === "sha3-256" ? 256 : 512);
  }

  const hashBuffer = await crypto.subtle.digest(cryptoAlgo, encoded);
  return bufToHex(hashBuffer);
}

/**
 * Minimal MD5 implementation (RFC 1321).
 */
function md5(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const len = bytes.length;
  const bitLen = len * 8;
  const paddedLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[len] = 0x80;
  const pv = new DataView(padded.buffer);
  pv.setUint32(paddedLen - 8, bitLen, true);
  pv.setUint32(paddedLen - 4, 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  }

  function rotl(x: number, n: number): number {
    return ((x << n) | (x >>> (32 - n))) >>> 0;
  }

  for (let offset = 0; offset < paddedLen; offset += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) {
      M[j] = pv.getUint32(offset + j * 4, true);
    }

    let a = a0, b = b0, c = c0, d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      b = (b + rotl((a + ((f >>> 0) & 0xffffffff) + K[i] + M[g]) >>> 0, S[i])) >>> 0;
      a = temp;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const result = new Uint8Array(16);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, a0, true);
  rv.setUint32(4, b0, true);
  rv.setUint32(8, c0, true);
  rv.setUint32(12, d0, true);
  return Array.from(result)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-3 (Keccak) implementation for 256 and 512 bit output.
 */
function sha3(input: string, bits: 256 | 512): string {
  const encoded = new TextEncoder().encode(input);
  const rate = 1600 - bits * 2; // in bits
  const rateBytes = rate / 8;
  const outputBytes = bits / 8;

  // Pad with SHA-3 domain separation: 0x06, then 0x80 at end of block
  const msgLen = encoded.length;
  const padLen =
    msgLen % rateBytes === rateBytes - 1
      ? rateBytes + 1
      : rateBytes - (msgLen % rateBytes);
  const padded = new Uint8Array(msgLen + padLen);
  padded.set(encoded);
  padded[msgLen] = 0x06;
  padded[padded.length - 1] |= 0x80;

  // State: 5x5 matrix of 64-bit lanes (using pairs of 32-bit ints: low, high)
  const state = new Uint32Array(50); // 25 lanes * 2

  const RC = [
    [0x00000001, 0x00000000], [0x00008082, 0x00000000],
    [0x0000808a, 0x80000000], [0x80008000, 0x80000000],
    [0x0000808b, 0x00000000], [0x80000001, 0x00000000],
    [0x80008081, 0x80000000], [0x00008009, 0x80000000],
    [0x0000008a, 0x00000000], [0x00000088, 0x00000000],
    [0x80008009, 0x00000000], [0x8000000a, 0x00000000],
    [0x8000808b, 0x00000000], [0x0000008b, 0x80000000],
    [0x00008089, 0x80000000], [0x00008003, 0x80000000],
    [0x00008002, 0x80000000], [0x00000080, 0x80000000],
    [0x0000800a, 0x00000000], [0x8000000a, 0x80000000],
    [0x80008081, 0x80000000], [0x00008080, 0x80000000],
    [0x80000001, 0x00000000], [0x80008008, 0x80000000],
  ];

  function keccakf(s: Uint32Array) {
    const B = new Uint32Array(50);
    const C = new Uint32Array(10);
    const D = new Uint32Array(10);

    for (let round = 0; round < 24; round++) {
      // Theta
      for (let x = 0; x < 5; x++) {
        C[x * 2] = s[x * 2] ^ s[(x + 5) * 2] ^ s[(x + 10) * 2] ^ s[(x + 15) * 2] ^ s[(x + 20) * 2];
        C[x * 2 + 1] = s[x * 2 + 1] ^ s[(x + 5) * 2 + 1] ^ s[(x + 10) * 2 + 1] ^ s[(x + 15) * 2 + 1] ^ s[(x + 20) * 2 + 1];
      }
      for (let x = 0; x < 5; x++) {
        const p = ((x + 4) % 5) * 2;
        const n = ((x + 1) % 5) * 2;
        D[x * 2] = C[p] ^ ((C[n] << 1) | (C[n + 1] >>> 31));
        D[x * 2 + 1] = C[p + 1] ^ ((C[n + 1] << 1) | (C[n] >>> 31));
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 25; y += 5) {
          s[(y + x) * 2] ^= D[x * 2];
          s[(y + x) * 2 + 1] ^= D[x * 2 + 1];
        }
      }

      // Rho and Pi
      const rhoOffsets = [
        0, 1, 62, 28, 27, 36, 44, 6, 55, 20,
        3, 10, 43, 25, 39, 41, 45, 15, 21, 8,
        18, 2, 61, 56, 14,
      ];
      const piLane = [
        0, 10, 20, 5, 15, 16, 1, 11, 21, 6,
        7, 17, 2, 12, 22, 23, 8, 18, 3, 13,
        14, 24, 9, 19, 4,
      ];

      for (let i = 0; i < 25; i++) {
        const r = rhoOffsets[i];
        const lo = s[i * 2];
        const hi = s[i * 2 + 1];
        let newLo: number, newHi: number;
        if (r === 0) {
          newLo = lo;
          newHi = hi;
        } else if (r < 32) {
          newLo = (lo << r) | (hi >>> (32 - r));
          newHi = (hi << r) | (lo >>> (32 - r));
        } else if (r === 32) {
          newLo = hi;
          newHi = lo;
        } else {
          const rr = r - 32;
          newLo = (hi << rr) | (lo >>> (32 - rr));
          newHi = (lo << rr) | (hi >>> (32 - rr));
        }
        B[piLane[i] * 2] = newLo;
        B[piLane[i] * 2 + 1] = newHi;
      }

      // Chi
      for (let y = 0; y < 25; y += 5) {
        for (let x = 0; x < 5; x++) {
          const i = y + x;
          const j = y + (x + 1) % 5;
          const k = y + (x + 2) % 5;
          s[i * 2] = B[i * 2] ^ (~B[j * 2] & B[k * 2]);
          s[i * 2 + 1] = B[i * 2 + 1] ^ (~B[j * 2 + 1] & B[k * 2 + 1]);
        }
      }

      // Iota
      s[0] ^= RC[round][0];
      s[1] ^= RC[round][1];
    }
  }

  // Absorb
  for (let offset = 0; offset < padded.length; offset += rateBytes) {
    for (let i = 0; i < rateBytes && offset + i < padded.length; i += 8) {
      const lane = i / 8;
      if (lane >= 25) break;
      const lo =
        padded[offset + i] |
        (padded[offset + i + 1] << 8) |
        (padded[offset + i + 2] << 16) |
        (padded[offset + i + 3] << 24);
      const hi =
        (padded[offset + i + 4] || 0) |
        ((padded[offset + i + 5] || 0) << 8) |
        ((padded[offset + i + 6] || 0) << 16) |
        ((padded[offset + i + 7] || 0) << 24);
      state[lane * 2] ^= lo;
      state[lane * 2 + 1] ^= hi;
    }
    keccakf(state);
  }

  // Squeeze
  const output = new Uint8Array(outputBytes);
  for (let i = 0; i < outputBytes; i += 8) {
    const lane = i / 8;
    if (lane >= 25) break;
    const lo = state[lane * 2];
    const hi = state[lane * 2 + 1];
    output[i] = lo & 0xff;
    output[i + 1] = (lo >>> 8) & 0xff;
    output[i + 2] = (lo >>> 16) & 0xff;
    output[i + 3] = (lo >>> 24) & 0xff;
    if (i + 4 < outputBytes) {
      output[i + 4] = hi & 0xff;
      output[i + 5] = (hi >>> 8) & 0xff;
      output[i + 6] = (hi >>> 16) & 0xff;
      output[i + 7] = (hi >>> 24) & 0xff;
    }
  }

  return Array.from(output)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get all supported algorithm IDs for generation.
 */
export function getGeneratorAlgorithms(): { id: string; name: string }[] {
  return HASH_TYPES.map((h) => ({ id: h.id, name: h.name }));
}
