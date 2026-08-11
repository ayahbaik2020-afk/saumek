"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireManager, logAudit } from "@/lib/db";
import { adminDb } from "@/lib/supabase/admin";
import {
  DEFAULT_JOB_CHECKLIST,
} from "@/lib/constants";
import type {
  Priority,
  JobStatus,
  WoStatus,
  SkillLevel,
  JobToolStatus,
  PermitStatus,
  PermitType,
} from "@/lib/types";

export type JobState = { error?: string; id?: string } | undefined;

function required(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function strOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function numberOrNull(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ---------- WORK ORDER ----------

export async function createWorkOrder(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireManager();
  const jobTitle = required(formData, "job_title");
  if (!jobTitle) return { error: "Judul pekerjaan wajib diisi." };

  const { data: woNumber, error: numError } = await adminDb().rpc(
    "generate_code",
    { prefix: "WO", width: 5 }
  );
  if (numError || !woNumber) {
    return { error: "Gagal membuat nomor WO: " + (numError?.message ?? "unknown") };
  }

  const payload = {
    wo_number: String(woNumber),
    job_title: jobTitle,
    plant: strOrNull(formData.get("plant")),
    area: strOrNull(formData.get("area")),
    location: strOrNull(formData.get("location")),
    requester: strOrNull(formData.get("requester")),
    priority: (strOrNull(formData.get("priority")) ?? "NORMAL") as Priority,
    planned_date: strOrNull(formData.get("planned_date")),
    deadline: strOrNull(formData.get("deadline")),
    description: strOrNull(formData.get("description")),
    created_by: user.id,
  };

  const { data, error } = await adminDb()
    .from("work_orders")
    .insert(payload)
    .select("id, wo_number")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "CREATE WORK ORDER",
    module: "Job",
    recordId: data.id,
    newValue: { wo_number: data.wo_number, job_title: jobTitle },
  });

  revalidatePath("/work-orders");
  revalidatePath("/jobs");
  return { id: data.id };
}

// ---------- JOB ----------

export async function updateWorkOrderStatus(woId: string, status: WoStatus) {
  const user = await requireManager();
  const { error } = await adminDb()
    .from("work_orders")
    .update({ status })
    .eq("id", woId);
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "UPDATE WORK ORDER STATUS",
    module: "Job",
    recordId: woId,
    newValue: { status },
  });

  revalidatePath("/work-orders");
  revalidatePath("/jobs");
  return {};
}

export async function createJob(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireManager();
  const title = required(formData, "title");
  if (!title) return { error: "Judul pekerjaan wajib diisi." };

  const { data: jobNumber, error: numError } = await adminDb().rpc(
    "generate_code",
    { prefix: "JOB", width: 5 }
  );
  if (numError || !jobNumber) {
    return { error: "Gagal membuat nomor Job: " + (numError?.message ?? "unknown") };
  }

  const woTitle = strOrNull(formData.get("wo_title"));
  let woId: string | null = strOrNull(formData.get("wo_id"));

  // Auto-create a WO when the user provides a title but no existing WO
  if (!woId && woTitle) {
    const { data: woNumber, error: woNumErr } = await adminDb().rpc(
      "generate_code",
      { prefix: "WO", width: 5 }
    );
    if (woNumErr || !woNumber) {
      return { error: "Gagal membuat nomor WO: " + (woNumErr?.message ?? "unknown") };
    }
    const { data: woData, error: woErr } = await adminDb()
      .from("work_orders")
      .insert({
        wo_number: String(woNumber),
        job_title: woTitle,
        plant: strOrNull(formData.get("plant")),
        area: strOrNull(formData.get("area")),
        location: strOrNull(formData.get("location")),
        requester: strOrNull(formData.get("requester")),
        priority: (strOrNull(formData.get("priority")) ?? "NORMAL") as Priority,
        planned_date: strOrNull(formData.get("planned_start")),
        deadline: strOrNull(formData.get("planned_finish")),
        created_by: user.id,
      })
      .select("id")
      .single();
    if (woErr) return { error: woErr.message };
    woId = woData.id;
  }

  const payload = {
    job_number: String(jobNumber),
    wo_id: woId,
    title,
    description: strOrNull(formData.get("description")),
    plant: strOrNull(formData.get("plant")),
    area: strOrNull(formData.get("area")),
    location: strOrNull(formData.get("location")),
    priority: (strOrNull(formData.get("priority")) ?? "NORMAL") as Priority,
    pic_id: strOrNull(formData.get("pic_id")),
    supervisor_id: strOrNull(formData.get("supervisor_id")),
    planned_start: strOrNull(formData.get("planned_start")),
    planned_finish: strOrNull(formData.get("planned_finish")),
    status: "PLANNED",
    progress: 0,
    notes: strOrNull(formData.get("notes")),
    created_by: user.id,
  };

  const { data, error } = await adminDb()
    .from("jobs")
    .insert(payload)
    .select("id, job_number")
    .single();
  if (error) return { error: error.message };

  // Default pre-job checklist
  await adminDb()
    .from("job_checklists")
    .insert(
      DEFAULT_JOB_CHECKLIST.map((item, i) => ({
        job_id: data.id,
        item,
        is_required: true,
        sort: i,
      }))
    );

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "CREATE JOB",
    module: "Job",
    recordId: data.id,
    newValue: { job_number: data.job_number, title },
  });

  revalidatePath("/jobs");
  revalidatePath("/jobs/calendar");
  revalidatePath("/work-orders");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus
) {
  const user = await requireProfile();
  const patch: Record<string, string | number | null> = { status };
  if (status === "IN_PROGRESS" && !("actual_start" in patch)) {
    const { data: job } = await adminDb()
      .from("jobs")
      .select("actual_start")
      .eq("id", jobId)
      .single();
    if (!job?.actual_start) patch.actual_start = new Date().toISOString();
  }
  if (status === "COMPLETED") {
    patch.actual_finish = new Date().toISOString();
    patch.progress = 100;
  }

  const { error } = await adminDb()
    .from("jobs")
    .update(patch)
    .eq("id", jobId);
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "UPDATE JOB STATUS",
    module: "Job",
    recordId: jobId,
    newValue: { status },
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs/calendar");
  return {};
}

export async function updateJobProgress(
  jobId: string,
  progress: number
) {
  const user = await requireProfile();
  const clamped = Math.max(0, Math.min(100, progress));
  const { error } = await adminDb()
    .from("jobs")
    .update({ progress: clamped })
    .eq("id", jobId);
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "UPDATE JOB PROGRESS",
    module: "Job",
    recordId: jobId,
    newValue: { progress: clamped },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return {};
}

// ---------- MANPOWER ----------

export async function assignManpower(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireManager();
  const jobId = required(formData, "job_id");
  const employeeId = required(formData, "employee_id");
  if (!jobId || !employeeId) return { error: "Employee wajib dipilih." };

  const { data, error } = await adminDb()
    .from("job_manpower")
    .insert({
      job_id: jobId,
      employee_id: employeeId,
      role: strOrNull(formData.get("role")),
      is_pic: formData.get("is_pic") === "on" || formData.get("is_pic") === "true",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Employee sudah ditugaskan." };
    return { error: error.message };
  }

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "ASSIGN MANPOWER",
    module: "Job",
    recordId: jobId,
    newValue: { employee_id: employeeId },
  });
  revalidatePath(`/jobs/${jobId}`);
  return { id: data.id };
}

export async function removeManpower(id: string, jobId: string) {
  const user = await requireManager();
  const { error } = await adminDb().from("job_manpower").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "REMOVE MANPOWER",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

// ---------- REQUIREMENTS ----------

export async function addJobRequirement(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireManager();
  const jobId = required(formData, "job_id");
  if (!jobId) return { error: "Job tidak valid." };

  const { data, error } = await adminDb()
    .from("job_requirements")
    .insert({
      job_id: jobId,
      skill_id: strOrNull(formData.get("skill_id")),
      required_level: (strOrNull(formData.get("required_level")) ??
        null) as SkillLevel | null,
      required_certificate: strOrNull(formData.get("required_certificate")),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "ADD JOB REQUIREMENT",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return { id: data.id };
}

export async function removeJobRequirement(id: string, jobId: string) {
  const user = await requireManager();
  const { error } = await adminDb().from("job_requirements").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "REMOVE JOB REQUIREMENT",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

// ---------- JOB TOOLS (from inventory) ----------

export async function addJobTool(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireManager();
  const jobId = required(formData, "job_id");
  const itemId = required(formData, "item_id");
  if (!jobId || !itemId) return { error: "Tool wajib dipilih." };

  const quantity = numberOrNull(formData.get("quantity")) ?? 1;
  const { data, error } = await adminDb()
    .from("job_tools")
    .insert({
      job_id: jobId,
      item_id: itemId,
      quantity,
      notes: strOrNull(formData.get("notes")),
      status: "REQUIRED",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "ADD JOB TOOL",
    module: "Job",
    recordId: jobId,
    newValue: { item_id: itemId, quantity },
  });
  revalidatePath(`/jobs/${jobId}`);
  return { id: data.id };
}

export async function updateJobToolStatus(
  id: string,
  status: JobToolStatus,
  jobId: string
) {
  const user = await requireManager();
  const { error } = await adminDb()
    .from("job_tools")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "UPDATE JOB TOOL",
    module: "Job",
    recordId: jobId,
    newValue: { status },
  });
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

export async function removeJobTool(id: string, jobId: string) {
  const user = await requireManager();
  const { error } = await adminDb().from("job_tools").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "REMOVE JOB TOOL",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

// ---------- PERMITS ----------

export async function addPermit(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireManager();
  const jobId = required(formData, "job_id");
  if (!jobId) return { error: "Job tidak valid." };

  const { data, error } = await adminDb()
    .from("job_permits")
    .insert({
      job_id: jobId,
      permit_number: strOrNull(formData.get("permit_number")),
      permit_type: (strOrNull(formData.get("permit_type")) ??
        "WORK_PERMIT") as PermitType,
      issue_date: strOrNull(formData.get("issue_date")),
      expiry_date: strOrNull(formData.get("expiry_date")),
      approved_by: strOrNull(formData.get("approved_by")),
      notes: strOrNull(formData.get("notes")),
      status: "PENDING",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "ADD PERMIT",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return { id: data.id };
}

export async function updatePermitStatus(
  id: string,
  status: PermitStatus,
  jobId: string
) {
  const user = await requireManager();
  const { error } = await adminDb()
    .from("job_permits")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "UPDATE PERMIT",
    module: "Job",
    recordId: jobId,
    newValue: { status },
  });
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

export async function removePermit(id: string, jobId: string) {
  const user = await requireManager();
  const { error } = await adminDb().from("job_permits").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "DELETE PERMIT",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return {};
}

// ---------- CHECKLIST ----------

export async function toggleChecklist(id: string, checked: boolean, jobId: string) {
  const user = await requireProfile();
  const { error } = await adminDb()
    .from("job_checklists")
    .update({
      is_checked: checked,
      checked_by: checked ? user.id : null,
      checked_at: checked ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Job becomes READY when every required item is checked
  const { data: remaining } = await adminDb()
    .from("job_checklists")
    .select("id")
    .eq("job_id", jobId)
    .eq("is_required", true)
    .eq("is_checked", false);

  if (remaining && remaining.length === 0) {
    const { data: job } = await adminDb()
      .from("jobs")
      .select("status")
      .eq("id", jobId)
      .single();
    if (job && job.status === "PLANNED") {
      await adminDb().from("jobs").update({ status: "READY" }).eq("id", jobId);
    }
  }

  revalidatePath(`/jobs/${jobId}`);
  return {};
}

// ---------- PROGRESS / DAILY REPORT ----------

export async function addJobProgress(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireProfile();
  const jobId = required(formData, "job_id");
  if (!jobId) return { error: "Job tidak valid." };

  const progress = numberOrNull(formData.get("progress")) ?? 0;
  const { data, error } = await adminDb()
    .from("job_progress")
    .insert({
      job_id: jobId,
      progress: Math.max(0, Math.min(100, progress)),
      issue: strOrNull(formData.get("issue")),
      safety_issue: strOrNull(formData.get("safety_issue")),
      notes: strOrNull(formData.get("notes")),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await adminDb()
    .from("jobs")
    .update({ progress: Math.max(0, Math.min(100, progress)) })
    .eq("id", jobId);

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "ADD JOB PROGRESS",
    module: "Job",
    recordId: jobId,
    newValue: { progress },
  });
  revalidatePath(`/jobs/${jobId}`);
  return { id: data.id };
}

export async function addDailyReport(
  _state: JobState,
  formData: FormData
): Promise<JobState> {
  const user = await requireProfile();
  const jobId = required(formData, "job_id");
  if (!jobId) return { error: "Job tidak valid." };

  const { data, error } = await adminDb()
    .from("job_daily_reports")
    .insert({
      job_id: jobId,
      work_progress: strOrNull(formData.get("work_progress")),
      actual_work: strOrNull(formData.get("actual_work")),
      manpower: strOrNull(formData.get("manpower")),
      tools: strOrNull(formData.get("tools")),
      material: strOrNull(formData.get("material")),
      problem: strOrNull(formData.get("problem")),
      safety_issue: strOrNull(formData.get("safety_issue")),
      notes: strOrNull(formData.get("notes")),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "ADD DAILY REPORT",
    module: "Job",
    recordId: jobId,
  });
  revalidatePath(`/jobs/${jobId}`);
  return { id: data.id };
}
