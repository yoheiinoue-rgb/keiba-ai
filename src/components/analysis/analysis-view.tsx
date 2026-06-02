"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface AnalysisViewProps {
  text: string;
  isStreaming: boolean;
}

export function AnalysisView({ text, isStreaming }: AnalysisViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [text, isStreaming]);

  // Markdownをシンプルにレンダリング
  const lines = text.split("\n");

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-semibold">AI考察（競馬起動OS）</span>
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            分析中...
          </div>
        )}
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-1">
          {lines.map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="text-base font-bold mt-5 mb-2 text-foreground border-b border-border pb-1"
                >
                  {line.slice(3)}
                </h2>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h3
                  key={i}
                  className="text-sm font-bold mt-4 mb-1.5 text-foreground"
                >
                  {line.slice(4)}
                </h3>
              );
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={i} className="font-semibold text-sm">
                  {line.slice(2, -2)}
                </p>
              );
            }
            if (line.startsWith("- ") || line.startsWith("・")) {
              return (
                <li
                  key={i}
                  className="text-sm text-foreground/90 ml-4 list-disc"
                >
                  {line.slice(2)}
                </li>
              );
            }
            if (line === "") {
              return <div key={i} className="h-1" />;
            }
            // インラインの**bold**をパース
            const boldParsed = parseBold(line);
            return (
              <p key={i} className="text-sm text-foreground/90 leading-relaxed">
                {boldParsed}
              </p>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    )
  );
}
