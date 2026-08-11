import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { ViolationManager } from "@/components/violation-manager";
import type { Employee, EmployeeViolation } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ViolationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [violsRes, empRes] = await Promise.all([
    supabase
      .from("employee_violations")
      .select("*, employees(name, employee_id)")
      .order("violation_date", { ascending: false }),
    supabase.from("employees").select("*").order("name"),
  ]);

  return (
    <ViolationManager
      violations={(violsRes.data ?? []) as EmployeeViolation[]}
      employees={(empRes.data ?? []) as Employee[]}
      canManage={profile.role === "admin" || profile.role === "supervisor"}
    />
  );
}
