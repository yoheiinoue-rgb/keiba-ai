import { parsePdfBuffer, parseZIndexFromText } from "@/lib/parse-z-index";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  const allowedTypes = ["application/pdf", "text/plain"];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf")) {
    return Response.json(
      { error: "PDFまたはテキストファイルを選択してください" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text: string;
  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    text = new TextDecoder("utf-8").decode(buffer);
  } else {
    text = await parsePdfBuffer(buffer);
  }

  const zIndexData = parseZIndexFromText(text);

  if (zIndexData.length === 0) {
    return Response.json(
      {
        error:
          "Z指数データを抽出できませんでした。PDFの形式を確認してください。",
        rawText: text.slice(0, 500),
      },
      { status: 422 }
    );
  }

  return Response.json({ data: zIndexData });
}
