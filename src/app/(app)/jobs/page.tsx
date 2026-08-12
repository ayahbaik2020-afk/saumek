import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { JobList } from "@/components/job-list";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: jobs = [] } = await supabase
    .from("jobs")
    .select(
      "*, work_orders(wo_number), external_work_orders(wo_number, external_status), pic:employees!jobs_pic_id_fkey(name, employee_id), supervisor:employees!jobs_supervisor_id_fkey(name, employee_id), job_manpower(is_pic, employees(name))"
    )
    .order("created_at", { ascending: false });

  return <JobList jobs={(jobs as unknown) as Job[]} />;
}
