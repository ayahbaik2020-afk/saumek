import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const FILENAME = "saumek-sync.ps1";

export async function GET() {
  try {
    const file = readFileSync(join(process.cwd(), "sync-agent", FILENAME));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${FILENAME}"`,
      },
    });
  } catch {
    return Response.json(
      { ok: false, error: "File sync agent tidak ditemukan." },
      { status: 404 }
    );
  }
}
