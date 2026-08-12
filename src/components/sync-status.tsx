import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Button } from "@/components/ui";
import { MirrorSimipButton } from "@/components/mirror-simip-button";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SyncLogRow = {
  status: string;
  started_at: string | null;
  finished_at: string | null;
  total_read: number | null;
  total_inserted: number | null;
  total_updated: number | null;
  total_failed: number | null;
  error_message: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  RUNNING: "Sedang berjalan…",
  SUCCESS: "Sukses",
  PARTIAL: "Sebagian gagal",
  FAILED: "Gagal",
};

function StatusPill({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  const classes: Record<string, string> = {
    RUNNING: "bg-amber-50 text-amber-700 ring-amber-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
    FAILED: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        classes[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200"
      }`}
    >
      {label}
    </span>
  );
}

export default async function SyncStatusCard() {
  const supabase = await createClient();
  const { data: log } = await supabase
    .from("wo_sync_logs")
    .select(
      "status, started_at, finished_at, total_read, total_inserted, total_updated, total_failed, error_message"
    )
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latest = (log as SyncLogRow | null) ?? null;

  return (
    <Card>
      <CardHeader
        title="Sinkronisasi Work Order SIMIP"
        subtitle="Data WO mekanikal (MS/MR) disalin dari MIPRO/SAUSIMIP ke Supabase oleh sync-agent."
        action={
          <div className="flex flex-wrap gap-2">
            <MirrorSimipButton className="shrink-0 px-3 py-2 text-xs" />
            <Button href="/simip-wo" variant="secondary" className="shrink-0">
              Lihat WO SIMIP
            </Button>
            <Button href="/api/sync-agent/download" className="shrink-0">
              ⬇ Unduh saumek-sync.ps1
            </Button>
          </div>
        }
      />

      <div className="space-y-3 px-4 py-3">
        {latest ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900">Sync terakhir</p>
              <StatusPill status={latest.status} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["Baca", latest.total_read],
                ["Insert", latest.total_inserted],
                ["Update", latest.total_updated],
                ["Gagal", latest.total_failed],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-zinc-50 px-2 py-1.5">
                  <p className="text-sm font-semibold text-zinc-900">{value ?? 0}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    {String(label)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              {formatDateTime(latest.finished_at ?? latest.started_at)}
            </p>
            {latest.status === "FAILED" && latest.error_message && (
              <p className="text-xs text-rose-600">{latest.error_message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Belum ada riwayat sinkronisasi.
          </p>
        )}

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          <p className="font-semibold text-zinc-700">Cara sinkronisasi:</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4">
            <li>Unduh script, jalankan di PC yang terhubung jaringan Sulfindo (kantor/VPN).</li>
            <li>Double-click <code className="rounded bg-white px-1 py-0.5 text-[11px]">sync.bat</code>, isi konfigurasi sekali saat pertama kali.</li>
            <li>Sync berjalan otomatis setiap kali script dijalankan (manual atau Task Scheduler).</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
