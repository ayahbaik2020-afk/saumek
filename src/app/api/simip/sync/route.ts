import { createClient } from "@/lib/supabase/server";
import { syncSimip, type SimipMode } from "@/lib/simip/simip";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_ROLES = ["admin", "supervisor", "foreman"];

function friendlyError(err: unknown): string {
  const anyErr = err as { code?: string; number?: number; message?: string };
  const msg = anyErr?.message ?? String(err);
  if (
    anyErr?.code === "ELOGIN" ||
    anyErr?.number === 18456 ||
    /login failed|18456|ELOGIN/i.test(msg)
  ) {
    return "Login ke SIMIP gagal. Periksa user/password, atau pastikan server SIMIP terjangkau.";
  }
  if (/timeout|timed out|ETIMEOUT/i.test(msg)) {
    return "Koneksi ke server SIMIP timeout. Periksa jaringan / VPN.";
  }
  if (/ENOTFOUND|ESOCKET|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
    return "Server SIMIP tidak dapat dijangkau. Periksa koneksi jaringan.";
  }
  return msg;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !ALLOWED_ROLES.includes(profile.role as string)) {
    return Response.json({ ok: false, error: "Tidak berhak melakukan sinkronisasi." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Request body tidak valid." }, { status: 400 });
  }

  const b = body as {
    username?: unknown;
    password?: unknown;
    server?: unknown;
    database?: unknown;
    mode?: unknown;
  };

  const username = typeof b.username === "string" ? b.username.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!username || !password) {
    return Response.json(
      { ok: false, error: "User dan password SIMIP wajib diisi." },
      { status: 400 }
    );
  }

  const mode: SimipMode = b.mode === "test" ? "test" : "sync";
  const server =
    (typeof b.server === "string" && b.server.trim()) ||
    process.env.SIMIP_SERVER ||
    "192.168.20.10";
  const database =
    (typeof b.database === "string" && b.database.trim()) ||
    process.env.SIMIP_DATABASE ||
    "SAUSIMIP";

  try {
    const result = await syncSimip({ server, database, username, password }, mode);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: friendlyError(err) }, { status: 400 });
  }
}
