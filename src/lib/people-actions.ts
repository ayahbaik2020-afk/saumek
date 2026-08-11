"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/db";
import { adminDb } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/db";
import type {
  SkillLevel,
  CertStatus,
  DevStatus,
  ViolationCategory,
  ViolationSeverity,
  EmploymentStatus,
} from "@/lib/types";

export type PeopleState = { error?: string; id?: string } | undefined;

function required(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function strOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function dateOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function certStatus(expiry: string | null): CertStatus {
  if (!expiry) return "VALID";
  const exp = new Date(expiry + "T23:59:59");
  const now = new Date();
  if (exp < now) return "EXPIRED";
  const cutoff = new Date(now.getTime() + 30 * 86400000);
  if (exp <= cutoff) return "EXPIRING_SOON";
  return "VALID";
}

export async function createEmployee(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const name = required(formData, "name");
  if (!name) return { error: "Nama wajib diisi." };

  const { data: codeData, error: codeError } = await adminDb().rpc(
    "generate_code",
    { prefix: "EMP", width: 4 }
  );
  if (codeError || !codeData) {
    return { error: "Gagal membuat kode employee: " + (codeError?.message ?? "unknown") };
  }

  const employeeId = String(codeData);
  const payload = {
    employee_id: employeeId,
    qr_code: employeeId,
    nik: strOrNull(formData.get("nik")),
    name,
    photo_url: strOrNull(formData.get("photo_url")),
    position: strOrNull(formData.get("position")),
    department_id: strOrNull(formData.get("department_id")),
    education: strOrNull(formData.get("education")),
    grade: strOrNull(formData.get("grade")),
    join_date: dateOrNull(formData.get("join_date")),
    employment_status: (strOrNull(formData.get("employment_status")) ??
      "ACTIVE") as EmploymentStatus,
    contact: strOrNull(formData.get("contact")),
    notes: strOrNull(formData.get("notes")),
  };

  const { data, error } = await adminDb()
    .from("employees")
    .insert(payload)
    .select("id, employee_id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "NIK sudah digunakan." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE EMPLOYEE",
    module: "People",
    recordId: data.id,
    newValue: { employee_id: data.employee_id, name },
  });

  revalidatePath("/people");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateEmployee(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  const name = required(formData, "name");
  if (!id || !name) return { error: "Data employee tidak lengkap." };

  const payload = {
    nik: strOrNull(formData.get("nik")),
    name,
    photo_url: strOrNull(formData.get("photo_url")),
    position: strOrNull(formData.get("position")),
    department_id: strOrNull(formData.get("department_id")),
    education: strOrNull(formData.get("education")),
    grade: strOrNull(formData.get("grade")),
    join_date: dateOrNull(formData.get("join_date")),
    employment_status: (strOrNull(formData.get("employment_status")) ??
      "ACTIVE") as EmploymentStatus,
    contact: strOrNull(formData.get("contact")),
    notes: strOrNull(formData.get("notes")),
  };

  const { error } = await adminDb().from("employees").update(payload).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "NIK sudah digunakan." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE EMPLOYEE",
    module: "People",
    recordId: id,
    newValue: { name },
  });

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  return { id };
}

export async function toggleEmployeeActive(id: string) {
  const admin = await requireAdmin();
  const { data: emp } = await adminDb()
    .from("employees")
    .select("employment_status")
    .eq("id", id)
    .single();
  if (!emp) return { error: "Employee tidak ditemukan." };

  const next = emp.employment_status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const { error } = await adminDb()
    .from("employees")
    .update({ employment_status: next })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: next === "ACTIVE" ? "ACTIVATE EMPLOYEE" : "DEACTIVATE EMPLOYEE",
    module: "People",
    recordId: id,
    oldValue: { employment_status: emp.employment_status },
    newValue: { employment_status: next },
  });

  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  return {};
}

// ---------- SKILLS (master) ----------

export async function createSkill(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const name = required(formData, "name");
  if (!name) return { error: "Nama skill wajib diisi." };

  const { data, error } = await adminDb()
    .from("skills")
    .insert({ name, category: strOrNull(formData.get("category")) })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Skill sudah ada." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE SKILL",
    module: "People",
    recordId: data.id,
    newValue: { name },
  });
  revalidatePath("/skills");
  return { id: data.id };
}

export async function updateSkill(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  const name = required(formData, "name");
  if (!id || !name) return { error: "Data skill tidak lengkap." };

  const { error } = await adminDb()
    .from("skills")
    .update({ name, category: strOrNull(formData.get("category")) })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE SKILL",
    module: "People",
    recordId: id,
    newValue: { name },
  });
  revalidatePath("/skills");
  return { id };
}

export async function deleteSkill(id: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("skills").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE SKILL",
    module: "People",
    recordId: id,
  });
  revalidatePath("/skills");
  return {};
}

// ---------- CERTIFICATE TYPES (master) ----------

export async function createCertificateType(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const name = required(formData, "name");
  if (!name) return { error: "Nama tipe wajib diisi." };

  const { data, error } = await adminDb()
    .from("certificate_types")
    .insert({ name, description: strOrNull(formData.get("description")) })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Tipe sertifikat sudah ada." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE CERTIFICATE TYPE",
    module: "People",
    recordId: data.id,
    newValue: { name },
  });
  revalidatePath("/certificates");
  return { id: data.id };
}

export async function updateCertificateType(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  const name = required(formData, "name");
  if (!id || !name) return { error: "Data tipe sertifikat tidak lengkap." };

  const { error } = await adminDb()
    .from("certificate_types")
    .update({ name, description: strOrNull(formData.get("description")) })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE CERTIFICATE TYPE",
    module: "People",
    recordId: id,
    newValue: { name },
  });
  revalidatePath("/certificates");
  return { id };
}

export async function deleteCertificateType(id: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("certificate_types").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE CERTIFICATE TYPE",
    module: "People",
    recordId: id,
  });
  revalidatePath("/certificates");
  return {};
}

// ---------- EMPLOYEE SKILLS ----------

export async function addEmployeeSkill(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const employeeId = required(formData, "employee_id");
  const skillId = required(formData, "skill_id");
  if (!employeeId || !skillId) return { error: "Skill dan employee wajib dipilih." };

  const { data, error } = await adminDb()
    .from("employee_skills")
    .insert({
      employee_id: employeeId,
      skill_id: skillId,
      level: (strOrNull(formData.get("level")) ?? "INTERMEDIATE") as SkillLevel,
      verified_at: new Date().toISOString(),
      notes: strOrNull(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Skill sudah terdaftar untuk employee ini." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "ADD EMPLOYEE SKILL",
    module: "People",
    recordId: data.id,
  });
  revalidatePath(`/people/${employeeId}`);
  return { id: data.id };
}

export async function updateEmployeeSkill(
  id: string,
  level: SkillLevel,
  employeeId: string
) {
  const admin = await requireAdmin();
  const { error } = await adminDb()
    .from("employee_skills")
    .update({ level })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE EMPLOYEE SKILL",
    module: "People",
    recordId: id,
    newValue: { level },
  });
  revalidatePath(`/people/${employeeId}`);
  return {};
}

export async function removeEmployeeSkill(id: string, employeeId: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("employee_skills").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "REMOVE EMPLOYEE SKILL",
    module: "People",
    recordId: id,
  });
  revalidatePath(`/people/${employeeId}`);
  return {};
}

// ---------- EMPLOYEE CERTIFICATES ----------

export async function createCertificate(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const employeeId = required(formData, "employee_id");
  const certificateName = required(formData, "certificate_name");
  if (!employeeId || !certificateName) return { error: "Data sertifikat tidak lengkap." };

  const expiry = dateOrNull(formData.get("expiry_date"));
  const payload = {
    employee_id: employeeId,
    certificate_name: certificateName,
    certificate_number: strOrNull(formData.get("certificate_number")),
    issuer: strOrNull(formData.get("issuer")),
    issue_date: dateOrNull(formData.get("issue_date")),
    expiry_date: expiry,
    certificate_type_id: strOrNull(formData.get("certificate_type_id")),
    file_url: strOrNull(formData.get("file_url")),
    status: certStatus(expiry),
    notes: strOrNull(formData.get("notes")),
  };

  const { data, error } = await adminDb()
    .from("employee_certificates")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE CERTIFICATE",
    module: "People",
    recordId: data.id,
    newValue: { certificate_name: certificateName },
  });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/certificates");
  return { id: data.id };
}

export async function updateCertificate(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  const employeeId = required(formData, "employee_id");
  const certificateName = required(formData, "certificate_name");
  if (!id || !certificateName) return { error: "Data sertifikat tidak lengkap." };

  const expiry = dateOrNull(formData.get("expiry_date"));
  const payload = {
    certificate_name: certificateName,
    certificate_number: strOrNull(formData.get("certificate_number")),
    issuer: strOrNull(formData.get("issuer")),
    issue_date: dateOrNull(formData.get("issue_date")),
    expiry_date: expiry,
    certificate_type_id: strOrNull(formData.get("certificate_type_id")),
    file_url: strOrNull(formData.get("file_url")),
    status: certStatus(expiry),
    notes: strOrNull(formData.get("notes")),
  };

  const { error } = await adminDb()
    .from("employee_certificates")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE CERTIFICATE",
    module: "People",
    recordId: id,
  });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/certificates");
  return { id };
}

export async function removeCertificate(id: string, employeeId: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("employee_certificates").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE CERTIFICATE",
    module: "People",
    recordId: id,
  });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/certificates");
  return {};
}

// ---------- EMPLOYEE DEVELOPMENT ----------

export async function createDevelopment(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const employeeId = required(formData, "employee_id");
  const goal = required(formData, "goal");
  if (!employeeId || !goal) return { error: "Goal pengembangan wajib diisi." };

  const { data, error } = await adminDb()
    .from("employee_developments")
    .insert({
      employee_id: employeeId,
      goal,
      target_skill_id: strOrNull(formData.get("target_skill_id")),
      required_training: strOrNull(formData.get("required_training")),
      target_certificate: strOrNull(formData.get("target_certificate")),
      target_date: dateOrNull(formData.get("target_date")),
      status: (strOrNull(formData.get("status")) ?? "PLANNED") as DevStatus,
      notes: strOrNull(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE DEVELOPMENT",
    module: "People",
    recordId: data.id,
    newValue: { goal },
  });
  revalidatePath(`/people/${employeeId}`);
  return { id: data.id };
}

export async function updateDevelopmentStatus(
  id: string,
  status: DevStatus,
  employeeId: string
) {
  const admin = await requireAdmin();
  const { error } = await adminDb()
    .from("employee_developments")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE DEVELOPMENT",
    module: "People",
    recordId: id,
    newValue: { status },
  });
  revalidatePath(`/people/${employeeId}`);
  return {};
}

export async function removeDevelopment(id: string, employeeId: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("employee_developments").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE DEVELOPMENT",
    module: "People",
    recordId: id,
  });
  revalidatePath(`/people/${employeeId}`);
  return {};
}

// ---------- EMPLOYEE VIOLATIONS ----------

export async function createViolation(
  _state: PeopleState,
  formData: FormData
): Promise<PeopleState> {
  const admin = await requireAdmin();
  const employeeId = required(formData, "employee_id");
  const violation = required(formData, "violation");
  if (!employeeId || !violation) return { error: "Data pelanggaran tidak lengkap." };

  const { data, error } = await adminDb()
    .from("employee_violations")
    .insert({
      employee_id: employeeId,
      violation_date: dateOrNull(formData.get("violation_date")) ?? new Date().toISOString().slice(0, 10),
      category: (strOrNull(formData.get("category")) ?? "APD") as ViolationCategory,
      violation,
      description: strOrNull(formData.get("description")),
      severity: (strOrNull(formData.get("severity")) ?? "MINOR") as ViolationSeverity,
      action: strOrNull(formData.get("action")),
      pic: strOrNull(formData.get("pic")),
      status: (strOrNull(formData.get("status")) ?? "OPEN") as "OPEN" | "CLOSED" | "RESOLVED",
      notes: strOrNull(formData.get("notes")),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE VIOLATION",
    module: "People",
    recordId: data.id,
    newValue: { violation },
  });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/violations");
  return { id: data.id };
}

export async function updateViolationStatus(
  id: string,
  status: "OPEN" | "CLOSED" | "RESOLVED",
  employeeId: string
) {
  const admin = await requireAdmin();
  const { error } = await adminDb()
    .from("employee_violations")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE VIOLATION",
    module: "People",
    recordId: id,
    newValue: { status },
  });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/violations");
  return {};
}

export async function removeViolation(id: string, employeeId: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("employee_violations").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE VIOLATION",
    module: "People",
    recordId: id,
  });
  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/violations");
  return {};
}
