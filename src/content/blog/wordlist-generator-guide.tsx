import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "wordlist-generator-guide",
  title: "Wordlist Generator Cheat Sheet 2026 — Password Mutations, Leet Speak, and Custom Lists for Pentesters",
  description:
    "Complete guide to generating custom wordlists for penetration testing. Covers leet speak substitutions, case mutations, number/symbol appending, common password patterns, and tips for hashcat and John the Ripper.",
  date: "2026-03-23",
  author: "4252nez",
  keywords: [
    "wordlist generator",
    "password mutation generator",
    "custom wordlist pentesting",
    "leet speak password",
    "password list generator",
    "hashcat wordlist",
    "password cracking wordlist",
    "wordlist cheat sheet",
  ],
  relatedTool: "wordlist",
};

export function Content() {
  return (
    <>
      <p>
        Custom wordlists are one of the most effective tools in a pentester&apos;s
        arsenal. Generic password lists like rockyou.txt work for broad attacks, but
        targeted wordlists built from organization-specific keywords, employee names,
        and common patterns dramatically increase your success rate during
        password cracking and brute force engagements.
      </p>
      <p>
        This guide covers how to build effective custom wordlists using password
        mutation techniques. Use our{" "}
        <a href="/tools/wordlist">Wordlist / Password Mutation Generator</a> to
        create wordlists instantly in your browser, or use{" "}
        <code>osk wordlist</code> from the command line.
      </p>

      <h2>Why Custom Wordlists Matter</h2>
      <p>
        Users tend to create passwords from words they can remember: their company
        name, pet names, sports teams, birthdates, and common phrases. They then
        apply predictable mutations to meet password policies: capitalizing the first
        letter, appending numbers, substituting characters with leet speak, and
        adding a trailing symbol.
      </p>
      <p>
        A password policy requiring uppercase, lowercase, numbers, and symbols turns
        &quot;password&quot; into &quot;Password123!&quot; — which is exactly the kind
        of mutation a targeted wordlist captures. Understanding these patterns lets
        you generate focused lists that crack passwords orders of magnitude faster
        than brute force.
      </p>

      <h2>Leet Speak Substitutions</h2>
      <p>
        Leet speak (1337) replaces letters with visually similar numbers or symbols.
        These are among the most common password mutations:
      </p>
      <table>
        <thead>
          <tr>
            <th>Character</th>
            <th>Replacements</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>a</td><td>@ , 4</td><td>password → p@ssword, p4ssword</td></tr>
          <tr><td>e</td><td>3</td><td>server → s3rv3r</td></tr>
          <tr><td>i</td><td>1, !</td><td>admin → adm1n, adm!n</td></tr>
          <tr><td>o</td><td>0</td><td>root → r00t</td></tr>
          <tr><td>s</td><td>$, 5</td><td>pass → pa$$, pa55</td></tr>
          <tr><td>t</td><td>7</td><td>test → 7es7</td></tr>
          <tr><td>l</td><td>1</td><td>hello → he11o</td></tr>
          <tr><td>b</td><td>8</td><td>cyber → cy8er</td></tr>
          <tr><td>g</td><td>9, 6</td><td>google → 9oo9le</td></tr>
        </tbody>
      </table>
      <p>
        The key insight is that users rarely apply leet speak to every character.
        They typically substitute 1-3 characters, leaving most of the word readable.
        A good wordlist generator produces all practical combinations, not just the
        fully substituted version.
      </p>

      <h2>Case Variations</h2>
      <p>
        Case mutations are the simplest and most common password transformation.
        For a base word like &quot;company&quot;, you should generate:
      </p>
      <ul>
        <li><strong>Original</strong>: company</li>
        <li><strong>Lowercase</strong>: company</li>
        <li><strong>Uppercase</strong>: COMPANY</li>
        <li><strong>Capitalize</strong>: Company (most common — satisfies &quot;must contain uppercase&quot; policies)</li>
        <li><strong>Toggle case</strong>: cOmPaNy (less common but still seen)</li>
      </ul>

      <h2>Number Appending</h2>
      <p>
        Appending numbers is the most predictable password mutation. Common patterns include:
      </p>
      <ul>
        <li><strong>Single digits (0-9)</strong>: password1, password2, ... password9</li>
        <li><strong>Double digits (00-99)</strong>: password01, password23, password99</li>
        <li><strong>Years (2020-2026)</strong>: password2024, Company2025 (extremely common in corporate environments)</li>
        <li><strong>Common sequences</strong>: 123, 1234, 12345, 007, 69</li>
      </ul>
      <p>
        Years are particularly effective for corporate password cracking. Many organizations
        require periodic password changes, and users simply increment the year: Company2023 →
        Company2024 → Company2025.
      </p>

      <h2>Symbol Appending</h2>
      <p>
        When password policies require &quot;at least one special character&quot;, users
        overwhelmingly append a single symbol at the end:
      </p>
      <ul>
        <li><strong>!</strong> — the most common (Password1!)</li>
        <li><strong>@</strong> — second most common</li>
        <li><strong>#</strong> and <strong>$</strong> — occasionally used</li>
        <li><strong>.</strong> and <strong>*</strong> — rare but worth including</li>
      </ul>

      <h2>Using Wordlists with Hashcat</h2>
      <p>
        Once you have generated a wordlist, use it with hashcat for hash cracking:
      </p>
      <pre><code>{`# Basic dictionary attack
hashcat -m 1000 -a 0 ntlm_hashes.txt wordlist.txt

# Dictionary + rules for additional mutations
hashcat -m 1000 -a 0 ntlm_hashes.txt wordlist.txt -r best64.rule

# Show cracked passwords
hashcat -m 1000 ntlm_hashes.txt --show`}</code></pre>
      <p>
        Common hashcat modes: 0 (MD5), 100 (SHA1), 1000 (NTLM), 1400 (SHA256),
        1800 (sha512crypt), 3200 (bcrypt), 5600 (NetNTLMv2).
      </p>

      <h2>Using Wordlists with John the Ripper</h2>
      <pre><code>{`# Basic wordlist attack
john --wordlist=wordlist.txt hashes.txt

# With rules for additional mutations
john --wordlist=wordlist.txt --rules=best64 hashes.txt

# Show cracked passwords
john --show hashes.txt`}</code></pre>

      <h2>Wordlist Generation Strategy</h2>
      <p>
        For a targeted engagement, follow this process:
      </p>
      <ol>
        <li><strong>Gather base words</strong>: Company name, product names, city, sports teams, season names, employee names</li>
        <li><strong>Start with case + suffixes</strong>: This covers the most common password patterns with a small wordlist</li>
        <li><strong>Add years</strong>: Especially for corporate environments with password rotation</li>
        <li><strong>Add leet speak</strong>: Focus on common substitutions (a→@, e→3, o→0, s→$)</li>
        <li><strong>Combine words</strong>: Pairs of base words with separators (CompanyCity, company_city)</li>
        <li><strong>Layer with hashcat rules</strong>: Use your wordlist as input with hashcat rules for exponential coverage</li>
      </ol>
      <p>
        Start with a focused wordlist and only expand if initial attempts fail. A
        10,000-word targeted list often outperforms a 10-million-word generic list.
      </p>

      <h2>Command Line Usage</h2>
      <p>
        Generate wordlists from the terminal with the <code>osk</code> CLI:
      </p>
      <pre><code>{`# Install
pip install offseckit

# Basic mutations
osk wordlist gen company admin password

# Full mutation suite
osk wordlist gen company admin -o wordlist.txt \\
  --leet --numbers --number-range years \\
  --symbols --suffixes --combine

# Read base words from a file
osk wordlist gen -f base_words.txt --leet --numbers`}</code></pre>
    </>
  );
}
