import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import RevShellGenerator from "./RevShellGenerator";

const tool = getToolBySlug("revshell")!;

export const metadata: Metadata = {
  title: "Reverse Shell Generator - Free Online One-Liner Generator",
  description:
    "Generate reverse shell one-liners in Bash, Python, PowerShell, PHP, Ruby, Perl, Netcat, Socat, Java, and more. Copy-paste ready with encoding options. Free, client-side.",
  keywords: [
    "reverse shell generator",
    "reverse shell cheat sheet",
    "reverse shell one liner",
    "bash reverse shell",
    "python reverse shell",
    "powershell reverse shell",
    "netcat reverse shell",
    "php reverse shell",
  ],
  openGraph: {
    title: "Reverse Shell Generator - Free Online | OffSecKit",
    description:
      "Generate reverse shell one-liners in 12+ languages. Copy-paste ready with Base64 and URL encoding options.",
    url: "https://offseckit.com/tools/revshell",
  },
};

const faq = [
  {
    question: "What is a reverse shell?",
    answer:
      "A reverse shell is a type of shell where the target machine connects back to the attacker's machine. The attacker sets up a listener on their machine, and the target initiates the connection. This is useful in penetration testing when inbound connections to the target are blocked by a firewall.",
  },
  {
    question: "How do I use a reverse shell?",
    answer:
      'First, start a listener on your machine (e.g., "nc -lvnp 4444"). Then execute the reverse shell command on the target machine. The target will connect back to your listener, giving you an interactive shell.',
  },
  {
    question: "What is the difference between a reverse shell and a bind shell?",
    answer:
      "A reverse shell connects from the target back to the attacker. A bind shell opens a port on the target that the attacker connects to. Reverse shells are preferred in most pentesting scenarios because outbound connections are less likely to be blocked by firewalls.",
  },
  {
    question: "Why would I Base64 encode a reverse shell?",
    answer:
      "Base64 encoding helps bypass input filters, WAFs, and command injection restrictions that block special characters like pipes, redirects, and quotes. The encoded payload is decoded and executed at runtime.",
  },
  {
    question: "Is this tool safe to use?",
    answer:
      "This tool runs 100% in your browser. No data is sent to any server. The reverse shell commands generated are standard payloads used in authorized penetration testing. Only use these on systems you have explicit permission to test.",
  },
];

export default function RevShellPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/revshell">
      <RevShellGenerator />
    </ToolLayout>
  );
}
