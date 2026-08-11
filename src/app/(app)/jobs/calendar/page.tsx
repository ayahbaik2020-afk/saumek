import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { JobCalendar } from "@/components/job-calendar";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobCalendarPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: jobs = [] } = await supabase
    .from("jobs")
    .select("*")
    .order("planned_start", { ascending: true });

  return <JobCalendar jobs={(jobs as unknown) as Job[]} />;
}
