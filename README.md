# >_ OffSecKit

**Free, browser-based offensive security toolkit for pentesters, red teamers, and bug bounty hunters.**

**https://offseckit.com**

Every tool runs 100% client-side — no data leaves your browser. No accounts, no tracking, no BS.

## Tools

| Tool | Status | Web | CLI |
|------|--------|-----|-----|
| [Reverse Shell Generator](https://offseckit.com/tools/revshell) | Live | [Use it](https://offseckit.com/tools/revshell) | [revshell](https://github.com/offseckit/revshell) |
| Encoding/Decoding Multi-Tool | Coming soon | — | — |
| Hash Identifier & Generator | Coming soon | — | — |
| JWT Decoder & Analyzer | Coming soon | — | — |
| Nmap Command Builder | Coming soon | — | — |
| XSS Payload Generator | Coming soon | — | — |
| HTTP Header Security Analyzer | Coming soon | — | — |
| CVSS Calculator | Coming soon | — | — |
| Subnet/CIDR Calculator | Coming soon | — | — |
| CLI Output Formatter | Coming soon | — | — |

## CLI Tools

Each tool is also available as a standalone CLI tool, installable via pip:

```bash
pip install offseckit-revshell
```

See [all CLI tools](https://github.com/offseckit) on GitHub.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/offseckit/offseckit.com.git
cd offseckit.com
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
```

Static output goes to `out/`.

## Tech Stack

- **Framework**: Next.js (App Router, static export)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Theme**: Dracula-inspired dark UI

## Contributing

Found a bug? Missing a shell variant? PRs welcome.

## License

MIT
