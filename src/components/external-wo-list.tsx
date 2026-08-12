"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, Input, SectionTitle, Select } from "@/components/ui";
import { WoStatusBadge, PriorityBadge } from "@/components/status-badge";
import { MirrorSimipButton } from "@/components/mirror-simip-button";
import { createJobFromExternalWo } from "@/lib/job-actions";
import { formatDate, formatDateTime } from "@/lib/constants";
import type { ExternalWorkOrder, ExternalWoStatus, Job, Priority } from "@/lib/types";

export type ExternalWoRow = ExternalWorkOrder & {
  jobs?: Pick<Job, "id" | "job_number" | "status">[] | Pick<Job, "id" | "job_number" | "status"> | null;
};

function linkedJob(row: ExternalWoRow) {
  const j = row.jobs;
  if (!j) return null;
  if (Array.isArray(j)) return j[0] ?? null;
  return j;
}

export function ExternalWoList({
  workOrders,
  canManage,
}: {
  workOrders: ExternalWoRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [linkFilter, setLinkFilter] = useState("UNSCHEDULED");
  const [area, setArea] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const w of workOrders) {
      if (w.area) set.add(w.area);
    }
    return Array.from(set).sort();
  }, [workOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return workOrders.filter((w) => {
      const job = linkedJob(w);
      if (linkFilter === "UNSCHEDULED" && job) return false;
      if (linkFilter === "SCHEDULED" && !job) return false;

      if (status === "ACTIVE") {
        if (!w.is_active) return false;
        if (w.external_status === "CANCELLED" || w.external_status === "COMPLETED") return false;
      } else if (status !== "ALL") {
        if (w.external_status !== status) return false;
      }

      if (area !== "ALL" && (w.area ?? "") !== area) return false;

      if (!q) return true;
      return (
        w.wo_number.toLowerCase().includes(q) ||
        (w.title ?? "").toLowerCase().includes(q) ||
        (w.equipment ?? "").toLowerCase().includes(q) ||
        (w.location ?? "").toLowerCase().includes(q) ||
        (w.area ?? "").toLowerCase().includes(q) ||
        (w.plant ?? "").toLowerCase().includes(q)
      );
    });
  }, [workOrders, search, status, linkFilter, area]);

  async function schedule(woId: string) {
    setError(null);
    setBusyId(woId);
    const result = await createJobFromExternalWo(woId);
    setBusyId(null);
    if (result?.error && !result.id) {
      setError(result.error);
      return;
    }
    if (result?.id) {
      router.push(`/jobs/${result.id}`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title={`WO SIMIP (${filtered.length})`}
        action={
          <div className="flex flex-wrap items-start gap-2">
            {canManage && <MirrorSimipButton className="px-3 py-1.5 text-xs" />}
            <Button href="/jobs" variant="secondary">Daftar Job</Button>
            <Button href="/work-orders" variant="ghost">WO Internal</Button>
          </div>
        }
      />

      <Card className="p-3">
        <p className="text-xs text-zinc-500">
          Work Order dari SAUSIMIP (sinkron). Jadwalkan menjadi job SAUMEK untuk pemantauan lapangan.
          Satu WO hanya bisa punya satu job.
        </p>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          name="search"
          label="Cari"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nomor WO, judul, equipment..."
        />
        <Select name="status" label="Status SIMIP" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">Aktif (open / planned / in progress)</option>
          <option value="ALL">Semua status</option>
          <option value="OPEN">Open</option>
          <option value="PLANNED">Direncanakan</option>
          <option value="IN_PROGRESS">Berjalan</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </Select>
        <Select name="link" label="Jadwal Job" value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)}>
          <option value="UNSCHEDULED">Belum dijadwalkan</option>
          <option value="SCHEDULED">Sudah ada job</option>
          <option value="ALL">Semua</option>
        </Select>
        <Select name="area" label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="ALL">Semua area</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-700">{error}</p>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="Tidak ada WO"
            description={
              workOrders.length === 0
                ? "Belum ada data sinkron dari SIMIP. Jalankan sync-agent terlebih dahulu."
                : "Tidak ada WO yang cocok dengan filter saat ini."
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((wo) => {
            const job = linkedJob(wo);
            const canSchedule =
              canManage &&
              !job &&
              wo.is_active &&
              wo.external_status !== "CANCELLED";
            return (
              <Card key={wo.id} className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">
                      <span className="font-mono text-[var(--color-primary)]">{wo.wo_number}</span>
                      {wo.title ? (
                        <Badge className="ml-2 bg-zinc-100 text-zinc-700">{wo.title}</Badge>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {[wo.plant, wo.area, wo.location].filter(Boolean).join(" / ") || "-"}
                      {wo.equipment ? ` · Eq: ${wo.equipment}` : ""}
                      {wo.wo_type ? ` · ${wo.wo_type}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Rencana {formatDate(wo.planned_start)} – {formatDate(wo.planned_finish)}
                      {wo.synced_at ? ` · Sync ${formatDateTime(wo.synced_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {wo.priority ? <PriorityBadge priority={wo.priority as Priority} /> : null}
                    {wo.external_status ? (
                      <WoStatusBadge status={wo.external_status as ExternalWoStatus} />
                    ) : null}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2">
                  <div className="text-xs text-zinc-500">
                    {job ? (
                      <>
                        Job:{" "}
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {job.job_number}
                        </Link>
                        <Badge className="ml-2 bg-emerald-50 text-emerald-700">Terjadwal</Badge>
                      </>
                    ) : (
                      <span className="text-amber-700">Belum dijadwalkan</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {job && (
                      <Button href={`/jobs/${job.id}`} variant="secondary" className="px-3 py-1.5 text-xs">
                        Buka Job
                      </Button>
                    )}
                    {canSchedule && (
                      <Button
                        className="px-3 py-1.5 text-xs"
                        disabled={busyId === wo.id}
                        onClick={() => schedule(wo.id)}
                      >
                        {busyId === wo.id ? "Membuat..." : "+ Jadwalkan Job"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
