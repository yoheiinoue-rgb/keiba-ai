"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function RaceDatePicker({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();

  function changeDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split("T")[0];
    router.push(`/races?date=${next}`);
  }

  const formatted = new Date(selectedDate).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => changeDate(-1)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium min-w-[9rem] text-center">
        {formatted}
      </span>
      <button
        onClick={() => changeDate(1)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
