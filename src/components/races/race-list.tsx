import Link from "next/link";
import type { Race } from "@/types/race";
import { cn } from "@/lib/utils";

async function getRaces(date: string): Promise<Race[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/races?date=${date}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.races ?? [];
}

const classBadgeColor: Record<string, string> = {
  G1: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  G2: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  G3: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  OP: "bg-green-500/10 text-green-600 border-green-500/20",
  L: "bg-green-500/10 text-green-600 border-green-500/20",
};

export async function RaceList({ date }: { date: string }) {
  const races = await getRaces(date);

  if (races.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-lg font-medium">この日のレースはありません</p>
        <p className="text-sm mt-1">
          JRAは土日開催が基本です。日付を変えてお試しください
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {races.map((race) => (
        <Link
          key={race.id}
          href={`/races/${race.id}`}
          className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
              {race.name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium",
                classBadgeColor[race.raceClass] ??
                  "bg-muted text-muted-foreground border-border"
              )}
            >
              {race.raceClass}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{race.venue}</span>
            <span>·</span>
            <span>
              {race.surface} {race.distance}m
            </span>
            {race.horseCount > 0 && (
              <>
                <span>·</span>
                <span>{race.horseCount}頭</span>
              </>
            )}
          </div>
          {race.startTime && (
            <div className="text-xs text-muted-foreground">{race.startTime} 発走</div>
          )}
        </Link>
      ))}
    </div>
  );
}
