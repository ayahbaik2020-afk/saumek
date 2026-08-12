"use client";

import { useState } from "react";
import { Button, Card, CardHeader, ErrorMessage, Input } from "@/components/ui";

interface SyncStats {
  total_read: number;
  total_inserted: number;
  total_updated: number;
  total_failed: number;
}

interface SimipResult {
  ok: boolean;
  mode: "test" | "sync";
  stats: SyncStats;
  first_error: string | null;
  error?: string;
}

export function SimipSyncCard() {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [database, setDatabase] = useState("");
  const [busy, setBusy] = useState<null | "test" | "sync">(null);
  const [result, setResult] = useState<SimipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: "test" | "sync") {
    setBusy(mode);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/simip/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          username,
          password,
          server: server.trim() || undefined,
          database: database.trim() || undefined,
        }),
      });
      const data: SimipResult = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Sinkronisasi gagal.");
        return;
      }
      setResult(data);
    } catch {
      setError("Tidak dapat terhubung ke server aplikasi.");
    } finally {
      setBusy(null);
    }
  }

  function close() {
    setOpen(false);
    setResult(null);
    setError(null);
    setPassword("");
  }

  const { stats } = result ?? { stats: null };

  return (
    <Card>
      <CardHeader
        title="Sinkronisasi WO dari SIMIP"
        subtitle="Tarik nomor Work Order mekanikal (MS/MR) dari MIPRO/SAUSIMIP ke Supabase."
        action={
          <Button onClick={() => setOpen(true)} className="shrink-0">
            🔄 Sinkronkan
          </Button>
        }
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-900">
              Sinkronisasi Work Order SIMIP
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Masukkan kredensial akses MIPRO/SIMIP. Tidak disimpan di aplikasi.
            </p>

            <div className="mt-4 space-y-3">
              <Input
                name="simip-username"
                label="User SIMIP"
                placeholder="mis. suyana"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                name="simip-password"
                label="Password SIMIP"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {showAdvanced ? "Sembunyikan" : "Tampilkan"} server/database (opsional)
              </button>
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="simip-server"
                    label="Server"
                    placeholder="192.168.20.10"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                  />
                  <Input
                    name="simip-database"
                    label="Database"
                    placeholder="SAUSIMIP"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                  />
                </div>
              )}
            </div>

            <ErrorMessage message={error} />

            {result && stats && (
              <div className="mt-3 space-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                {result.mode === "test" ? (
                  <p className="text-emerald-700">
                    ✅ Koneksi OK. Ditemukan {stats.total_read} WO mekanikal.
                  </p>
                ) : (
                  <>
                    <p className="font-medium text-emerald-700">
                      ✅ Selesai sinkronisasi.
                    </p>
                    <p className="text-zinc-600">
                      Baca {stats.total_read} · Insert {stats.total_inserted} ·
                      Update {stats.total_updated} · Gagal {stats.total_failed}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={close} disabled={busy !== null}>
                Batal
              </Button>
              <Button
                variant="secondary"
                onClick={() => run("test")}
                disabled={busy !== null || !username || !password}
              >
                {busy === "test" ? "Menghubungkan…" : "Uji Koneksi"}
              </Button>
              <Button
                onClick={() => run("sync")}
                disabled={busy !== null || !username || !password}
              >
                {busy === "sync" ? "Menyinkronkan…" : "Sinkronkan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
