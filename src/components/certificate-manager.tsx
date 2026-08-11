"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ErrorMessage,
  IconButton,
  Input,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import {
  createCertificateType,
  updateCertificateType,
  deleteCertificateType,
  type PeopleState,
} from "@/lib/people-actions";
import { CertStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/constants";
import type { CertificateType, EmployeeCertificate } from "@/lib/types";

export function CertificateManager({
  certificateTypes,
  certificates,
  canManage,
}: {
  certificateTypes: CertificateType[];
  certificates: EmployeeCertificate[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CertificateType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [state, action, pending] = useActionState<PeopleState, FormData>(
    editing ? updateCertificateType : createCertificateType,
    {}
  );

  const filtered = statusFilter
    ? certificates.filter((c) => c.status === statusFilter)
    : certificates;

  const expiring = certificates.filter((c) => c.status === "EXPIRING_SOON").length;
  const expired = certificates.filter((c) => c.status === "EXPIRED").length;

  async function handleDelete(id: string) {
    if (!confirm("Hapus tipe sertifikat ini?")) return;
    const res = await deleteCertificateType(id);
    if (res.error) alert(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Sertifikat Karyawan" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="px-4 py-3">
          <p className="text-xs text-zinc-500">Total Sertifikat</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{certificates.length}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-zinc-500">Segera Habis</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{expiring}</p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-zinc-500">Expired</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{expired}</p>
        </Card>
      </div>

      {canManage && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            {editing ? "Edit Tipe Sertifikat" : "Tambah Tipe Sertifikat"}
          </h3>
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Input name="name" label="Nama Tipe *" defaultValue={editing?.name ?? ""} required />
            <Textarea name="description" label="Keterangan" rows={1} defaultValue={editing?.description ?? ""} />
            <div className="flex items-start gap-2 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={state?.error} />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambah"}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={() => { setEditing(null); router.refresh(); }}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {canManage && certificateTypes.length > 0 && (
        <Card className="divide-y divide-zinc-100">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tipe Sertifikat
          </div>
          {certificateTypes.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.name}</p>
                {t.description && <p className="text-xs text-zinc-500">{t.description}</p>}
              </div>
              <div className="flex gap-1">
                <IconButton onClick={() => { setEditing(t); router.refresh(); }} title="Edit">✏️</IconButton>
                <IconButton onClick={() => handleDelete(t.id)} title="Hapus">🗑️</IconButton>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="border-b border-zinc-100 px-4 py-3">
          <select
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRING_SOON">Segera Habis</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div className="divide-y divide-zinc-100">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">Tidak ada sertifikat.</p>
          )}
          {filtered.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {c.certificate_name} <CertStatusBadge status={c.status} />
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {c.employees?.name ?? "-"} · Berlaku s/d {formatDate(c.expiry_date)}
                </p>
              </div>
              <Button href={`/people/${c.employee_id}`} variant="ghost" className="text-xs shrink-0">
                Detail
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
