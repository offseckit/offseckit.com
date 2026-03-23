import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import EmailCapture from "@/components/EmailCapture";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools",
  description:
    "Browse all free offensive security tools: reverse shell generator, hash identifier, JWT decoder, encoding multi-tool, and more.",
};

export default function ToolsPage() {
  const liveTools = tools.filter((t) => t.status === "live");
  const comingSoon = tools.filter((t) => t.status === "coming-soon");

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            All Tools
          </h1>
          <p className="text-sm text-dracula-comment mb-8">
            Free, browser-based security tools. More coming soon.
          </p>

          {liveTools.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold text-dracula-green mb-4 uppercase tracking-wider">
                Available Now
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {comingSoon.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-dracula-comment mb-4 uppercase tracking-wider">
                Coming Soon
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {comingSoon.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )}

          {/* Email capture */}
          <section className="mt-10">
            <EmailCapture variant="tools" />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
