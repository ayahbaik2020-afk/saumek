"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, Input, SectionTitle, Select } from "@/components/ui";
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/constants";
import type { Job } from "@/lib/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function JobList({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [area, setArea] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [when, setWhen] = useState("ALL");

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.area) set.add(j.area);
    }
    return Array.from(set).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const today = todayKey();
    const weekEnd = addDays(today, 7);

    return jobs.filter((j) => {
      if (status === "ACTIVE") {
        if (j.status === "COMPLETED" || j.status === "CANCELLED") return false;
      } else if (status !== "ALL" && j.status !== status) {
        return false;
      }

      if (area !== "ALL" && (j.area ?? "") !== area) return false;

      if (source === "SIMIP" && !j.external_wo_id) return false;
      if (source === "INTERNAL" && j.external_wo_id) return false;

      if (when === "TODAY") {
        const start = j.planned_start?.slice(0, 10);
        const end = j.planned_finish?.slice(0, 10) ?? start;
        if (!start) return false;
        if (start > today || (end && end < today)) return false;
      } else if (when === "WEEK") {
        const start = j.planned_start?.slice(0, 10);
        if (!start || start < today || start > weekEnd) return false;
      } else if (when === "OVERDUE") {
        const end = (j.planned_finish ?? j.planned_start)?.slice(0, 10);
        if (!end || end >= today) return false;
        if (j.status === "COMPLETED" || j.status === "CANCELLED") return false;
      }

      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.job_number.toLowerCase().includes(q) ||
        (j.plant ?? "").toLowerCase().includes(q) ||
        (j.area ?? "").toLowerCase().includes(q) ||
        (j.work_orders?.wo_number ?? "").toLowerCase().includes(q) ||
        (j.external_work_orders?.wo_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [jobs, search, status, area, source, when]);

  return (
    <div className="space-y-4">
      <SectionTitle
        title={`Daftar Pekerjaan (${filtered.length})`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/jobs/calendar" variant="secondary">Kalender</Button>
            <Button href="/simip-wo" variant="secondary">Dari WO SIMIP</Button>
            <Button href="/jobs/new">+ Buat Job</Button>
          </div>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Input
            name="search"
            label="Cari pekerjaan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Judul, nomor job, SIMIP WO..."
          />
        </div>
        <Select name="status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">Aktif</option>
          <option value="ALL">Semua Status</option>
          <option value="PLANNED">Direncanakan</option>
          <option value="READY">Siap</option>
          <option value="IN_PROGRESS">Berjalan</option>
          <option value="PENDING">Tertunda</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </Select>
        <Select name="area" label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="ALL">Semua area</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Select name="source" label="Sumber" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="ALL">Semua sumber</option>
          <option value="SIMIP">Dari SIMIP</option>
          <option value="INTERNAL">Internal</option>
        </Select>
        <Select name="when" label="Jadwal" value={when} onChange={(e) => setWhen(e.target.value)}>
          <option value="ALL">Semua tanggal</option>
          <option value="TODAY">Berjalan hari ini</option>
          <option value="WEEK">7 hari ke depan</option>
          <option value="OVERDUE">Lewat rencana</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada pekerjaan"
            description="Buat job dari WO SIMIP atau buat job manual."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button href="/simip-wo" variant="secondary">WO SIMIP</Button>
                <Button href="/jobs/new">+ Buat Job</Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((j) => (
            <Card key={j.id} interactive className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/jobs/${j.id}`} className="block truncate text-sm font-semibold text-zinc-900 hover:underline">
                    {j.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {j.job_number}
                    {j.external_work_orders
                      ? ` · SIMIP ${j.external_work_orders.wo_number}`
                      : j.work_orders
                        ? ` · WO ${j.work_orders.wo_number}`
                        : ""}
                    {j.plant || j.area ? ` · ${[j.plant, j.area].filter(Boolean).join(" / ")}` : ""}
                    {" · Mulai "}{formatDate(j.planned_start)}
                    {(() => {
                      const pics = (j.job_manpower ?? [])
                        .filter((m) => m.is_pic)
                        .map((m) => m.employees?.name)
                        .filter(Boolean) as string[];
                      const names =
                        pics.length > 0
                          ? pics
                          : j.pic?.name
                            ? [j.pic.name]
                            : [];
                      return names.length
                        ? ` · PIC ${names.join(", ")}`
                        : "";
                    })()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={j.priority} />
                  <JobStatusBadge status={j.status} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-zinc-100 pt-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-200 ease-out"
                    style={{ width: `${j.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-600">{j.progress}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
