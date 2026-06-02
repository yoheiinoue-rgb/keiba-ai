import type { ZIndexData } from "@/types/analysis";

/**
 * TARGETからダウンロードしたZ指数PDFをパースして
 * 馬番ごとのZ指数を返す
 */
export function parseZIndexFromText(text: string): ZIndexData[] {
  const results: ZIndexData[] = [];

  // パターン1: "1. ホース名 ... 85.3" のような形式
  // パターン2: テーブル形式 "馬番 馬名 Z指数"
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // 馬番（1〜18）+ 馬名 + 数値（Z指数）を抽出
    const match = line.match(/^(\d{1,2})[.\s　]+([^\d\s].+?)\s+([\d]{2,3}(?:\.\d)?)\s*$/);
    if (match) {
      const horseNumber = parseInt(match[1], 10);
      const horseName = match[2].trim();
      const zIndex = parseFloat(match[3]);
      if (horseNumber >= 1 && horseNumber <= 18 && !isNaN(zIndex)) {
        results.push({ horseNumber, horseName, zIndex });
      }
    }
  }

  // パターン2: スペース区切りのテーブル（TARGET形式に多い）
  if (results.length === 0) {
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const num = parseInt(parts[0], 10);
        const zVal = parseFloat(parts[parts.length - 1]);
        const name = parts.slice(1, parts.length - 1).join("");
        if (num >= 1 && num <= 18 && !isNaN(zVal) && zVal > 0 && zVal < 200) {
          results.push({ horseNumber: num, horseName: name, zIndex: zVal });
        }
      }
    }
  }

  return results.sort((a, b) => a.horseNumber - b.horseNumber);
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // pdf-parseはサーバーサイドのみ
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const parsed = await pdfParse(buffer);
  return parsed.text;
}
