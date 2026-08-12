import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { ExternalWoList, type ExternalWoRow } from "@/components/external-wo-list";

export const dynamic = "force-dynamic";

export default async function SimipWoPage(props: PageProps<"/simip-wo">) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const searchParams = await props.searchParams;
  const rawQ = searchParams.q;
  const initialSearch = typeof rawQ === "string" ? rawQ : "";

  const { data: workOrders = [] } = await supabase
    .from("external_work_orders")
    .select(
      "*, jobs!jobs_external_wo_id_fkey(id, job_number, status)"
    )
    .order("planned_start", { ascending: true, nullsFirst: false })
    .order("wo_number", { ascending: true });

  return (
    <ExternalWoList
      workOrders={(workOrders as unknown) as ExternalWoRow[]}
      canManage={["admin", "supervisor", "foreman"].includes(profile.role)}
      initialSearch={initialSearch}
    />
  );
}
