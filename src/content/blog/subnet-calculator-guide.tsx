import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "subnet-calculator-guide",
  title: "Subnet Calculator Cheat Sheet 2026 — CIDR Notation, Subnet Masks, and IP Ranges for Pentesters",
  description:
    "Complete guide to subnetting for pentesters and network engineers. Covers CIDR notation, subnet masks, wildcard masks, subnet splitting, RFC 1918 private ranges, and practical tips for scope verification and network enumeration.",
  date: "2026-03-22",
  author: "4252nez",
  keywords: [
    "subnet calculator",
    "CIDR cheat sheet",
    "subnet mask chart",
    "CIDR notation guide",
    "IP subnetting",
    "wildcard mask",
    "network calculator",
    "subnet splitting",
    "pentest subnet",
    "RFC 1918 private ranges",
  ],
  relatedTool: "subnet",
};

export function Content() {
  return (
    <>
      <p>
        Subnetting is one of the most fundamental networking skills for
        penetration testers, network engineers, and anyone working with IP
        networks. Whether you are verifying scope, planning network enumeration,
        or understanding segmentation boundaries, you need to quickly calculate
        subnet details from CIDR notation. This guide covers everything you need
        to know about IPv4 subnetting with practical examples.
      </p>
      <p>
        Use our <a href="/tools/subnet">Subnet Calculator</a> to calculate
        network details instantly, split subnets, and check IP containment, or
        read on for the full reference.
      </p>

      <h2>CIDR Notation Explained</h2>
      <p>
        CIDR (Classless Inter-Domain Routing) notation is the standard way to
        specify an IP address and its associated network mask. It is written as
        an IP address followed by a forward slash and a prefix length:
      </p>
      <pre><code>192.168.1.0/24</code></pre>
      <p>
        The prefix length (the number after the slash) tells you how many
        leading bits of the address identify the network. The remaining bits
        identify individual hosts on that network. A /24 means the first 24 bits
        are the network portion and the last 8 bits are the host portion, giving
        you 256 total addresses (2^8) and 254 usable hosts.
      </p>

      <h2>Subnet Mask Reference Table</h2>
      <p>
        This table shows common prefix lengths with their subnet masks, wildcard
        masks, and host counts. Memorizing the common ones (/8, /16, /24, /25,
        /26, /27, /28, /30, /32) covers the vast majority of real-world
        scenarios.
      </p>
      <table>
        <thead>
          <tr>
            <th>Prefix</th>
            <th>Subnet Mask</th>
            <th>Wildcard</th>
            <th>Total IPs</th>
            <th>Usable Hosts</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>/8</td><td>255.0.0.0</td><td>0.255.255.255</td><td>16,777,216</td><td>16,777,214</td></tr>
          <tr><td>/12</td><td>255.240.0.0</td><td>0.15.255.255</td><td>1,048,576</td><td>1,048,574</td></tr>
          <tr><td>/16</td><td>255.255.0.0</td><td>0.0.255.255</td><td>65,536</td><td>65,534</td></tr>
          <tr><td>/20</td><td>255.255.240.0</td><td>0.0.15.255</td><td>4,096</td><td>4,094</td></tr>
          <tr><td>/24</td><td>255.255.255.0</td><td>0.0.0.255</td><td>256</td><td>254</td></tr>
          <tr><td>/25</td><td>255.255.255.128</td><td>0.0.0.127</td><td>128</td><td>126</td></tr>
          <tr><td>/26</td><td>255.255.255.192</td><td>0.0.0.63</td><td>64</td><td>62</td></tr>
          <tr><td>/27</td><td>255.255.255.224</td><td>0.0.0.31</td><td>32</td><td>30</td></tr>
          <tr><td>/28</td><td>255.255.255.240</td><td>0.0.0.15</td><td>16</td><td>14</td></tr>
          <tr><td>/29</td><td>255.255.255.248</td><td>0.0.0.7</td><td>8</td><td>6</td></tr>
          <tr><td>/30</td><td>255.255.255.252</td><td>0.0.0.3</td><td>4</td><td>2</td></tr>
          <tr><td>/31</td><td>255.255.255.254</td><td>0.0.0.1</td><td>2</td><td>2 (RFC 3021)</td></tr>
          <tr><td>/32</td><td>255.255.255.255</td><td>0.0.0.0</td><td>1</td><td>1</td></tr>
        </tbody>
      </table>

      <h2>Key Subnet Concepts</h2>

      <h3>Network Address</h3>
      <p>
        The network address is the first address in a subnet, with all host bits
        set to 0. It identifies the network itself and cannot be assigned to a
        host. For 192.168.1.0/24, the network address is 192.168.1.0.
      </p>

      <h3>Broadcast Address</h3>
      <p>
        The broadcast address is the last address in a subnet, with all host
        bits set to 1. Packets sent to this address are delivered to all hosts
        on the subnet. For 192.168.1.0/24, the broadcast address is
        192.168.1.255.
      </p>

      <h3>Subnet Mask vs. Wildcard Mask</h3>
      <p>
        A subnet mask marks the network portion with 1s (e.g., 255.255.255.0
        for /24). A wildcard mask is the bitwise inverse, marking the host
        portion with 1s (e.g., 0.0.0.255 for /24). Wildcard masks are used in
        Cisco ACLs and OSPF configurations where you need to specify which bits
        to match (0 = must match, 1 = don&apos;t care).
      </p>

      <h3>Reserved Addresses</h3>
      <p>
        In a standard subnet, two addresses are reserved: the network address
        (first) and the broadcast address (last). This is why a /24 has 256
        total addresses but only 254 usable hosts. The exceptions are /31
        subnets (RFC 3021, used for point-to-point links) and /32 (a single
        host).
      </p>

      <h2>RFC 1918 Private Address Ranges</h2>
      <p>
        RFC 1918 defines three private IPv4 address ranges that are not routable
        on the public internet:
      </p>
      <table>
        <thead>
          <tr>
            <th>Range</th>
            <th>CIDR</th>
            <th>Class</th>
            <th>Total Addresses</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>10.0.0.0 - 10.255.255.255</td><td>10.0.0.0/8</td><td>A</td><td>16,777,216</td></tr>
          <tr><td>172.16.0.0 - 172.31.255.255</td><td>172.16.0.0/12</td><td>B</td><td>1,048,576</td></tr>
          <tr><td>192.168.0.0 - 192.168.255.255</td><td>192.168.0.0/16</td><td>C</td><td>65,536</td></tr>
        </tbody>
      </table>
      <p>
        During penetration testing, identifying private vs. public address space
        tells you whether you are on an internal network, behind NAT, or
        directly exposed to the internet. This affects your approach to lateral
        movement, pivoting, and scope verification.
      </p>

      <h2>Subnet Splitting</h2>
      <p>
        Subnet splitting (or subnetting) divides a larger network into smaller,
        equal-sized subnets. Each split doubles the prefix length by 1 and
        halves the number of hosts per subnet:
      </p>
      <table>
        <thead>
          <tr>
            <th>Original</th>
            <th>Split Into</th>
            <th>New Prefix</th>
            <th>Hosts Each</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>/24 (254 hosts)</td><td>2 subnets</td><td>/25</td><td>126</td></tr>
          <tr><td>/24 (254 hosts)</td><td>4 subnets</td><td>/26</td><td>62</td></tr>
          <tr><td>/24 (254 hosts)</td><td>8 subnets</td><td>/27</td><td>30</td></tr>
          <tr><td>/24 (254 hosts)</td><td>16 subnets</td><td>/28</td><td>14</td></tr>
          <tr><td>/16 (65,534 hosts)</td><td>256 subnets</td><td>/24</td><td>254</td></tr>
        </tbody>
      </table>
      <p>
        Subnetting is essential for network segmentation, VLAN design, reducing
        broadcast domains, and improving security. During pentests, understanding
        how a network is segmented helps you plan lateral movement and identify
        hosts that share a broadcast domain.
      </p>

      <h2>Subnetting for Pentesters</h2>
      <p>
        Here are practical scenarios where subnetting knowledge is critical
        during penetration tests:
      </p>
      <ul>
        <li><strong>Scope verification</strong> — confirm that target IPs fall within the authorized CIDR range before scanning</li>
        <li><strong>Network enumeration</strong> — calculate the exact IP range to scan with nmap based on the CIDR scope</li>
        <li><strong>Segmentation testing</strong> — identify subnet boundaries to test if traffic can cross between segments</li>
        <li><strong>Pivot planning</strong> — after compromising a host, determine which subnets are reachable from the current position</li>
        <li><strong>Report writing</strong> — accurately describe affected IP ranges using CIDR notation in findings</li>
        <li><strong>Cloud assessments</strong> — AWS VPCs, Azure VNets, and GCP VPCs all use CIDR notation for subnet allocation</li>
      </ul>

      <h2>Quick Reference: Common Calculations</h2>
      <ul>
        <li><strong>Total addresses</strong> = 2^(32 - prefix). For /24: 2^8 = 256</li>
        <li><strong>Usable hosts</strong> = total - 2 (subtract network and broadcast). For /24: 254</li>
        <li><strong>Subnet mask</strong> = set the first N bits to 1, rest to 0. For /24: 11111111.11111111.11111111.00000000 = 255.255.255.0</li>
        <li><strong>Network address</strong> = IP AND mask (bitwise AND)</li>
        <li><strong>Broadcast address</strong> = network address OR wildcard mask (bitwise OR)</li>
        <li><strong>First host</strong> = network address + 1</li>
        <li><strong>Last host</strong> = broadcast address - 1</li>
      </ul>

      <h2>Tools</h2>
      <p>
        Our <a href="/tools/subnet">Subnet Calculator</a> handles all of these
        calculations instantly. Enter any CIDR notation and get the full
        breakdown: network address, broadcast, subnet mask, wildcard mask, host
        range, IP class, binary representation, subnet splitting, and IP
        containment checking. All calculations run 100% client-side in your
        browser.
      </p>
      <p>
        For terminal use, install the CLI with <code>pip install offseckit</code>{" "}
        and use <code>osk subnet calc</code>, <code>osk subnet split</code>,{" "}
        <code>osk subnet contains</code>, and <code>osk subnet list</code>.
      </p>
    </>
  );
}
