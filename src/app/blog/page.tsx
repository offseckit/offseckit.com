import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSortedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Offensive security guides, cheat sheets, and tutorials for pentesters, red teamers, and bug bounty hunters.",
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Blog
          </h1>
          <p className="text-sm text-dracula-comment mb-8">
            Guides, cheat sheets, and tutorials for offensive security.
          </p>
          <div className="space-y-6">
            {getSortedPosts().map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <article className="rounded-lg border border-border bg-surface p-5 hover:border-dracula-purple hover-glow gradient-border transition-all">
                  <div className="flex items-center gap-3 text-xs text-dracula-comment">
                    <time>{post.date}</time>
                    <span>by <span className="text-dracula-cyan">{post.author}</span></span>
                  </div>
                  <h2 className="mt-1 text-base font-semibold text-foreground group-hover:text-dracula-cyan transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-dracula-comment leading-relaxed">
                    {post.description}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
