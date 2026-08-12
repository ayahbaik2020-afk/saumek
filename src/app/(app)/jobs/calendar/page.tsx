import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { JobCalendar, type CalendarExternalWo } from "@/components/job-calendar";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobCalendarPage() {
  await requireProfile();
  const supabase = await createClient();

  const [jobsRes, ewoRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, external_work_orders(wo_number)")
      .order("planned_start", { ascending: true }),
    supabase
      .from("external_work_orders")
      .select(
        "id, wo_number, title, area, plant, location, priority, external_status, planned_start, planned_finish, is_active, jobs!jobs_external_wo_id_fkey(id, job_number, status)"
      )
      .eq("is_active", true)
      .in("external_status", ["OPEN", "PLANNED", "IN_PROGRESS"])
      .order("planned_start", { ascending: true, nullsFirst: false }),
  ]);

  return (
    <JobCalendar
      jobs={(jobsRes.data ?? []) as unknown as Job[]}
      externalWos={(ewoRes.data ?? []) as unknown as CalendarExternalWo[]}
    />
  );
}
