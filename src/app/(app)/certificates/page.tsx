import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { CertificateManager } from "@/components/certificate-manager";
import type { CertificateType, EmployeeCertificate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [typesRes, certsRes] = await Promise.all([
    supabase.from("certificate_types").select("*").order("name"),
    supabase
      .from("employee_certificates")
      .select("*, employees(name, employee_id)")
      .order("expiry_date", { ascending: true }),
  ]);

  return (
    <CertificateManager
      certificateTypes={(typesRes.data ?? []) as CertificateType[]}
      certificates={(certsRes.data ?? []) as EmployeeCertificate[]}
      canManage={profile.role === "admin" || profile.role === "supervisor"}
    />
  );
}
