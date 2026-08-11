"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, Input, SectionTitle, Select } from "@/components/ui";
import { JobStatusBadge, PriorityBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/constants";
import type { Job } from "@/lib/types";

export function JobList({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      if (status !== "ALL" && j.status !== status) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.job_number.toLowerCase().includes(q) ||
        (j.plant ?? "").toLowerCase().includes(q) ||
        (j.area ?? "").toLowerCase().includes(q) ||
        (j.work_orders?.wo_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [jobs, search, status]);

  return (
    <div className="space-y-4">
      <SectionTitle
        title={`Daftar Pekerjaan (${filtered.length})`}
        action={<Button href="/jobs/new">+ Buat Job</Button>}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          name="search"
          label="Cari pekerjaan"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Judul, nomor job, plant..."
        />
        <Select name="status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">Semua Status</option>
          <option value="PLANNED">Direncanakan</option>
          <option value="READY">Siap</option>
          <option value="IN_PROGRESS">Berjalan</option>
          <option value="PENDING">Tertunda</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada pekerjaan"
            description="Buat job baru untuk mulai merencanakan pekerjaan mechanical."
            action={<Button href="/jobs/new">+ Buat Job</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((j) => (
            <Card key={j.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/jobs/${j.id}`} className="block truncate text-sm font-semibold text-zinc-900 hover:underline">
                    {j.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {j.job_number}
                    {j.work_orders ? ` · WO ${j.work_orders.wo_number}` : ""}
                    {j.plant || j.area ? ` · ${[j.plant, j.area].filter(Boolean).join(" / ")}` : ""}
                    {" · Mulai "}{formatDate(j.planned_start)}
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
                    className="h-full rounded-full bg-blue-600 transition-all"
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
