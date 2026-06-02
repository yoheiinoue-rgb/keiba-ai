import { scrapeRaceList } from "@/lib/scraping/netkeiba";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  try {
    const races = await scrapeRaceList(date);
    return Response.json({ races });
  } catch (e) {
    console.error("race list scrape error:", e);
    return Response.json({ races: [], error: "取得に失敗しました" });
  }
}
