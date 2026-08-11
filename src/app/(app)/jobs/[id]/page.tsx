import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { JobDetail } from "@/components/job-detail";
import { notFound } from "next/navigation";
import type {
  Job,
  Employee,
  Skill,
  Item,
  JobManpower,
  JobRequirement,
  JobTool,
  JobPermit,
  JobChecklist,
  JobProgress,
  JobDailyReport,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { id } = await params;

  const { data: job } = await supabase
    .from("jobs")
    .select("*, work_orders(wo_number), pic(name, employee_id), supervisor(name, employee_id)")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const [manpowerRes, reqRes, toolRes, permitRes, checklistRes, progressRes, reportsRes, empRes, skillRes, itemRes] =
    await Promise.all([
      supabase.from("job_manpower").select("*, employees(name, employee_id)").eq("job_id", id).order("created_at"),
      supabase.from("job_requirements").select("*, skills(name, category)").eq("job_id", id).order("created_at"),
      supabase.from("job_tools").select("*, items(item_code, name)").eq("job_id", id).order("created_at"),
      supabase.from("job_permits").select("*").eq("job_id", id).order("created_at"),
      supabase.from("job_checklists").select("*").eq("job_id", id).order("sort"),
      supabase.from("job_progress").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      supabase.from("job_daily_reports").select("*").eq("job_id", id).order("report_date", { ascending: false }),
      supabase.from("employees").select("*").order("name"),
      supabase.from("skills").select("*").order("name"),
      supabase.from("items").select("id, item_code, name").order("name"),
    ]);

  const canManage = ["admin", "supervisor", "foreman"].includes(profile.role);

  return (
    <JobDetail
      job={(job as unknown) as Job}
      manpower={(manpowerRes.data ?? []) as JobManpower[]}
      requirements={(reqRes.data ?? []) as JobRequirement[]}
      tools={(toolRes.data ?? []) as JobTool[]}
      permits={(permitRes.data ?? []) as JobPermit[]}
      checklist={(checklistRes.data ?? []) as JobChecklist[]}
      progress={(progressRes.data ?? []) as JobProgress[]}
      dailyReports={(reportsRes.data ?? []) as JobDailyReport[]}
      employees={(empRes.data ?? []) as Employee[]}
      skills={(skillRes.data ?? []) as Skill[]}
      items={(itemRes.data ?? []) as Item[]}
      canManage={canManage}
    />
  );
}
