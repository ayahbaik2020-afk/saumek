import {
  buildSimipAttachmentServeUrl,
  isAllowedWonum,
  listWoAttachmentFilesOnDisk,
} from "@/lib/simip-attachment-server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ wonum: string }> }
) {
  const { wonum: raw } = await context.params;
  const wonum = raw?.trim();
  if (!wonum || !isAllowedWonum(wonum)) {
    return Response.json({ ok: false, error: "WONUM tidak valid." }, { status: 400 });
  }

  const url = new URL(request.url);
  const rawPaths = url.searchParams.get("paths");
  const extraPaths =
    rawPaths?.split("|").map((p) => decodeURIComponent(p)).filter(Boolean) ?? [];

  const diskFiles = listWoAttachmentFilesOnDisk(wonum, extraPaths);
  const root = process.env.NEXT_PUBLIC_SIMIP_ATTACHMENT_ROOT ?? "N:\\workorder\\";

  const attachments = diskFiles.map((f) => ({
    name: f.name,
    localPath: f.localPath,
    contentType: f.contentType,
    url: buildSimipAttachmentServeUrl(wonum, f.name),
  }));

  return Response.json({
    ok: true,
    wonum,
    source: "local-drive",
    root,
    attachments,
    hint:
      attachments.length === 0
        ? `Drive tidak terbaca atau file tidak ada di ${root}. Jalankan npm run dev di PC dengan drive N: aktif.`
        : null,
  });
}
