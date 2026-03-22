import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import EncoderTool from "./EncoderTool";

const tool = getToolBySlug("encode")!;

export const metadata: Metadata = {
  title: "Base64 Decode & Encode Online - Hex, URL, HTML Encoder | OffSecKit",
  description:
    "Free online encoder/decoder for Base64, URL, Hex, HTML entities, Binary, Unicode, ROT13, and more. Chain multiple encoding operations together. 100% client-side.",
  keywords: [
    "base64 decode",
    "base64 encode",
    "base64 decoder",
    "base64 encoder",
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
    "unicode escape",
    "encoding tool",
    "decoding tool",
    "online encoder decoder",
    "encoding chain",
    "double url encode",
  ],
  openGraph: {
    title: "Encoding/Decoding Multi-Tool - Free Online | OffSecKit",
    description:
      "Encode and decode Base64, URL, Hex, HTML entities, Binary, and more. Chain multiple operations together. 100% client-side.",
    url: "https://offseckit.com/tools/encode",
  },
};

const faq = [
  {
    question: "What encoding formats are supported?",
    answer:
      "Base64, URL encoding (standard and full), Hex (plain and \\x prefixed), HTML entities (standard and numeric), Unicode escape sequences, Binary, Decimal (ASCII), Octal, ROT13, plus text transforms like reverse, uppercase, and lowercase.",
  },
  {
    question: "What is encoding chaining and why is it useful?",
    answer:
      "Encoding chaining lets you apply multiple encoding or decoding operations in sequence — the output of one step becomes the input to the next. This is essential in penetration testing for bypassing WAFs and input filters that decode once before checking. For example, double URL encoding or Base64 + URL encoding are common WAF bypass techniques.",
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
    question: "What is the difference between URL Encode and URL Encode (Full)?",
    answer:
      "Standard URL encoding (encodeURIComponent) encodes special characters but leaves alphanumeric characters and some symbols like - _ . ~ untouched. Full URL encoding converts every character to its %XX hex representation, which is useful for obfuscation or bypassing filters that whitelist certain characters.",
  },
  {
    question: "Can I use this tool for CTF challenges?",
    answer:
      "Yes — this tool is built for security professionals and CTF players. The chaining feature is especially useful for CTFs where flags are often encoded with multiple layers. Add decode steps in the right order to unwrap the flag.",
  },
];

export default function EncodePage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/encode">
      <EncoderTool />
    </ToolLayout>
  );
}
