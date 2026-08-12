import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const BUNDLE_FILES = [
  "saumek-sync.ps1",
  "sync.bat",
  "config.template.json",
  "README.md",
] as const;

/** ZIP store-only (tanpa kompresi) — cukup untuk bundel kecil sync-agent. */
function buildZip(files: { name: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [];
  let offset = 0;
  const central: Buffer[] = [];

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    const localOffset = offset;
    parts.push(local, file.data);
    offset += local.length + file.data.length;

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(file.data.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    nameBuf.copy(centralHeader, 46);
    central.push(centralHeader);
  }

  const centralDir = Buffer.concat(central);
  const centralOffset = offset;
  parts.push(centralDir);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  parts.push(end);

  return Buffer.concat(parts);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildConfigTemplate(dir: string): Buffer {
  const templatePath = join(dir, "config.template.json");
  const base = existsSync(templatePath)
    ? JSON.parse(readFileSync(templatePath, "utf8"))
    : {};

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url) base.supabaseUrl = url.replace(/\/$/, "");
  if (key) base.supabaseKey = key;

  return Buffer.from(JSON.stringify(base, null, 2) + "\n", "utf8");
}

export async function GET() {
  const dir = join(process.cwd(), "sync-agent");
  const files: { name: string; data: Buffer }[] = [];

  for (const name of BUNDLE_FILES) {
    if (name === "config.template.json") {
      files.push({ name, data: buildConfigTemplate(dir) });
      continue;
    }
    const path = join(dir, name);
    if (!existsSync(path)) continue;
    files.push({ name, data: readFileSync(path) });
  }

  if (files.length === 0) {
    return Response.json(
      { ok: false, error: "File sync agent tidak ditemukan." },
      { status: 404 }
    );
  }

  const zip = buildZip(files);
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="saumek-sync-agent.zip"',
    },
  });
}
