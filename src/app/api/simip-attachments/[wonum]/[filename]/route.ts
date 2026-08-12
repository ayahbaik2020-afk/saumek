import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import {
  isAllowedWonum,
  resolveWoAttachmentFileOnDisk,
} from "@/lib/simip-attachment-server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ wonum: string; filename: string }> }
) {
  const { wonum: rawWonum, filename: rawFilename } = await context.params;
  const wonum = rawWonum?.trim();
  const filename = rawFilename ? decodeURIComponent(rawFilename) : "";

  if (!wonum || !isAllowedWonum(wonum)) {
    return Response.json({ ok: false, error: "WONUM tidak valid." }, { status: 400 });
  }

  const url = new URL(request.url);
  const rawPaths = url.searchParams.get("paths");
  const extraPaths =
    rawPaths?.split("|").map((p) => decodeURIComponent(p)).filter(Boolean) ?? [];

  const file = resolveWoAttachmentFileOnDisk(wonum, filename, extraPaths);
  if (!file) {
    return Response.json(
      {
        ok: false,
        error: `File tidak ditemukan: ${filename}. Pastikan drive N: aktif di PC yang menjalankan npm run dev.`,
      },
      { status: 404 }
    );
  }

  const stream = createReadStream(file.localPath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  const inline = url.searchParams.get("download") !== "1";

  return new Response(webStream, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.name}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
