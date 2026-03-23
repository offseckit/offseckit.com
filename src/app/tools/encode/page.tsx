import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import EncoderTool from "./EncoderTool";

const tool = getToolBySlug("encode")!;

export const metadata: Metadata = {
  title: "Base64 Decode & Encode Online - Hex, URL, HTML, Base32, Base58, Punycode Encoder | OffSecKit",
  description:
    "Free online encoder/decoder for Base64, Base64url, Base32, Base58, URL, Hex, HTML entities, Punycode, Binary, Unicode, ROT13, ROT47, and more. Chain multiple encoding operations. Auto-detect encoding. 100% client-side.",
  keywords: [
    "base64 decode",
    "base64 encode",
    "base64 decoder",
    "base64 encoder",
    "base64url encode",
    "base64url decode",
    "base32 encode",
    "base32 decode",
    "base58 encode",
    "base58 decode",
    "punycode encode",
    "punycode decode",
    "url encode",
    "url decode",
    "url encoder",
    "hex to text",
    "text to hex",
    "html entity encode",
    "html entity decode",
    "binary to text",
    "text to binary",
    "rot13",
    "rot47",
    "unicode escape",
    "encoding tool",
    "decoding tool",
    "online encoder decoder",
    "encoding chain",
    "double url encode",
    "detect encoding",
    "cyberchef alternative",
  ],
  openGraph: {
    title: "Encoding/Decoding Multi-Tool - Free Online | OffSecKit",
    description:
      "Encode and decode Base64, Base32, Base58, URL, Hex, HTML entities, Punycode, and more. Chain operations, auto-detect encodings, share recipes via URL. 100% client-side.",
    url: "https://offseckit.com/tools/encode",
  },
};

const faq = [
  {
    question: "What encoding formats are supported?",
    answer:
      "Base64, Base64url (JWT-safe), Base32 (TOTP/DNS tunneling), Base58 (Bitcoin/IPFS), URL encoding (standard and full), Hex (plain and \\x prefixed), HTML entities (standard and numeric), Unicode escape sequences, Punycode (IDN domains), Binary, Decimal (ASCII), Octal, ROT13, ROT47, plus text transforms like reverse, uppercase, and lowercase.",
  },
  {
    question: "What is encoding chaining and why is it useful?",
    answer:
      "Encoding chaining lets you apply multiple encoding or decoding operations in sequence — the output of one step becomes the input to the next. This is essential in penetration testing for bypassing WAFs and input filters that decode once before checking. For example, double URL encoding or Base64 + URL encoding are common WAF bypass techniques.",
  },
  {
    question: "How does auto-detect work?",
    answer:
      "Click the Detect button next to the input field. The tool analyzes your input for patterns like Base64 padding (=), URL percent-encoding (%XX), hex-only characters, HTML entities (&amp;), Unicode escapes (\\uXXXX), Punycode prefixes (xn--), and more. Each suggestion shows a confidence level (high, medium, low). Click any suggestion to apply it as a decode step.",
  },
  {
    question: "Can I share my encoding recipe with teammates?",
    answer:
      "Yes. Click the Share URL button above the operation chain. This copies a URL to your clipboard that encodes your current input and operation chain in the URL hash. Anyone who opens the link will see the same recipe and input — no server needed.",
  },
  {
    question: "How do I decode double-encoded data?",
    answer:
      "Add two decode steps in the chain. For example, if data is URL encoded twice, add two URL Decode steps. The tool shows intermediate results so you can verify each step.",
  },
  {
    question: "Is my data sent to any server?",
    answer:
      "No. All encoding and decoding operations run 100% in your browser using JavaScript. No data is transmitted anywhere. This makes it safe for handling sensitive payloads and credentials.",
  },
  {
    question: "What is the difference between Base64 and Base64url?",
    answer:
      "Standard Base64 uses + and / characters with = padding. Base64url replaces + with - and / with _, and strips padding. Base64url is used in JWTs (JSON Web Tokens), URL parameters, and filenames where + and / would cause issues.",
  },
  {
    question: "What is Punycode and why is it important for security?",
    answer:
      "Punycode is the encoding used for internationalized domain names (IDN). Attackers use lookalike Unicode characters to create phishing domains that appear identical to legitimate ones (IDN homograph attacks). For example, a domain using Cyrillic 'a' looks like the Latin 'a' but resolves to a different server. This tool helps you encode/decode Punycode to analyze suspicious domains.",
  },
  {
    question: "Can I use this tool for CTF challenges?",
    answer:
      "Yes — this tool is built for security professionals and CTF players. The chaining feature is especially useful for CTFs where flags are often encoded with multiple layers. Use the auto-detect feature to identify unknown encodings, then add decode steps in the right order to unwrap the flag.",
  },
];

export default function EncodePage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/encode">
      <EncoderTool />
    </ToolLayout>
  );
}
