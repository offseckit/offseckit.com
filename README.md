# >_ OffSecKit

**Free, browser-based offensive security toolkit for pentesters, red teamers, and bug bounty hunters.**

**https://offseckit.com**

Every tool runs 100% client-side — no data leaves your browser. No accounts, no tracking, no BS.

## Tools

| Tool | Web | CLI |
|------|-----|-----|
| Reverse Shell Generator | [Use it](https://offseckit.com/tools/revshell) | `osk revshell` |
| Encoding/Decoding Multi-Tool | [Use it](https://offseckit.com/tools/encode) | `osk encode` |
| Hash Identifier & Generator | [Use it](https://offseckit.com/tools/hash) | `osk hash` |
| JWT Decoder & Analyzer | [Use it](https://offseckit.com/tools/jwt) | `osk jwt` |
| Nmap Command Builder | [Use it](https://offseckit.com/tools/nmap) | `osk nmap` |
| XSS Payload Generator | [Use it](https://offseckit.com/tools/xss) | `osk xss` |
| SQL Injection Payload Generator | [Use it](https://offseckit.com/tools/sqli) | `osk sqli` |
| HTTP Header Security Analyzer | [Use it](https://offseckit.com/tools/headers) | `osk headers` |
| CVSS Calculator | [Use it](https://offseckit.com/tools/cvss) | `osk cvss` |
| Subnet/CIDR Calculator | [Use it](https://offseckit.com/tools/subnet) | `osk subnet` |
| CLI Output Formatter | [Use it](https://offseckit.com/tools/cli-format) | `osk format` |
| Wordlist / Password Mutation Generator | [Use it](https://offseckit.com/tools/wordlist) | `osk wordlist` |

## CLI

All tools are available via `osk`, our unified CLI toolkit:

```bash
pip install offseckit
```

```bash
osk revshell -i 10.10.10.10 -l python
osk encode -o base64-encode "Hello World"
osk hash id 5d41402abc4b2a76b9719d911017c592
osk jwt decode eyJhbGciOiJIUzI1NiIs...
osk nmap build -t 10.10.10.0/24 --syn --top-ports 1000
osk xss gen --context html-attr --action alert
osk sqli gen -d mysql -t union -c 3
curl -sI https://example.com | osk headers analyze
```

See [offseckit/osk](https://github.com/offseckit/osk) for full documentation.

## Development

```bash
git clone https://github.com/offseckit/offseckit.com.git
cd offseckit.com
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework**: Next.js (App Router, static export)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Theme**: Dracula-inspired dark UI

## Contributing

Found a bug? Missing a feature? PRs welcome.

## License

MIT
