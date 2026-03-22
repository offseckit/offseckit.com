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
