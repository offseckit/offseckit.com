import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import HeadersTool from "./HeadersTool";

const tool = getToolBySlug("headers")!;

export const metadata: Metadata = {
  title: "HTTP Security Headers Analyzer - Check Headers Online | OffSecKit",
  description:
    "Analyze HTTP response headers for security misconfigurations. Check HSTS, CSP, X-Frame-Options, and more with remediation guidance. Paste headers from curl or Burp. Free, 100% client-side.",
  keywords: [
    "security headers check",
    "HTTP security headers analyzer",
    "security headers scanner",
    "HTTP header checker",
    "content security policy checker",
    "HSTS checker",
    "security headers test",
    "check security headers online",
    "HTTP response headers security",
    "missing security headers",
    "security headers grade",
    "CSP analyzer",
    "X-Frame-Options check",
    "OWASP security headers",
    "HTTP header security audit",
    "security headers remediation",
  ],
  openGraph: {
    title: "HTTP Header Security Analyzer - Free Online | OffSecKit",
    description:
      "Paste HTTP response headers and get instant security analysis with grades, CSP evaluation, and remediation guidance. 100% client-side.",
    url: "https://offseckit.com/tools/headers",
  },
};

const faq = [
  {
    question: "What are HTTP security headers?",
    answer:
      "HTTP security headers are response headers that web servers send to browsers to enable security features. They protect against common attacks like cross-site scripting (XSS), clickjacking, MIME-type sniffing, protocol downgrade attacks, and cross-origin data leaks. Key headers include Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy. The OWASP Secure Headers Project maintains the definitive list of recommended headers and values.",
  },
  {
    question: "How do I get HTTP response headers to paste into this tool?",
    answer:
      "You can get response headers using several methods: (1) curl: run 'curl -sI https://example.com' to print only headers. (2) Browser DevTools: open Network tab, click a request, and view Response Headers. (3) Burp Suite: inspect responses in the Proxy or Repeater tab. (4) wget: run 'wget --server-response -q -O /dev/null https://example.com'. Copy the header output and paste it directly into this tool for analysis.",
  },
  {
    question: "Are my headers sent to any server for analysis?",
    answer:
      "No. All analysis runs 100% in your browser using JavaScript. No data is transmitted to any server. This makes it safe to analyze headers from internal applications, staging environments, or targets during authorized penetration testing engagements where confidentiality is critical.",
  },
  {
    question: "What is Content-Security-Policy (CSP) and why is it important?",
    answer:
      "Content-Security-Policy is an HTTP header that tells the browser which content sources are allowed on a page. It mitigates XSS attacks by restricting where scripts, styles, images, and other resources can be loaded from. A strong CSP uses 'self' for default-src, avoids 'unsafe-inline' and 'unsafe-eval', blocks object-src, and restricts frame-ancestors. This tool performs directive-level CSP analysis to identify weaknesses like wildcard sources, unsafe directives, and missing restrictions.",
  },
  {
    question: "What does HSTS (Strict-Transport-Security) do?",
    answer:
      "HSTS tells browsers to only connect to the site over HTTPS, preventing protocol downgrade attacks and cookie hijacking. Once a browser sees the HSTS header, it will refuse to connect over HTTP for the duration specified by max-age. The includeSubDomains directive extends this protection to all subdomains. The preload directive allows the domain to be included in browser preload lists, providing HSTS protection even on the first visit. OWASP recommends a max-age of at least 2 years (63072000 seconds).",
  },
  {
    question: "How is the security grade calculated?",
    answer:
      "The grade is calculated based on the presence and correct configuration of security headers. Core headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) are weighted most heavily. Missing core headers result in larger score deductions than missing optional headers. Deprecated headers (X-XSS-Protection, Expect-CT) and information disclosure headers (Server, X-Powered-By) also reduce the score. CSP directive-level issues like unsafe-inline or wildcard sources cause additional deductions. The score maps to grades: A+ (95-100), A (80-94), B (65-79), C (50-64), D (35-49), F (0-34).",
  },
];

export default function HeadersPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/headers">
      <HeadersTool />
    </ToolLayout>
  );
}
