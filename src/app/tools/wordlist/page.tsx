import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import ToolLayout from "@/components/ToolLayout";
import WordlistGenerator from "./WordlistGenerator";

const tool = getToolBySlug("wordlist")!;

export const metadata: Metadata = {
  title: "Wordlist / Password Mutation Generator - Custom Wordlists Online | OffSecKit",
  description:
    "Generate custom wordlists from base words with leet speak substitutions, case mutations, number/symbol appending, and common password patterns. Free, 100% client-side.",
  keywords: [
    "wordlist generator online",
    "password mutation generator",
    "custom wordlist pentesting",
    "password list generator",
    "wordlist generator",
    "leet speak password generator",
    "password cracking wordlist",
    "custom wordlist generator",
    "password mutation tool",
    "brute force wordlist",
    "hashcat wordlist",
    "password permutation generator",
  ],
  openGraph: {
    title: "Wordlist / Password Mutation Generator - Free Online | OffSecKit",
    description:
      "Generate custom wordlists from base words with leet speak, case mutations, and common password patterns. 100% client-side.",
    url: "https://offseckit.com/tools/wordlist",
  },
};

const faq = [
  {
    question: "What is a wordlist generator?",
    answer:
      "A wordlist generator creates lists of potential passwords by applying mutations to base words. Common mutations include leet speak substitutions (a to @, e to 3), case variations, appending numbers and symbols, and combining words. These wordlists are used in penetration testing for dictionary attacks with tools like hashcat and John the Ripper.",
  },
  {
    question: "How does leet speak mutation work?",
    answer:
      "Leet speak (1337) replaces letters with visually similar numbers or symbols. Common substitutions include a to @ or 4, e to 3, i to 1 or !, o to 0, s to $ or 5, and t to 7. The generator creates all combinations of these substitutions for each base word, producing variants like p@ssword, p4ssw0rd, and pa$$word.",
  },
  {
    question: "Is my data sent to any server?",
    answer:
      "No. All wordlist generation runs 100% in your browser using JavaScript. No data is transmitted anywhere. This makes it safe for use during real penetration testing engagements where you may be working with client-specific keywords, names, or dates.",
  },
  {
    question: "What is the maximum wordlist size?",
    answer:
      "The tool caps output at 100,000 words by default to keep your browser responsive. For larger wordlists, consider using a CLI tool like osk wordlist or psudohash. The generated wordlist can be downloaded as a .txt file for use with hashcat, John the Ripper, Hydra, or other password cracking tools.",
  },
  {
    question: "How do I use this wordlist with hashcat?",
    answer:
      "Generate your wordlist, download it as a .txt file, then use it with hashcat: hashcat -m [hash-mode] -a 0 hash.txt wordlist.txt. For example, to crack NTLM hashes: hashcat -m 1000 -a 0 ntlm_hashes.txt wordlist.txt. You can also pipe the wordlist directly or combine it with hashcat rules for even more mutations.",
  },
  {
    question: "Can I share my wordlist configuration?",
    answer:
      "Yes. Click the Share URL button to copy a link that encodes your current configuration (base words, mutation settings) in the URL. Anyone who opens the link will see the same configuration and can generate the same wordlist. No data is stored on any server — the configuration is encoded entirely in the URL.",
  },
];

export default function WordlistPage() {
  return (
    <ToolLayout tool={tool} faq={faq} githubUrl="https://github.com/offseckit/wordlist">
      <WordlistGenerator />
    </ToolLayout>
  );
}
