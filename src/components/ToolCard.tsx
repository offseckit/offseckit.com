import Link from "next/link";
import type { Tool } from "@/lib/tools";
import ToolIcon from "./ToolIcon";

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const isLive = tool.status === "live";

  const content = (
    <div
      className={`group relative rounded-lg border p-5 transition-all ${
        isLive
          ? "border-border bg-surface hover:border-dracula-purple hover:bg-surface-light hover-glow gradient-border cursor-pointer"
          : "border-border/50 bg-surface/50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 ${
            isLive
              ? "text-dracula-cyan group-hover:text-dracula-pink"
              : "text-dracula-comment"
          } transition-colors`}
        >
          <ToolIcon icon={tool.icon} className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold text-sm ${
                isLive ? "text-foreground" : "text-dracula-comment"
              }`}
            >
              {tool.shortName}
            </h3>
            {!isLive && (
              <span className="text-[10px] uppercase tracking-wider text-dracula-comment bg-dracula-current px-1.5 py-0.5 rounded">
                Soon
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-dracula-comment/80 leading-relaxed line-clamp-2 group-hover:text-dracula-comment">
            {tool.description}
          </p>
        </div>
      </div>
    </div>
  );

  if (isLive) {
    return <Link href={`/tools/${tool.slug}`}>{content}</Link>;
  }

  return content;
}
