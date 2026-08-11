"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [state, action, pending] = useActionState<JobState, FormData>(createJob, {});

  const activeEmployees = employees.filter((e) => e.employment_status !== "INACTIVE");

  return (
    <Card>
      <CardHeader
        title="Buat Pekerjaan Baru (Job)"
        subtitle="Nomor Job dan WO dibuat otomatis."
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
        <Select name="pic_id" label="PIC (Person in Charge)" defaultValue="">
          <option value="">- Pilih -</option>
          {activeEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
          ))}
        </Select>
        <Select name="supervisor_id" label="Supervisor" defaultValue="">
          <option value="">- Pilih -</option>
          {activeEmployees.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
          ))}
        </Select>
        <Input name="planned_start" label="Mulai (Rencana)" type="date" />
        <Input name="planned_finish" label="Selesai (Rencana)" type="date" />
        <Input name="requester" label="Requester" />
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
