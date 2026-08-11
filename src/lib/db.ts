import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*, departments(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export async function requireSupervisor(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "supervisor") redirect("/dashboard");
  return profile;
}

export async function requireManager(): Promise<Profile> {
  const profile = await requireProfile();
  if (
    profile.role !== "admin" &&
    profile.role !== "supervisor" &&
    profile.role !== "foreman"
  )
    redirect("/dashboard");
  return profile;
}

export async function logAudit(input: {
  userId?: string | null;
  userName?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  try {
    await adminDb().from("audit_logs").insert({
      user_id: input.userId ?? null,
      user_name: input.userName ?? null,
      action: input.action,
      module: input.module,
      record_id: input.recordId ?? null,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
    });
  } catch {
    // Audit logging must never break a business operation.
  }
}
