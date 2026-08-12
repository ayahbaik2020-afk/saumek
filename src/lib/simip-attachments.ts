/**
 * SIMIP WO attachments (foto/dokumen) on mapped drive N: (MIPRO/SAUSIMIP).
 * Contoh nyata: N:\workorder\26011225_WR.pdf
 * WONUM = nomor WO asli SIMIP (bukan job_number SAUMEK).
 */

export type SimipWoRef = {
  wo_number: string;
  external_wo_id?: string | null;
  raw_data?: Record<string, unknown> | null;
};

/** Folder lampiran SIMIP, contoh: N:\workorder\ */
const DEFAULT_ROOT = "N:\\workorder\\";
/** File utama work request, contoh: N:\workorder\26011225_WR.pdf */
const DEFAULT_FILE_TEMPLATE = "{root}{wonum}_WR.pdf";

export function simipAttachmentRoot() {
  const raw = (process.env.NEXT_PUBLIC_SIMIP_ATTACHMENT_ROOT ?? DEFAULT_ROOT).trim();
  if (!raw) return DEFAULT_ROOT;
  return raw.endsWith("\\") || raw.endsWith("/") ? raw : `${raw}\\`;
}

export function simipAttachmentTemplate() {
  return (
    process.env.NEXT_PUBLIC_SIMIP_ATTACHMENT_TEMPLATE ?? DEFAULT_FILE_TEMPLATE
  ).trim() || DEFAULT_FILE_TEMPLATE;
}

/** Fallback file patterns (comma-separated env) */
export function simipAttachmentAlternateTemplates(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_SIMIP_ATTACHMENT_ALTERNATES ??
    "{root}{wonum}.pdf,{root}{wonum}.jpg,{root}{wonum}.jpeg,{root}{wonum}.xlsx,{root}{wonum}_WR.jpg,{root}{wonum}_WR.jpeg";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ekstensi lampiran WO yang didukung (preview atau unduh). */
export const SIMIP_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".xlsx",
  ".xls",
  ".doc",
  ".docx",
] as const;

function applyTemplate(template: string, wonum: string) {
  const root = simipAttachmentRoot();
  const wo = String(wonum ?? "").trim();
  return template
    .replaceAll("{root}", root)
    .replaceAll("{wo_number}", wo)
    .replaceAll("{wonum}", wo);
}

/**
 * Canonical SIMIP WONUM from MIP_WORKORDER.
 * Priority: raw_data.WONUM → external_wo_id → wo_number.
 */
export function resolveSimipWoNumber(ref: SimipWoRef): string {
  const raw = ref.raw_data;
  if (raw && typeof raw === "object") {
    const wonum = raw.WONUM ?? raw.wonum ?? raw.WoNum;
    if (typeof wonum === "string" && wonum.trim()) return wonum.trim();
    if (typeof wonum === "number" && Number.isFinite(wonum)) return String(wonum);
  }
  if (ref.external_wo_id && String(ref.external_wo_id).trim()) {
    return String(ref.external_wo_id).trim();
  }
  if (ref.wo_number && String(ref.wo_number).trim()) {
    return String(ref.wo_number).trim();
  }
  return "";
}

/** Folder containing WO documents, e.g. N:\workorder\ */
export function buildSimipAttachmentFolderPath() {
  return simipAttachmentRoot();
}

/** Primary document path, e.g. N:\workorder\26011225_WR.pdf */
export function buildSimipAttachmentFilePath(wonum: string) {
  return applyTemplate(simipAttachmentTemplate(), wonum);
}

/** Default candidate paths when sync has not resolved MIP_DOCINFO yet. */
export function buildSimipDefaultDocumentCandidates(wonum: string): string[] {
  const out: string[] = [buildSimipAttachmentFilePath(wonum)];
  for (const t of simipAttachmentAlternateTemplates()) {
    out.push(applyTemplate(t, wonum));
  }
  return [...new Set(out)];
}

/** file:/// URL for local Explorer / PDF viewer (may be blocked by browser). */
export function buildSimipAttachmentFileUrl(winPath: string) {
  const normalized = winPath.replace(/\\/g, "/");
  if (/^[A-Za-z]:/.test(normalized)) {
    return `file:///${normalized}`;
  }
  if (normalized.startsWith("//")) {
    return `file:${normalized}`;
  }
  return `file:///${normalized}`;
}

function normalizeWindowsPath(p: string) {
  const s = p.trim();
  if (!s) return "";
  if (/^[A-Za-z]:/.test(s) || s.startsWith("\\\\")) {
    return s.replace(/\//g, "\\");
  }
  const root = simipAttachmentRoot();
  return `${root}${s.replace(/^\\+/, "").replace(/\//g, "\\")}`;
}

/** Paths from sync (raw_data._attachment_paths) or raw_data fields. */
export function extractSimipDocumentPaths(
  raw: Record<string, unknown> | null | undefined,
  wonum: string
): string[] {
  const out: string[] = [];

  const synced = raw?._attachment_paths ?? raw?.attachment_paths;
  if (Array.isArray(synced)) {
    for (const p of synced) {
      if (typeof p === "string" && p.trim()) out.push(normalizeWindowsPath(p.trim()));
      else if (p && typeof p === "object") {
        const o = p as Record<string, unknown>;
        const path = o.URLORNAME ?? o.urlorname ?? o.path ?? o.URL ?? o.filepath;
        if (typeof path === "string" && path.trim()) {
          out.push(normalizeWindowsPath(path.trim()));
        }
      }
    }
  }

  const keys = [
    "URLORNAME",
    "urlorname",
    "DOCUMENT",
    "DOCPATH",
    "ATTACHMENT",
    "ATTACHMENT_PATH",
    "FILEPATH",
  ];
  if (raw && typeof raw === "object") {
    for (const k of keys) {
      const v = raw[k];
      if (typeof v === "string" && v.trim()) out.push(normalizeWindowsPath(v.trim()));
    }
    const docs = raw.attachments ?? raw.DOCUMENTS ?? raw.doclinks ?? raw.DOCINFO;
    if (Array.isArray(docs)) {
      for (const d of docs) {
        if (typeof d === "string" && d.trim()) out.push(normalizeWindowsPath(d.trim()));
        else if (d && typeof d === "object") {
          const o = d as Record<string, unknown>;
          const p = o.URLORNAME ?? o.urlorname ?? o.url ?? o.path ?? o.filepath;
          if (typeof p === "string" && p.trim()) out.push(normalizeWindowsPath(p.trim()));
        }
      }
    }
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of out) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    unique.push(p);
  }

  if (wonum) {
    unique.sort((a, b) => {
      const aHas = a.toLowerCase().includes(wonum.toLowerCase()) ? 0 : 1;
      const bHas = b.toLowerCase().includes(wonum.toLowerCase()) ? 0 : 1;
      return aHas - bHas;
    });
  }

  return unique;
}

function guessContentType(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "xlsx")
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "doc") return "application/msword";
  if (ext === "docx")
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

export function attachmentExtension(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? `.${m[1]}` : "";
}

/** URL API same-origin untuk stream file dari drive N: (localhost / PC dengan N: ter-map). */
export function buildSimipAttachmentApiUrl(wonum: string, filename: string) {
  return `/api/simip-attachments/${encodeURIComponent(wonum)}/${encodeURIComponent(filename)}`;
}

/** Lampiran dari path lokal + URL API (tanpa Supabase Storage). */
export function extractSimipViewableAttachments(
  wonum: string,
  localPaths: string[]
): ViewableAttachment[] {
  const out: ViewableAttachment[] = [];
  const seen = new Set<string>();

  for (const p of localPaths) {
    const name = p.split("\\").pop() ?? p.split("/").pop() ?? p;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({
      name,
      localPath: p,
      url: buildSimipAttachmentApiUrl(wonum, name),
      contentType: guessContentType(name),
    });
  }

  return out;
}

export function isPdfAttachment(a: ViewableAttachment) {
  return (
    a.contentType === "application/pdf" ||
    a.name.toLowerCase().endsWith(".pdf") ||
    (a.url ?? "").toLowerCase().includes(".pdf")
  );
}

export function isImageAttachment(a: ViewableAttachment) {
  const ct = a.contentType ?? "";
  if (ct.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp)$/i.test(a.name);
}

export function isSpreadsheetAttachment(a: ViewableAttachment) {
  const ct = a.contentType ?? "";
  if (
    ct.includes("spreadsheet") ||
    ct === "application/vnd.ms-excel"
  ) {
    return true;
  }
  return /\.(xlsx?|csv)$/i.test(a.name);
}

export function attachmentKind(a: ViewableAttachment) {
  if (isPdfAttachment(a)) return "pdf";
  if (isImageAttachment(a)) return "image";
  if (isSpreadsheetAttachment(a)) return "spreadsheet";
  return "other";
}

export function attachmentKindLabel(kind: ReturnType<typeof attachmentKind>) {
  switch (kind) {
    case "pdf":
      return "PDF";
    case "image":
      return "Foto";
    case "spreadsheet":
      return "Excel";
    default:
      return "Dokumen";
  }
}

export type ViewableAttachment = {
  name: string;
  /** URL API same-origin - stream dari drive N: via server Next.js */
  url?: string | null;
  /** Path lokal di PC SIMIP, contoh N:\workorder\26011225_WR.pdf */
  localPath?: string | null;
  contentType?: string | null;
};

export type SimipAttachmentInfo = {
  wonum: string;
  folderPath: string;
  documentPaths: string[];
  primaryPath: string;
  viewables: ViewableAttachment[];
};

export function resolveSimipAttachmentInfo(ref: SimipWoRef): SimipAttachmentInfo | null {
  const wonum = resolveSimipWoNumber(ref);
  if (!wonum) return null;

  const folderPath = buildSimipAttachmentFolderPath();
  const synced = extractSimipDocumentPaths(ref.raw_data ?? null, wonum);

  const documentPaths: string[] = [];
  for (const p of synced) {
    if (!documentPaths.includes(p)) documentPaths.push(p);
  }

  /**
   * IMPORTANT:
   * Untuk mencegah WO tanpa file tampil seolah punya lampiran,
   * daftar viewables diisi dari API disk scan (server-side), bukan dari kandidat path.
   */
  const viewables: ViewableAttachment[] = [];
  const primaryPath = synced[0] ?? buildSimipAttachmentFilePath(wonum);

  return { wonum, folderPath, documentPaths, primaryPath, viewables };
}

/** @deprecated */
export function buildSimipAttachmentPath(woNumber: string) {
  return buildSimipAttachmentFilePath(woNumber);
}

/** @deprecated */
export function extractRawAttachmentPaths(
  raw: Record<string, unknown> | null | undefined
): string[] {
  return extractSimipDocumentPaths(raw, "");
}
