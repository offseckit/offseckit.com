import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import SQLiGenerator from "./SQLiGenerator";

const tool = getToolBySlug("sqli")!;

export const metadata: Metadata = {
  title: "SQL Injection Payload Generator - SQLi Cheat Sheet | OffSecKit",
  description:
    "Generate context-aware SQL injection payloads for MySQL, MSSQL, PostgreSQL, Oracle, and SQLite. UNION, blind, error-based, stacked queries with WAF bypass variants. Free SQLi cheat sheet. 100% client-side.",
  keywords: [
    "SQL injection cheat sheet",
    "SQL injection payloads",
    "SQLi payload generator",
    "SQL injection WAF bypass",
    "SQL injection testing",
    "UNION injection",
    "blind SQL injection",
    "error based SQL injection",
    "stacked queries SQL injection",
    "SQL injection MySQL",
    "SQL injection MSSQL",
    "SQL injection PostgreSQL",
    "SQL injection Oracle",
    "SQL injection SQLite",
    "SQLi cheat sheet",
    "SQL injection authentication bypass",
  ],
  openGraph: {
    title: "SQL Injection Payload Generator - Free Online | OffSecKit",
    description:
      "Context-aware SQL injection payload generator for MySQL, MSSQL, PostgreSQL, Oracle, and SQLite. UNION, blind, error-based, and stacked queries with WAF bypass variants. Free SQLi cheat sheet for pentesters.",
    url: "https://offseckit.com/tools/sqli",
  },
};

const faq = [
  {
    question: "What is SQL injection (SQLi)?",
    answer:
      "SQL injection is a web security vulnerability that allows an attacker to interfere with the queries an application makes to its database. By inserting malicious SQL code into user inputs (like login forms, search fields, or URL parameters), attackers can read, modify, or delete data, bypass authentication, and in some cases execute commands on the underlying server. It remains one of the OWASP Top 10 most critical web application security risks.",
  },
  {
    question: "What is the difference between UNION, blind, and error-based SQL injection?",
    answer:
      "UNION-based injection appends a second SELECT query to extract data directly in the response. Boolean blind injection infers data by observing whether true/false conditions change the application response. Time-based blind injection uses database sleep functions to cause measurable delays that reveal information. Error-based injection extracts data from database error messages by forcing type conversion or XML parsing errors. Stacked queries execute entirely new SQL statements using semicolons, enabling INSERT, UPDATE, DELETE, or even OS command execution.",
  },
  {
    question: "Why does the database type matter for SQL injection payloads?",
    answer:
      "Each database engine has different SQL syntax, functions, system tables, and capabilities. For example, MySQL uses SLEEP() for time delays while MSSQL uses WAITFOR DELAY. MySQL stores metadata in information_schema while Oracle uses all_tables and all_tab_columns. MSSQL supports xp_cmdshell for OS command execution while PostgreSQL uses COPY TO PROGRAM. Using the wrong syntax for the target database will cause payloads to fail.",
  },
  {
    question: "What is the injection context and why does it matter?",
    answer:
      "The injection context refers to how user input is embedded in the SQL query. In a numeric context (WHERE id = INJECT), no quotes need to be escaped. In a single-quoted string context (WHERE name = 'INJECT'), the payload must first close the single quote. In a double-quoted context, the double quote must be closed. Using the correct breakout character for your context is essential for the payload to work.",
  },
  {
    question: "How do WAF bypass techniques work for SQL injection?",
    answer:
      "WAFs use pattern matching to detect SQL injection attempts. Bypass techniques exploit differences between how the WAF parses input and how the database interprets it. Case swapping (SeLeCt instead of SELECT) bypasses case-sensitive regex rules. Inline comments (SEL/**/ECT) break up keywords the WAF looks for. URL encoding (%27 for single quote) may bypass string matching. Whitespace variants (tabs instead of spaces) evade rigid pattern matching. These techniques can be combined for more effective bypasses.",
  },
  {
    question: "Does this tool perform actual SQL injection attacks?",
    answer:
      "No. This tool is a payload generator that runs 100% in your browser. It generates SQL injection payload strings that you can copy and test against applications you are authorized to test. No data is sent to any server, no database connections are made, and no websites are attacked. Only use these payloads on systems where you have explicit written authorization for security testing.",
  },
];

export default function SQLiPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/sqli">
      <SQLiGenerator />
    </ToolLayout>
  );
}
