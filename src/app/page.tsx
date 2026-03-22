import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-28 hero-grid">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Image
                src="/logo-square.png"
                alt="OffSecKit"
                width={80}
                height={80}
                className="rounded-2xl logo-glow"
                priority
              />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              OffSecKit
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-dracula-comment max-w-2xl mx-auto">
              Free, browser-based offensive security tools.{" "}
              <span className="text-dracula-cyan">
                100% client-side — no data leaves your browser.
              </span>
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/tools"
                className="btn-glow inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-dracula-purple text-foreground font-semibold text-sm hover:bg-dracula-purple/80 transition-colors"
              >
                Browse Tools
              </Link>
              <a
                href="https://github.com/offseckit"
                target="_blank"
                rel="noopener noreferrer"
                className="gradient-border inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border text-dracula-comment font-semibold text-sm hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Tool grid */}
        <section className="pb-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-foreground mb-6">
              <span className="text-dracula-pink">#</span> Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-16 border-t border-border">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-foreground mb-4">
              <span className="text-dracula-pink">#</span> About
            </h2>
            <div className="space-y-3 text-sm text-dracula-comment leading-relaxed">
              <p>
                OffSecKit is a collection of free, open-source security tools
                built for pentesters, red teamers, bug bounty hunters, and
                security professionals.
              </p>
              <p>
                Every tool runs entirely in your browser. No data is
                sent to any server. No tracking, no accounts, no BS.
              </p>
              <p>
                Each tool is also available as a standalone CLI tool on{" "}
                <a
                  href="https://github.com/offseckit"
                  className="text-dracula-cyan hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
