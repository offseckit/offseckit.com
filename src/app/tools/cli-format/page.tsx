import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import CliFormatTool from "./CliFormatTool";

const tool = getToolBySlug("cli-format")!;

export const metadata: Metadata = {
  title: "CLI Output Formatter — Terminal Screenshot Generator | OffSecKit",
  description:
    "Free online terminal screenshot generator. Paste terminal output, apply Dracula-themed syntax highlighting with ANSI color support, and export beautiful PNG images. 100% client-side.",
  keywords: [
    "terminal screenshot generator",
    "command output formatter",
    "terminal to image",
    "CLI output beautifier",
    "terminal screenshot online",
    "code screenshot generator",
    "terminal output to image",
    "ANSI color screenshot",
    "terminal image generator",
    "CLI screenshot tool",
    "terminal output formatter",
    "carbon alternative terminal",
    "nmap output screenshot",
    "pentest report screenshot",
  ],
  openGraph: {
    title: "CLI Output Formatter — Terminal Screenshot Generator | OffSecKit",
    description:
      "Paste terminal output and generate styled, Dracula-themed screenshots with ANSI color support. Free, 100% client-side terminal screenshot generator.",
    url: "https://offseckit.com/tools/cli-format",
  },
};

const faq = [
  {
    question: "What is a terminal screenshot generator?",
    answer:
      "A terminal screenshot generator converts text-based terminal output into a styled image with a terminal window frame, syntax highlighting, and custom themes. Instead of taking actual screenshots of your terminal (which depend on your local settings), this tool produces consistent, professional-looking images perfect for documentation, blog posts, presentations, and pentest reports.",
  },
  {
    question: "Does this tool support ANSI escape codes?",
    answer:
      "Yes. The formatter parses standard ANSI SGR escape codes including 8 basic colors, 8 bright colors, 256-color mode, and 24-bit truecolor (RGB). It also handles bold, italic, underline, dim, and strikethrough attributes. You can paste output directly from tools like nmap, gobuster, sqlmap, hashcat, and any other program that uses ANSI colors.",
  },
  {
    question: "How do I paste terminal output with colors?",
    answer:
      "Most terminal emulators strip ANSI codes when copying text. To preserve colors, you can: (1) redirect output to a file with 'script' or 'unbuffer', (2) use tools like 'ansifilter' to convert output, or (3) manually include escape codes in the format \\033[31m for red text, \\033[32m for green, etc. The tool also recognizes \\x1b[ and \\e[ escape sequences.",
  },
  {
    question: "What themes are available?",
    answer:
      "The tool ships with five terminal themes: Dracula (default, matching the OffSecKit design), Monokai, Nord, GitHub Dark, and Solarized Dark. Each theme defines the full 16-color ANSI palette plus background and foreground colors, so your terminal output looks authentic in any theme.",
  },
  {
    question: "What export formats are supported?",
    answer:
      "Currently the tool exports PNG images at 2x resolution for crisp display on retina screens. You can download the image as a file or copy it directly to your clipboard. The export includes the terminal window frame, title bar, traffic light dots, and your chosen background gradient or solid color.",
  },
  {
    question: "Is my terminal output sent to any server?",
    answer:
      "No. All processing runs 100% in your browser using JavaScript and the HTML Canvas API. No data is transmitted to any server. This makes it safe to format output containing internal IP addresses, credentials, vulnerability details, and other sensitive information from penetration tests.",
  },
];

export default function CliFormatPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/cli-format">
      <CliFormatTool />
    </ToolLayout>
  );
}
