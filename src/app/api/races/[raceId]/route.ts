import { scrapeShutuba } from "@/lib/scraping/netkeiba";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const { raceId } = await params;

  try {
    const result = await scrapeShutuba(raceId);
    if (!result) {
      return Response.json({ race: null, entries: [] });
    }
    return Response.json(result);
  } catch (e) {
    console.error("race detail scrape error:", e);
    return Response.json({ race: null, entries: [] });
  }
}
