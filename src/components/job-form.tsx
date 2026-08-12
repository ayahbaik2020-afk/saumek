"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  ErrorMessage,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { createJob, type JobState } from "@/lib/job-actions";
import { PRIORITY } from "@/lib/constants";
import type { Employee, WorkOrder } from "@/lib/types";

export function JobForm({
  workOrders,
  employees,
  canManage,
}: {
  workOrders: WorkOrder[];
  employees: Employee[];
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState<JobState, FormData>(createJob, {});
  const [picIds, setPicIds] = useState<string[]>([]);
  const [picSearch, setPicSearch] = useState("");

  const activeEmployees = employees.filter((e) => e.employment_status !== "INACTIVE");
  const picFiltered = activeEmployees.filter((e) => {
    const q = picSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q)
    );
  });

  function togglePic(id: string) {
    setPicIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <Card>
      <CardHeader
        title="Buat Pekerjaan Baru (Job)"
        subtitle="Nomor Job dan WO dibuat otomatis. PIC boleh lebih dari satu."
      />
      <form action={action} className="grid gap-3 p-4 sm:grid-cols-2">
        <Input name="title" label="Judul Pekerjaan *" placeholder="contoh: Overhaul Compressor A" required />
        <Select name="priority" label="Prioritas" defaultValue="NORMAL">
          {Object.entries(PRIORITY).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Select>
        <Select name="wo_id" label="Hubungkan ke WO (opsional)" defaultValue="">
          <option value="">- Tidak ada / buat baru -</option>
          {workOrders.map((wo) => (
            <option key={wo.id} value={wo.id}>{wo.wo_number} · {wo.job_title}</option>
          ))}
        </Select>
        <Input name="wo_title" label="atau judul WO baru (otomatis dibuat)" placeholder="contoh: Overhaul Compressor A" />
        <Input name="plant" label="Plant" />
        <Input name="area" label="Area" />
        <Input name="location" label="Lokasi Detail" />
        <Select name="supervisor_id" label="Supervisor" defaultValue="">
          <option value="">- Pilih -</option>
          {activeEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
          ))}
        </Select>
        <Input name="planned_start" label="Mulai (Rencana)" type="date" />
        <Input name="planned_finish" label="Selesai (Rencana)" type="date" />
        <Input name="requester" label="Requester" />

        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm font-medium text-zinc-700">
              PIC (Person in Charge) — boleh lebih dari satu
            </label>
            <span className="text-xs text-zinc-500">
              {picIds.length === 0 ? "Belum dipilih" : `${picIds.length} dipilih`}
            </span>
          </div>
          {picIds.map((id) => (
            <input key={id} type="hidden" name="pic_ids" value={id} />
          ))}
          <Input
            name="pic_search"
            placeholder="Cari nama / NIK..."
            value={picSearch}
            onChange={(e) => setPicSearch(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
            {picFiltered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-zinc-500">Tidak ada karyawan.</p>
            ) : (
              picFiltered.map((e) => {
                const checked = picIds.includes(e.id);
                return (
                  <label
                    key={e.id}
                    className={`flex cursor-pointer items-center gap-3 border-b border-zinc-50 px-3 py-2 text-sm last:border-0 hover:bg-zinc-50 ${
                      checked ? "bg-[var(--color-primary-soft)]" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePic(e.id)}
                      className="h-4 w-4"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-zinc-900">
                      {e.name}
                      <span className="ml-1 font-normal text-zinc-500">({e.employee_id})</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <Textarea name="description" label="Deskripsi" rows={3} className="sm:col-span-2" />
        <Textarea name="notes" label="Catatan" rows={2} className="sm:col-span-2" />
        <div className="flex items-start justify-between gap-3 sm:col-span-2">
          <div className="flex-1">
            <ErrorMessage message={state?.error} />
          </div>
          <Button type="submit" disabled={pending || !canManage}>
            {pending ? "Membuat..." : "Buat Job"}
          </Button>
        </div>
      </form>
      {state?.id && !state?.error && (
        <div className="px-4 pb-4">
          <Button href={`/jobs/${state.id}`} variant="secondary">Lihat detail job →</Button>
        </div>
      )}
    </Card>
  );
}
