import Link from "next/link";
import type { Tool } from "@/lib/tools";
import { getRelatedTools } from "@/lib/tools";
import Header from "./Header";
import Footer from "./Footer";
import ToolCard from "./ToolCard";

interface FAQ {
  question: string;
  answer: string;
}

interface ToolLayoutProps {
  tool: Tool;
  children: React.ReactNode;
  faq?: FAQ[];
  githubUrl?: string;
}

export default function ToolLayout({ tool, children, faq, githubUrl }: ToolLayoutProps) {
  const related = getRelatedTools(tool.slug);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-dracula-comment mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/tools"
              className="hover:text-foreground transition-colors"
            >
              Tools
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{tool.shortName}</span>
          </nav>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {tool.name}
            </h1>
            <p className="mt-2 text-sm text-dracula-comment max-w-2xl">
              {tool.description}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <p className="text-xs text-dracula-green">
                100% client-side — no data leaves your browser
              </p>
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1 rounded border border-border text-dracula-comment hover:text-foreground hover:border-dracula-purple transition-colors"
                >
                  CLI version on GitHub
                </a>
              )}
            </div>
          </div>

          {/* Tool content */}
          <div className="mb-12">{children}</div>

          {/* Ad slot placeholder */}
          <div className="mb-12" id="ad-slot" />

          {/* FAQ */}
          {faq && faq.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-bold text-foreground mb-4">FAQ</h2>
              <dl className="space-y-4">
                {faq.map((item) => (
                  <div
                    key={item.question}
                    className="border border-border rounded-lg p-4 bg-surface"
                  >
                    <dt className="font-semibold text-sm text-foreground">
                      {item.question}
                    </dt>
                    <dd className="mt-2 text-sm text-dracula-comment">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Related tools */}
          {related.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">
                Related Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
