import type { ZIndexData } from "@/types/analysis";

/**
 * TARGETからダウンロードしたZ指数PDFをパースして
 * 馬番ごとのZ指数を返す
 */
export function parseZIndexFromText(text: string): ZIndexData[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const seen = new Set<number>();
  const results: ZIndexData[] = [];

  function add(horseNumber: number, horseName: string, zIndex: number) {
    if (horseNumber >= 1 && horseNumber <= 18 && !isNaN(zIndex) && zIndex > 0 && zIndex < 300 && !seen.has(horseNumber)) {
      seen.add(horseNumber);
      results.push({ horseNumber, horseName, zIndex });
    }
  }

  // パターン1: "1 馬名 85.3" / "1. 馬名 85.3" / "1　馬名　85.3"
  for (const line of lines) {
    const m = line.match(/^(\d{1,2})[.\s　]+([^\d\s].+?)\s+([\d]{2,3}(?:\.\d)?)\s*$/);
    if (m) add(parseInt(m[1], 10), m[2].trim(), parseFloat(m[3]));
  }

  // パターン2: TARGET Z指数 "馬番 馬名 Z指数 ..." 複数列
  if (results.length === 0) {
    for (const line of lines) {
      const parts = line.split(/[\s\t　]+/);
      if (parts.length >= 2) {
        const num = parseInt(parts[0], 10);
        // 末尾から数値を探す
        for (let i = parts.length - 1; i >= 1; i--) {
          const val = parseFloat(parts[i]);
          if (!isNaN(val) && val > 0 && val < 300) {
            const name = parts.slice(1, i).join("") || parts[1] || "";
            add(num, name, val);
            break;
          }
        }
      }
    }
  }

  // パターン3: 行に馬番と数値だけ含まれる最小形式 "1 85.3"
  if (results.length === 0) {
    for (const line of lines) {
      const m = line.match(/^(\d{1,2})\s+([\d]{2,3}(?:\.\d)?)\s*$/);
      if (m) add(parseInt(m[1], 10), `${m[1]}番`, parseFloat(m[2]));
    }
  }

  return results.sort((a, b) => a.horseNumber - b.horseNumber);
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // Vercelサーバーレス環境では pdf-parse のメイン index.js がテストコードを
  // 実行しようとしてエラーになるため、lib 直下を直接 require する
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const parsed = await pdfParse(buffer);
  return parsed.text;
}
