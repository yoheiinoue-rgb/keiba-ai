import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import { EntryTable } from "@/components/races/entry-table";
import { ZIndexUpload } from "@/components/analysis/z-index-upload";
import type { Entry, Race } from "@/types/race";

async function getRaceData(
  raceId: string
): Promise<{ race: Race | null; entries: Entry[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/races/${raceId}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { race: null, entries: [] };
  const json = await res.json();
  return { race: json.race ?? null, entries: json.entries ?? [] };
}

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;
  const { race, entries } = await getRaceData(raceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/races"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {race?.name ?? `レース ${raceId}`}
          </h1>
          {race && (
            <p className="text-sm text-muted-foreground">
              {race.venue} · {race.surface} {race.distance}m · {race.raceClass}{" "}
              · {race.horseCount || entries.length}頭
            </p>
          )}
        </div>
      </div>

      <Suspense fallback={<div className="h-64 rounded-lg bg-muted animate-pulse" />}>
        <EntryTable entries={entries} />
      </Suspense>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          Z指数をアップロードしてAI考察を実行
        </h2>
        <p className="text-sm text-muted-foreground">
          TARGETからダウンロードしたZ指数PDFをアップロードすると、競馬起動OSによる全STEP分析を自動実行します。
        </p>
        <ZIndexUpload
          raceId={raceId}
          race={
            race ?? {
              id: raceId,
              name: `レース ${raceId}`,
              venue: "",
              date: "",
              raceNumber: 0,
              surface: "芝",
              distance: 0,
              raceClass: "OP",
              horseCount: entries.length,
            }
          }
          entries={entries}
        />
      </div>
    </div>
  );
}
