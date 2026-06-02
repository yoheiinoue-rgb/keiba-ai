import { parseZIndexFromCsv, parseZIndexFromText } from "@/lib/parse-z-index";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name.toLowerCase();

  let zIndexData;

  if (fileName.endsWith(".csv")) {
    // TARGETのCSV（Shift-JIS）
    zIndexData = parseZIndexFromCsv(buffer);
  } else if (fileName.endsWith(".txt")) {
    const text = buffer.toString("utf-8");
    zIndexData = parseZIndexFromText(text);
  } else if (
    fileName.endsWith(".pdf") ||
    file.type === "application/pdf" ||
    (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const parsed = await pdfParse(buffer);
    zIndexData = parseZIndexFromText(parsed.text as string);
  } else {
    return Response.json(
      { error: "CSV・PDF・テキストファイルを選択してください" },
      { status: 400 }
    );
  }

  if (zIndexData.length === 0) {
    return Response.json(
      {
        error: "Z指数データを抽出できませんでした。ファイルの形式を確認してください。",
        hint: "TARGETのCSVエクスポートファイルをそのままアップロードしてください",
      },
      { status: 422 }
    );
  }

  return Response.json({ data: zIndexData });
}
