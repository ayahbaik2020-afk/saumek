"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ErrorMessage,
  Input,
  SectionTitle,
  Select,
  Textarea,
} from "@/components/ui";
import {
  createViolation,
  updateViolationStatus,
  removeViolation,
  type PeopleState,
} from "@/lib/people-actions";
import { ViolationSeverityBadge } from "@/components/status-badge";
import { VIOLATION_CATEGORY } from "@/lib/constants";
import type { Employee, EmployeeViolation } from "@/lib/types";

const V_STATUS: Record<EmployeeViolation["status"], string> = {
  OPEN: "Terbuka",
  CLOSED: "Ditutup",
  RESOLVED: "Selesai",
};

export function ViolationManager({
  violations,
  employees,
  canManage,
}: {
  violations: EmployeeViolation[];
  employees: Employee[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [state, action, pending] = useActionState<PeopleState, FormData>(createViolation, {});

  const filtered = useMemo(() => {
    if (filter === "ALL") return violations;
    if (filter === "OPEN" || filter === "CLOSED" || filter === "RESOLVED")
      return violations.filter((v) => v.status === filter);
    return violations.filter((v) => v.category === filter);
  }, [violations, filter]);

  const activeEmployees = employees.filter((e) => e.employment_status !== "INACTIVE");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionTitle title={`Pelanggaran (${filtered.length})`} />

      {canManage && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Tambah Pelanggaran</h3>
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <Select name="employee_id" label="Karyawan *" required>
              <option value="">- Pilih -</option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
              ))}
            </Select>
            <Input name="violation_date" label="Tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <Select name="category" label="Kategori" defaultValue="APD">
              {Object.entries(VIOLATION_CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select name="severity" label="Tingkat" defaultValue="MINOR">
              <option value="MINOR">Ringan</option>
              <option value="MAJOR">Sedang</option>
              <option value="CRITICAL">Berat</option>
            </Select>
            <Input name="violation" label="Pelanggaran *" required />
            <Input name="action" label="Tindakan" />
            <Input name="pic" label="PIC" />
            <Textarea name="description" label="Deskripsi" rows={2} className="sm:col-span-2" />
            <div className="flex items-start gap-2 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={state?.error} />
              </div>
              <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "+ Tambah"}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="border-b border-zinc-100 px-4 py-3">
          <select
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 sm:w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">Semua</option>
            <optgroup label="Status">
              <option value="OPEN">Terbuka</option>
              <option value="CLOSED">Ditutup</option>
              <option value="RESOLVED">Selesai</option>
            </optgroup>
            <optgroup label="Kategori">
              {Object.entries(VIOLATION_CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="divide-y divide-zinc-100">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">Tidak ada pelanggaran.</p>
          )}
          {filtered.map((v) => (
            <div key={v.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-900">
                  {v.violation} <ViolationSeverityBadge severity={v.severity} />
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {VIOLATION_CATEGORY[v.category]}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {V_STATUS[v.status]}
                  </span>
                </div>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {v.employees ? `${v.employees.name} (${v.employees.employee_id}) · ` : ""}{v.violation_date}{v.action ? ` · Tindakan: ${v.action}` : ""}
              </p>
              {canManage && (
                <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-zinc-100 pt-2">
                  {v.status !== "RESOLVED" && (
                    <Button
                      variant="ghost"
                      className="text-xs"
                      disabled={busy}
                      onClick={() => run(() => updateViolationStatus(v.id, "RESOLVED", v.employee_id))}
                    >
                      Tandai Selesai
                    </Button>
                  )}
                  {v.status === "OPEN" && (
                    <Button
                      variant="ghost"
                      className="text-xs"
                      disabled={busy}
                      onClick={() => run(() => updateViolationStatus(v.id, "CLOSED", v.employee_id))}
                    >
                      Tutup
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="text-xs text-rose-600"
                    disabled={busy}
                    onClick={() => run(() => removeViolation(v.id, v.employee_id))}
                  >
                    Hapus
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
