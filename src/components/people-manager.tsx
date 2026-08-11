"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Input,
  SectionTitle,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import {
  createEmployee,
  updateEmployee,
  toggleEmployeeActive,
  type PeopleState,
} from "@/lib/people-actions";
import { EmploymentBadge } from "@/components/status-badge";
import { EMPLOYMENT_STATUS } from "@/lib/constants";
import type { Employee, Department } from "@/lib/types";

export function PeopleManager({
  departments,
  canManage,
}: {
  departments: Department[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, action, pending] = useActionState<PeopleState, FormData>(
    editing ? updateEmployee : createEmployee,
    {}
  );

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("*, departments(name)")
        .order("name");
      setEmployees((data ?? []) as Employee[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        (e.nik ?? "").toLowerCase().includes(q) ||
        (e.position ?? "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  async function handleToggle(emp: Employee) {
    setBusy(true);
    await toggleEmployeeActive(emp.id);
    setBusy(false);
    router.refresh();
  }

  function startEdit(emp: Employee) {
    setEditing(emp);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <SectionTitle
        title={`Daftar Personel (${filtered.length})`}
        action={
          canManage && (
            <Button onClick={() => { setEditing(null); setShowForm(!showForm); }}>
              {showForm ? "Tutup" : "+ Tambah Personel"}
            </Button>
          )
        }
      />

      {showForm && canManage && (
        <Card className="p-4">
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <Input name="name" label="Nama Lengkap *" defaultValue={editing?.name ?? ""} required />
            <Input name="nik" label="NIK / Nomor Personel" defaultValue={editing?.nik ?? ""} />
            <Input name="position" label="Jabatan / Keahlian" defaultValue={editing?.position ?? ""} />
            <Select
              name="department_id"
              label="Departemen"
              defaultValue={editing?.department_id ?? ""}
            >
              <option value="">- Pilih -</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Input name="education" label="Pendidikan" defaultValue={editing?.education ?? ""} />
            <Input name="grade" label="Grade" defaultValue={editing?.grade ?? ""} />
            <Input name="join_date" label="Tahun Masuk" type="date" defaultValue={editing?.join_date ?? ""} />
            <Select
              name="employment_status"
              label="Status Kerja"
              defaultValue={editing?.employment_status ?? "ACTIVE"}
            >
              {Object.entries(EMPLOYMENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
            <Input name="contact" label="Kontak" defaultValue={editing?.contact ?? ""} />
            <Input name="photo_url" label="URL Foto" defaultValue={editing?.photo_url ?? ""} hint="Masukkan URL gambar langsung." />
            <Textarea name="notes" label="Catatan" rows={2} defaultValue={editing?.notes ?? ""} className="sm:col-span-2" />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
              {editing && (
                <Button variant="secondary" onClick={() => { setEditing(null); setShowForm(false); }} type="button">
                  Batal
                </Button>
              )}
            </div>
          </form>
          <div className="mt-3">
            <ErrorMessage message={state?.error} />
          </div>
        </Card>
      )}

      <Input
        name="search"
        label="Cari personel"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Nama, NIK, jabatan..."
      />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada personel"
            description="Tambahkan personel Team Mechanical untuk mulai mengelola data mereka."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((emp) => (
            <Card key={emp.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt={emp.name} className="h-full w-full object-cover" />
                  ) : (
                    emp.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/people/${emp.id}`} className="block truncate text-sm font-semibold text-zinc-900 hover:underline">
                    {emp.name}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">
                    {emp.employee_id}{emp.nik ? ` · NIK ${emp.nik}` : ""} · {emp.position ?? "-"}
                  </p>
                </div>
                <EmploymentBadge status={emp.employment_status} />
              </div>
              {canManage && (
                <div className="mt-2 flex gap-1 border-t border-zinc-100 pt-2">
                  <Button href={`/people/${emp.id}`} variant="ghost" className="text-xs">Profil & QR</Button>
                  <Button variant="ghost" className="text-xs" onClick={() => startEdit(emp)}>Edit</Button>
                  <Button
                    variant="ghost"
                    className="text-xs"
                    disabled={busy}
                    onClick={() => handleToggle(emp)}
                  >
                    {emp.employment_status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
