import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo-square.png"
              alt="OffSecKit"
              width={30}
              height={30}
              className="rounded-md"
            />
            <span className="font-bold text-lg text-foreground">
              OffSecKit
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/tools"
              className="text-dracula-comment hover:text-foreground transition-colors"
            >
              Tools
            </Link>
            <Link
              href="/blog"
              className="text-dracula-comment hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <a
              href="https://github.com/offseckit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dracula-comment hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
