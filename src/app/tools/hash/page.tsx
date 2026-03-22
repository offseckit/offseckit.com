import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import HashTool from "./HashTool";

const tool = getToolBySlug("hash")!;

export const metadata: Metadata = {
  title: "Hash Identifier & Generator - Identify Hash Types Online | OffSecKit",
  description:
    "Identify unknown hash types and generate hashes in MD5, SHA1, SHA256, SHA512, NTLM, SHA3, and more. Detect hash algorithms by length and format. Free, 100% client-side.",
  keywords: [
    "hash identifier",
    "hash generator online",
    "what hash is this",
    "hash type identifier",
    "MD5 hash generator",
    "SHA256 hash generator",
    "NTLM hash generator",
    "SHA1 hash generator",
    "SHA512 hash generator",
    "hash analyzer",
    "identify hash type",
    "hash lookup",
    "hash detection",
    "hash algorithm identifier",
  ],
  openGraph: {
    title: "Hash Identifier & Generator - Free Online | OffSecKit",
    description:
      "Identify unknown hash types and generate MD5, SHA1, SHA256, SHA512, NTLM hashes. 100% client-side.",
    url: "https://offseckit.com/tools/hash",
  },
};

const faq = [
  {
    question: "How does hash identification work?",
    answer:
      "Hash identification works by analyzing the length and character set of the input. Each hash algorithm produces a fixed-length output — MD5 is 32 hex characters, SHA-1 is 40, SHA-256 is 64, and so on. The tool matches your input against known hash lengths and formats to determine the most likely algorithm.",
  },
  {
    question: "What is the difference between MD5 and NTLM?",
    answer:
      "Both MD5 and NTLM produce 32 hex character hashes, but they use different algorithms. MD5 hashes the raw UTF-8 bytes, while NTLM uses MD4 on the UTF-16LE encoding of the input. NTLM is the hash format used by Windows for storing passwords in the SAM database and Active Directory.",
  },
  {
    question: "Is my data sent to any server?",
    answer:
      "No. All hash identification and generation runs 100% in your browser using the Web Crypto API and pure JavaScript implementations. No data is transmitted anywhere. This makes it safe for handling passwords and sensitive data.",
  },
  {
    question: "Which hash algorithms are supported for generation?",
    answer:
      "The tool supports MD5, SHA-1, SHA-256, SHA-384, SHA-512, NTLM, SHA3-256, and SHA3-512. SHA-1, SHA-256, SHA-384, and SHA-512 use the browser's native Web Crypto API. MD5, NTLM, and SHA-3 use optimized pure JavaScript implementations.",
  },
  {
    question: "Can I use this for password cracking or hash analysis?",
    answer:
      "This tool identifies hash types and generates hashes — it does not crack or reverse hashes. If you have a hash from a pentest or CTF and need to identify the algorithm before feeding it to hashcat or John the Ripper, this tool will help you determine the correct mode to use.",
  },
  {
    question: "Why does my 32-character hash match both MD5 and NTLM?",
    answer:
      "MD5 and NTLM both produce 32 hex character output, so they cannot be distinguished by length alone. If the hash came from a Windows environment (SAM dump, NTDS.dit, or hashdump), it is likely NTLM. If it came from a web application database or file checksum, it is likely MD5.",
  },
];

export default function HashPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/hash">
      <HashTool />
    </ToolLayout>
  );
}
