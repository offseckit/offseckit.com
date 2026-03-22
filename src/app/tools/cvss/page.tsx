import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import CvssTool from "./CvssTool";

const tool = getToolBySlug("cvss")!;

export const metadata: Metadata = {
  title: "CVSS Calculator — CVSS 3.1 & 4.0 Score Calculator Online | OffSecKit",
  description:
    "Free online CVSS calculator supporting both CVSS 3.1 and CVSS 4.0. Build vectors interactively, calculate base/temporal/environmental scores in real time, parse existing vectors, and score common vulnerability types. 100% client-side.",
  keywords: [
    "CVSS calculator",
    "CVSS 3.1 calculator",
    "CVSS 4.0 calculator",
    "CVSS score calculator",
    "vulnerability scoring",
    "CVSS vector builder",
    "CVSS base score",
    "CVSS vector string",
    "CVSS calculator online",
    "vulnerability severity calculator",
    "CVSS temporal score",
    "CVSS environmental score",
    "CVSS severity rating",
    "common vulnerability scoring system",
    "FIRST CVSS calculator",
  ],
  openGraph: {
    title: "CVSS Calculator — CVSS 3.1 & 4.0 Online | OffSecKit",
    description:
      "Interactive CVSS 3.1 and 4.0 vector builder with real-time score calculation. Parse vectors, use vulnerability presets, and calculate base, temporal, and environmental scores. Free, 100% client-side.",
    url: "https://offseckit.com/tools/cvss",
  },
};

const faq = [
  {
    question: "What is CVSS and why is it important?",
    answer:
      "CVSS (Common Vulnerability Scoring System) is an open framework maintained by FIRST.org for communicating the severity of security vulnerabilities. It produces a numerical score between 0 and 10 that reflects the severity of a vulnerability. CVSS scores are used by security teams to prioritize remediation, by vulnerability databases like NVD and CVE, and in compliance frameworks like PCI DSS. Understanding CVSS is essential for penetration testers, vulnerability analysts, and security engineers.",
  },
  {
    question: "What is the difference between CVSS 3.1 and CVSS 4.0?",
    answer:
      "CVSS 4.0 (released November 2023) introduces several improvements over 3.1. Key differences include: replacing the Scope metric with separate Vulnerable and Subsequent System impact metrics, adding Attack Requirements (AT) for prerequisite conditions, splitting User Interaction into None/Passive/Active instead of None/Required, renaming Temporal to Threat (with simplified Exploit Maturity only), and using a MacroVector-based scoring algorithm instead of the mathematical formula used in 3.1. CVSS 4.0 also adds optional Supplemental metrics like Safety, Automatable, and Recovery.",
  },
  {
    question: "How is the CVSS base score calculated?",
    answer:
      "For CVSS 3.1, the base score is calculated using formulas defined by FIRST: the Impact Sub Score (ISS) combines Confidentiality, Integrity, and Availability impacts, then the Impact score applies different weights based on whether Scope is Changed or Unchanged. The Exploitability sub score multiplies weights for Attack Vector, Attack Complexity, Privileges Required, and User Interaction. The final base score combines these with a Roundup function. For CVSS 4.0, scoring uses a MacroVector lookup table with interpolation rather than a direct formula.",
  },
  {
    question: "Are my vulnerability details sent to any server?",
    answer:
      "No. All CVSS calculations run 100% in your browser using JavaScript. No data is transmitted to any server. This makes it safe to score vulnerabilities from confidential penetration test reports, internal security assessments, or classified environments where data must not leave your machine.",
  },
  {
    question: "What are the CVSS severity ratings?",
    answer:
      "CVSS scores map to five severity ratings: None (0.0), Low (0.1 - 3.9), Medium (4.0 - 6.9), High (7.0 - 8.9), and Critical (9.0 - 10.0). These ratings are the same for both CVSS 3.1 and 4.0. A Critical rating like 9.8 typically indicates a remotely exploitable vulnerability requiring no privileges or user interaction with high impact across confidentiality, integrity, and availability.",
  },
  {
    question: "Can I parse an existing CVSS vector string?",
    answer:
      "Yes. Paste any CVSS 3.1 vector (starting with CVSS:3.1/) or CVSS 4.0 vector (starting with CVSS:4.0/) into the Parse Vector input and click Parse. The calculator will automatically detect the version, populate all metrics, and display the calculated score. This is useful when reviewing CVE entries, vendor advisories, or pentest reports that include CVSS vectors.",
  },
];

export default function CvssPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/cvss">
      <CvssTool />
    </ToolLayout>
  );
}
