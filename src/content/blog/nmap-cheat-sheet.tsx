import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "nmap-cheat-sheet",
  title: "Nmap Cheat Sheet 2026 — Commands, Scan Types, Flags, and NSE Scripts",
  description:
    "Complete nmap cheat sheet for pentesters. Covers scan types, port specification, service detection, NSE scripts, timing templates, firewall evasion, and output options with copy-paste ready examples.",
  date: "2026-03-16",
  author: "4252nez",
  keywords: [
    "nmap cheat sheet",
    "nmap commands",
    "nmap scan types",
    "nmap flags",
    "nmap NSE scripts",
    "nmap port scan",
    "nmap tutorial",
    "nmap pentest",
    "nmap stealth scan",
    "network scanning",
  ],
  relatedTool: "nmap",
};

export function Content() {
  return (
    <>
      <p>
        Nmap is the most widely used network scanner in penetration testing. Whether
        you&apos;re running a quick recon scan or a full vulnerability assessment,
        knowing the right flags and options is essential. This cheat sheet covers
        every nmap command you need, organized by use case.
      </p>
      <p>
        Use our <a href="/tools/nmap">Nmap Command Builder</a> to visually build
        nmap commands with explanations for every option, or keep reading for the
        full reference.
      </p>

      <h2>Basic Scanning</h2>
      <pre>
        <code>{`# Scan a single target (default: top 1000 TCP ports)
nmap 10.10.10.10

# Scan multiple targets
nmap 10.10.10.10 10.10.10.11 10.10.10.12

# Scan a subnet
nmap 192.168.1.0/24

# Scan a range
nmap 10.10.10.1-50

# Scan from a file
nmap -iL targets.txt`}</code>
      </pre>

      <h2>Scan Types</h2>
      <p>
        Nmap supports many scan techniques. The scan type determines how nmap
        probes each port to determine its state.
      </p>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Scan Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>-sS</td>
            <td>SYN Scan (Stealth)</td>
            <td>
              Default for root. Sends SYN without completing handshake. Fast and
              stealthy.
            </td>
          </tr>
          <tr>
            <td>-sT</td>
            <td>TCP Connect</td>
            <td>
              Full TCP handshake. Works without root. Slower and more detectable.
            </td>
          </tr>
          <tr>
            <td>-sU</td>
            <td>UDP Scan</td>
            <td>
              Scans UDP ports. Much slower. Essential for DNS (53), SNMP (161),
              DHCP (67).
            </td>
          </tr>
          <tr>
            <td>-sN</td>
            <td>NULL Scan</td>
            <td>
              No TCP flags. Can bypass stateless firewalls. Does not work on
              Windows.
            </td>
          </tr>
          <tr>
            <td>-sF</td>
            <td>FIN Scan</td>
            <td>
              Only FIN flag set. Can bypass SYN-filtering firewalls. Does not
              work on Windows.
            </td>
          </tr>
          <tr>
            <td>-sX</td>
            <td>Xmas Scan</td>
            <td>
              FIN + PSH + URG flags. Named because it lights up the packet like a
              Christmas tree.
            </td>
          </tr>
          <tr>
            <td>-sA</td>
            <td>ACK Scan</td>
            <td>
              Maps firewall rules. Shows which ports are filtered vs unfiltered.
            </td>
          </tr>
          <tr>
            <td>-sI</td>
            <td>Idle Scan</td>
            <td>
              Uses a zombie host. Stealthiest scan type — no packets from your
              IP.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Port Specification</h2>
      <pre>
        <code>{`# Scan specific ports
nmap -p 22,80,443 10.10.10.10

# Scan a port range
nmap -p 1-1000 10.10.10.10

# Scan ALL ports (1-65535)
nmap -p- 10.10.10.10

# Fast scan (top 100 ports)
nmap -F 10.10.10.10

# Scan top N ports
nmap --top-ports 200 10.10.10.10

# Mix TCP and UDP ports
nmap -p U:53,111,T:21-25,80,443 10.10.10.10`}</code>
      </pre>

      <h2>Service and Version Detection</h2>
      <pre>
        <code>{`# Detect service versions
nmap -sV 10.10.10.10

# OS fingerprinting
nmap -O 10.10.10.10

# Aggressive mode (OS + version + scripts + traceroute)
nmap -A 10.10.10.10

# Version detection with intensity (0-9)
nmap -sV --version-intensity 5 10.10.10.10`}</code>
      </pre>

      <h2>NSE Scripts</h2>
      <p>
        The Nmap Scripting Engine (NSE) includes 600+ Lua scripts for
        vulnerability detection, enumeration, and exploitation.
      </p>
      <pre>
        <code>{`# Run default scripts
nmap -sC 10.10.10.10

# Run vulnerability scripts
nmap --script vuln 10.10.10.10

# Run a specific script
nmap --script http-title 10.10.10.10

# Run multiple scripts
nmap --script "http-title,ssl-heartbleed,smb-os-discovery" 10.10.10.10

# Run scripts by category
nmap --script "safe and discovery" 10.10.10.10

# Run all scripts in a category
nmap --script auth 10.10.10.10`}</code>
      </pre>

      <h3>Essential NSE Scripts for Pentesters</h3>
      <table>
        <thead>
          <tr>
            <th>Script</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>http-title</td>
            <td>Show web page titles on HTTP ports</td>
          </tr>
          <tr>
            <td>ssl-heartbleed</td>
            <td>Check for OpenSSL Heartbleed (CVE-2014-0160)</td>
          </tr>
          <tr>
            <td>smb-os-discovery</td>
            <td>Identify OS and domain via SMB</td>
          </tr>
          <tr>
            <td>smb-vuln-ms17-010</td>
            <td>Check for EternalBlue (MS17-010)</td>
          </tr>
          <tr>
            <td>http-enum</td>
            <td>Enumerate common web directories</td>
          </tr>
          <tr>
            <td>dns-brute</td>
            <td>Brute-force DNS subdomains</td>
          </tr>
          <tr>
            <td>ftp-anon</td>
            <td>Check for anonymous FTP access</td>
          </tr>
          <tr>
            <td>ssl-enum-ciphers</td>
            <td>Enumerate SSL/TLS cipher suites</td>
          </tr>
          <tr>
            <td>vuln</td>
            <td>Run all vulnerability detection scripts</td>
          </tr>
          <tr>
            <td>http-sql-injection</td>
            <td>Crawl for SQL injection vulnerabilities</td>
          </tr>
        </tbody>
      </table>

      <h2>Timing Templates</h2>
      <p>
        Timing templates control scan speed and stealth. Lower values are
        slower but harder to detect.
      </p>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Name</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>-T0</td>
            <td>Paranoid</td>
            <td>IDS evasion, one probe at a time</td>
          </tr>
          <tr>
            <td>-T1</td>
            <td>Sneaky</td>
            <td>IDS evasion, 15-second delay</td>
          </tr>
          <tr>
            <td>-T2</td>
            <td>Polite</td>
            <td>Reduce bandwidth usage</td>
          </tr>
          <tr>
            <td>-T3</td>
            <td>Normal</td>
            <td>Default — balanced speed and stealth</td>
          </tr>
          <tr>
            <td>-T4</td>
            <td>Aggressive</td>
            <td>Fast, reliable network (internal pentests)</td>
          </tr>
          <tr>
            <td>-T5</td>
            <td>Insane</td>
            <td>Fastest, may miss ports</td>
          </tr>
        </tbody>
      </table>

      <h2>Firewall and IDS Evasion</h2>
      <pre>
        <code>{`# Fragment packets
nmap -f 10.10.10.10

# Custom MTU
nmap --mtu 24 10.10.10.10

# Use decoys to obscure source
nmap -D RND:5 10.10.10.10

# Specific decoy addresses
nmap -D 10.0.0.1,10.0.0.2,ME 10.10.10.10

# Spoof source port (DNS traffic often allowed)
nmap --source-port 53 10.10.10.10

# Add random data to packets
nmap --data-length 25 10.10.10.10

# Spoof MAC address
nmap --spoof-mac 0 10.10.10.10

# Send packets with bad checksums
nmap --badsum 10.10.10.10`}</code>
      </pre>

      <h2>Output Options</h2>
      <pre>
        <code>{`# Normal output to file
nmap -oN scan.txt 10.10.10.10

# XML output (for parsing)
nmap -oX scan.xml 10.10.10.10

# Grepable output
nmap -oG scan.grep 10.10.10.10

# All formats at once
nmap -oA scan 10.10.10.10

# Show only open ports
nmap --open 10.10.10.10

# Verbose output
nmap -v 10.10.10.10

# Show reason for port state
nmap --reason 10.10.10.10`}</code>
      </pre>

      <h2>Pentest Scan Profiles</h2>
      <p>
        These are the scans you will run most often during engagements:
      </p>

      <h3>Initial Recon</h3>
      <pre>
        <code>{`# Quick TCP scan of common ports
nmap -sS -sV -F -T4 --open 10.10.10.10`}</code>
      </pre>

      <h3>Full Port Scan</h3>
      <pre>
        <code>{`# Scan all 65535 ports, find everything
nmap -sS -sV -p- -T4 --open 10.10.10.10`}</code>
      </pre>

      <h3>Vulnerability Scan</h3>
      <pre>
        <code>{`# Version detection + vuln scripts + OS detection
nmap -sS -sV -O -sC --script vuln -T4 --open 10.10.10.10`}</code>
      </pre>

      <h3>Stealth Scan</h3>
      <pre>
        <code>{`# Low-noise scan for monitored networks
nmap -sS -T2 -f --source-port 53 --open 10.10.10.10`}</code>
      </pre>

      <h3>UDP Scan</h3>
      <pre>
        <code>{`# Top UDP services
nmap -sU -sV --top-ports 100 -T4 --open 10.10.10.10`}</code>
      </pre>

      <h3>Host Discovery (Ping Sweep)</h3>
      <pre>
        <code>{`# Find live hosts without port scanning
nmap -sn 192.168.1.0/24`}</code>
      </pre>

      <h2>CLI Version</h2>
      <p>
        Build nmap commands from your terminal with the OffSecKit CLI:
      </p>
      <pre>
        <code>pip install offseckit</code>
      </pre>
      <pre>
        <code>{`# Build a custom command
osk nmap build -t 10.10.10.10 -sV --open

# Use a preset
osk nmap preset vuln -t 10.10.10.10

# List presets and scan types
osk nmap presets
osk nmap scans`}</code>
      </pre>
      <p>
        Source code on{" "}
        <a href="https://github.com/offseckit/nmap">GitHub</a>.
      </p>

      <h2>Quick Reference</h2>
      <p>
        Use our <a href="/tools/nmap">Nmap Command Builder</a> to visually
        build commands with explanations for every flag and option. Select scan
        types, ports, NSE scripts, timing templates, and evasion techniques,
        then copy the generated command. All processing happens in your browser.
      </p>
    </>
  );
}
