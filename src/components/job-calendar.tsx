"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { JobStatusBadge } from "@/components/status-badge";
import type { Job } from "@/lib/types";

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function toKey(date: string | null | undefined) {
  return date ? date.slice(0, 10) : null;
}

export function JobCalendar({ jobs }: { jobs: Job[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const byDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const j of jobs) {
      const start = toKey(j.planned_start);
      const end = toKey(j.planned_finish);
      if (start) {
        map.set(start, [...(map.get(start) ?? []), j]);
      }
      if (end && end !== start) {
        map.set(end, [...(map.get(end) ?? []), j]);
      }
    }
    return map;
  }, [jobs]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">
          {MONTH_NAMES[cursor.m]} {cursor.y}
        </h2>
        <div className="flex gap-1.5">
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => shift(-1)}>‹ Bulan</Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => { const t = new Date(); setCursor({ y: t.getFullYear(), m: t.getMonth() }); }}>Hari Ini</Button>
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => shift(1)}>Bulan ›</Button>
        </div>
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
            const dayJobs = byDate.get(key) ?? [];
            const isToday = key === isTodayKey;
            return (
              <div key={key} className={`min-h-[92px] border-b border-r border-zinc-100 p-1.5 ${isToday ? "bg-blue-50" : ""}`}>
                <p className={`text-xs font-medium ${isToday ? "text-blue-700" : "text-zinc-500"}`}>
                  {Number(key.slice(8, 10))}
                </p>
                <div className="mt-1 space-y-1">
                  {dayJobs.slice(0, 3).map((j) => (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      title={j.title}
                      className="block truncate rounded bg-blue-100/70 px-1.5 py-0.5 text-[11px] font-medium text-blue-800 hover:bg-blue-200"
                    >
                      {j.title}
                    </Link>
                  ))}
                  {dayJobs.length > 3 && (
                    <p className="text-[11px] text-zinc-400">+{dayJobs.length - 3} lagi</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900">Legenda</h3>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
          {(["PLANNED", "READY", "IN_PROGRESS", "PENDING", "COMPLETED", "CANCELLED"] as Job["status"][]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <JobStatusBadge status={s} /> {s}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
