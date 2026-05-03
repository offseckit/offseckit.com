/**
 * Chmod / Linux Permissions Calculator logic.
 * All operations run client-side; pure functions only.
 *
 * Mode is represented as a 12-bit integer:
 *   bits 0..2  → other  (r=4, w=2, x=1)
 *   bits 3..5  → group  (r=4, w=2, x=1)
 *   bits 6..8  → owner  (r=4, w=2, x=1)
 *   bit 9      → sticky (1000 octal)
 *   bit 10     → setgid (2000 octal)
 *   bit 11     → setuid (4000 octal)
 *
 * Range: 0..0o7777 (decimal 0..4095)
 */

export type Who = "owner" | "group" | "other";
export type Perm = "read" | "write" | "execute";
export type SpecialBit = "setuid" | "setgid" | "sticky";

export const MODE_MAX = 0o7777;

// ── Bit math ───────────────────────────────────────────────────────

const PERM_OFFSET: Record<Who, number> = {
  owner: 6,
  group: 3,
  other: 0,
};

const PERM_BIT: Record<Perm, number> = {
  read: 4,
  write: 2,
  execute: 1,
};

const SPECIAL_BIT: Record<SpecialBit, number> = {
  setuid: 0o4000,
  setgid: 0o2000,
  sticky: 0o1000,
};

export function hasPerm(mode: number, who: Who, perm: Perm): boolean {
  return ((mode >> PERM_OFFSET[who]) & PERM_BIT[perm]) !== 0;
}

export function setPerm(mode: number, who: Who, perm: Perm, on: boolean): number {
  const bit = PERM_BIT[perm] << PERM_OFFSET[who];
  return on ? mode | bit : mode & ~bit;
}

export function hasSpecial(mode: number, bit: SpecialBit): boolean {
  return (mode & SPECIAL_BIT[bit]) !== 0;
}

export function setSpecial(mode: number, bit: SpecialBit, on: boolean): number {
  return on ? mode | SPECIAL_BIT[bit] : mode & ~SPECIAL_BIT[bit];
}

// ── Octal formatting ───────────────────────────────────────────────

/**
 * Format mode as octal. Always returns 4 digits (e.g., "0755", "4755").
 */
export function toOctal4(mode: number): string {
  const m = clampMode(mode);
  return m.toString(8).padStart(4, "0");
}

/**
 * Format mode as octal, omitting leading zero when special bits are unused.
 * Always returns at least 3 digits.
 */
export function toOctal(mode: number): string {
  const m = clampMode(mode);
  const special = (m >> 9) & 0o7;
  if (special === 0) return (m & 0o777).toString(8).padStart(3, "0");
  return m.toString(8).padStart(4, "0");
}

export function clampMode(mode: number): number {
  if (!Number.isFinite(mode)) return 0;
  const m = Math.trunc(mode);
  if (m < 0) return 0;
  if (m > MODE_MAX) return MODE_MAX;
  return m;
}

/**
 * Parse octal string. Accepts 3 or 4 digit forms ("755", "0755", "4755").
 * Returns null when the input is invalid.
 */
export function parseOctal(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^[0-7]{1,4}$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 8);
  if (Number.isNaN(n)) return null;
  if (n < 0 || n > MODE_MAX) return null;
  return n;
}

// ── Symbolic (rwx) string ──────────────────────────────────────────

/**
 * Render the 9-character permission string (e.g., "rwxr-xr-x") with optional
 * special-bit overlay (setuid/setgid/sticky), as printed in `ls -l`.
 *
 * Examples:
 *   0o755 → "rwxr-xr-x"
 *   0o4755 → "rwsr-xr-x"
 *   0o4644 → "rwSr--r--"
 *   0o1777 → "rwxrwxrwt"
 *   0o1666 → "rw-rw-rwT"
 */
export function toRwxString(mode: number): string {
  const m = clampMode(mode);
  const setuid = hasSpecial(m, "setuid");
  const setgid = hasSpecial(m, "setgid");
  const sticky = hasSpecial(m, "sticky");

  const ownerR = hasPerm(m, "owner", "read") ? "r" : "-";
  const ownerW = hasPerm(m, "owner", "write") ? "w" : "-";
  const ownerXBit = hasPerm(m, "owner", "execute");
  const ownerX = setuid ? (ownerXBit ? "s" : "S") : ownerXBit ? "x" : "-";

  const groupR = hasPerm(m, "group", "read") ? "r" : "-";
  const groupW = hasPerm(m, "group", "write") ? "w" : "-";
  const groupXBit = hasPerm(m, "group", "execute");
  const groupX = setgid ? (groupXBit ? "s" : "S") : groupXBit ? "x" : "-";

  const otherR = hasPerm(m, "other", "read") ? "r" : "-";
  const otherW = hasPerm(m, "other", "write") ? "w" : "-";
  const otherXBit = hasPerm(m, "other", "execute");
  const otherX = sticky ? (otherXBit ? "t" : "T") : otherXBit ? "x" : "-";

  return `${ownerR}${ownerW}${ownerX}${groupR}${groupW}${groupX}${otherR}${otherW}${otherX}`;
}

/**
 * Parse a 9- or 10-character ls -l permission string back into a mode.
 * Accepts both "rwxr-xr-x" and "-rwxr-xr-x" (with file-type prefix).
 * Returns null on invalid input.
 */
export function parseRwxString(input: string): number | null {
  let s = input.trim();
  if (s.length === 10) {
    // Strip leading file-type char (-, d, l, c, b, p, s)
    if (!/^[-dlcbpsDLCBPS]/.test(s)) return null;
    s = s.slice(1);
  }
  if (s.length !== 9) return null;
  if (!/^[-rwxsStT]{9}$/.test(s)) return null;

  let mode = 0;

  // Owner
  if (s[0] === "r") mode |= PERM_BIT.read << PERM_OFFSET.owner;
  else if (s[0] !== "-") return null;

  if (s[1] === "w") mode |= PERM_BIT.write << PERM_OFFSET.owner;
  else if (s[1] !== "-") return null;

  if (s[2] === "x") mode |= PERM_BIT.execute << PERM_OFFSET.owner;
  else if (s[2] === "s") {
    mode |= PERM_BIT.execute << PERM_OFFSET.owner;
    mode |= SPECIAL_BIT.setuid;
  } else if (s[2] === "S") {
    mode |= SPECIAL_BIT.setuid;
  } else if (s[2] !== "-") return null;

  // Group
  if (s[3] === "r") mode |= PERM_BIT.read << PERM_OFFSET.group;
  else if (s[3] !== "-") return null;

  if (s[4] === "w") mode |= PERM_BIT.write << PERM_OFFSET.group;
  else if (s[4] !== "-") return null;

  if (s[5] === "x") mode |= PERM_BIT.execute << PERM_OFFSET.group;
  else if (s[5] === "s") {
    mode |= PERM_BIT.execute << PERM_OFFSET.group;
    mode |= SPECIAL_BIT.setgid;
  } else if (s[5] === "S") {
    mode |= SPECIAL_BIT.setgid;
  } else if (s[5] !== "-") return null;

  // Other
  if (s[6] === "r") mode |= PERM_BIT.read << PERM_OFFSET.other;
  else if (s[6] !== "-") return null;

  if (s[7] === "w") mode |= PERM_BIT.write << PERM_OFFSET.other;
  else if (s[7] !== "-") return null;

  if (s[8] === "x") mode |= PERM_BIT.execute << PERM_OFFSET.other;
  else if (s[8] === "t") {
    mode |= PERM_BIT.execute << PERM_OFFSET.other;
    mode |= SPECIAL_BIT.sticky;
  } else if (s[8] === "T") {
    mode |= SPECIAL_BIT.sticky;
  } else if (s[8] !== "-") return null;

  return mode;
}

// ── Symbolic notation parser (POSIX-style) ─────────────────────────

// Subset of POSIX chmod symbolic mode:
//   <whoList><op><permList>[,<whoList><op><permList>...]
//   whoList: any of [ugoa]*
//   op: one of [+-=]
//   permList: any of [rwxXstugo]*  (capital X, s, t, u/g/o copy-from)
//
// Examples accepted:
//   "u+x"           — add execute for owner
//   "go-w"          — remove write for group/other
//   "a=rw"          — set all to read+write only
//   "u=rwx,go=rx"   — owner rwx, group/other rx
//   "+x"            — add execute for all (subject to umask in POSIX, but
//                     our tool treats empty whoList as "a")
//   "u+s"           — set the setuid bit
//   "g+s"           — set the setgid bit
//   "+t"            — set the sticky bit (whoList ignored for t)
//   "o=u-w"         — copy owner perms to other, then remove write (we
//                     support u/g/o copy permissions)

interface SymbolicClause {
  who: Set<Who>;
  op: "+" | "-" | "=";
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
  perms: Set<Perm>;
  copyFrom: Who | null;
  /** When true, X (capital) — adds execute only if mode is a dir or already has any execute bit. */
  conditionalExecute: boolean;
}

function expandWho(who: string): Set<Who> {
  const set = new Set<Who>();
  for (const c of who) {
    if (c === "u") set.add("owner");
    else if (c === "g") set.add("group");
    else if (c === "o") set.add("other");
    else if (c === "a") {
      set.add("owner");
      set.add("group");
      set.add("other");
    }
  }
  return set;
}

function parseSymbolicClause(raw: string): SymbolicClause | null {
  const m = raw.match(/^([ugoa]*)([+\-=])([rwxXstugo]*)$/);
  if (!m) return null;

  const whoStr = m[1];
  const op = m[2] as "+" | "-" | "=";
  const permStr = m[3];

  const who = whoStr.length === 0 ? expandWho("a") : expandWho(whoStr);

  const clause: SymbolicClause = {
    who,
    op,
    setuid: false,
    setgid: false,
    sticky: false,
    perms: new Set(),
    copyFrom: null,
    conditionalExecute: false,
  };

  for (const c of permStr) {
    if (c === "r") clause.perms.add("read");
    else if (c === "w") clause.perms.add("write");
    else if (c === "x") clause.perms.add("execute");
    else if (c === "X") clause.conditionalExecute = true;
    else if (c === "s") {
      clause.setuid = true;
      clause.setgid = true;
    } else if (c === "t") {
      clause.sticky = true;
    } else if (c === "u" || c === "g" || c === "o") {
      // Copy permissions from a who. POSIX says only one of u/g/o, last wins.
      clause.copyFrom = c === "u" ? "owner" : c === "g" ? "group" : "other";
    }
  }

  return clause;
}

function getPermsFor(mode: number, who: Who): Set<Perm> {
  const s = new Set<Perm>();
  if (hasPerm(mode, who, "read")) s.add("read");
  if (hasPerm(mode, who, "write")) s.add("write");
  if (hasPerm(mode, who, "execute")) s.add("execute");
  return s;
}

function applyClause(
  mode: number,
  clause: SymbolicClause,
  isDirectory: boolean,
): number {
  let next = mode;

  // Resolve permissions to apply for this clause. If copyFrom is set, use the
  // (possibly restricted) perms from that who.
  const basePerms = clause.copyFrom
    ? getPermsFor(next, clause.copyFrom)
    : new Set(clause.perms);

  for (const w of clause.who) {
    const perms = new Set(basePerms);

    // Capital X: treat as execute if mode is a dir OR already has any execute bit.
    if (clause.conditionalExecute) {
      const anyExec =
        hasPerm(next, "owner", "execute") ||
        hasPerm(next, "group", "execute") ||
        hasPerm(next, "other", "execute");
      if (isDirectory || anyExec) perms.add("execute");
    }

    if (clause.op === "=") {
      // Clear all three perms for this who, then set the new ones
      next = setPerm(next, w, "read", false);
      next = setPerm(next, w, "write", false);
      next = setPerm(next, w, "execute", false);
      for (const p of perms) next = setPerm(next, w, p, true);
      // = also clears the corresponding special bit when whoList specified
      if (w === "owner") next = setSpecial(next, "setuid", false);
      if (w === "group") next = setSpecial(next, "setgid", false);
    } else if (clause.op === "+") {
      for (const p of perms) next = setPerm(next, w, p, true);
    } else {
      for (const p of perms) next = setPerm(next, w, p, false);
    }
  }

  // Special-bit handling. Per POSIX:
  //   u+s  → setuid
  //   g+s  → setgid
  //   +s (whoList=a) → both setuid and setgid (most implementations)
  //   +t  → sticky (regardless of whoList)
  const whoIsAll =
    clause.who.has("owner") && clause.who.has("group") && clause.who.has("other");

  if (clause.setuid) {
    const apply = clause.who.has("owner") || whoIsAll;
    if (apply) {
      if (clause.op === "+" || clause.op === "=") {
        next = setSpecial(next, "setuid", true);
      } else {
        next = setSpecial(next, "setuid", false);
      }
    }
  }
  if (clause.setgid) {
    const apply = clause.who.has("group") || whoIsAll;
    if (apply) {
      if (clause.op === "+" || clause.op === "=") {
        next = setSpecial(next, "setgid", true);
      } else {
        next = setSpecial(next, "setgid", false);
      }
    }
  }
  if (clause.sticky) {
    if (clause.op === "+" || clause.op === "=") {
      next = setSpecial(next, "sticky", true);
    } else {
      next = setSpecial(next, "sticky", false);
    }
  }

  return next;
}

export interface SymbolicApplyResult {
  mode: number;
  warnings: string[];
}

/**
 * Apply a POSIX-style symbolic mode string to a base mode.
 * Multiple clauses can be comma-separated.
 *
 * Throws an Error on invalid input.
 */
export function applySymbolic(
  baseMode: number,
  symbolic: string,
  options: { isDirectory?: boolean } = {},
): SymbolicApplyResult {
  const trimmed = symbolic.trim();
  if (!trimmed) throw new Error("Empty symbolic notation");

  let mode = clampMode(baseMode);
  const warnings: string[] = [];

  const clauses = trimmed.split(",");
  for (const raw of clauses) {
    const clause = parseSymbolicClause(raw.trim());
    if (!clause) {
      throw new Error(`Invalid symbolic clause: "${raw.trim()}"`);
    }
    mode = applyClause(mode, clause, options.isDirectory ?? false);
  }

  return { mode, warnings };
}

/**
 * Convert a mode into the canonical "u=rwx,g=rx,o=rx" symbolic form.
 * Suitable for `chmod u=rwx,g=rx,o=rx file`.
 */
export function toSymbolicEquals(mode: number): string {
  const m = clampMode(mode);
  const groups: string[] = [];

  const buildGroup = (label: string, who: Who) => {
    let s = "";
    if (hasPerm(m, who, "read")) s += "r";
    if (hasPerm(m, who, "write")) s += "w";
    if (hasPerm(m, who, "execute")) s += "x";
    return `${label}=${s}`;
  };

  groups.push(buildGroup("u", "owner"));
  groups.push(buildGroup("g", "group"));
  groups.push(buildGroup("o", "other"));

  // Add special bits as separate clauses for clarity
  const specials: string[] = [];
  if (hasSpecial(m, "setuid")) specials.push("u+s");
  if (hasSpecial(m, "setgid")) specials.push("g+s");
  if (hasSpecial(m, "sticky")) specials.push("+t");

  return [...groups, ...specials].join(",");
}

/**
 * Convert a mode into a delta-style notation (only enabled bits).
 * Useful when the receiver wants additive notation.
 *
 * Example: 0o755 → "u+rwx,g+rx,o+rx"
 *          0o4755 → "u+rwxs,g+rx,o+rx"
 *          0o000  → "a-rwx"
 */
export function toSymbolicDelta(mode: number): string {
  const m = clampMode(mode);
  const parts: string[] = [];

  const ownerBits: string[] = [];
  if (hasPerm(m, "owner", "read")) ownerBits.push("r");
  if (hasPerm(m, "owner", "write")) ownerBits.push("w");
  if (hasPerm(m, "owner", "execute")) ownerBits.push("x");
  if (hasSpecial(m, "setuid")) ownerBits.push("s");
  if (ownerBits.length) parts.push(`u+${ownerBits.join("")}`);

  const groupBits: string[] = [];
  if (hasPerm(m, "group", "read")) groupBits.push("r");
  if (hasPerm(m, "group", "write")) groupBits.push("w");
  if (hasPerm(m, "group", "execute")) groupBits.push("x");
  if (hasSpecial(m, "setgid")) groupBits.push("s");
  if (groupBits.length) parts.push(`g+${groupBits.join("")}`);

  const otherBits: string[] = [];
  if (hasPerm(m, "other", "read")) otherBits.push("r");
  if (hasPerm(m, "other", "write")) otherBits.push("w");
  if (hasPerm(m, "other", "execute")) otherBits.push("x");
  if (hasSpecial(m, "sticky")) otherBits.push("t");
  if (otherBits.length) parts.push(`o+${otherBits.join("")}`);

  return parts.length ? parts.join(",") : "a-rwx";
}

// ── Risk warnings ──────────────────────────────────────────────────

export interface PermissionWarning {
  level: "info" | "warn" | "danger";
  title: string;
  detail: string;
}

export function getWarnings(mode: number): PermissionWarning[] {
  const m = clampMode(mode);
  const warnings: PermissionWarning[] = [];

  const worldWrite = hasPerm(m, "other", "write");
  const sticky = hasSpecial(m, "sticky");
  const setuid = hasSpecial(m, "setuid");
  const setgid = hasSpecial(m, "setgid");

  // 777 / world fully open
  if (
    hasPerm(m, "other", "read") &&
    hasPerm(m, "other", "write") &&
    hasPerm(m, "other", "execute") &&
    hasPerm(m, "group", "write") &&
    !sticky
  ) {
    warnings.push({
      level: "danger",
      title: "World-writable and world-executable (mode 777)",
      detail:
        "Any local user can read, modify, and execute this resource. Avoid 777 in production. For directories where multiple users must write, use 1777 (sticky bit) like /tmp.",
    });
  } else if (worldWrite && !sticky) {
    warnings.push({
      level: "warn",
      title: "World-writable without sticky bit",
      detail:
        "Any local user can modify or delete this. For shared directories use sticky (1xxx) so only the owner of a file may delete it. Hunt these on a target with: find / -perm -2 -type d -not -perm -1000 2>/dev/null",
    });
  }

  if (setuid) {
    warnings.push({
      level: "warn",
      title: "Setuid bit is set",
      detail:
        "When executed, the binary runs with the file owner's privileges. If owned by root and writable by anyone (or it links to a writable library / spawns a shell), it is a privilege-escalation vector. Pentesters: find / -perm -4000 -type f 2>/dev/null",
    });
    if (worldWrite) {
      warnings.push({
        level: "danger",
        title: "Setuid + world-writable",
        detail:
          "A setuid binary that any user can overwrite is an immediate privilege escalation. Remove world-write or clear setuid.",
      });
    }
  }

  if (setgid) {
    warnings.push({
      level: "info",
      title: "Setgid bit is set",
      detail:
        "On a binary, executes with the file's group privileges. On a directory, new files inherit the directory's group (useful for shared project dirs). Hunt on a target: find / -perm -2000 -type f 2>/dev/null",
    });
  }

  if (sticky && !hasPerm(m, "other", "execute")) {
    warnings.push({
      level: "info",
      title: "Sticky bit set without other-execute",
      detail:
        "Sticky bit only takes effect on directories with execute set for others. The capital T in ls -l output flags this dormant state.",
    });
  }

  if (
    !hasPerm(m, "owner", "read") &&
    !hasPerm(m, "owner", "write") &&
    !hasPerm(m, "owner", "execute")
  ) {
    warnings.push({
      level: "warn",
      title: "Owner has no permissions",
      detail:
        "The owner cannot read, write, or execute this file. This is unusual and often unintentional — most software assumes owner access.",
    });
  }

  return warnings;
}

// ── Presets ────────────────────────────────────────────────────────

export interface PermissionPreset {
  octal: string;
  mode: number;
  label: string;
  detail: string;
  audience: "common" | "secure" | "special";
}

export const PRESETS: PermissionPreset[] = [
  {
    octal: "755",
    mode: 0o755,
    label: "Directories / executables",
    detail: "Owner full, group/other read+execute. The de-facto default for binaries and traversable directories.",
    audience: "common",
  },
  {
    octal: "644",
    mode: 0o644,
    label: "Regular files",
    detail: "Owner read+write, group/other read-only. The standard mode for non-executable files.",
    audience: "common",
  },
  {
    octal: "700",
    mode: 0o700,
    label: "Private directory (.ssh)",
    detail: "Owner-only access. Required by OpenSSH for the user's .ssh directory.",
    audience: "secure",
  },
  {
    octal: "600",
    mode: 0o600,
    label: "Private file (SSH key)",
    detail: "Owner read+write only. Required by OpenSSH for private keys; ssh refuses to use a key with looser perms.",
    audience: "secure",
  },
  {
    octal: "640",
    mode: 0o640,
    label: "Group-readable config",
    detail: "Owner read+write, group read-only, other none. Common for service config files (e.g., /etc/shadow uses 640 root:shadow).",
    audience: "secure",
  },
  {
    octal: "777",
    mode: 0o777,
    label: "Fully open (avoid)",
    detail: "Anyone on the system can read, write, and execute. Almost always a mistake outside of /tmp-style sticky dirs.",
    audience: "common",
  },
  {
    octal: "1777",
    mode: 0o1777,
    label: "Sticky world-writable (/tmp)",
    detail: "World-writable directory where users can only delete their own files. Used by /tmp and /var/tmp.",
    audience: "special",
  },
  {
    octal: "4755",
    mode: 0o4755,
    label: "Setuid binary",
    detail: "Runs as the file owner regardless of caller. Common pattern for /usr/bin/sudo, /usr/bin/passwd. A pentest target.",
    audience: "special",
  },
  {
    octal: "2755",
    mode: 0o2755,
    label: "Setgid binary / dir",
    detail: "On a binary, runs as the file's group. On a directory, new files inherit the directory's group.",
    audience: "special",
  },
];

// ── Bit breakdown for the UI ───────────────────────────────────────

export interface BitRow {
  octal: string;
  binary: string;
  weight: number;
  label: string;
  meaning: string;
  set: boolean;
}

export function getBitBreakdown(mode: number): BitRow[] {
  const m = clampMode(mode);
  const rows: BitRow[] = [];

  const push = (
    weight: number,
    label: string,
    meaning: string,
  ) => {
    rows.push({
      octal: weight.toString(8).padStart(4, "0"),
      binary: weight.toString(2).padStart(12, "0"),
      weight,
      label,
      meaning,
      set: (m & weight) !== 0,
    });
  };

  push(0o4000, "setuid", "Run with the file owner's privileges. Privesc target if owned by root.");
  push(0o2000, "setgid", "On binaries: run with file group. On dirs: new files inherit the dir's group.");
  push(0o1000, "sticky", "Only the file owner can delete files in this directory.");
  push(0o0400, "owner read", "Owner can read the file's contents.");
  push(0o0200, "owner write", "Owner can modify the file.");
  push(0o0100, "owner execute", "Owner can execute the file or traverse the directory.");
  push(0o0040, "group read", "Members of the file's group can read.");
  push(0o0020, "group write", "Members of the file's group can modify.");
  push(0o0010, "group execute", "Members of the file's group can execute or traverse.");
  push(0o0004, "other read", "Anyone on the system can read.");
  push(0o0002, "other write", "Anyone on the system can modify. Almost always a misconfiguration.");
  push(0o0001, "other execute", "Anyone on the system can execute or traverse.");

  return rows;
}

// ── Sum-of-octal-digits explanation ────────────────────────────────

/**
 * Build a human-readable arithmetic explanation:
 *   0o755 → "7 = 4+2+1 (rwx)  5 = 4+1 (r-x)  5 = 4+1 (r-x)"
 */
export function explainOctalDigits(mode: number): {
  digit: number;
  octal: number;
  components: string[];
  rwx: string;
  label: string;
}[] {
  const m = clampMode(mode);
  const result: { digit: number; octal: number; components: string[]; rwx: string; label: string }[] = [];

  const labels = ["special", "owner", "group", "other"];
  for (let i = 0; i < 4; i++) {
    const shift = (3 - i) * 3;
    const digit = (m >> shift) & 0o7;
    const components: string[] = [];
    let rwx = "";

    if (i === 0) {
      // special bits: 4=setuid, 2=setgid, 1=sticky
      if (digit & 4) {
        components.push("4 (setuid)");
        rwx += "s";
      }
      if (digit & 2) {
        components.push("2 (setgid)");
        rwx += "s";
      }
      if (digit & 1) {
        components.push("1 (sticky)");
        rwx += "t";
      }
      if (!rwx) rwx = "---";
    } else {
      if (digit & 4) {
        components.push("4 (read)");
        rwx += "r";
      } else rwx += "-";
      if (digit & 2) {
        components.push("2 (write)");
        rwx += "w";
      } else rwx += "-";
      if (digit & 1) {
        components.push("1 (execute)");
        rwx += "x";
      } else rwx += "-";
    }

    result.push({
      digit: i,
      octal: digit,
      components,
      rwx,
      label: labels[i],
    });
  }

  return result;
}
