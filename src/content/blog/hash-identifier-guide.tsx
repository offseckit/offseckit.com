import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "hash-identifier-guide",
  title: "Hash Identifier Cheat Sheet 2026 — MD5, SHA, NTLM, and More",
  description:
    "Complete guide to identifying hash types by length and format. Covers MD5, SHA-1, SHA-256, SHA-512, NTLM, SHA-3, and more with examples, hashcat modes, and practical tips for pentesters.",
  date: "2026-03-22",
  author: "4252nez",
  keywords: [
    "hash identifier",
    "what hash is this",
    "hash type identifier",
    "identify hash type",
    "MD5 hash",
    "SHA-256 hash",
    "NTLM hash",
    "hash length chart",
    "hashcat hash modes",
    "hash cheat sheet",
  ],
  relatedTool: "hash",
};

export function Content() {
  return (
    <>
      <p>
        When you pull hashes from a database dump, SAM file, or credential store
        during a pentest, the first step is identifying what algorithm produced
        them. Without knowing the hash type, you cannot select the correct mode
        in hashcat or John the Ripper.
      </p>
      <p>
        This guide covers how to identify hash types by their length, format,
        and context. Use our{" "}
        <a href="/tools/hash">Hash Identifier &amp; Generator</a> tool to
        identify hashes instantly in your browser.
      </p>

      <h2>Identifying Hashes by Length</h2>
      <p>
        The fastest way to identify a hash is by counting its hexadecimal
        characters. Each algorithm produces a fixed-length output:
      </p>
      <table>
        <thead>
          <tr>
            <th>Hex Length</th>
            <th>Bits</th>
            <th>Possible Algorithms</th>
            <th>Hashcat Mode</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>32</td>
            <td>128</td>
            <td>MD5, NTLM</td>
            <td>0 (MD5), 1000 (NTLM)</td>
          </tr>
          <tr>
            <td>40</td>
            <td>160</td>
            <td>SHA-1</td>
            <td>100</td>
          </tr>
          <tr>
            <td>64</td>
            <td>256</td>
            <td>SHA-256, SHA3-256</td>
            <td>1400 (SHA-256), 17400 (SHA3-256)</td>
          </tr>
          <tr>
            <td>96</td>
            <td>384</td>
            <td>SHA-384</td>
            <td>10800</td>
          </tr>
          <tr>
            <td>128</td>
            <td>512</td>
            <td>SHA-512, SHA3-512</td>
            <td>1700 (SHA-512), 17600 (SHA3-512)</td>
          </tr>
        </tbody>
      </table>

      <h2>MD5 (32 hex characters)</h2>
      <p>
        MD5 produces a 128-bit (32 hex character) hash. It&apos;s the most
        common hash you&apos;ll encounter in web application databases, WordPress
        installs, and legacy systems.
      </p>
      <pre>
        <code>{`# MD5 of "hello"
5d41402abc4b2a76b9719d911017c592

# MD5 of "password"
5f4dcc3b5aa765d61d8327deb882cf99

# Crack with hashcat
hashcat -m 0 hash.txt wordlist.txt`}</code>
      </pre>
      <p>
        MD5 is cryptographically broken and can be cracked extremely quickly
        with modern GPUs. If you encounter MD5 hashes during a pentest, cracking
        them should be straightforward.
      </p>

      <h2>NTLM (32 hex characters)</h2>
      <p>
        NTLM is the password hash format used by Windows. It&apos;s also 32 hex
        characters, making it visually identical to MD5. The key difference is
        that NTLM uses MD4 on the UTF-16LE encoding of the password (not MD5
        on UTF-8).
      </p>
      <pre>
        <code>{`# NTLM of "password"
a4f49c406510bdcab6824ee7c30fd852

# Where you'll find NTLM hashes:
# - SAM database (local Windows accounts)
# - NTDS.dit (Active Directory)
# - hashdump from Meterpreter/mimikatz
# - DCSync output

# Crack with hashcat
hashcat -m 1000 hash.txt wordlist.txt`}</code>
      </pre>
      <h3>How to distinguish MD5 from NTLM</h3>
      <p>
        You cannot tell them apart by the hash alone — both are 32 hex
        characters. Use context:
      </p>
      <ul>
        <li>
          <strong>From a Windows system</strong> (SAM, NTDS.dit, hashdump,
          mimikatz) — it&apos;s NTLM
        </li>
        <li>
          <strong>From a web application database</strong> (MySQL, PostgreSQL) —
          it&apos;s probably MD5
        </li>
        <li>
          <strong>With a $NT$ prefix</strong> — definitely NTLM
        </li>
        <li>
          <strong>Paired with an LM hash</strong> (in format LM:NTLM) — NTLM
        </li>
      </ul>

      <h2>SHA-1 (40 hex characters)</h2>
      <p>
        SHA-1 produces a 160-bit (40 hex character) hash. It has a unique length
        among common algorithms, making it easy to identify. It&apos;s deprecated
        for security use but still found in older systems and git commit hashes.
      </p>
      <pre>
        <code>{`# SHA-1 of "hello"
aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d

# Crack with hashcat
hashcat -m 100 hash.txt wordlist.txt`}</code>
      </pre>

      <h2>SHA-256 (64 hex characters)</h2>
      <p>
        SHA-256 is the current standard for most security applications. At 64
        hex characters, it can be confused with SHA3-256 (same output length).
        In practice, SHA-256 (from the SHA-2 family) is far more common.
      </p>
      <pre>
        <code>{`# SHA-256 of "hello"
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

# Crack with hashcat
hashcat -m 1400 hash.txt wordlist.txt`}</code>
      </pre>

      <h2>SHA-512 (128 hex characters)</h2>
      <p>
        SHA-512 produces a 512-bit (128 hex character) hash. The long output
        makes it distinctive. It&apos;s used in Linux shadow files (with salt and
        prefix <code>$6$</code>), some web frameworks, and high-security applications.
      </p>
      <pre>
        <code>{`# SHA-512 of "hello"
9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043

# Crack with hashcat
hashcat -m 1700 hash.txt wordlist.txt`}</code>
      </pre>

      <h2>Common Hash Prefixes</h2>
      <p>
        Many systems store hashes with prefixes that identify the algorithm and
        salt:
      </p>
      <pre>
        <code>{`$1$       — MD5crypt (Linux)
$2a$/$2b$ — bcrypt
$5$       — SHA-256crypt (Linux)
$6$       — SHA-512crypt (Linux)
$NT$      — NTLM
$apr1$    — Apache MD5
{SHA}     — Base64-encoded SHA-1 (LDAP)
{SSHA}    — Salted SHA-1 (LDAP)`}</code>
      </pre>
      <p>
        If a hash has a prefix, identification is trivial. The prefix tells you
        exactly what algorithm was used.
      </p>

      <h2>Practical Workflow</h2>
      <p>
        Here&apos;s a typical workflow when you encounter unknown hashes during
        an engagement:
      </p>
      <ol>
        <li>
          <strong>Count hex characters</strong> — this narrows it to 1-2
          algorithms immediately
        </li>
        <li>
          <strong>Check for prefixes</strong> — $6$, $2a$, $NT$, etc.
        </li>
        <li>
          <strong>Consider context</strong> — where did the hash come from?
          (Windows AD, web app, Linux shadow file)
        </li>
        <li>
          <strong>Verify with known input</strong> — generate the hash of a
          known password using each candidate algorithm and compare
        </li>
        <li>
          <strong>Select hashcat/john mode</strong> — use the correct mode for
          the identified algorithm
        </li>
      </ol>

      <h2>Generating Test Hashes</h2>
      <p>
        Use our <a href="/tools/hash">Hash Generator</a> to create hashes for
        verification, or generate them from the command line:
      </p>
      <pre>
        <code>{`# MD5
echo -n "test" | md5sum

# SHA-1
echo -n "test" | sha1sum

# SHA-256
echo -n "test" | sha256sum

# SHA-512
echo -n "test" | sha512sum

# NTLM (Python)
python3 -c "import hashlib; print(hashlib.new('md4', 'test'.encode('utf-16-le')).hexdigest())"

# Or use the OffSecKit CLI
hash generate -a md5 -a sha256 -a ntlm "test"`}</code>
      </pre>

      <h2>CLI Version</h2>
      <p>
        Prefer working from the terminal? Install the CLI version via pip:
      </p>
      <pre>
        <code>pip install offseckit</code>
      </pre>
      <p>Identify and generate hashes directly from your terminal:</p>
      <pre>
        <code>{`# Identify a hash
osk hash id 5d41402abc4b2a76b9719d911017c592

# Generate SHA-256
osk hash generate -a sha256 "password"

# Generate multiple algorithms
osk hash generate -a md5 -a ntlm -a sha512 "admin"

# List supported algorithms
osk hash list`}</code>
      </pre>
      <p>
        Source code and documentation on{" "}
        <a href="https://github.com/offseckit/hash">GitHub</a>.
      </p>

      <h2>Quick Reference</h2>
      <p>
        Use our <a href="/tools/hash">Hash Identifier &amp; Generator</a> to
        instantly identify hash types and generate hashes in 8+ algorithms. All
        processing happens in your browser, making it safe for handling
        credential data during engagements.
      </p>
    </>
  );
}
