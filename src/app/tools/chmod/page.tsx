import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import ChmodCalculator from "./ChmodCalculator";

const tool = getToolBySlug("chmod")!;

export const metadata: Metadata = {
  title: "Chmod Calculator — Linux Permissions",
  description:
    "Free chmod calculator. Convert between octal and symbolic Unix permissions, toggle setuid/setgid/sticky, and copy chmod commands. 100% client-side.",
  keywords: [
    "chmod calculator",
    "chmod 755",
    "chmod 644",
    "linux permissions calculator",
    "unix permissions calculator",
    "chmod command generator",
    "octal permissions calculator",
    "symbolic permissions",
    "setuid setgid sticky",
    "rwxr-xr-x",
    "file permissions calculator",
    "chmod online",
    "permission converter",
    "chmod 777",
    "chmod 600 ssh key",
  ],
  openGraph: {
    title: "Chmod Calculator — Linux Permissions Online | OffSecKit",
    description:
      "Convert between octal and symbolic Unix permissions, toggle setuid/setgid/sticky bits, and copy chmod commands. Free, 100% client-side.",
    url: "https://offseckit.com/tools/chmod",
  },
  alternates: { canonical: "/tools/chmod" },
};

const faq = [
  {
    question: "What does chmod 755 mean?",
    answer:
      "Mode 755 grants the owner read, write, and execute (4+2+1=7); group and other read and execute (4+1=5). Symbolically it is rwxr-xr-x. It is the typical default for executable scripts, binaries, and traversable directories — anyone may run or list, but only the owner may modify.",
  },
  {
    question: "What does chmod 644 mean?",
    answer:
      "Mode 644 grants the owner read and write (4+2=6); group and other read-only (4). Symbolically it is rw-r--r--. It is the standard mode for regular non-executable files such as HTML, configuration files, and documents.",
  },
  {
    question: "What is the difference between octal and symbolic chmod notation?",
    answer:
      "Octal notation uses three or four digits where each digit packs read (4), write (2), and execute (1) for owner, group, and other respectively. Symbolic notation uses letters: u (user/owner), g (group), o (other), a (all) combined with operators + (add), - (remove), = (set exactly) and permission letters r/w/x. Both forms produce identical results — chmod 755 file and chmod u=rwx,go=rx file are equivalent.",
  },
  {
    question: "What are setuid, setgid, and the sticky bit?",
    answer:
      "These are three special permission bits packed into a fourth leading octal digit. Setuid (4000) makes a binary execute as the file's owner — common on /usr/bin/sudo and /usr/bin/passwd. Setgid (2000) on a binary executes as the file's group; on a directory, new files inherit the directory's group. The sticky bit (1000) on a directory restricts deletion to file owners — used by /tmp (mode 1777) so users cannot delete each other's temp files.",
  },
  {
    question: "Why is chmod 777 considered dangerous?",
    answer:
      "Mode 777 means everyone on the system — including unprivileged users and any process running as nobody — can read, modify, and execute the file or directory. On a multi-user host or any internet-facing server it is a serious risk: malicious users or compromised services can tamper with config files, plant backdoors, or replace executables. For directories where multiple users must write (like /tmp), use 1777 with the sticky bit so users cannot delete each other's files. For files, 644 or 664 is almost always sufficient.",
  },
  {
    question: "How do I find setuid binaries on a Linux system for privilege escalation?",
    answer:
      "Pentesters and CTF players hunt for setuid binaries with: find / -perm -4000 -type f 2>/dev/null. Check the results against GTFOBins (gtfobins.github.io) which catalogs known privesc techniques for common setuid binaries. World-writable directories without the sticky bit are another vector: find / -perm -2 -type d -not -perm -1000 2>/dev/null. The chmod calculator on this page surfaces the same warnings inline as you toggle bits.",
  },
  {
    question: "What permissions should I set for SSH keys?",
    answer:
      "OpenSSH refuses to use private keys with permissive permissions. Set the .ssh directory to 700 (chmod 700 .ssh) and private keys to 600 (chmod 600 .ssh/id_rsa). Public keys can be 644. The authorized_keys file should be 600. If ssh complains 'Permissions are too open', it is enforcing exactly these constraints.",
  },
  {
    question: "Are my permission inputs sent to any server?",
    answer:
      "No. All chmod conversions run 100% in your browser using JavaScript. Nothing is transmitted to any server, no analytics, no logs. Filenames, custom paths, and modes you experiment with stay on your machine. This makes the tool safe to use against confidential paths from internal systems or pentest engagements.",
  },
];

export default function ChmodPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/chmod">
      <ChmodCalculator />
    </ToolLayout>
  );
}
