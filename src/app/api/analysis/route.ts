import OpenAI from "openai";
import { KEIBA_OS_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import type { RaceWithEntries } from "@/types/race";
import type { ZIndexData } from "@/types/analysis";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { race, zIndexData } = body as {
    race: RaceWithEntries;
    zIndexData?: ZIndexData[];
  };

  if (!race) {
    return Response.json({ error: "レースデータが必要です" }, { status: 400 });
  }

  // レースデータをテキストに変換
  const raceText = buildRacePrompt(race, zIndexData);

  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: KEIBA_OS_SYSTEM_PROMPT },
      { role: "user", content: raceText },
    ],
    stream: true,
    temperature: 0.3,
    max_tokens: 4000,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}

function buildRacePrompt(
  race: RaceWithEntries,
  zIndexData?: ZIndexData[]
): string {
  const zMap = new Map(zIndexData?.map((z) => [z.horseNumber, z.zIndex]) ?? []);

  const lines = [
    `【対象レース】`,
    `レース名：${race.name}`,
    `競馬場：${race.venue}`,
    `${race.surface} / ${race.distance}m`,
    `頭数：${race.horseCount}頭`,
    `クラス：${race.raceClass}`,
    ``,
    `【出馬表】`,
    `馬番 | 枠番 | 馬名 | 性齢 | 斤量 | 騎手 | Z指数 | オッズ | 人気`,
    `-----|-----|------|------|------|------|-------|--------|-----`,
  ];

  for (const entry of race.entries) {
    const z = zMap.get(entry.horseNumber);
    lines.push(
      `${entry.horseNumber} | ${entry.gateNumber} | ${entry.horseName} | ${entry.sex}${entry.age} | ${entry.loadWeight} | ${entry.jockey} | ${z !== undefined ? z : "未入力"} | ${entry.odds ?? "?"} | ${entry.popularity ?? "?"}`
    );
  }

  lines.push(``, `【各馬の過去成績】`);
  for (const entry of race.entries) {
    if (!entry.pastRaces?.length) continue;
    lines.push(``, `■ ${entry.horseNumber}番 ${entry.horseName}`);
    for (const pr of entry.pastRaces.slice(0, 5)) {
      lines.push(
        `  ${pr.date} ${pr.venue} ${pr.raceClass} ${pr.surface}${pr.distance}m ${pr.trackCondition ?? ""} ${pr.horseCount}頭 ${pr.gateNumber}枠${pr.horseNumber}番 ${pr.popularity}人気 ${pr.finishPosition}着 4角:${pr.corner4 ?? "?"}番手`
      );
    }
  }

  lines.push(
    ``,
    `上記データを元に、競馬起動OSのSTEP0からSTEP13を全て実行して分析してください。`
  );

  return lines.join("\n");
}
