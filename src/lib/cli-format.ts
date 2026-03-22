/**
 * CLI Output Formatter logic.
 *
 * Parses ANSI escape codes from terminal output and converts them
 * to styled HTML spans for rendering and screenshot generation.
 * All processing runs 100% client-side.
 */

// ── Types ─────────────────────────────────────────────────────────

export interface ThemeColors {
  name: string;
  label: string;
  bg: string;
  fg: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface FormatOptions {
  theme: string;
  fontSize: number;
  padding: number;
  windowTitle: string;
  showDots: boolean;
  background: BackgroundStyle;
  lineNumbers: boolean;
}

export type BackgroundStyle =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | { type: "none" };

export interface StyledSegment {
  text: string;
  fg: string | null;
  bg: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  dim: boolean;
  strikethrough: boolean;
}

export interface ParsedLine {
  segments: StyledSegment[];
}

// ── Themes ────────────────────────────────────────────────────────

export const THEMES: ThemeColors[] = [
  {
    name: "dracula",
    label: "Dracula",
    bg: "#282a36",
    fg: "#f8f8f2",
    black: "#21222c",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
    blue: "#6272a4",
    magenta: "#ff79c6",
    cyan: "#8be9fd",
    white: "#f8f8f2",
    brightBlack: "#6272a4",
    brightRed: "#ff6e6e",
    brightGreen: "#69ff94",
    brightYellow: "#ffffa5",
    brightBlue: "#d6acff",
    brightMagenta: "#ff92df",
    brightCyan: "#a4ffff",
    brightWhite: "#ffffff",
  },
  {
    name: "monokai",
    label: "Monokai",
    bg: "#272822",
    fg: "#f8f8f2",
    black: "#272822",
    red: "#f92672",
    green: "#a6e22e",
    yellow: "#e6db74",
    blue: "#66d9ef",
    magenta: "#ae81ff",
    cyan: "#66d9ef",
    white: "#f8f8f2",
    brightBlack: "#75715e",
    brightRed: "#f92672",
    brightGreen: "#a6e22e",
    brightYellow: "#e6db74",
    brightBlue: "#66d9ef",
    brightMagenta: "#ae81ff",
    brightCyan: "#66d9ef",
    brightWhite: "#f9f8f5",
  },
  {
    name: "nord",
    label: "Nord",
    bg: "#2e3440",
    fg: "#d8dee9",
    black: "#3b4252",
    red: "#bf616a",
    green: "#a3be8c",
    yellow: "#ebcb8b",
    blue: "#81a1c1",
    magenta: "#b48ead",
    cyan: "#88c0d0",
    white: "#e5e9f0",
    brightBlack: "#4c566a",
    brightRed: "#bf616a",
    brightGreen: "#a3be8c",
    brightYellow: "#ebcb8b",
    brightBlue: "#81a1c1",
    brightMagenta: "#b48ead",
    brightCyan: "#8fbcbb",
    brightWhite: "#eceff4",
  },
  {
    name: "github-dark",
    label: "GitHub Dark",
    bg: "#0d1117",
    fg: "#c9d1d9",
    black: "#484f58",
    red: "#ff7b72",
    green: "#3fb950",
    yellow: "#d29922",
    blue: "#58a6ff",
    magenta: "#bc8cff",
    cyan: "#39d353",
    white: "#b1bac4",
    brightBlack: "#6e7681",
    brightRed: "#ffa198",
    brightGreen: "#56d364",
    brightYellow: "#e3b341",
    brightBlue: "#79c0ff",
    brightMagenta: "#d2a8ff",
    brightCyan: "#56d364",
    brightWhite: "#f0f6fc",
  },
  {
    name: "solarized-dark",
    label: "Solarized Dark",
    bg: "#002b36",
    fg: "#839496",
    black: "#073642",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
    blue: "#268bd2",
    magenta: "#d33682",
    cyan: "#2aa198",
    white: "#eee8d5",
    brightBlack: "#586e75",
    brightRed: "#cb4b16",
    brightGreen: "#586e75",
    brightYellow: "#657b83",
    brightBlue: "#839496",
    brightMagenta: "#6c71c4",
    brightCyan: "#93a1a1",
    brightWhite: "#fdf6e3",
  },
];

export const DEFAULT_OPTIONS: FormatOptions = {
  theme: "dracula",
  fontSize: 14,
  padding: 24,
  windowTitle: "Terminal",
  showDots: true,
  background: { type: "gradient", from: "#6272a4", to: "#ff79c6", angle: 135 },
  lineNumbers: false,
};

export const BACKGROUND_PRESETS: { label: string; style: BackgroundStyle }[] = [
  { label: "Purple-Pink", style: { type: "gradient", from: "#6272a4", to: "#ff79c6", angle: 135 } },
  { label: "Cyan-Green", style: { type: "gradient", from: "#8be9fd", to: "#50fa7b", angle: 135 } },
  { label: "Red-Orange", style: { type: "gradient", from: "#ff5555", to: "#ffb86c", angle: 135 } },
  { label: "Blue-Purple", style: { type: "gradient", from: "#6272a4", to: "#bd93f9", angle: 135 } },
  { label: "Dark Solid", style: { type: "solid", color: "#1a1b26" } },
  { label: "None", style: { type: "none" } },
];

// ── ANSI Parser ───────────────────────────────────────────────────

// Standard ANSI 256-color palette (first 16 match theme, 16-255 are fixed)
const ANSI_256_COLORS: string[] = (() => {
  const palette: string[] = [];
  // 0-15: Filled at render time from the theme
  for (let i = 0; i < 16; i++) palette.push("");
  // 16-231: 6x6x6 color cube
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        const rv = r ? 55 + r * 40 : 0;
        const gv = g ? 55 + g * 40 : 0;
        const bv = b ? 55 + b * 40 : 0;
        palette.push(`rgb(${rv},${gv},${bv})`);
      }
    }
  }
  // 232-255: grayscale
  for (let i = 0; i < 24; i++) {
    const v = 8 + i * 10;
    palette.push(`rgb(${v},${v},${v})`);
  }
  return palette;
})();

function getColorFromIndex(index: number, theme: ThemeColors): string | null {
  if (index < 0 || index > 255) return null;
  if (index < 16) {
    const themeColors = [
      theme.black, theme.red, theme.green, theme.yellow,
      theme.blue, theme.magenta, theme.cyan, theme.white,
      theme.brightBlack, theme.brightRed, theme.brightGreen, theme.brightYellow,
      theme.brightBlue, theme.brightMagenta, theme.brightCyan, theme.brightWhite,
    ];
    return themeColors[index];
  }
  return ANSI_256_COLORS[index];
}

interface AnsiState {
  fg: string | null;
  bg: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  dim: boolean;
  strikethrough: boolean;
}

function defaultState(): AnsiState {
  return { fg: null, bg: null, bold: false, italic: false, underline: false, dim: false, strikethrough: false };
}

/**
 * Parse ANSI escape codes from terminal text and return styled segments.
 * Handles SGR (Select Graphic Rendition) codes: colors, bold, italic, underline, etc.
 */
export function parseAnsi(input: string, theme: ThemeColors): ParsedLine[] {
  const state: AnsiState = defaultState();
  const result: ParsedLine[] = [];

  // ESC[ ... m pattern (SGR)
  const ansiRegex = /\x1b\[([0-9;]*)m/g;
  // Also match escaped representations like \033[ or \x1b[
  const escapedInput = unescapeAnsi(input);
  const escapedLines = escapedInput.split("\n");

  for (const line of escapedLines) {
    const segments: StyledSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex
    ansiRegex.lastIndex = 0;

    while ((match = ansiRegex.exec(line)) !== null) {
      // Add text before this escape code
      if (match.index > lastIndex) {
        const text = line.substring(lastIndex, match.index);
        if (text) {
          segments.push({ text, ...state });
        }
      }

      // Parse SGR codes
      const codes = match[1] ? match[1].split(";").map(Number) : [0];
      processSgrCodes(codes, state, theme);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      segments.push({ text: line.substring(lastIndex), ...state });
    }

    // If line is empty, add an empty segment to preserve the blank line
    if (segments.length === 0) {
      segments.push({ text: "", ...state });
    }

    result.push({ segments });
  }

  return result;
}

/**
 * Convert escaped ANSI representations to actual escape characters.
 * Handles: \033[, \x1b[, \e[
 */
function unescapeAnsi(input: string): string {
  return input
    .replace(/\\033\[/g, "\x1b[")
    .replace(/\\x1[bB]\[/g, "\x1b[")
    .replace(/\\e\[/g, "\x1b[");
}

function processSgrCodes(codes: number[], state: AnsiState, theme: ThemeColors): void {
  let i = 0;
  while (i < codes.length) {
    const code = codes[i];

    if (code === 0) {
      // Reset
      Object.assign(state, defaultState());
    } else if (code === 1) {
      state.bold = true;
    } else if (code === 2) {
      state.dim = true;
    } else if (code === 3) {
      state.italic = true;
    } else if (code === 4) {
      state.underline = true;
    } else if (code === 9) {
      state.strikethrough = true;
    } else if (code === 22) {
      state.bold = false;
      state.dim = false;
    } else if (code === 23) {
      state.italic = false;
    } else if (code === 24) {
      state.underline = false;
    } else if (code === 29) {
      state.strikethrough = false;
    } else if (code >= 30 && code <= 37) {
      // Standard foreground colors
      state.fg = getColorFromIndex(code - 30, theme);
    } else if (code === 38) {
      // Extended foreground: 38;5;n (256-color) or 38;2;r;g;b (truecolor)
      if (i + 1 < codes.length && codes[i + 1] === 5 && i + 2 < codes.length) {
        state.fg = getColorFromIndex(codes[i + 2], theme);
        i += 2;
      } else if (i + 1 < codes.length && codes[i + 1] === 2 && i + 4 < codes.length) {
        state.fg = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`;
        i += 4;
      }
    } else if (code === 39) {
      state.fg = null; // Default foreground
    } else if (code >= 40 && code <= 47) {
      // Standard background colors
      state.bg = getColorFromIndex(code - 40, theme);
    } else if (code === 48) {
      // Extended background
      if (i + 1 < codes.length && codes[i + 1] === 5 && i + 2 < codes.length) {
        state.bg = getColorFromIndex(codes[i + 2], theme);
        i += 2;
      } else if (i + 1 < codes.length && codes[i + 1] === 2 && i + 4 < codes.length) {
        state.bg = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`;
        i += 4;
      }
    } else if (code === 49) {
      state.bg = null; // Default background
    } else if (code >= 90 && code <= 97) {
      // Bright foreground colors
      state.fg = getColorFromIndex(code - 90 + 8, theme);
    } else if (code >= 100 && code <= 107) {
      // Bright background colors
      state.bg = getColorFromIndex(code - 100 + 8, theme);
    }

    i++;
  }
}

// ── Preset Examples ───────────────────────────────────────────────

export interface PresetExample {
  label: string;
  title: string;
  content: string;
}

export const PRESET_EXAMPLES: PresetExample[] = [
  {
    label: "Nmap Scan",
    title: "nmap -sV -sC 10.10.10.10",
    content: `\x1b[1;32mStarting Nmap 7.94\x1b[0m ( https://nmap.org )
Nmap scan report for \x1b[1;37m10.10.10.10\x1b[0m
Host is up (\x1b[32m0.045s\x1b[0m latency).
Not shown: \x1b[33m997 closed ports\x1b[0m

\x1b[1mPORT    STATE SERVICE  VERSION\x1b[0m
\x1b[32m22/tcp  open  ssh      OpenSSH 8.9p1\x1b[0m
\x1b[32m80/tcp  open  http     Apache httpd 2.4.52\x1b[0m
\x1b[32m443/tcp open  ssl/http Apache httpd 2.4.52\x1b[0m

Service detection performed. Please report any incorrect results.
\x1b[1;32mNmap done:\x1b[0m 1 IP address (1 host up) scanned in \x1b[33m12.34\x1b[0m seconds`,
  },
  {
    label: "Gobuster",
    title: "gobuster dir -u http://10.10.10.10 -w common.txt",
    content: `\x1b[33m===============================================================\x1b[0m
\x1b[33mGobuster v3.6\x1b[0m
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
\x1b[33m===============================================================\x1b[0m
[\x1b[34m+\x1b[0m] Url:            http://10.10.10.10
[\x1b[34m+\x1b[0m] Threads:        10
[\x1b[34m+\x1b[0m] Wordlist:       /usr/share/wordlists/common.txt
\x1b[33m===============================================================\x1b[0m
\x1b[32m/admin\x1b[0m               (Status: \x1b[32m200\x1b[0m) [Size: 1234]
\x1b[32m/api\x1b[0m                 (Status: \x1b[32m301\x1b[0m) [Size: 312]
\x1b[31m/backup\x1b[0m              (Status: \x1b[31m403\x1b[0m) [Size: 277]
\x1b[32m/config\x1b[0m              (Status: \x1b[32m200\x1b[0m) [Size: 890]
\x1b[32m/login\x1b[0m               (Status: \x1b[32m200\x1b[0m) [Size: 2341]
\x1b[32m/uploads\x1b[0m             (Status: \x1b[32m301\x1b[0m) [Size: 318]
\x1b[33m===============================================================\x1b[0m
\x1b[33mFinished\x1b[0m`,
  },
  {
    label: "SQLMap",
    title: "sqlmap -u http://target/page?id=1",
    content: `        ___
       __H__
 ___ ___[\x1b[32m'\x1b[0m]_____ ___ ___  {\x1b[33m1.8\x1b[0m}
|_ -| . [\x1b[32m.\x1b[0m]     | .\x1b[32m'\x1b[0m| . |
|___|_  [\x1b[32m)\x1b[0m_|_|_|__,|  _|
      |_|V...       |_|  https://sqlmap.org

[\x1b[34m*\x1b[0m] starting @ 14:23:01

[\x1b[32mINFO\x1b[0m] testing connection to the target URL
[\x1b[32mINFO\x1b[0m] testing if the target URL content is stable
[\x1b[32mINFO\x1b[0m] target URL content is stable
[\x1b[32mINFO\x1b[0m] testing if GET parameter 'id' is dynamic
[\x1b[33mWARNING\x1b[0m] GET parameter 'id' does not appear to be dynamic
[\x1b[32mINFO\x1b[0m] heuristic (basic) test shows that GET parameter 'id' might be injectable
[\x1b[1;32m14:23:05\x1b[0m] [\x1b[1;32mINFO\x1b[0m] GET parameter 'id' is \x1b[1;31mvulnerable\x1b[0m
[\x1b[1;32mINFO\x1b[0m] the back-end DBMS is \x1b[1;36mMySQL\x1b[0m`,
  },
  {
    label: "Hashcat",
    title: "hashcat -m 0 hashes.txt rockyou.txt",
    content: `\x1b[37mhashcat (v6.2.6) starting\x1b[0m

\x1b[33mOpenCL API (OpenCL 3.0) - Platform #1 [Intel]\x1b[0m
=================================================
* Device #1: Intel UHD Graphics, \x1b[32m3072/6144 MB\x1b[0m, 24MCU

Minimum password length supported: \x1b[36m0\x1b[0m
Maximum password length supported: \x1b[36m256\x1b[0m

Dictionary cache built:
* Filename..: rockyou.txt
* Passwords.: \x1b[33m14344392\x1b[0m
* Keyspace..: \x1b[33m14344385\x1b[0m

\x1b[32m5d41402abc4b2a76b9719d911017c592:hello\x1b[0m
\x1b[32me99a18c428cb38d5f260853678922e03:abc123\x1b[0m
\x1b[32m098f6bcd4621d373cade4e832627b4f6:test\x1b[0m

Session..........: hashcat
Status...........: \x1b[1;32mCracked\x1b[0m
Hash.Mode........: 0 (MD5)
Speed.#1.........: \x1b[36m1234.5 MH/s\x1b[0m
Recovered........: \x1b[32m3/3 (100.00%)\x1b[0m digests
Progress.........: 14344385/14344385 (100.00%)`,
  },
  {
    label: "ls -la",
    title: "ls -la /var/www",
    content: `total 24
\x1b[1;34mdrwxr-xr-x\x1b[0m  6 \x1b[33mwww-data\x1b[0m \x1b[33mwww-data\x1b[0m 4096 Mar 15 09:42 \x1b[1;34m.\x1b[0m
\x1b[1;34mdrwxr-xr-x\x1b[0m 14 \x1b[33mroot\x1b[0m     \x1b[33mroot\x1b[0m     4096 Jan  8 14:22 \x1b[1;34m..\x1b[0m
-rw-r--r--   1 \x1b[33mwww-data\x1b[0m \x1b[33mwww-data\x1b[0m  612 Mar 15 09:42 index.html
-rw-r--r--   1 \x1b[33mwww-data\x1b[0m \x1b[33mwww-data\x1b[0m 2048 Mar 14 17:33 config.php
\x1b[1;31m-rwsr-xr-x\x1b[0m   1 \x1b[33mroot\x1b[0m     \x1b[33mroot\x1b[0m    16712 Feb  2 11:01 \x1b[1;31msuid_binary\x1b[0m
\x1b[1;36mlrwxrwxrwx\x1b[0m   1 \x1b[33mroot\x1b[0m     \x1b[33mroot\x1b[0m       24 Jan  8 14:22 \x1b[1;36m.secret -> /etc/shadow\x1b[0m`,
  },
];

// ── Theme Helpers ─────────────────────────────────────────────────

export function getTheme(name: string): ThemeColors {
  return THEMES.find((t) => t.name === name) ?? THEMES[0];
}

/**
 * Convert background style to CSS for the outer wrapper.
 */
export function backgroundToCSS(bg: BackgroundStyle): string {
  switch (bg.type) {
    case "solid":
      return bg.color;
    case "gradient":
      return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
    case "none":
      return "transparent";
  }
}
