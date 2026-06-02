"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Brain, ChevronDown, ChevronUp } from "lucide-react";
import type { Entry, Race } from "@/types/race";
import type { ZIndexData } from "@/types/analysis";
import { AnalysisView } from "./analysis-view";

interface ZIndexUploadProps {
  raceId: string;
  race: Race;
  entries: Entry[];
}

export function ZIndexUpload({ raceId, race, entries }: ZIndexUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [zData, setZData] = useState<ZIndexData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [showZData, setShowZData] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/z-index", {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) {
      setUploadError(json.error ?? "アップロードに失敗しました");
      return;
    }
    setZData(json.data);
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalysisText("");

    const raceWithEntries = {
      ...race,
      entries: entries.map((e) => ({
        ...e,
        zIndex: zData.find((z) => z.horseNumber === e.horseNumber)?.zIndex,
      })),
    };

    const res = await fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race: raceWithEntries,
        zIndexData: zData,
      }),
    });

    if (!res.ok || !res.body) {
      setAnalyzing(false);
      setAnalysisText("エラーが発生しました。しばらく後でお試しください。");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setAnalysisText(text);
    }
    setAnalyzing(false);
  }

  return (
    <div className="space-y-4">
      {/* アップロードエリア */}
      <div
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ? (
          <Loader2 className="size-8 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="size-8 text-muted-foreground" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">
            {uploading ? "解析中..." : "Z指数PDFをタップしてアップロード"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            TARGETからダウンロードしたPDF / テキストファイル
          </p>
        </div>
      </div>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {zData.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <button
            onClick={() => setShowZData((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            <span>Z指数データ読み込み完了（{zData.length}頭）</span>
            {showZData ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {showZData && (
            <div className="mt-2 grid grid-cols-3 gap-1 sm:grid-cols-4">
              {zData.map((z) => (
                <div
                  key={z.horseNumber}
                  className="flex items-center justify-between gap-1 rounded bg-background px-2 py-1 text-xs"
                >
                  <span className="font-bold">{z.horseNumber}番</span>
                  <span className="font-mono text-primary">{z.zIndex}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={runAnalysis}
        disabled={analyzing}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50 hover:opacity-90"
      >
        {analyzing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            AI考察を実行中...
          </>
        ) : (
          <>
            <Brain className="size-4" />
            AI考察を実行（STEP0〜STEP13）
          </>
        )}
      </button>

      {(analysisText || analyzing) && (
        <AnalysisView text={analysisText} isStreaming={analyzing} />
      )}
    </div>
  );
}
