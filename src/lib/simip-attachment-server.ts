import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  SIMIP_ATTACHMENT_EXTENSIONS,
  buildSimipDefaultDocumentCandidates,
  simipAttachmentRoot,
} from "@/lib/simip-attachments";

export type DiskAttachment = {
  name: string;
  localPath: string;
  contentType: string;
};

export function guessAttachmentContentType(name: string) {
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

/** WONUM aman untuk path (tanpa traversal). */
export function isAllowedWonum(wonum: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/.test(wonum);
}

function resolveAttachmentRootDir() {
  const raw = simipAttachmentRoot().replace(/\//g, "\\");
  return path.resolve(raw);
}

function isUnderRoot(filePath: string, root: string) {
  const resolved = path.resolve(filePath);
  const rootResolved = path.resolve(root);
  const rel = path.relative(rootResolved, resolved);
  return rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

function normalizeDiskPath(p: string) {
  return p.trim().replace(/\//g, "\\");
}

/** Daftar file lampiran WO dari drive N: (hanya baca, tidak upload). */
export function listWoAttachmentFilesOnDisk(
  wonum: string,
  extraPaths: string[] = []
): DiskAttachment[] {
  if (!isAllowedWonum(wonum)) return [];

  const root = resolveAttachmentRootDir();
  const allowedExts = new Set(
    SIMIP_ATTACHMENT_EXTENSIONS.map((e) => e.toLowerCase())
  );
  const found = new Map<string, string>();
  const wonumUpper = wonum.toUpperCase();

  const tryAdd = (filePath: string) => {
    const normalized = normalizeDiskPath(filePath);
    if (!normalized || !fs.existsSync(normalized)) return;
    const stat = fs.statSync(normalized);
    if (!stat.isFile()) return;
    if (!isUnderRoot(normalized, root)) return;

    const name = path.basename(normalized);
    const ext = path.extname(name).toLowerCase();
    if (!allowedExts.has(ext)) return;
    if (!name.toUpperCase().startsWith(wonumUpper)) return;

    found.set(name, normalized);
  };

  for (const candidate of buildSimipDefaultDocumentCandidates(wonum)) {
    tryAdd(candidate);
  }

  for (const p of extraPaths) {
    tryAdd(p);
  }

  try {
    if (fs.existsSync(root)) {
      for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
        if (!ent.isFile()) continue;
        tryAdd(path.join(root, ent.name));
      }
    }
  } catch {
    // drive N: tidak ter-map
  }

  return [...found.entries()].map(([name, localPath]) => ({
    name,
    localPath,
    contentType: guessAttachmentContentType(name),
  }));
}

export function resolveWoAttachmentFileOnDisk(
  wonum: string,
  filename: string,
  extraPaths: string[] = []
): DiskAttachment | null {
  const safeName = path.basename(filename);
  if (!safeName || safeName.includes("..")) return null;

  const files = listWoAttachmentFilesOnDisk(wonum, extraPaths);
  return files.find((f) => f.name === safeName) ?? null;
}

export function buildSimipAttachmentServeUrl(wonum: string, filename: string) {
  return `/api/simip-attachments/${encodeURIComponent(wonum)}/${encodeURIComponent(filename)}`;
}
