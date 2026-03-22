import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import XSSGenerator from "./XSSGenerator";

const tool = getToolBySlug("xss")!;

export const metadata: Metadata = {
  title: "XSS Payload Generator - Cross-Site Scripting Cheat Sheet | OffSecKit",
  description:
    "Generate context-aware XSS payloads with WAF bypass variants, filter evasion techniques, and encoding options. Free XSS cheat sheet and payload generator. 100% client-side.",
  keywords: [
    "XSS payloads",
    "XSS cheat sheet",
    "cross site scripting payloads",
    "XSS payload generator",
    "XSS filter bypass",
    "XSS WAF bypass",
    "XSS payload list",
    "XSS attack payloads",
    "XSS injection payloads",
    "cross site scripting cheat sheet",
    "XSS bypass techniques",
    "XSS encoding",
    "reflected XSS payloads",
    "stored XSS payloads",
    "DOM XSS payloads",
    "XSS polyglot",
  ],
  openGraph: {
    title: "XSS Payload Generator - Free Online | OffSecKit",
    description:
      "Context-aware XSS payload generator with WAF bypass profiles, filter evasion, encoding options, and polyglot payloads. Free XSS cheat sheet for pentesters.",
    url: "https://offseckit.com/tools/xss",
  },
};

const faq = [
  {
    question: "What is Cross-Site Scripting (XSS)?",
    answer:
      "Cross-Site Scripting (XSS) is a web security vulnerability that allows attackers to inject malicious scripts into web pages viewed by other users. It occurs when an application includes untrusted data in its output without proper validation or encoding. XSS can be used to steal session cookies, redirect users, deface websites, or perform actions on behalf of the victim. There are three main types: Reflected XSS (payload in the request), Stored XSS (payload saved in the database), and DOM-based XSS (payload processed by client-side JavaScript).",
  },
  {
    question: "What is the difference between reflected, stored, and DOM-based XSS?",
    answer:
      "Reflected XSS occurs when malicious input is immediately reflected back in the server response — for example, a search query displayed on the results page. Stored XSS happens when the payload is permanently saved (e.g., in a database) and served to other users who view the affected page, like a malicious comment on a forum. DOM-based XSS occurs entirely in the browser when client-side JavaScript processes user-controlled data and writes it to the DOM without sanitization, never sending the payload to the server.",
  },
  {
    question: "Why is injection context important for XSS payloads?",
    answer:
      "The injection context determines which characters and constructs are available to break out of the current syntax and execute JavaScript. For example, if your input lands inside a double-quoted HTML attribute, you need to close the quote first. If it lands inside a JavaScript string, you need to break the string with the matching quote character. Using the wrong payload for the context will fail even if the application has no XSS protections. This tool lets you select the exact injection point so every generated payload is tailored to work in that context.",
  },
  {
    question: "How do WAF bypass payloads work?",
    answer:
      "Web Application Firewalls (WAFs) use pattern matching and regex rules to block known XSS patterns like <script> tags and common event handlers. WAF bypass payloads use techniques such as case variation, unusual HTML tags, less common event handlers (onbegin, ontoggle, onpageshow), encoding tricks, whitespace insertion (tabs, newlines between attributes), and HTML parser quirks to evade these rules while still executing JavaScript in the browser. Different WAFs have different rule sets, so payloads effective against one WAF may not work against another.",
  },
  {
    question: "What are polyglot XSS payloads?",
    answer:
      "Polyglot payloads are crafted to work across multiple injection contexts simultaneously. They combine quote-breaking characters, tag closers, event handlers, and JavaScript protocol handlers in a single string so that regardless of whether the injection lands in an HTML body, attribute, JavaScript string, or URL context, the payload will execute. Polyglots are useful during initial testing when you haven't yet determined the exact injection context, though they tend to be longer and more likely to be caught by WAFs.",
  },
  {
    question: "Does this tool perform actual XSS attacks?",
    answer:
      "No. This tool is a payload generator that runs 100% in your browser. It generates XSS payload strings that you can copy and test against applications you are authorized to test. No data is sent to any server, no requests are made, and no websites are attacked. Only use these payloads on systems where you have explicit written authorization for security testing.",
  },
];

export default function XSSPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/xss">
      <XSSGenerator />
    </ToolLayout>
  );
}
