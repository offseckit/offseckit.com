import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import EmailCapture from "@/components/EmailCapture";
import Footer from "@/components/Footer";
import { meta, Content } from "@/content/blog/cli-output-formatter-guide";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: "article",
    publishedTime: meta.date,
    url: `https://offseckit.com/blog/${meta.slug}`,
  },
};

export default function BlogPostPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-dracula-comment mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              href="/blog"
              className="hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">CLI Output Formatter Guide</span>
          </nav>

          <header className="mb-8">
            <div className="flex items-center gap-3 text-xs text-dracula-comment">
              <time>{meta.date}</time>
              <span>by <a href="https://github.com/4252nez" target="_blank" rel="noopener noreferrer" className="text-dracula-cyan hover:underline">{meta.author}</a></span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {meta.title}
            </h1>
            <p className="mt-3 text-sm text-dracula-comment">
              {meta.description}
            </p>
            {meta.relatedTool && (
              <Link
                href={`/tools/${meta.relatedTool}`}
                className="inline-block mt-4 text-xs px-3 py-1.5 rounded border border-dracula-purple text-dracula-purple hover:bg-dracula-purple/10 transition-colors"
              >
                Try the CLI Output Formatter
              </Link>
            )}
          </header>

          <div className="prose-custom">
            <Content />
          </div>

          <div className="mt-10">
            <EmailCapture variant="blog" />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
