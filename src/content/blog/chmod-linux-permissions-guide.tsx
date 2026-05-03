import type { BlogPost } from "@/lib/blog";

export const meta: BlogPost = {
  slug: "chmod-linux-permissions-guide",
  title: "Chmod Cheat Sheet 2026 — Linux Permissions",
  description:
    "Practical chmod cheat sheet covering octal vs symbolic notation, setuid/setgid/sticky bits, common modes (755, 644, 600, 1777), and how to hunt setuid binaries during privilege escalation.",
  date: "2026-05-03",
  author: "4252nez",
  keywords: [
    "chmod cheat sheet",
    "chmod calculator",
    "linux permissions",
    "chmod 755",
    "chmod 644",
    "chmod 777",
    "setuid setgid sticky",
    "rwx permissions",
    "find perm 4000",
    "linux privilege escalation",
  ],
  relatedTool: "chmod",
};

export function Content() {
  return (
    <>
      <p>
        Linux file permissions are the foundation of every Unix-like system. They
        decide who can read your config files, run your binaries, and modify
        files on shared servers. Misconfigured permissions are one of the most
        common privilege-escalation vectors in CTFs and real engagements.
      </p>
      <p>
        This guide is a practical reference for both directions: making sense of
        what <code>chmod 4755 file</code> actually does, and quickly translating
        between octal, symbolic, and POSIX notation. Use our{" "}
        <a href="/tools/chmod" className="underline">
          chmod calculator
        </a>{" "}
        for instant conversions, or run <code>osk chmod</code> from the
        terminal.
      </p>

      <h2>The 9-bit base model</h2>
      <p>
        A standard Unix file mode is nine bits split into three triples — owner,
        group, and other — each encoding read, write, and execute:
      </p>
      <pre><code>{`r w x   r w x   r w x
4 2 1   4 2 1   4 2 1
[owner] [group] [other]`}</code></pre>
      <p>
        Each octal digit is the sum of the bits you want to set. Read is 4,
        write is 2, execute is 1. So mode <code>755</code> means owner gets
        4+2+1 = 7 (rwx), group gets 4+1 = 5 (r-x), and other gets 4+1 = 5
        (r-x), which prints as <code>rwxr-xr-x</code> in <code>ls -l</code>.
      </p>

      <h2>The fourth digit: setuid, setgid, sticky</h2>
      <p>
        Modes can have a leading fourth octal digit packing three special bits:
      </p>
      <table>
        <thead>
          <tr>
            <th>Bit</th>
            <th>Octal</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>setuid</td>
            <td>4000</td>
            <td>
              On a binary, runs as the file&apos;s owner. Used by{" "}
              <code>/usr/bin/sudo</code>, <code>/usr/bin/passwd</code>,{" "}
              <code>/usr/bin/su</code>.
            </td>
          </tr>
          <tr>
            <td>setgid</td>
            <td>2000</td>
            <td>
              On a binary, runs as the file&apos;s group. On a directory, new
              files inherit the directory&apos;s group — common pattern for
              shared project directories.
            </td>
          </tr>
          <tr>
            <td>sticky</td>
            <td>1000</td>
            <td>
              On a directory, only the file&apos;s owner can delete files in
              it. Used by <code>/tmp</code> (mode <code>1777</code>) so users
              cannot remove each other&apos;s temp files.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        These bits show up in <code>ls -l</code> overlaid on the execute slot:
        lowercase <code>s</code>/<code>t</code> when execute is also set,
        capital <code>S</code>/<code>T</code> when it is not.
      </p>

      <h2>Common modes you should memorize</h2>
      <table>
        <thead>
          <tr>
            <th>Octal</th>
            <th>rwx</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>755</td>
            <td>rwxr-xr-x</td>
            <td>Executables, traversable directories — the default for most things.</td>
          </tr>
          <tr>
            <td>644</td>
            <td>rw-r--r--</td>
            <td>Regular files (HTML, configs, source code).</td>
          </tr>
          <tr>
            <td>700</td>
            <td>rwx------</td>
            <td>Private user directory. Required for the user&apos;s .ssh directory.</td>
          </tr>
          <tr>
            <td>600</td>
            <td>rw-------</td>
            <td>Private file. Required for SSH private keys.</td>
          </tr>
          <tr>
            <td>640</td>
            <td>rw-r-----</td>
            <td>Group-readable config (e.g., <code>/etc/shadow</code> with the <code>shadow</code> group).</td>
          </tr>
          <tr>
            <td>1777</td>
            <td>rwxrwxrwt</td>
            <td>Sticky world-writable directory (the <code>/tmp</code> pattern).</td>
          </tr>
          <tr>
            <td>4755</td>
            <td>rwsr-xr-x</td>
            <td>Setuid binary running as its owner — typical for sudo, passwd.</td>
          </tr>
          <tr>
            <td>2755</td>
            <td>rwxr-sr-x</td>
            <td>Setgid binary, or setgid directory for inherited group ownership.</td>
          </tr>
          <tr>
            <td>777</td>
            <td>rwxrwxrwx</td>
            <td>Almost always a misconfiguration. Use <code>1777</code> if you actually need shared write.</td>
          </tr>
        </tbody>
      </table>

      <h2>Octal vs symbolic notation</h2>
      <p>
        Both forms are accepted by chmod and produce identical results. Pick
        whichever is easier for the change you are making.
      </p>
      <p>
        <strong>Octal</strong> is best when you want to set a mode absolutely:
      </p>
      <pre><code>{`chmod 755 script.sh
chmod 644 config.yaml
chmod 600 .ssh/id_ed25519
chmod 1777 /tmp
chmod 4755 /usr/local/bin/pingtool`}</code></pre>
      <p>
        <strong>Symbolic</strong> is best when you want a relative change to an
        existing mode:
      </p>
      <pre><code>{`# Add execute for everyone
chmod a+x script.sh

# Make a file private (owner-only)
chmod go-rwx secret.key

# Set owner rwx, group/other rx, regardless of current mode
chmod u=rwx,go=rx file

# Add the setuid bit
chmod u+s binary

# Add the sticky bit
chmod +t shared_dir`}</code></pre>
      <p>
        The symbolic form&apos;s grammar is{" "}
        <code>[ugoa]*[+\-=][rwxXstugo]*</code>, optionally repeated and
        comma-separated. <code>u</code> = user/owner, <code>g</code> = group,{" "}
        <code>o</code> = other, <code>a</code> = all. Operators are{" "}
        <code>+</code> (add), <code>-</code> (remove), <code>=</code> (set
        exactly).
      </p>

      <h2>Privilege-escalation hunting (pentesters)</h2>
      <p>
        When you land on a target, weird permissions are gold. Here are the
        searches every Linux pentester runs first:
      </p>
      <pre><code>{`# Setuid binaries — the classic privesc target
find / -perm -4000 -type f 2>/dev/null

# Setgid binaries — less common but still useful
find / -perm -2000 -type f 2>/dev/null

# World-writable directories without sticky — anyone can delete files
find / -perm -2 -type d -not -perm -1000 2>/dev/null

# World-writable files (excluding /proc churn)
find / -perm -2 -type f -not -path '/proc/*' 2>/dev/null

# Files writable by the current user (very useful on shared boxes)
find / -writable -not -path '/proc/*' 2>/dev/null`}</code></pre>
      <p>
        For the setuid hits, cross-reference{" "}
        <a
          href="https://gtfobins.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GTFOBins
        </a>{" "}
        — most common setuid binaries (vim, less, find, awk, python) have
        well-known privesc recipes when they run as root. A custom in-house
        setuid binary deserves an immediate strings + ltrace + reverse engineer
        pass.
      </p>

      <h2>Risky permission patterns</h2>
      <ul>
        <li>
          <strong>chmod 777</strong> on production files: any local user can
          tamper. Replace with <code>755</code> for executables, <code>644</code>{" "}
          for files, or <code>1777</code> if you genuinely need a shared
          writable dir.
        </li>
        <li>
          <strong>setuid + world-writable</strong>: an attacker can overwrite
          the binary with their own payload and it will execute as the owner.
          Immediate root if the file is owned by root.
        </li>
        <li>
          <strong>setuid on a shell script</strong>: most modern Linux kernels
          ignore setuid on interpreted scripts (race-condition mitigation), but
          older kernels and BSDs may honor it. Either way, dangerous.
        </li>
        <li>
          <strong>World-writable directory without sticky</strong>: anyone can
          delete other users&apos; files. The <code>/tmp</code> pattern always
          uses sticky for this reason.
        </li>
        <li>
          <strong>SSH keys with mode 644 or wider</strong>: OpenSSH refuses to
          use them. Set keys to <code>600</code> and the directory to{" "}
          <code>700</code>.
        </li>
      </ul>

      <h2>umask: the default-permissions filter</h2>
      <p>
        New files do not start with mode <code>666</code> — your{" "}
        <code>umask</code> is subtracted (logically AND-NOT&apos;d) from the
        requested mode at creation time. A typical umask is <code>022</code>{" "}
        which strips group and other write:
      </p>
      <pre><code>{`# umask 022:
#   files created with 666 -> end up 644
#   dirs created with 777 -> end up 755

# umask 077 (paranoid, owner-only):
#   files created with 666 -> end up 600
#   dirs created with 777 -> end up 700`}</code></pre>
      <p>
        Set <code>umask 077</code> in your shell rc file when you handle
        sensitive files (private keys, credentials, pentest data).
      </p>

      <h2>Recursive chmod (and why -R is dangerous)</h2>
      <p>
        <code>chmod -R 755 dir/</code> applies <code>755</code> to every file
        and every subdirectory. That is fine for directories but typically wrong
        for files — most files should be <code>644</code>, not <code>755</code>.
        Use the capital-X trick to apply execute only to dirs and files that
        already had it:
      </p>
      <pre><code>{`# Files become 644, dirs become 755:
chmod -R u=rwX,go=rX webapp/`}</code></pre>
      <p>
        Capital <code>X</code> means &quot;execute only if it&apos;s a directory
        or already has any execute bit set&quot;. Combined with the symbolic
        form, this is the cleanest way to fix a recursively wrong tree.
      </p>

      <h2>Command-line usage</h2>
      <p>
        Run <code>osk chmod</code> for a one-shot conversion or explanation
        without opening a browser:
      </p>
      <pre><code>{`# Install
pip install offseckit

# Convert and explain
osk chmod 755
osk chmod rwxr-xr-x
osk chmod 4755 --explain

# Apply POSIX symbolic notation against a base mode
osk chmod 644 --apply u+x

# Risky-permission warnings only
osk chmod 4777 --warnings

# JSON output for scripting
osk chmod 4755 --json

# Print the find(1) recipes for privesc hunting
osk chmod hunt`}</code></pre>
    </>
  );
}
