import type { Entry } from "@/types/race";
import { cn } from "@/lib/utils";

interface EntryTableProps {
  entries: Entry[];
}

const gateColors = [
  "bg-white text-gray-900 border border-gray-300",
  "bg-black text-white",
  "bg-red-600 text-white",
  "bg-blue-600 text-white",
  "bg-yellow-400 text-gray-900",
  "bg-green-600 text-white",
  "bg-orange-500 text-white",
  "bg-pink-500 text-white",
];

export function EntryTable({ entries }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        <p>出馬表データがありません</p>
        <p className="text-xs mt-1">JRA-VAN APIキーを設定してください</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-10">枠</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-10">馬番</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">馬名</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-12">性齢</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-12">斤量</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">騎手</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-16">Z指数</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-16">オッズ</th>
            <th className="px-3 py-2 text-center font-medium text-muted-foreground w-12">人気</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="px-3 py-2 text-center">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-sm text-xs font-bold",
                    gateColors[(entry.gateNumber - 1) % 8] ?? gateColors[0]
                  )}
                >
                  {entry.gateNumber}
                </span>
              </td>
              <td className="px-3 py-2 text-center font-bold">
                {entry.horseNumber}
              </td>
              <td className="px-3 py-2 font-medium">{entry.horseName}</td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                {entry.sex}{entry.age}
              </td>
              <td className="px-3 py-2 text-center text-muted-foreground">
                {entry.loadWeight}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{entry.jockey}</td>
              <td className="px-3 py-2 text-center">
                {entry.zIndex !== undefined ? (
                  <span className="font-mono font-semibold text-primary">
                    {entry.zIndex}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-center font-mono">
                {entry.odds !== undefined ? entry.odds : "—"}
              </td>
              <td className="px-3 py-2 text-center">
                {entry.popularity !== undefined ? (
                  <span
                    className={cn(
                      "font-semibold",
                      entry.popularity <= 3
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {entry.popularity}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
