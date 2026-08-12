"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ErrorMessage, Input, SectionTitle, Select, Textarea } from "@/components/ui";
import { WoStatusBadge, PriorityBadge } from "@/components/status-badge";
import { createWorkOrder, updateWorkOrderStatus, type JobState } from "@/lib/job-actions";
import { formatDate, PRIORITY } from "@/lib/constants";
import type { WorkOrder, WoStatus } from "@/lib/types";

const WO_FLOW: Partial<Record<WoStatus, WoStatus[]>> = {
  OPEN: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  PLANNED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

export function WorkOrderList({ workOrders, canManage }: { workOrders: WorkOrder[]; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [state, action, pending] = useActionState<JobState, FormData>(createWorkOrder, {});

  const filtered = useMemo(() => {
    if (status === "ALL") return workOrders;
    return workOrders.filter((w) => w.status === status);
  }, [workOrders, status]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title={`Work Order (${filtered.length})`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/simip-wo" variant="secondary">WO SIMIP</Button>
            {canManage && (
              <Button href="/jobs/new" variant="secondary">+ Buat Job</Button>
            )}
          </div>
        }
      />

      {canManage && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Buat Work Order</h3>
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <Input name="job_title" label="Judul Pekerjaan *" required />
            <Select name="priority" label="Prioritas" defaultValue="NORMAL">
              {Object.entries(PRIORITY).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
            <Input name="plant" label="Plant" />
            <Input name="area" label="Area" />
            <Input name="location" label="Lokasi Detail" />
            <Input name="requester" label="Requester" />
            <Input name="planned_date" label="Tanggal Rencana" type="date" />
            <Input name="deadline" label="Deadline" type="date" />
            <Textarea name="description" label="Deskripsi" rows={2} className="sm:col-span-2" />
            <div className="flex items-start gap-2 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={state?.error} />
              </div>
              <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Buat WO"}</Button>
            </div>
          </form>
        </Card>
      )}

      <Select name="status" label="Filter Status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-xs">
        <option value="ALL">Semua Status</option>
        <option value="OPEN">Open</option>
        <option value="PLANNED">Direncanakan</option>
        <option value="IN_PROGRESS">Berjalan</option>
        <option value="COMPLETED">Selesai</option>
        <option value="CANCELLED">Dibatalkan</option>
      </Select>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card>
            <p className="px-4 py-6 text-center text-sm text-zinc-500">Belum ada work order.</p>
          </Card>
        )}
        {filtered.map((wo) => (
          <Card key={wo.id} className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">
                  {wo.wo_number} <Badge className="ml-1 bg-zinc-100 text-zinc-600">{wo.job_title}</Badge>
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {[wo.plant, wo.area, wo.location].filter(Boolean).join(" / ") || "-"}
                  {wo.requester ? ` · Requester: ${wo.requester}` : ""}
                  {wo.planned_date ? ` · ${formatDate(wo.planned_date)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PriorityBadge priority={wo.priority} />
                <WoStatusBadge status={wo.status} />
              </div>
            </div>
            {canManage && (WO_FLOW[wo.status] ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 border-t border-zinc-100 pt-2">
                {(WO_FLOW[wo.status] ?? []).map((s) => (
                  <Button key={s} variant="ghost" className="text-xs" disabled={busy} onClick={() => run(() => updateWorkOrderStatus(wo.id, s))}>
                    {s === "COMPLETED" ? "✓ Selesai" : s === "CANCELLED" ? "✕ Batal" : s}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
