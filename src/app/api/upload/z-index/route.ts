import { parsePdfBuffer, parseZIndexFromText } from "@/lib/parse-z-index";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  // iOSはPDFをapplication/octet-streamで送ることがあるため
  // MIMEタイプではなくファイル名とマジックバイトで判定する
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");
  // PDFマジックバイト: %PDF
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf") ||
    (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46);

  if (!isTxt && !isPdf) {
    return Response.json(
      { error: "PDFまたはテキストファイルを選択してください" },
      { status: 400 }
    );
  }

  let text: string;
  if (isTxt) {
    text = new TextDecoder("utf-8").decode(buffer);
  } else {
    text = await parsePdfBuffer(buffer);
  }

  const zIndexData = parseZIndexFromText(text);

  if (zIndexData.length === 0) {
    return Response.json(
      {
        error: "Z指数データを抽出できませんでした。PDFのテキストを確認してください。",
        rawText: text.slice(0, 800),
        hint: "PDFからテキストが抽出できない場合は、TARGETの画面をスクリーンショット→テキストコピーしてテキストファイルとして送ってください",
      },
      { status: 422 }
    );
  }

  return Response.json({ data: zIndexData });
}
