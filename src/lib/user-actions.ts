"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/db";
import { logAudit } from "@/lib/db";
import { adminDb } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

export type UserState = { error?: string; id?: string } | undefined;

function str(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

export async function createUser(
  _state: UserState,
  formData: FormData
): Promise<UserState> {
  const admin = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const employeeId = str(formData.get("employee_id"));
  const departmentId = str(formData.get("department_id"));
  const password = String(formData.get("password") ?? "");
  const role = (str(formData.get("role")) ?? "mechanic") as Role;

  if (!name) return { error: "Nama user wajib diisi." };
  if (!username) return { error: "Username wajib diisi." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };

  const email =
    str(formData.get("email")) ??
    `${username.toLowerCase().replace(/[^a-z0-9._-]/g, "")}@saumek.local`;

  const { data: userData, error } = await adminDb().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      username,
      role,
    },
  });

  if (error) return { error: error.message };

  // profile is created by the on_auth_user_created trigger; update extras
  const profileUpdate: Record<string, unknown> = {
    employee_id: employeeId,
    name,
    username,
    department_id: departmentId,
    role,
    email,
  };

  await adminDb()
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userData.user.id);

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE USER",
    module: "User Management",
    recordId: userData.user.id,
    newValue: { name, username, role },
  });

  revalidatePath("/users");
  return { id: userData.user.id };
}

export async function updateUser(
  _state: UserState,
  formData: FormData
): Promise<UserState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "ID user tidak valid." };

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const employeeId = str(formData.get("employee_id"));
  const departmentId = str(formData.get("department_id"));
  const role = (str(formData.get("role")) ?? "mechanic") as Role;

  if (!name || !username) return { error: "Nama dan username wajib diisi." };

  const { error } = await adminDb()
    .from("profiles")
    .update({
      name,
      username,
      employee_id: employeeId,
      department_id: departmentId,
      role,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE USER",
    module: "User Management",
    recordId: id,
    newValue: { name, username, role },
  });

  revalidatePath("/users");
  return { id };
}

export async function toggleUserActive(id: string) {
  const admin = await requireAdmin();
  if (id === admin.id) return { error: "Tidak dapat menonaktifkan akun sendiri." };

  const { data: profile } = await adminDb()
    .from("profiles")
    .select("status, name")
    .eq("id", id)
    .single();
  if (!profile) return { error: "User tidak ditemukan." };

  const next = profile.status === "active" ? "inactive" : "active";
  const { error } = await adminDb()
    .from("profiles")
    .update({ status: next })
    .eq("id", id);

  if (error) return { error: error.message };

  if (next === "inactive") {
    await adminDb().auth.admin.updateUserById(id, { ban_duration: "876000h" });
  } else {
    await adminDb().auth.admin.updateUserById(id, { ban_duration: "none" });
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: next === "active" ? "ACTIVATE USER" : "DEACTIVATE USER",
    module: "User Management",
    recordId: id,
    oldValue: { status: profile.status },
    newValue: { status: next },
  });

  revalidatePath("/users");
  return {};
}

export async function resetUserPassword(id: string, password: string) {
  const admin = await requireAdmin();
  if (!password || password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  const { error } = await adminDb().auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "RESET PASSWORD",
    module: "User Management",
    recordId: id,
  });

  return {};
}
