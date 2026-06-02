import iconv from "iconv-lite";
import type { ZIndexData } from "@/types/analysis";

/**
 * TARGET CSVからZ指数データを抽出する
 *
 * CSVの列構成（0インデックス）:
 *   3:  馬番
 *   8:  馬名（Shift-JISエンコード）
 *   19: ZI（Z指数、先頭スペースあり）
 *
 * 最初の3行はヘッダーのためスキップする
 */
export function parseZIndexFromCsv(buffer: Buffer): ZIndexData[] {
  // TARGETのCSVはShift-JIS
  const text = iconv.decode(buffer, "Shift_JIS");
  const lines = text.split(/\r?\n/);
  const results: ZIndexData[] = [];

  // 最初の3行はヘッダー行
  for (const line of lines.slice(3)) {
    if (!line.trim()) continue;

    // CSVをカンマ分割（ダブルクォート対応）
    const cols = parseCsvLine(line);
    if (cols.length < 20) continue;

    const horseNumber = parseInt(cols[3], 10);
    const horseName = cols[8].trim();
    // ZI値: " 130" や "  97" のようにスペースが入ることがある
    // "(75)" のように括弧で囲まれた前走補正値は別列なので無視
    const ziRaw = cols[19].replace(/[()]/g, "").trim();
    const zIndex = parseInt(ziRaw, 10);

    if (
      isNaN(horseNumber) ||
      horseNumber < 1 ||
      horseNumber > 20 ||
      !horseName ||
      isNaN(zIndex) ||
      zIndex <= 0
    ) {
      continue;
    }

    results.push({ horseNumber, horseName, zIndex });
  }

  return results.sort((a, b) => a.horseNumber - b.horseNumber);
}

/** シンプルなCSV行パーサー（ダブルクォートで囲まれたフィールド対応） */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/** テキスト形式のフォールバックパーサー（PDF/テキストファイル用） */
export function parseZIndexFromText(text: string): ZIndexData[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const seen = new Set<number>();
  const results: ZIndexData[] = [];

  function add(horseNumber: number, horseName: string, zIndex: number) {
    if (horseNumber >= 1 && horseNumber <= 20 && !isNaN(zIndex) && zIndex > 0 && zIndex < 300 && !seen.has(horseNumber)) {
      seen.add(horseNumber);
      results.push({ horseNumber, horseName, zIndex });
    }
  }

  for (const line of lines) {
    const m = line.match(/^(\d{1,2})[.\s　]+([^\d\s].+?)\s+([\d]{2,3}(?:\.\d)?)\s*$/);
    if (m) add(parseInt(m[1], 10), m[2].trim(), parseFloat(m[3]));
  }

  if (results.length === 0) {
    for (const line of lines) {
      const parts = line.split(/[\s\t　]+/);
      if (parts.length >= 2) {
        const num = parseInt(parts[0], 10);
        for (let i = parts.length - 1; i >= 1; i--) {
          const val = parseFloat(parts[i]);
          if (!isNaN(val) && val > 0 && val < 300) {
            add(num, parts.slice(1, i).join("") || parts[1], val);
            break;
          }
        }
      }
    }
  }

  return results.sort((a, b) => a.horseNumber - b.horseNumber);
}
