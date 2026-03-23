export interface EncodingOperation {
  id: string;
  name: string;
  category: "encode" | "decode";
  description: string;
  fn: (input: string) => string;
}

const operations: EncodingOperation[] = [
  // Base64
  {
    id: "base64-encode",
    name: "Base64 Encode",
    category: "encode",
    description: "Encode text to Base64",
    fn: (input) => btoa(unescape(encodeURIComponent(input))),
  },
  {
    id: "base64-decode",
    name: "Base64 Decode",
    category: "decode",
    description: "Decode Base64 to text",
    fn: (input) => decodeURIComponent(escape(atob(input.trim()))),
  },

  // Base64url (URL-safe Base64)
  {
    id: "base64url-encode",
    name: "Base64url Encode",
    category: "encode",
    description: "Encode text to URL-safe Base64 (used in JWTs)",
    fn: (input) =>
      btoa(unescape(encodeURIComponent(input)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, ""),
  },
  {
    id: "base64url-decode",
    name: "Base64url Decode",
    category: "decode",
    description: "Decode URL-safe Base64 to text",
    fn: (input) => {
      let s = input.trim().replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      return decodeURIComponent(escape(atob(s)));
    },
  },

  // Base32
  {
    id: "base32-encode",
    name: "Base32 Encode",
    category: "encode",
    description: "Encode text to Base32 (used in TOTP, DNS tunneling)",
    fn: (input) => {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const bytes = new TextEncoder().encode(input);
      let bits = "";
      for (const b of bytes) bits += b.toString(2).padStart(8, "0");
      while (bits.length % 5) bits += "0";
      let result = "";
      for (let i = 0; i < bits.length; i += 5) {
        result += alphabet[parseInt(bits.substring(i, i + 5), 2)];
      }
      while (result.length % 8) result += "=";
      return result;
    },
  },
  {
    id: "base32-decode",
    name: "Base32 Decode",
    category: "decode",
    description: "Decode Base32 to text",
    fn: (input) => {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const clean = input.trim().replace(/=+$/, "").toUpperCase();
      let bits = "";
      for (const c of clean) {
        const idx = alphabet.indexOf(c);
        if (idx === -1) throw new Error(`Invalid Base32 character: ${c}`);
        bits += idx.toString(2).padStart(5, "0");
      }
      const bytes: number[] = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substring(i, i + 8), 2));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },

  // Base58
  {
    id: "base58-encode",
    name: "Base58 Encode",
    category: "encode",
    description: "Encode text to Base58 (used in Bitcoin, IPFS)",
    fn: (input) => {
      const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const bytes = new TextEncoder().encode(input);
      // Convert bytes to a big integer
      let num = 0n;
      for (const b of bytes) num = num * 256n + BigInt(b);
      let result = "";
      while (num > 0n) {
        result = alphabet[Number(num % 58n)] + result;
        num = num / 58n;
      }
      // Preserve leading zeros
      for (const b of bytes) {
        if (b === 0) result = "1" + result;
        else break;
      }
      return result || "1";
    },
  },
  {
    id: "base58-decode",
    name: "Base58 Decode",
    category: "decode",
    description: "Decode Base58 to text",
    fn: (input) => {
      const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const clean = input.trim();
      let num = 0n;
      for (const c of clean) {
        const idx = alphabet.indexOf(c);
        if (idx === -1) throw new Error(`Invalid Base58 character: ${c}`);
        num = num * 58n + BigInt(idx);
      }
      // Convert big integer to bytes
      const hex = num === 0n ? "" : num.toString(16).padStart(2, "0");
      const padded = hex.length % 2 ? "0" + hex : hex;
      const bytes: number[] = [];
      for (let i = 0; i < padded.length; i += 2) {
        bytes.push(parseInt(padded.substring(i, i + 2), 16));
      }
      // Restore leading zeros
      for (const c of clean) {
        if (c === "1") bytes.unshift(0);
        else break;
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },

  // Punycode
  {
    id: "punycode-encode",
    name: "Punycode Encode",
    category: "encode",
    description: "Encode domain to Punycode (IDN homograph attack analysis)",
    fn: (input) => {
      try {
        const url = new URL("http://" + input);
        const encoded = url.hostname;
        return encoded;
      } catch {
        // Fallback: try encoding each label via URL constructor
        return input
          .split(".")
          .map((label) => {
            try {
              const url = new URL("http://" + label + ".test");
              return url.hostname.split(".")[0];
            } catch {
              return label;
            }
          })
          .join(".");
      }
    },
  },
  {
    id: "punycode-decode",
    name: "Punycode Decode",
    category: "decode",
    description: "Decode Punycode to Unicode domain",
    fn: (input) => {
      // Use the IDN-aware URL constructor to decode
      const clean = input.trim();
      try {
        // Create a URL and read back the Unicode hostname
        const url = new URL("http://" + clean);
        // The URL constructor normalizes, but we need to decode from ASCII
        // Use document to decode IDN via an anchor element trick
        if (typeof document !== "undefined") {
          const a = document.createElement("a");
          a.href = "http://" + clean;
          return a.hostname;
        }
        return url.hostname;
      } catch {
        return clean;
      }
    },
  },

  // URL
  {
    id: "url-encode",
    name: "URL Encode",
    category: "encode",
    description: "Percent-encode special characters",
    fn: (input) => encodeURIComponent(input),
  },
  {
    id: "url-decode",
    name: "URL Decode",
    category: "decode",
    description: "Decode percent-encoded text",
    fn: (input) => decodeURIComponent(input),
  },
  {
    id: "url-encode-full",
    name: "URL Encode (Full)",
    category: "encode",
    description: "Encode all characters including /, ?, &, =",
    fn: (input) =>
      Array.from(new TextEncoder().encode(input))
        .map((b) => "%" + b.toString(16).toUpperCase().padStart(2, "0"))
        .join(""),
  },

  // Hex
  {
    id: "hex-encode",
    name: "Hex Encode",
    category: "encode",
    description: "Convert text to hexadecimal",
    fn: (input) =>
      Array.from(new TextEncoder().encode(input))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
  },
  {
    id: "hex-decode",
    name: "Hex Decode",
    category: "decode",
    description: "Convert hexadecimal to text",
    fn: (input) => {
      const clean = input.replace(/[\s:0x,]/g, "");
      const bytes = [];
      for (let i = 0; i < clean.length; i += 2) {
        bytes.push(parseInt(clean.substring(i, i + 2), 16));
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },
  {
    id: "hex-encode-prefixed",
    name: "Hex Encode (\\x prefix)",
    category: "encode",
    description: "Convert text to \\x prefixed hex bytes",
    fn: (input) =>
      Array.from(new TextEncoder().encode(input))
        .map((b) => "\\x" + b.toString(16).padStart(2, "0"))
        .join(""),
  },

  // HTML entities
  {
    id: "html-encode",
    name: "HTML Entity Encode",
    category: "encode",
    description: "Encode special characters as HTML entities",
    fn: (input) =>
      input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"),
  },
  {
    id: "html-decode",
    name: "HTML Entity Decode",
    category: "decode",
    description: "Decode HTML entities to characters",
    fn: (input) => {
      const doc = new DOMParser().parseFromString(input, "text/html");
      return doc.documentElement.textContent || "";
    },
  },
  {
    id: "html-encode-all",
    name: "HTML Entity Encode (All)",
    category: "encode",
    description: "Encode all characters as numeric HTML entities",
    fn: (input) =>
      Array.from(input)
        .map((c) => "&#" + c.codePointAt(0) + ";")
        .join(""),
  },

  // Unicode
  {
    id: "unicode-escape",
    name: "Unicode Escape",
    category: "encode",
    description: "Convert text to \\uXXXX escape sequences",
    fn: (input) =>
      Array.from(input)
        .map((c) => {
          const cp = c.codePointAt(0)!;
          if (cp > 0xffff) {
            return "\\u{" + cp.toString(16) + "}";
          }
          return "\\u" + cp.toString(16).padStart(4, "0");
        })
        .join(""),
  },
  {
    id: "unicode-unescape",
    name: "Unicode Unescape",
    category: "decode",
    description: "Convert \\uXXXX sequences to text",
    fn: (input) =>
      input.replace(
        /\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
        (_, p1, p2) => String.fromCodePoint(parseInt(p1 || p2, 16))
      ),
  },

  // Binary
  {
    id: "binary-encode",
    name: "Binary Encode",
    category: "encode",
    description: "Convert text to 8-bit binary",
    fn: (input) =>
      Array.from(new TextEncoder().encode(input))
        .map((b) => b.toString(2).padStart(8, "0"))
        .join(" "),
  },
  {
    id: "binary-decode",
    name: "Binary Decode",
    category: "decode",
    description: "Convert binary to text",
    fn: (input) => {
      const bytes = input
        .trim()
        .split(/[\s,]+/)
        .map((b) => parseInt(b, 2));
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },

  // Decimal / ASCII
  {
    id: "decimal-encode",
    name: "Decimal (ASCII) Encode",
    category: "encode",
    description: "Convert text to decimal byte values",
    fn: (input) =>
      Array.from(new TextEncoder().encode(input))
        .map((b) => b.toString(10))
        .join(" "),
  },
  {
    id: "decimal-decode",
    name: "Decimal (ASCII) Decode",
    category: "decode",
    description: "Convert decimal byte values to text",
    fn: (input) => {
      const bytes = input
        .trim()
        .split(/[\s,]+/)
        .map((b) => parseInt(b, 10));
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },

  // Octal
  {
    id: "octal-encode",
    name: "Octal Encode",
    category: "encode",
    description: "Convert text to octal byte values",
    fn: (input) =>
      Array.from(new TextEncoder().encode(input))
        .map((b) => b.toString(8).padStart(3, "0"))
        .join(" "),
  },
  {
    id: "octal-decode",
    name: "Octal Decode",
    category: "decode",
    description: "Convert octal byte values to text",
    fn: (input) => {
      const bytes = input
        .trim()
        .split(/[\s,]+/)
        .map((b) => parseInt(b, 8));
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },

  // ROT13
  {
    id: "rot13",
    name: "ROT13",
    category: "encode",
    description: "Rotate letters by 13 positions (self-reversing)",
    fn: (input) =>
      input.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      }),
  },

  // ROT47
  {
    id: "rot47",
    name: "ROT47",
    category: "encode",
    description: "Rotate printable ASCII characters by 47 positions (self-reversing)",
    fn: (input) =>
      input.replace(/[!-~]/g, (c) => {
        const code = c.charCodeAt(0);
        return String.fromCharCode(((code - 33 + 47) % 94) + 33);
      }),
  },

  // String reversal
  {
    id: "reverse",
    name: "Reverse String",
    category: "encode",
    description: "Reverse the input string",
    fn: (input) => Array.from(input).reverse().join(""),
  },

  // Uppercase / Lowercase
  {
    id: "uppercase",
    name: "Uppercase",
    category: "encode",
    description: "Convert text to uppercase",
    fn: (input) => input.toUpperCase(),
  },
  {
    id: "lowercase",
    name: "Lowercase",
    category: "encode",
    description: "Convert text to lowercase",
    fn: (input) => input.toLowerCase(),
  },
];

export function getOperations(): EncodingOperation[] {
  return operations;
}

export interface DetectedEncoding {
  id: string;
  name: string;
  confidence: "high" | "medium" | "low";
}

export function detectEncoding(input: string): DetectedEncoding[] {
  const results: DetectedEncoding[] = [];
  const trimmed = input.trim();
  if (!trimmed) return results;

  // Base64: valid chars, length divisible by 4 (with padding), or looks like base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (base64Regex.test(trimmed) && trimmed.length >= 4) {
    try {
      atob(trimmed);
      const confidence = trimmed.length % 4 === 0 ? "high" : "medium";
      results.push({ id: "base64-decode", name: "Base64 Decode", confidence });
    } catch {
      // Not valid base64
    }
  }

  // Base64url: valid chars with - and _ instead of + and /
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  if (base64urlRegex.test(trimmed) && trimmed.length >= 4 && (trimmed.includes("-") || trimmed.includes("_"))) {
    try {
      let s = trimmed.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      atob(s);
      results.push({ id: "base64url-decode", name: "Base64url Decode", confidence: "medium" });
    } catch {
      // Not valid base64url
    }
  }

  // URL-encoded: contains %XX patterns
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    const pctCount = (trimmed.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    const confidence = pctCount > 3 ? "high" : "medium";
    results.push({ id: "url-decode", name: "URL Decode", confidence });
  }

  // Hex: only hex chars, even length
  const hexClean = trimmed.replace(/[\s:,]/g, "").replace(/0x/g, "");
  if (/^[0-9A-Fa-f]+$/.test(hexClean) && hexClean.length >= 4 && hexClean.length % 2 === 0) {
    results.push({ id: "hex-decode", name: "Hex Decode", confidence: trimmed.length > 8 ? "medium" : "low" });
  }

  // Hex with \x prefix
  if (/\\x[0-9A-Fa-f]{2}/.test(trimmed)) {
    results.push({ id: "hex-decode", name: "Hex Decode (\\x prefixed)", confidence: "high" });
  }

  // HTML entities: &xxx; or &#xxx; patterns
  if (/&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(trimmed)) {
    const entityCount = (trimmed.match(/&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g) || []).length;
    results.push({ id: "html-decode", name: "HTML Entity Decode", confidence: entityCount > 2 ? "high" : "medium" });
  }

  // Unicode escape: \uXXXX patterns
  if (/\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/.test(trimmed)) {
    results.push({ id: "unicode-unescape", name: "Unicode Unescape", confidence: "high" });
  }

  // Binary: only 0s and 1s in 8-bit groups
  if (/^[01]{8}(\s+[01]{8})*$/.test(trimmed)) {
    results.push({ id: "binary-decode", name: "Binary Decode", confidence: "high" });
  }

  // Decimal: space/comma-separated numbers 0-255
  const decParts = trimmed.split(/[\s,]+/);
  if (decParts.length >= 2 && decParts.every((p) => /^\d+$/.test(p) && parseInt(p) >= 0 && parseInt(p) <= 255)) {
    results.push({ id: "decimal-decode", name: "Decimal (ASCII) Decode", confidence: "medium" });
  }

  // Octal: space-separated 3-digit octal values
  if (/^[0-7]{3}(\s+[0-7]{3})*$/.test(trimmed)) {
    results.push({ id: "octal-decode", name: "Octal Decode", confidence: "medium" });
  }

  // Base32: only A-Z2-7 with optional = padding
  const base32Regex = /^[A-Z2-7]+=*$/;
  if (base32Regex.test(trimmed.toUpperCase()) && trimmed.length >= 4 && /[A-Z]/.test(trimmed.toUpperCase())) {
    // Check it's not just all letters (which would be ambiguous)
    if (/[2-7]/.test(trimmed) || trimmed.endsWith("=")) {
      results.push({ id: "base32-decode", name: "Base32 Decode", confidence: trimmed.endsWith("=") ? "high" : "low" });
    }
  }

  // Base58: only Base58 alphabet chars (no 0, O, I, l)
  const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  if (base58Regex.test(trimmed) && trimmed.length >= 20) {
    results.push({ id: "base58-decode", name: "Base58 Decode", confidence: "low" });
  }

  // Punycode: xn-- prefix
  if (/xn--/i.test(trimmed)) {
    results.push({ id: "punycode-decode", name: "Punycode Decode", confidence: "high" });
  }

  // ROT13: only letters and common punctuation (low confidence, hard to detect)
  if (/^[a-zA-Z\s.,!?;:'"()-]+$/.test(trimmed) && trimmed.length >= 4) {
    results.push({ id: "rot13", name: "ROT13", confidence: "low" });
  }

  return results;
}

export function getOperationById(id: string): EncodingOperation | undefined {
  return operations.find((op) => op.id === id);
}

export interface ChainStep {
  id: string;
  operationId: string;
}

export function runChain(input: string, steps: ChainStep[]): { results: string[]; error?: string; errorStep?: number } {
  const results: string[] = [];
  let current = input;

  for (let i = 0; i < steps.length; i++) {
    const op = getOperationById(steps[i].operationId);
    if (!op) {
      return { results, error: `Unknown operation: ${steps[i].operationId}`, errorStep: i };
    }
    try {
      current = op.fn(current);
      results.push(current);
    } catch (e) {
      return {
        results,
        error: e instanceof Error ? e.message : "Encoding/decoding failed",
        errorStep: i,
      };
    }
  }

  return { results };
}
