"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Select } from "@/components/ui";
import { JobStatusBadge, WoStatusBadge } from "@/components/status-badge";
import type { ExternalWorkOrder, ExternalWoStatus, Job, JobStatus } from "@/lib/types";

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export type CalendarExternalWo = ExternalWorkOrder & {
  jobs?: { id: string; job_number: string; status: JobStatus }[] | { id: string; job_number: string; status: JobStatus } | null;
};

type CalendarItem = {
  key: string;
  title: string;
  href: string;
  planned_start: string | null;
  planned_finish: string | null;
  area: string | null;
  kind: "job" | "simip_wo";
  statusLabel: string;
  tone: "job_simip" | "job_internal" | "wo_only";
  wo_number?: string;
};

function toKey(date: string | null | undefined) {
  return date ? date.slice(0, 10) : null;
}

function eachDate(start: string, end: string) {
  const keys: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  let guard = 0;
  while (cur <= last && guard < 120) {
    keys.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return keys;
}

function linkedJobId(wo: CalendarExternalWo): string | null {
  const j = wo.jobs;
  if (!j) return null;
  if (Array.isArray(j)) return j[0]?.id ?? null;
  return j.id;
}

function stageOfJob(status: JobStatus): "SCHEDULE" | "IN_PROGRESS" | "DONE" | "OTHER" {
  if (status === "PLANNED" || status === "READY" || status === "PENDING") return "SCHEDULE";
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "COMPLETED" || status === "CANCELLED") return "DONE";
  return "OTHER";
}

function stageOfWo(status: ExternalWoStatus | null): "SCHEDULE" | "IN_PROGRESS" | "DONE" | "OTHER" {
  if (!status) return "OTHER";
  if (status === "OPEN" || status === "PLANNED") return "SCHEDULE";
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "COMPLETED" || status === "CANCELLED") return "DONE";
  return "OTHER";
}

export function JobCalendar({
  jobs,
  externalWos = [],
}: {
  jobs: Job[];
  externalWos?: CalendarExternalWo[];
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [area, setArea] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [stage, setStage] = useState("ACTIVE");

  const items = useMemo(() => {
    const list: CalendarItem[] = [];
    const jobLinkedExternalIds = new Set(
      jobs.map((j) => j.external_wo_id).filter(Boolean) as string[]
    );

    for (const j of jobs) {
      list.push({
        key: `job-${j.id}`,
        title: j.title,
        href: `/jobs/${j.id}`,
        planned_start: j.planned_start,
        planned_finish: j.planned_finish,
        area: j.area,
        kind: "job",
        statusLabel: j.status,
        tone: j.external_wo_id ? "job_simip" : "job_internal",
        wo_number: j.external_work_orders?.wo_number ?? undefined,
      });
    }

    for (const wo of externalWos) {
      // Skip WO already represented by a SAUMEK job
      if (jobLinkedExternalIds.has(wo.id) || linkedJobId(wo)) continue;
      if (!wo.is_active) continue;
      if (wo.external_status === "CANCELLED") continue;
      if (!wo.planned_start && !wo.planned_finish) continue;

      list.push({
        key: `wo-${wo.id}`,
        title: wo.title || wo.wo_number,
        href: `/simip-wo?q=${encodeURIComponent(wo.wo_number)}`,
        planned_start: wo.planned_start,
        planned_finish: wo.planned_finish,
        area: wo.area,
        kind: "simip_wo",
        statusLabel: wo.external_status ?? "OPEN",
        tone: "wo_only",
        wo_number: wo.wo_number,
      });
    }

    return list;
  }, [jobs, externalWos]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.area) set.add(i.area);
    }
    return Array.from(set).sort();
  }, [items]);

  const visible = useMemo(() => {
    return items.filter((i) => {
      if (area !== "ALL" && (i.area ?? "") !== area) return false;

      if (source === "SIMIP" && i.tone === "job_internal") return false;
      if (source === "INTERNAL" && i.tone !== "job_internal") return false;
      if (source === "WO_ONLY" && i.kind !== "simip_wo") return false;

      if (stage === "ACTIVE") {
        if (i.kind === "job") {
          const s = stageOfJob(i.statusLabel as JobStatus);
          return s === "SCHEDULE" || s === "IN_PROGRESS";
        }
        const s = stageOfWo(i.statusLabel as ExternalWoStatus);
        return s === "SCHEDULE" || s === "IN_PROGRESS";
      }
      if (stage === "SCHEDULE") {
        return i.kind === "job"
          ? stageOfJob(i.statusLabel as JobStatus) === "SCHEDULE"
          : stageOfWo(i.statusLabel as ExternalWoStatus) === "SCHEDULE";
      }
      if (stage === "IN_PROGRESS") {
        return i.kind === "job"
          ? stageOfJob(i.statusLabel as JobStatus) === "IN_PROGRESS"
          : stageOfWo(i.statusLabel as ExternalWoStatus) === "IN_PROGRESS";
      }
      if (stage === "DONE") {
        return i.kind === "job"
          ? stageOfJob(i.statusLabel as JobStatus) === "DONE"
          : stageOfWo(i.statusLabel as ExternalWoStatus) === "DONE";
      }
      return true;
    });
  }, [items, area, source, stage]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const j of visible) {
      const start = toKey(j.planned_start);
      const end = toKey(j.planned_finish) ?? start;
      if (!start) continue;
      for (const key of eachDate(start, end ?? start)) {
        const list = map.get(key) ?? [];
        if (!list.some((x) => x.key === j.key)) list.push(j);
        map.set(key, list);
      }
    }
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const result: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const pad = (n: number) => String(n).padStart(2, "0");
      result.push(`${cursor.y}-${pad(cursor.m + 1)}-${pad(d)}`);
    }
    return result;
  }, [cursor]);

  function shift(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  const isTodayKey = toKey(today.toISOString());

  const toneClass: Record<CalendarItem["tone"], string> = {
    job_simip: "bg-teal-100/80 text-teal-900",
    job_internal: "bg-blue-100/70 text-blue-800",
    wo_only: "bg-amber-100/80 text-amber-900 ring-1 ring-amber-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            {MONTH_NAMES[cursor.m]} {cursor.y}
          </h2>
          <p className="text-xs text-zinc-500">
            Job SAUMEK + WO SIMIP terjadwal/berjalan ({visible.length} item)
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button href="/jobs" variant="ghost" className="px-3 py-1.5 text-xs">Daftar</Button>
          <Button href="/simip-wo" variant="ghost" className="px-3 py-1.5 text-xs">WO SIMIP</Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => shift(-1)}>‹ Bulan</Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => { const t = new Date(); setCursor({ y: t.getFullYear(), m: t.getMonth() }); }}>Hari Ini</Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => shift(1)}>Bulan ›</Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select name="stage" label="Tahap" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="ACTIVE">Aktif (jadwal + pengerjaan)</option>
          <option value="SCHEDULE">Jadwal / schedule</option>
          <option value="IN_PROGRESS">Pengerjaan</option>
          <option value="DONE">Selesai / batal</option>
          <option value="ALL">Semua tahap</option>
        </Select>
        <Select name="area" label="Area" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="ALL">Semua area</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Select name="source" label="Sumber" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="ALL">Semua sumber</option>
          <option value="SIMIP">Job dari SIMIP</option>
          <option value="WO_ONLY">WO SIMIP belum jadi job</option>
          <option value="INTERNAL">Job internal</option>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-7 border-b border-zinc-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-zinc-500">{d}</div>
          ))}
        </div>
        <div className="grid min-w-[720px] grid-cols-7">
          {cells.map((key, i) => {
            if (!key) return <div key={`pad-${i}`} className="min-h-[92px] border-b border-r border-zinc-100 bg-zinc-50/50" />;
            const dayItems = byDate.get(key) ?? [];
            const isToday = key === isTodayKey;
            return (
              <div key={key} className={`min-h-[92px] border-b border-r border-zinc-100 p-1.5 ${isToday ? "bg-blue-50" : ""}`}>
                <p className={`text-xs font-medium ${isToday ? "text-blue-700" : "text-zinc-500"}`}>
                  {Number(key.slice(8, 10))}
                </p>
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 3).map((j) => (
                    <Link
                      key={j.key}
                      href={j.href}
                      title={`${j.wo_number ? j.wo_number + " · " : ""}${j.title} (${j.statusLabel})`}
                      className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium hover:opacity-90 ${toneClass[j.tone]}`}
                    >
                      {j.wo_number ? `${j.wo_number} · ` : ""}
                      {j.kind === "simip_wo" ? `[WO] ${j.title}` : j.title}
                    </Link>
                  ))}
                  {dayItems.length > 3 && (
                    <p className="text-[11px] text-zinc-400">+{dayItems.length - 3} lagi</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900">Legenda</h3>
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-teal-900">Job SIMIP</span>
            job dari WO SIMIP
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900 ring-1 ring-amber-200">[WO]</span>
            WO SIMIP terjadwal, belum jadi job
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-800">Internal</span>
            job manual
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
          {(["PLANNED", "READY", "IN_PROGRESS", "PENDING", "COMPLETED"] as JobStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <JobStatusBadge status={s} />
            </span>
          ))}
          {(["OPEN", "PLANNED", "IN_PROGRESS"] as ExternalWoStatus[]).map((s) => (
            <span key={`wo-${s}`} className="inline-flex items-center gap-1.5">
              <WoStatusBadge status={s} />
              <span className="text-zinc-400">SIMIP</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
