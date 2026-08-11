import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "@/components/job-form";
import type { Employee, WorkOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [woRes, empRes] = await Promise.all([
    supabase.from("work_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("employees").select("*").order("name"),
  ]);

  return (
    <JobForm
      workOrders={(woRes.data ?? []) as WorkOrder[]}
      employees={(empRes.data ?? []) as Employee[]}
      canManage={["admin", "supervisor", "foreman"].includes(profile.role)}
    />
  );
}
