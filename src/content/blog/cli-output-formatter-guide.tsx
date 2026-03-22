import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "cli-output-formatter-guide",
  title: "Terminal Screenshot Guide 2026 — Generate Beautiful CLI Output Images for Pentest Reports",
  description:
    "Complete guide to generating professional terminal screenshots for pentest reports, documentation, and blog posts. Covers ANSI color codes, terminal themes, export options, and tips for making security tool output look great.",
  date: "2026-03-22",
  author: "4252nez",
  keywords: [
    "terminal screenshot generator",
    "CLI output formatter",
    "terminal to image",
    "ANSI color codes",
    "pentest report screenshots",
    "terminal beautifier",
    "code screenshot tool",
    "nmap output screenshot",
    "terminal image generator",
  ],
  relatedTool: "cli-format",
};

export function Content() {
  return (
    <>
      <p>
        Whether you are writing a penetration test report, creating a blog post
        about a CTF challenge, or building documentation for a security tool, you
        need clean and readable terminal screenshots. Simply screenshotting your
        terminal often produces inconsistent results depending on your font size,
        window dimensions, and color scheme. A terminal screenshot generator
        solves this by producing styled, consistent images every time.
      </p>
      <p>
        Use our <a href="/tools/cli-format">CLI Output Formatter</a> to
        instantly generate Dracula-themed terminal screenshots with ANSI color
        support, or read on for the full guide.
      </p>

      <h2>Why Use a Terminal Screenshot Generator?</h2>
      <p>
        Taking screenshots of your terminal has several problems that a
        dedicated formatter solves:
      </p>
      <ul>
        <li>
          <strong>Inconsistent appearance</strong> — Different terminals,
          themes, and font sizes produce different-looking screenshots.
        </li>
        <li>
          <strong>Hard to read</strong> — Small font sizes, poor contrast,
          and window chrome all reduce readability.
        </li>
        <li>
          <strong>Non-portable</strong> — Screenshots depend on your local
          environment and are not reproducible.
        </li>
        <li>
          <strong>OPSEC concerns</strong> — Terminal screenshots may reveal
          your hostname, username, working directory, or other sensitive
          information visible in the prompt.
        </li>
        <li>
          <strong>Not text-selectable</strong> — Readers cannot copy
          commands or output from a screenshot image.
        </li>
      </ul>
      <p>
        A terminal screenshot generator takes raw text (with or without ANSI
        color codes) and renders it into a professional-looking image with a
        consistent theme, customizable options, and no leaking of local
        environment details.
      </p>

      <h2>Understanding ANSI Escape Codes</h2>
      <p>
        ANSI escape codes are special sequences that terminals interpret to
        apply colors, bold text, underlines, and other formatting to output.
        Most security tools like nmap, gobuster, sqlmap, and hashcat use ANSI
        codes to colorize their output.
      </p>
      <p>
        The basic format is <code>ESC[&lt;code&gt;m</code> where ESC is the
        escape character (hex 0x1B, octal 033). Common codes include:
      </p>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>0</td><td>Reset all attributes</td></tr>
          <tr><td>1</td><td>Bold</td></tr>
          <tr><td>2</td><td>Dim</td></tr>
          <tr><td>3</td><td>Italic</td></tr>
          <tr><td>4</td><td>Underline</td></tr>
          <tr><td>30-37</td><td>Standard foreground colors (black, red, green, yellow, blue, magenta, cyan, white)</td></tr>
          <tr><td>40-47</td><td>Standard background colors</td></tr>
          <tr><td>90-97</td><td>Bright foreground colors</td></tr>
          <tr><td>38;5;N</td><td>256-color foreground</td></tr>
          <tr><td>38;2;R;G;B</td><td>24-bit truecolor foreground</td></tr>
        </tbody>
      </table>
      <p>
        For example, <code>\033[31mERROR\033[0m</code> renders the word
        &quot;ERROR&quot; in red. When you copy text from your terminal, these codes
        are usually stripped. To preserve them, redirect output to a file using
        tools like <code>script</code> or <code>unbuffer</code>.
      </p>

      <h2>Capturing Terminal Output with Colors</h2>
      <p>
        The challenge with terminal screenshots is preserving the ANSI color
        information. Here are the most reliable methods:
      </p>

      <h3>Method 1: script command</h3>
      <pre><code>script -q output.log nmap -sV 10.10.10.10</code></pre>
      <p>
        The <code>script</code> command records everything printed to the
        terminal, including ANSI escape codes. The <code>-q</code> flag
        suppresses the &quot;Script started&quot; / &quot;Script done&quot; messages.
      </p>

      <h3>Method 2: unbuffer</h3>
      <pre><code>unbuffer nmap -sV 10.10.10.10 &gt; output.log</code></pre>
      <p>
        Many programs disable color output when they detect their stdout is
        not a terminal. <code>unbuffer</code> (from the expect package) tricks
        the program into thinking it is running in a terminal, preserving color
        output even when redirecting to a file.
      </p>

      <h3>Method 3: Force color flags</h3>
      <p>
        Some tools have explicit flags to force color output:
      </p>
      <ul>
        <li><code>grep --color=always</code></li>
        <li><code>ls --color=always</code></li>
        <li><code>git log --color=always</code></li>
      </ul>

      <h2>Choosing a Terminal Theme</h2>
      <p>
        The theme determines how ANSI color codes are rendered. The same
        terminal output can look dramatically different depending on the theme.
        Popular themes for security work include:
      </p>
      <ul>
        <li>
          <strong>Dracula</strong> — A dark theme with vibrant colors and
          excellent readability. The default for OffSecKit and popular among
          developers and security professionals.
        </li>
        <li>
          <strong>Monokai</strong> — A classic dark theme known for its warm
          tones and comfortable contrast.
        </li>
        <li>
          <strong>Nord</strong> — A cool, muted palette inspired by Arctic
          colors. Great for presentations where you want a subtle look.
        </li>
        <li>
          <strong>GitHub Dark</strong> — Matches the GitHub dark mode aesthetic,
          ideal for README screenshots.
        </li>
        <li>
          <strong>Solarized Dark</strong> — Scientifically designed for optimal
          readability with carefully balanced contrast ratios.
        </li>
      </ul>

      <h2>Tips for Great Pentest Report Screenshots</h2>
      <p>
        When including terminal output in a professional penetration test
        report, follow these best practices:
      </p>
      <ol>
        <li>
          <strong>Use descriptive window titles</strong> — Instead of a generic
          &quot;Terminal&quot; title, use the actual command you ran, like
          &quot;nmap -sV -sC 10.10.10.10&quot;. This provides context
          without requiring the reader to find the command in the output.
        </li>
        <li>
          <strong>Trim unnecessary output</strong> — Remove verbose startup
          banners or irrelevant lines. Show only the evidence that supports
          your finding.
        </li>
        <li>
          <strong>Use consistent theming</strong> — Pick one theme and stick
          with it throughout the entire report for a professional look.
        </li>
        <li>
          <strong>Consider padding and font size</strong> — Reports are
          often viewed in PDF format. Ensure the font size is large enough to
          read in print (14px+ recommended).
        </li>
        <li>
          <strong>Redact sensitive information</strong> — Replace real client
          IP addresses, hostnames, and credentials with sanitized values
          before generating the screenshot.
        </li>
      </ol>

      <h2>Web Tool vs. CLI</h2>
      <p>
        OffSecKit offers both a browser-based and CLI version of the output
        formatter:
      </p>
      <ul>
        <li>
          <strong>Browser version</strong> — Paste terminal output, customize
          themes and options visually, preview in real time, and export PNG
          images. Best for one-off screenshots and when you want visual
          customization.
        </li>
        <li>
          <strong>CLI version (<code>osk format</code>)</strong> — Pipe
          terminal output through the formatter to add a styled window frame.
          Supports stripping ANSI codes and output statistics. Best for
          scripted workflows and integration with existing toolchains.
        </li>
      </ul>
      <pre><code>{`# Browser: paste output at offseckit.com/tools/cli-format

# CLI: pipe any command output through the formatter
nmap -sV 10.10.10.10 | osk format render --title "Nmap Scan"

# Strip ANSI codes for clean text
cat colored-output.log | osk format strip`}</code></pre>

      <h2>Common Use Cases</h2>
      <ul>
        <li>Penetration test reports and executive summaries</li>
        <li>Bug bounty submission evidence</li>
        <li>CTF writeups and walkthroughs</li>
        <li>Security tool documentation and READMEs</li>
        <li>Blog posts and tutorials</li>
        <li>Training materials and presentations</li>
        <li>Incident response documentation</li>
      </ul>
    </>
  );
}
