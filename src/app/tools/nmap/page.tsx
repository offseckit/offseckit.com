import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import NmapBuilder from "./NmapBuilder";

const tool = getToolBySlug("nmap")!;

export const metadata: Metadata = {
  title: "Nmap Command Builder - Generate Nmap Commands Online | OffSecKit",
  description:
    "Visual nmap command builder and cheat sheet. Select scan types, flags, NSE scripts, and timing options with explanations. Generate copy-paste ready nmap commands. Free, 100% client-side.",
  keywords: [
    "nmap cheat sheet",
    "nmap commands",
    "nmap command generator",
    "nmap command builder",
    "nmap scan types",
    "nmap flags",
    "nmap scripts",
    "nmap tutorial",
    "nmap online",
    "nmap options",
    "nmap port scan",
    "nmap NSE scripts",
    "nmap stealth scan",
    "nmap SYN scan",
    "nmap UDP scan",
  ],
  openGraph: {
    title: "Nmap Command Builder - Free Online | OffSecKit",
    description:
      "Visual nmap command builder with scan types, flags, NSE scripts, and timing options. Generate copy-paste ready nmap commands.",
    url: "https://offseckit.com/tools/nmap",
  },
};

const faq = [
  {
    question: "What is Nmap?",
    answer:
      "Nmap (Network Mapper) is a free, open-source tool for network discovery and security auditing. It uses raw IP packets to determine what hosts are available on the network, what services they are running, what operating systems they use, what type of packet filters/firewalls are in use, and many other characteristics. It is one of the most essential tools in a penetration tester's arsenal.",
  },
  {
    question: "What is the difference between SYN scan and TCP Connect scan?",
    answer:
      'SYN scan (-sS) sends a SYN packet and waits for a SYN-ACK response without completing the TCP handshake, making it stealthier and faster. It requires root/sudo privileges. TCP Connect scan (-sT) completes the full three-way TCP handshake, which is slower and more detectable but works without root privileges. SYN scan is the default and recommended scan type for most penetration testing scenarios.',
  },
  {
    question: "What are NSE scripts and how do I use them?",
    answer:
      "NSE (Nmap Scripting Engine) scripts are Lua scripts that extend Nmap's functionality for vulnerability detection, service enumeration, brute-force testing, and more. There are 600+ scripts included with Nmap, organized into categories like 'vuln', 'discovery', 'auth', and 'brute'. Use -sC for default scripts, or --script followed by script names or categories for specific scripts. For example: --script vuln runs all vulnerability detection scripts.",
  },
  {
    question: "How do I scan all 65,535 ports?",
    answer:
      "Use the -p- flag to scan all TCP ports (1-65535). For example: 'nmap -sS -p- -T4 target'. This is slower than the default top-1000 scan but ensures no open ports are missed. For a full assessment, combine with -sV for version detection: 'nmap -sS -p- -sV -T4 target'. You can also scan all UDP ports with -sU -p-, though UDP scanning is significantly slower.",
  },
  {
    question: "How can I make my nmap scans less detectable?",
    answer:
      "Use timing templates T0 (Paranoid) or T1 (Sneaky) to slow down scans. Fragment packets with -f to bypass packet filters. Use decoy addresses with -D to obscure your source IP. Spoof the source port with --source-port 53 (DNS) to bypass firewalls that allow DNS traffic. Use NULL (-sN), FIN (-sF), or Xmas (-sX) scans to bypass stateless firewalls. The Idle scan (-sI) is the stealthiest option, using a zombie host so no packets are sent from your IP.",
  },
  {
    question: "Does this tool run actual nmap scans?",
    answer:
      "No. This tool is a command builder that runs 100% in your browser. It generates nmap command strings that you copy and run in your own terminal. No data is sent to any server, and no network scanning occurs. You need nmap installed on your system to execute the generated commands. Only use nmap on systems you have explicit authorization to test.",
  },
];

export default function NmapPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/nmap">
      <NmapBuilder />
    </ToolLayout>
  );
}
