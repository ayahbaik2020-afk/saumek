import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { EmployeeDetail } from "@/components/employee-detail";
import { notFound } from "next/navigation";
import type {
  Employee,
  Department,
  Skill,
  CertificateType,
  EmployeeSkill,
  EmployeeCertificate,
  EmployeeDevelopment,
  EmployeeViolation,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EmployeePage({ params }: PageProps<"/people/[id]">) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { id } = await params;

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!employee) notFound();

  const [departmentsRes, skillsRes, certTypesRes, empSkillsRes, certsRes, devsRes, violsRes, historyRes] =
    await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("skills").select("*").order("name"),
      supabase.from("certificate_types").select("*").order("name"),
      supabase
        .from("employee_skills")
        .select("*, skills(*)")
        .eq("employee_id", id)
        .order("created_at"),
      supabase
        .from("employee_certificates")
        .select("*")
        .eq("employee_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("employee_developments")
        .select("*, skills(*)")
        .eq("employee_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("employee_violations")
        .select("*")
        .eq("employee_id", id)
        .order("violation_date", { ascending: false }),
      supabase
        .from("job_manpower")
        .select("role, jobs(job_number, title, status, planned_start)")
        .eq("employee_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const rows = (historyRes.data ?? []) as unknown as {
    role: string | null;
    jobs: { job_number: string; title: string; status: string; planned_start: string | null } | null;
  }[];

  const jobHistory = rows
    .filter((r) => r.jobs)
    .map((r) => ({
      id: r.jobs!.job_number,
      job_number: r.jobs!.job_number,
      title: r.jobs!.title,
      status: r.jobs!.status,
      planned_start: r.jobs!.planned_start,
      role: r.role,
    }));

  return (
    <EmployeeDetail
      employee={employee as Employee}
      departments={departmentsRes.data as Department[]}
      skills={skillsRes.data as Skill[]}
      certificateTypes={certTypesRes.data as CertificateType[]}
      employeeSkills={(empSkillsRes.data ?? []) as EmployeeSkill[]}
      certificates={(certsRes.data ?? []) as EmployeeCertificate[]}
      developments={(devsRes.data ?? []) as EmployeeDevelopment[]}
      violations={(violsRes.data ?? []) as EmployeeViolation[]}
      jobHistory={jobHistory}
      role={profile.role}
    />
  );
}
