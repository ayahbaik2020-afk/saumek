"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorMessage,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { QrCard } from "@/components/qr-card";
import {
  CertStatusBadge,
  DevStatusBadge,
  EmploymentBadge,
  ViolationSeverityBadge,
} from "@/components/status-badge";
import {
  addEmployeeSkill,
  removeEmployeeSkill,
  updateEmployeeSkill,
  createCertificate,
  removeCertificate,
  createDevelopment,
  updateDevelopmentStatus,
  removeDevelopment,
  createViolation,
  updateViolationStatus,
  removeViolation,
  type PeopleState,
} from "@/lib/people-actions";
import { formatDate, SKILL_LEVEL, VIOLATION_CATEGORY } from "@/lib/constants";
import type {
  Employee,
  Department,
  Skill,
  EmployeeSkill,
  EmployeeCertificate,
  CertificateType,
  EmployeeDevelopment,
  EmployeeViolation,
  DevStatus,
  SkillLevel,
  Role,
} from "@/lib/types";

interface JobHistoryLine {
  id: string;
  job_number: string;
  title: string;
  status: string;
  planned_start: string | null;
  role: string | null;
}

export function EmployeeDetail({
  employee,
  departments,
  skills,
  certificateTypes,
  employeeSkills,
  certificates,
  developments,
  violations,
  jobHistory,
  role,
}: {
  employee: Employee;
  departments: Department[];
  skills: Skill[];
  certificateTypes: CertificateType[];
  employeeSkills: EmployeeSkill[];
  certificates: EmployeeCertificate[];
  developments: EmployeeDevelopment[];
  violations: EmployeeViolation[];
  jobHistory: JobHistoryLine[];
  role: Role;
}) {
  const router = useRouter();
  const canManage = role === "admin" || role === "supervisor";

  const [skillState, addSkillAction, skillPending] = useActionState<PeopleState, FormData>(
    addEmployeeSkill,
    {}
  );
  const [certState, addCertAction, certPending] = useActionState<PeopleState, FormData>(
    createCertificate,
    {}
  );
  const [devState, addDevAction, devPending] = useActionState<PeopleState, FormData>(
    createDevelopment,
    {}
  );
  const [violState, addViolAction, violPending] = useActionState<PeopleState, FormData>(
    createViolation,
    {}
  );
  const [busy, setBusy] = useState(false);

  const empId = employee.id;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    await fn();
    setBusy(false);
    router.refresh();
  }

  const department = departments.find((d) => d.id === employee.department_id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-3xl font-bold text-blue-700">
          {employee.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={employee.photo_url} alt={employee.name} className="h-full w-full object-cover" />
          ) : (
            employee.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-900">{employee.name}</h1>
            <EmploymentBadge status={employee.employment_status} />
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {employee.employee_id} · {employee.position ?? "-"} · {department?.name ?? "-"}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-zinc-400">NIK</dt>
              <dd className="font-medium text-zinc-800">{employee.nik ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Pendidikan</dt>
              <dd className="font-medium text-zinc-800">{employee.education ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Grade</dt>
              <dd className="font-medium text-zinc-800">{employee.grade ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-400">Tahun Masuk</dt>
              <dd className="font-medium text-zinc-800">{formatDate(employee.join_date)}</dd>
            </div>
          </dl>
          {employee.notes && (
            <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">{employee.notes}</p>
          )}
        </div>
      </div>

      {/* QR */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">QR Personel</h2>
        <div className="max-w-[220px]">
          <QrCard code={employee.qr_code ?? employee.employee_id} name={employee.name} />
        </div>
      </div>

      {/* Skills */}
      <Card>
        <CardHeader title={`Keahlian (${employeeSkills.length})`} />
        <div className="divide-y divide-zinc-100">
          {employeeSkills.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada keahlian.</p>
          )}
          {employeeSkills.map((es) => (
            <div key={es.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {es.skills?.name ?? "Skill"}
                  <Badge className="ml-2 bg-blue-50 text-blue-700">{SKILL_LEVEL[es.level]}</Badge>
                </p>
                <p className="text-xs text-zinc-500">{es.skills?.category ?? ""}</p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <Select
                    className="w-auto py-1.5 text-xs"
                    value={es.level}
                    onChange={(e) => run(() => updateEmployeeSkill(es.id, e.target.value as SkillLevel, empId))}
                  >
                    {Object.entries(SKILL_LEVEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                  <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeEmployeeSkill(es.id, empId))}>
                    Hapus
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addSkillAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-2">
            <input type="hidden" name="employee_id" value={empId} />
            <Select name="skill_id" label="Skill" required>
              <option value="">- Pilih skill -</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select name="level" label="Level" defaultValue="INTERMEDIATE">
              {Object.entries(SKILL_LEVEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <div className="sm:col-span-2 flex items-start justify-between gap-3">
              <div className="flex-1">
                <ErrorMessage message={skillState?.error} />
              </div>
              <Button type="submit" disabled={skillPending}>{skillPending ? "..." : "+ Tambah"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader title={`Sertifikat (${certificates.length})`} />
        <div className="divide-y divide-zinc-100">
          {certificates.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada sertifikat.</p>
          )}
          {certificates.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {c.certificate_name} <CertStatusBadge status={c.status} />
                </p>
                <p className="text-xs text-zinc-500">
                  {c.certificate_number ?? ""}{c.issuer ? ` · ${c.issuer}` : ""}
                  {" · Berlaku s/d "}{formatDate(c.expiry_date)}
                </p>
              </div>
              {canManage && (
                <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeCertificate(c.id, empId))}>
                  Hapus
                </Button>
              )}
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addCertAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-2">
            <input type="hidden" name="employee_id" value={empId} />
            <Input name="certificate_name" label="Nama Sertifikat *" required />
            <Select name="certificate_type_id" label="Tipe" defaultValue="">
              <option value="">- Pilih -</option>
              {certificateTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <Input name="certificate_number" label="Nomor Sertifikat" />
            <Input name="issuer" label="Penerbit" />
            <Input name="issue_date" label="Tanggal Terbit" type="date" />
            <Input name="expiry_date" label="Tanggal Kadaluarsa" type="date" />
            <Input name="file_url" label="URL Dokumen" className="sm:col-span-2" />
            <div className="flex items-start justify-between gap-3 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={certState?.error} />
              </div>
              <Button type="submit" disabled={certPending}>{certPending ? "..." : "+ Tambah"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Development */}
      <Card>
        <CardHeader title={`Pengembangan Diri (${developments.length})`} />
        <div className="divide-y divide-zinc-100">
          {developments.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada rencana pengembangan.</p>
          )}
          {developments.map((d) => (
            <div key={d.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{d.goal} <DevStatusBadge status={d.status} /></p>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <Select
                      className="w-auto py-1.5 text-xs"
                      value={d.status}
                      onChange={(e) => run(() => updateDevelopmentStatus(d.id, e.target.value as DevStatus, empId))}
                    >
                      <option value="PLANNED">Direncanakan</option>
                      <option value="IN_PROGRESS">Berjalan</option>
                      <option value="COMPLETED">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </Select>
                    <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeDevelopment(d.id, empId))}>
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {d.required_training ?? d.target_certificate ?? "Tidak ada training target"}
                {d.target_date ? ` · Target: ${formatDate(d.target_date)}` : ""}
              </p>
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addDevAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-2">
            <input type="hidden" name="employee_id" value={empId} />
            <Input name="goal" label="Tujuan Pengembangan *" required />
            <Select name="target_skill_id" label="Skill Target" defaultValue="">
              <option value="">- Pilih -</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Input name="required_training" label="Training yang Dibutuhkan" />
            <Input name="target_certificate" label="Sertifikat Target" />
            <Input name="target_date" label="Tanggal Target" type="date" />
            <Select name="status" label="Status" defaultValue="PLANNED">
              <option value="PLANNED">Direncanakan</option>
              <option value="IN_PROGRESS">Berjalan</option>
              <option value="COMPLETED">Selesai</option>
              <option value="CANCELLED">Dibatalkan</option>
            </Select>
            <div className="flex items-start justify-between gap-3 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={devState?.error} />
              </div>
              <Button type="submit" disabled={devPending}>{devPending ? "..." : "+ Tambah"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Violations */}
      <Card>
        <CardHeader title={`Pelanggaran (${violations.length})`} />
        <div className="divide-y divide-zinc-100">
          {violations.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-zinc-500">Tidak ada pelanggaran tercatat.</p>
          )}
          {violations.map((v) => (
            <div key={v.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-900">
                  {v.violation} <ViolationSeverityBadge severity={v.severity} />
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-zinc-100 text-zinc-600">
                    {VIOLATION_CATEGORY[v.category]}
                  </Badge>
                  {canManage && (
                    <Button variant="ghost" className="text-xs text-rose-600" onClick={() => run(() => removeViolation(v.id, empId))}>
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDate(v.violation_date)} · {v.action ?? "-"}
              </p>
            </div>
          ))}
        </div>
        {canManage && (
          <form action={addViolAction} className="grid gap-2 border-t border-zinc-100 p-4 sm:grid-cols-2">
            <input type="hidden" name="employee_id" value={empId} />
            <Select name="category" label="Kategori" defaultValue="APD">
              {Object.entries(VIOLATION_CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Input name="violation_date" label="Tanggal" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <Input name="violation" label="Pelanggaran *" required />
            <Select name="severity" label="Tingkat" defaultValue="MINOR">
              <option value="MINOR">Ringan</option>
              <option value="MAJOR">Sedang</option>
              <option value="CRITICAL">Berat</option>
            </Select>
            <Input name="action" label="Tindakan" />
            <Input name="pic" label="PIC" />
            <Textarea name="description" label="Deskripsi" rows={2} className="sm:col-span-2" />
            <div className="flex items-start justify-between gap-3 sm:col-span-2">
              <div className="flex-1">
                <ErrorMessage message={violState?.error} />
              </div>
              <Button type="submit" disabled={violPending}>{violPending ? "..." : "+ Tambah"}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Job history */}
      <Card>
        <CardHeader title={`Riwayat Pekerjaan (${jobHistory.length})`} />
        <div className="divide-y divide-zinc-100">
          {jobHistory.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-zinc-500">Belum ada riwayat pekerjaan.</p>
          )}
          {jobHistory.map((j) => (
            <div key={j.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{j.title}</p>
                <Badge className="bg-zinc-100 text-zinc-600">{j.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                {j.job_number}{j.planned_start ? ` · ${formatDate(j.planned_start)}` : ""}{j.role ? ` · ${j.role}` : ""}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
