import { Suspense } from "react";
import { RaceList } from "@/components/races/race-list";
import { RaceDatePicker } from "@/components/races/race-date-picker";

export const metadata = {
  title: "レース一覧 | 競馬AI",
};

/** JRAは土日開催が基本。平日の場合は次の土曜日をデフォルトにする */
function nextRaceDay(): string {
  const d = new Date();
  const dow = d.getDay(); // 0=日, 6=土
  if (dow === 0 || dow === 6) return d.toISOString().split("T")[0];
  // 月〜金なら次の土曜日
  const daysUntilSat = 6 - dow;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().split("T")[0];
}

export default async function RacesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selectedDate = date ?? nextRaceDay();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">レース一覧</h1>
        <RaceDatePicker selectedDate={selectedDate} />
      </div>
      <Suspense fallback={<RaceListSkeleton />}>
        <RaceList date={selectedDate} />
      </Suspense>
    </div>
  );
}

function RaceListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
