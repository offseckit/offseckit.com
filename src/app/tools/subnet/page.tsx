import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import SubnetTool from "./SubnetTool";

const tool = getToolBySlug("subnet")!;

export const metadata: Metadata = {
  title: "Subnet/CIDR Calculator — IP Subnet Calculator Online | OffSecKit",
  description:
    "Free online subnet calculator. Calculate network addresses, broadcast addresses, subnet masks, wildcard masks, host ranges, and split subnets from CIDR notation. 100% client-side.",
  keywords: [
    "subnet calculator",
    "CIDR calculator",
    "IP subnet calculator",
    "subnet mask calculator",
    "IP range calculator",
    "network address calculator",
    "CIDR to IP range",
    "subnet calculator online",
    "CIDR notation calculator",
    "wildcard mask calculator",
    "broadcast address calculator",
    "subnet splitting calculator",
    "IPv4 subnet calculator",
    "network calculator",
    "IP address calculator",
  ],
  openGraph: {
    title: "Subnet/CIDR Calculator — IP Subnet Calculator Online | OffSecKit",
    description:
      "Calculate network addresses, broadcast addresses, subnet masks, host ranges, and split subnets from CIDR notation. Free, 100% client-side subnet calculator.",
    url: "https://offseckit.com/tools/subnet",
  },
};

const faq = [
  {
    question: "What is CIDR notation?",
    answer:
      "CIDR (Classless Inter-Domain Routing) notation is a compact way to specify an IP address and its associated network mask. It is written as an IP address followed by a forward slash and a number (the prefix length), like 192.168.1.0/24. The prefix length indicates how many leading bits of the address are the network portion. CIDR replaced the older classful addressing system (Class A, B, C) and allows for more flexible allocation of IP address space.",
  },
  {
    question: "What is the difference between subnet mask and wildcard mask?",
    answer:
      "A subnet mask marks the network portion of an IP address with 1s and the host portion with 0s (e.g., 255.255.255.0 for /24). A wildcard mask is the bitwise inverse — it marks the host portion with 1s and the network portion with 0s (e.g., 0.0.0.255 for /24). Wildcard masks are commonly used in Cisco ACLs and OSPF configurations. They tell the router which bits to check (0) and which to ignore (1).",
  },
  {
    question: "Why can't I use all addresses in a subnet for hosts?",
    answer:
      "In a standard subnet, two addresses are reserved: the network address (the first address, all host bits set to 0) identifies the network itself, and the broadcast address (the last address, all host bits set to 1) is used to send packets to all hosts on the subnet. For example, in 192.168.1.0/24, the network address is 192.168.1.0 and the broadcast is 192.168.1.255, leaving 192.168.1.1 through 192.168.1.254 (254 addresses) for hosts. The exception is /31 subnets (RFC 3021) used for point-to-point links, which use both addresses for hosts.",
  },
  {
    question: "What is subnet splitting and when would I use it?",
    answer:
      "Subnet splitting (or subnetting) divides a larger network into smaller, equal-sized subnets. For example, splitting 10.0.0.0/24 into 4 subnets creates four /26 networks with 62 usable hosts each. This is useful for network segmentation, isolating departments or VLANs, reducing broadcast domains, and improving security by limiting lateral movement. During penetration testing, understanding subnet boundaries helps you map scope, identify segmentation weaknesses, and plan lateral movement strategies.",
  },
  {
    question: "Are my IP addresses and network details sent to any server?",
    answer:
      "No. All subnet calculations run 100% in your browser using JavaScript. No data is transmitted to any server. This makes it safe to calculate subnets for internal networks, client infrastructure, and classified environments where IP addressing information must remain confidential.",
  },
  {
    question: "What are RFC 1918 private address ranges?",
    answer:
      "RFC 1918 defines three private IPv4 address ranges that are not routable on the public internet: 10.0.0.0/8 (Class A, 16.7 million addresses), 172.16.0.0/12 (Class B, 1 million addresses), and 192.168.0.0/16 (Class C, 65,536 addresses). These ranges are used for internal networks behind NAT. In penetration testing, identifying private address space helps determine if you are on an internal network and understand the potential scope of lateral movement.",
  },
];

export default function SubnetPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/subnet">
      <SubnetTool />
    </ToolLayout>
  );
}
