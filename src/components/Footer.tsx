import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dracula-comment">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="text-dracula-pink font-bold">&gt;_</span>
              <span>OffSecKit</span>
            </div>
            <span className="hidden sm:inline text-border">|</span>
            <span>100% client-side. No data leaves your browser.</span>
            <span className="hidden sm:inline text-border">|</span>
            <span>&copy; {new Date().getFullYear()} OffSecKit</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/tools" className="hover:text-foreground transition-colors">
              Tools
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <a
              href="https://github.com/offseckit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
