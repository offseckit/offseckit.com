import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "cvss-calculator-guide",
  title: "CVSS Calculator Cheat Sheet 2026 — CVSS 3.1 vs 4.0 Scoring Guide for Pentesters",
  description:
    "Complete guide to CVSS vulnerability scoring for pentesters and security analysts. Covers CVSS 3.1 and 4.0 differences, base/temporal/environmental metrics, score calculation, common vulnerability scores, and practical tips for writing pentest reports.",
  date: "2026-03-20",
  author: "4252nez",
  keywords: [
    "CVSS calculator",
    "CVSS 3.1 vs 4.0",
    "CVSS scoring guide",
    "vulnerability scoring",
    "CVSS cheat sheet",
    "CVSS base score",
    "CVSS vector string",
    "pentest report scoring",
    "CVSS severity ratings",
    "FIRST CVSS specification",
  ],
  relatedTool: "cvss",
};

export function Content() {
  return (
    <>
      <p>
        The Common Vulnerability Scoring System (CVSS) is the industry standard
        for communicating vulnerability severity. Whether you are writing a
        pentest report, triaging CVEs, or prioritizing patches, understanding
        CVSS is essential. This guide covers both CVSS 3.1 and the newer CVSS
        4.0, with practical scoring examples for common vulnerability types.
      </p>
      <p>
        Use our <a href="/tools/cvss">CVSS Calculator</a> to build vectors
        interactively, parse existing vectors, and calculate scores in real
        time, or read on for the full reference.
      </p>

      <h2>CVSS Overview</h2>
      <p>
        CVSS produces a numerical score between 0.0 and 10.0 reflecting
        vulnerability severity. Scores map to five severity ratings:
      </p>
      <table>
        <thead>
          <tr>
            <th>Rating</th>
            <th>Score Range</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>None</td><td>0.0</td></tr>
          <tr><td>Low</td><td>0.1 - 3.9</td></tr>
          <tr><td>Medium</td><td>4.0 - 6.9</td></tr>
          <tr><td>High</td><td>7.0 - 8.9</td></tr>
          <tr><td>Critical</td><td>9.0 - 10.0</td></tr>
        </tbody>
      </table>
      <p>
        CVSS is maintained by FIRST.org and is used by NVD, CVE, and compliance
        frameworks like PCI DSS. The current versions in active use are CVSS 3.1
        (2019) and CVSS 4.0 (November 2023).
      </p>

      <h2>CVSS 3.1 Base Metrics</h2>
      <p>
        The CVSS 3.1 base score is calculated from eight metrics organized into
        two groups: Exploitability and Impact.
      </p>

      <h3>Exploitability Metrics</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Values</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Attack Vector (AV)</td><td>Network, Adjacent, Local, Physical</td><td>How the attacker reaches the vulnerable component</td></tr>
          <tr><td>Attack Complexity (AC)</td><td>Low, High</td><td>Conditions beyond the attacker&apos;s control</td></tr>
          <tr><td>Privileges Required (PR)</td><td>None, Low, High</td><td>Privilege level needed before exploitation</td></tr>
          <tr><td>User Interaction (UI)</td><td>None, Required</td><td>Whether a user must take action</td></tr>
          <tr><td>Scope (S)</td><td>Unchanged, Changed</td><td>Whether impact crosses security boundary</td></tr>
        </tbody>
      </table>

      <h3>Impact Metrics</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Values</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Confidentiality (C)</td><td>None, Low, High</td><td>Impact on information disclosure</td></tr>
          <tr><td>Integrity (I)</td><td>None, Low, High</td><td>Impact on data modification</td></tr>
          <tr><td>Availability (A)</td><td>None, Low, High</td><td>Impact on system availability</td></tr>
        </tbody>
      </table>

      <h3>CVSS 3.1 Vector String Format</h3>
      <pre><code>CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H</code></pre>
      <p>
        Each metric is abbreviated (AV, AC, PR, UI, S, C, I, A) followed by
        a colon and the value abbreviation (N, L, H, P, R, U, C). The example
        above represents an unauthenticated network-exploitable vulnerability
        with full CIA impact — scoring <strong>9.8 Critical</strong>.
      </p>

      <h2>CVSS 3.1 Score Calculation</h2>
      <p>
        The base score combines an Impact Sub Score (ISS) and an Exploitability
        sub score using this formula:
      </p>
      <pre><code>{`ISS = 1 - [(1-C) * (1-I) * (1-A)]

If Scope = Unchanged:
  Impact = 6.42 * ISS
If Scope = Changed:
  Impact = 7.52 * (ISS-0.029) - 3.25 * (ISS-0.02)^15

Exploitability = 8.22 * AV * AC * PR * UI

If Impact <= 0: Base Score = 0
If Scope = Unchanged: Roundup(min[Impact + Exploitability, 10])
If Scope = Changed: Roundup(min[1.08 * (Impact + Exploitability), 10])`}</code></pre>
      <p>
        The Roundup function returns the smallest number with one decimal place
        that is greater than or equal to the input. This ensures consistent
        rounding across implementations.
      </p>

      <h2>CVSS 4.0 — What Changed</h2>
      <p>
        CVSS 4.0 introduced significant improvements over 3.1. Here are the key
        differences that affect how you score vulnerabilities:
      </p>

      <h3>Scope Is Gone</h3>
      <p>
        The confusing Scope metric has been replaced by separate impact metrics
        for the <strong>Vulnerable System</strong> (VC, VI, VA) and
        the <strong>Subsequent System</strong> (SC, SI, SA). This makes it much
        clearer whether the vulnerability affects the component itself or
        downstream systems.
      </p>

      <h3>New Metrics</h3>
      <ul>
        <li><strong>Attack Requirements (AT)</strong> — replaces some of what Scope covered, representing prerequisite deployment conditions</li>
        <li><strong>User Interaction</strong> now has three values: None, Passive (e.g., visiting a page), Active (e.g., accepting a dialog)</li>
        <li><strong>Threat group</strong> replaces Temporal, with only Exploit Maturity (Attacked, POC, Unreported)</li>
        <li><strong>Supplemental metrics</strong> (Safety, Automatable, Recovery, Value Density) are informational and do not affect the score</li>
      </ul>

      <h3>MacroVector Scoring</h3>
      <p>
        Unlike CVSS 3.1&apos;s direct formula, CVSS 4.0 uses a lookup table of
        270 MacroVectors with interpolation. Each MacroVector groups vectors of
        comparable severity as determined by expert evaluation. The algorithm:
      </p>
      <ol>
        <li>Compute 6 equivalence classes (EQ1-EQ6) from the metrics</li>
        <li>Look up the MacroVector base score from the table</li>
        <li>Calculate severity distance from the highest-severity vector in that MacroVector</li>
        <li>Subtract the mean normalized distance to get the final score</li>
      </ol>

      <h2>Common Vulnerability Scores</h2>
      <p>
        These are typical CVSS scores for common vulnerability types. Use them as
        starting points and adjust based on the specific context:
      </p>
      <table>
        <thead>
          <tr>
            <th>Vulnerability Type</th>
            <th>CVSS 3.1</th>
            <th>CVSS 4.0</th>
            <th>Typical Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Remote Code Execution (unauth)</td><td>9.8</td><td>9.3</td><td>Critical</td></tr>
          <tr><td>SQL Injection (unauth)</td><td>9.1</td><td>9.3</td><td>Critical</td></tr>
          <tr><td>SSRF (internal access)</td><td>8.6</td><td>7.2</td><td>High</td></tr>
          <tr><td>Local Privilege Escalation</td><td>7.8</td><td>8.5</td><td>High</td></tr>
          <tr><td>Denial of Service (remote)</td><td>7.5</td><td>8.7</td><td>High</td></tr>
          <tr><td>Information Disclosure</td><td>7.5</td><td>8.7</td><td>High</td></tr>
          <tr><td>Reflected XSS</td><td>6.1</td><td>5.1</td><td>Medium</td></tr>
          <tr><td>Stored XSS (auth required)</td><td>5.4</td><td>5.1</td><td>Medium</td></tr>
          <tr><td>IDOR (auth required)</td><td>6.5</td><td>7.1</td><td>Medium-High</td></tr>
        </tbody>
      </table>

      <h2>Temporal and Environmental Scores</h2>
      <p>
        The base score reflects the intrinsic severity of a vulnerability. You
        can refine it with:
      </p>
      <ul>
        <li><strong>Temporal / Threat metrics</strong> — account for the current state of exploitation (is there a working exploit? is a patch available?)</li>
        <li><strong>Environmental metrics</strong> — adjust for your specific environment (how important is confidentiality vs. availability for this system?)</li>
      </ul>
      <p>
        In pentest reports, you typically report the base score and note relevant
        temporal factors. Environmental adjustments are usually left to the
        client since they know their own system criticality.
      </p>

      <h2>Tips for Pentest Reports</h2>
      <ul>
        <li>Always include the full CVSS vector string alongside the score so readers can verify and adjust</li>
        <li>Use CVSS 4.0 for new reports when possible — it is the current standard</li>
        <li>Include both base and temporal scores when exploit maturity is known</li>
        <li>Reference the CVSS version used (3.1 vs 4.0) since scores differ between versions</li>
        <li>Common findings like XSS and IDOR have well-established CVSS ranges — deviating significantly needs justification</li>
        <li>For chained vulnerabilities, score the full impact of the chain, not individual steps</li>
        <li>Remember: CVSS measures technical severity, not business risk. A low-CVSS vuln in a critical system may still warrant urgent remediation</li>
      </ul>

      <h2>CVSS 3.1 vs 4.0 — Which to Use?</h2>
      <p>
        As of 2026, both versions are in active use. CVSS 4.0 is the current
        standard and preferred for new assessments. However, many organizations,
        vulnerability databases, and scanning tools still use CVSS 3.1. When in
        doubt, provide both scores. Our{" "}
        <a href="/tools/cvss">CVSS Calculator</a> supports both versions with
        easy tab switching.
      </p>
    </>
  );
}
