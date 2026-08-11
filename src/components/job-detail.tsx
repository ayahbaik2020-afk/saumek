"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, CardHeader, ErrorMessage, Input, Select, Textarea } from "@/components/ui";
import { JobStatusBadge, PriorityBadge, JobToolStatusBadge, PermitStatusBadge } from "@/components/status-badge";
import {
  updateJobStatus,
  updateJobProgress,
  assignManpower,
  removeManpower,
  addJobRequirement,
  removeJobRequirement,
  addJobTool,
  updateJobToolStatus,
  removeJobTool,
  addPermit,
  updatePermitStatus,
  removePermit,
  toggleChecklist,
  addJobProgress,
  addDailyReport,
  type JobState,
} from "@/lib/job-actions";
import { formatDate, PERMIT_TYPE, SKILL_LEVEL } from "@/lib/constants";
import type {
  Job,
  Employee,
  Skill,
  Item,
  JobManpower,
  JobRequirement,
  JobTool,
  JobPermit,
  JobChecklist,
  JobProgress,
  JobDailyReport,
  JobStatus,
  JobToolStatus,
  PermitStatus,
} from "@/lib/types";

const STATUS_FLOW: Partial<Record<JobStatus, JobStatus[]>> = {
  PLANNED: ["READY", "IN_PROGRESS", "CANCELLED", "PENDING"],
  READY: ["IN_PROGRESS", "PENDING", "CANCELLED"],
  PENDING: ["READY", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "PENDING", "CANCELLED"],
};

const JOB_TOOL_STATUSES: JobToolStatus[] = ["REQUIRED", "RESERVED", "ISSUED", "RETURNED", "CANCELLED"];
const PERMIT_STATUSES: PermitStatus[] = ["PENDING", "APPROVED", "EXPIRED", "REJECTED", "NOT_REQUIRED"];

export function JobDetail({
  job,
  manpower,
  requirements,
  tools,
  permits,
  checklist,
  progress,
  dailyReports,
  employees,
  skills,
  items,
  canManage,
}: {
  job: Job;
  manpower: JobManpower[];
  requirements: JobRequirement[];
  tools: JobTool[];
  permits: JobPermit[];
  checklist: JobChecklist[];
  progress: JobProgress[];
  dailyReports: JobDailyReport[];
  employees: Employee[];
  skills: Skill[];
  items: Item[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progressValue, setProgressValue] = useState(job.progress);

  const [manpowerState, addManpowerAction, manpowerPending] = useActionState<JobState, FormData>(assignManpower, {});
  const [reqState, addReqAction, reqPending] = useActionState<JobState, FormData>(addJobRequirement, {});
  const [toolState, addToolAction, toolPending] = useActionState<JobState, FormData>(addJobTool, {});
  const [permitState, addPermitAction, permitPending] = useActionState<JobState, FormData>(addPermit, {});
  const [progState, addProgAction, progPending] = useActionState<JobState, FormData>(addJobProgress, {});
  const [reportState, addReportAction, reportPending] = useActionState<JobState, FormData>(addDailyReport, {});

  const activeEmployees = employees.filter((e) => e.employment_status !== "INACTIVE");
  const assignedIds = new Set(manpower.map((m) => m.employee_id));
  const availableEmployees = activeEmployees.filter((e) => !assignedIds.has(e.id));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
    router.refresh();
  }

  const nextStatuses = STATUS_FLOW[job.status] ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900">{job.title}</h1>
              <JobStatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">
              {job.job_number}
              {job.work_orders ? (
                <>
                  {" · "}<Link href={`/work-orders`} className="text-blue-600 hover:underline">WO {job.work_orders.wo_number}</Link>
                </>
              ) : null}
              {" · "}{[job.plant, job.area, job.location].filter(Boolean).join(" / ") || "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nextStatuses.map((s) => (
              <Button key={s} variant="secondary" className="px-3 py-1.5 text-xs" disabled={busy} onClick={() => run(() => updateJobStatus(job.id, s))}>
                {s === "COMPLETED" ? "✓ Selesai" : s === "IN_PROGRESS" ? "▶ Mulai" : s === "CANCELLED" ? "✕ Batal" : s}
              </Button>
            ))}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-400">PIC</dt>
            <dd className="font-medium text-zinc-800">{job.pic?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-400">Supervisor</dt>
            <dd className="font-medium text-zinc-800">{job.supervisor?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-400">Mulai (Rencana)</dt>
            <dd className="font-medium text-zinc-800">{formatDate(job.planned_start)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-400">Selesai (Rencana)</dt>
            <dd className="font-medium text-zinc-800">{formatDate(job.planned_finish)}</dd>
          </div>
        </dl>

        {job.description && (
          <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">{job.description}</p>
        )}

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progressValue}
            onChange={(e) => setProgressValue(Number(e.target.value))}
            onPointerUp={() => run(() => updateJobProgress(job.id, progressValue))}
            className="w-full accent-blue-600"
          />
        </div>
      </Card>

      {/* Manpower */}
      <Card>
        <CardHeader title={`Manpower (${manpower.length})`} />
        <div className="divide-y divide-zinc-100">
          {manpower.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada manpower.</p>}
          {manpower.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {m.employees?.name ?? "-"}
                  {m.is_pic && <Badge className="ml-2 bg-blue-50 text-blue-700">PIC</Badge>}
                </p>
                <p className="text-xs text-zinc-500">
                  {m.employees?.employee_id ?? ""}{m.role ? ` · ${m.role}` : ""}
                </p>
              </div>
              {canManage && (
                <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeManpower(m.id, job.id))}>
                  Hapus
                </Button>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addManpowerAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-3">
            <input type="hidden" name="job_id" value={job.id} />
            <Select name="employee_id" label="Karyawan *" required>
              <option value="">- Pilih -</option>
              {availableEmployees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
              ))}
            </Select>
            <Input name="role" label="Peran" placeholder="contoh: Welder, Fitter" />
            <div className="flex items-end justify-between gap-2">
              <label className="flex items-center gap-2 pb-2 text-sm text-zinc-700">
                <input type="checkbox" name="is_pic" value="true" className="h-4 w-4" /> PIC
              </label>
              <div className="flex-1">
                <ErrorMessage message={manpowerState?.error} />
              </div>
              <Button type="submit" disabled={manpowerPending}>{manpowerPending ? "..." : "+ Tugaskan"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader title={`Requirements / Skills (${requirements.length})`} />
        <div className="divide-y divide-zinc-100">
          {requirements.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada requirement.</p>}
          {requirements.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{r.skills?.name ?? "Skill umum"}</p>
                <p className="text-xs text-zinc-500">
                  {r.required_level ? `Level: ${SKILL_LEVEL[r.required_level]}` : ""}
                  {r.required_certificate ? ` · Sertifikat: ${r.required_certificate}` : ""}
                </p>
              </div>
              {canManage && (
                <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeJobRequirement(r.id, job.id))}>
                  Hapus
                </Button>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addReqAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-3">
            <input type="hidden" name="job_id" value={job.id} />
            <Select name="skill_id" label="Skill" defaultValue="">
              <option value="">- Pilih -</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select name="required_level" label="Level Minimal" defaultValue="">
              <option value="">- Pilih -</option>
              {Object.entries(SKILL_LEVEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <div className="flex items-end justify-between gap-2">
              <Input name="required_certificate" label="Sertifikat" className="flex-1" />
              <div className="flex-1">
                <ErrorMessage message={reqState?.error} />
              </div>
              <Button type="submit" disabled={reqPending}>{reqPending ? "..." : "+ Tambah"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader title={`Tools / Inventory (${tools.length})`} />
        <div className="divide-y divide-zinc-100">
          {tools.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada tool.</p>}
          {tools.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {t.items?.name ?? "-"} × {t.quantity}
                  <JobToolStatusBadge status={t.status} />
                </p>
                <p className="text-xs text-zinc-500">{t.items?.item_code ?? ""}{t.notes ? ` · ${t.notes}` : ""}</p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Select
                    className="w-auto py-1.5 text-xs"
                    value={t.status}
                    onChange={(e) => run(() => updateJobToolStatus(t.id, e.target.value as JobToolStatus, job.id))}
                  >
                    {JOB_TOOL_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                  <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeJobTool(t.id, job.id))}>
                    Hapus
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addToolAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-3">
            <input type="hidden" name="job_id" value={job.id} />
            <Select name="item_id" label="Item *" required>
              <option value="">- Pilih -</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.item_code} · {i.name}</option>
              ))}
            </Select>
            <Input name="quantity" label="Jumlah" type="number" min={1} defaultValue={1} />
            <div className="flex items-end justify-between gap-2">
              <Input name="notes" label="Catatan" className="flex-1" />
              <div className="flex-1">
                <ErrorMessage message={toolState?.error} />
              </div>
              <Button type="submit" disabled={toolPending}>{toolPending ? "..." : "+ Tambah"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Permits */}
      <Card>
        <CardHeader title={`Permit (${permits.length})`} />
        <div className="divide-y divide-zinc-100">
          {permits.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada permit.</p>}
          {permits.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {PERMIT_TYPE[p.permit_type]} <PermitStatusBadge status={p.status} />
                </p>
                <p className="text-xs text-zinc-500">
                  {p.permit_number ?? "-"}{p.approved_by ? ` · Approver: ${p.approved_by}` : ""}
                  {p.expiry_date ? ` · Berlaku s/d ${formatDate(p.expiry_date)}` : ""}
                </p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Select
                    className="w-auto py-1.5 text-xs"
                    value={p.status}
                    onChange={(e) => run(() => updatePermitStatus(p.id, e.target.value as PermitStatus, job.id))}
                  >
                    {PERMIT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                  <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removePermit(p.id, job.id))}>
                    Hapus
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addPermitAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-3">
            <input type="hidden" name="job_id" value={job.id} />
            <Select name="permit_type" label="Tipe Permit" defaultValue="WORK_PERMIT">
              {Object.entries(PERMIT_TYPE).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Input name="permit_number" label="Nomor Permit" />
            <div className="flex items-end justify-between gap-2">
              <Input name="approved_by" label="Approver" className="flex-1" />
              <div className="flex-1">
                <ErrorMessage message={permitState?.error} />
              </div>
              <Button type="submit" disabled={permitPending}>{permitPending ? "..." : "+ Tambah"}</Button>
            </div>
            <Input name="issue_date" label="Tanggal Terbit" type="date" />
            <Input name="expiry_date" label="Berlaku Sampai" type="date" />
            <Textarea name="notes" label="Catatan" rows={1} />
          </form>
        )}
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader
          title="Pre-Job Checklist"
          subtitle={checklist.filter((c) => c.is_required).length > 0 ? `${checklist.filter((c) => c.is_required && c.is_checked).length}/${checklist.filter((c) => c.is_required).length} tercentang` : undefined}
        />
        <div className="divide-y divide-zinc-100">
          {checklist.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Tidak ada checklist.</p>}
          {checklist.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={c.is_checked}
                onChange={(e) => run(() => toggleChecklist(c.id, e.target.checked, job.id))}
                className="h-4 w-4 accent-blue-600"
              />
              <span className={`text-sm ${c.is_checked ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
                {c.item}
                {!c.is_required && <span className="ml-2 text-xs text-zinc-400">(opsional)</span>}
              </span>
              {c.checked_by && <span className="ml-auto text-xs text-zinc-400">{c.checked_at ? formatDate(c.checked_at) : ""}</span>}
            </label>
          ))}
        </div>
      </Card>

      {/* Progress history */}
      <Card>
        <CardHeader title={`Riwayat Progress (${progress.length})`} />
        <div className="divide-y divide-zinc-100">
          {progress.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada update progress.</p>}
          {progress.map((p) => (
            <div key={p.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{formatDate(p.progress_date)} · {p.progress}%</p>
              </div>
              {(p.issue || p.safety_issue || p.notes) && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {p.issue ? `Issue: ${p.issue}` : ""}{p.safety_issue ? ` · Safety: ${p.safety_issue}` : ""}{p.notes ? ` · ${p.notes}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
        <form action={addProgAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-2">
          <input type="hidden" name="job_id" value={job.id} />
          <Input name="progress" label="Persentase (%)" type="number" min={0} max={100} defaultValue={job.progress} />
          <Input name="issue" label="Issue / Kendala" />
          <Input name="safety_issue" label="Safety Issue" />
          <Textarea name="notes" label="Catatan" rows={1} />
          <div className="flex items-start justify-between gap-3 sm:col-span-2">
            <div className="flex-1">
              <ErrorMessage message={progState?.error} />
            </div>
            <Button type="submit" disabled={progPending}>{progPending ? "..." : "+ Tambah Progress"}</Button>
          </div>
        </form>
      </Card>

      {/* Daily reports */}
      <Card>
        <CardHeader title={`Laporan Harian (${dailyReports.length})`} />
        <div className="divide-y divide-zinc-100">
          {dailyReports.length === 0 && <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada laporan harian.</p>}
          {dailyReports.map((r) => (
            <div key={r.id} className="px-4 py-3">
              <p className="text-sm font-medium text-zinc-900">{formatDate(r.report_date)}</p>
              {(r.actual_work || r.work_progress) && (
                <p className="mt-0.5 text-xs text-zinc-500">Pekerjaan: {r.actual_work ?? r.work_progress}</p>
              )}
              {r.manpower && <p className="text-xs text-zinc-500">Manpower: {r.manpower}</p>}
              {(r.problem || r.safety_issue) && (
                <p className="text-xs text-amber-600">⚠ {r.problem ?? ""}{r.safety_issue ? ` Safety: ${r.safety_issue}` : ""}</p>
              )}
            </div>
          ))}
        </div>
        <form action={addReportAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-2">
          <input type="hidden" name="job_id" value={job.id} />
          <Input name="actual_work" label="Pekerjaan yang Dilakukan *" required />
          <Input name="manpower" label="Manpower (jumlah & peran)" />
          <Input name="tools" label="Tools Digunakan" />
          <Input name="material" label="Material" />
          <Input name="problem" label="Problem" />
          <Input name="safety_issue" label="Safety Issue" />
          <Textarea name="work_progress" label="Progress Work" rows={1} className="sm:col-span-2" />
          <div className="flex items-start justify-between gap-3 sm:col-span-2">
            <div className="flex-1">
              <ErrorMessage message={reportState?.error} />
            </div>
            <Button type="submit" disabled={reportPending}>{reportPending ? "..." : "+ Tambah Laporan"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
