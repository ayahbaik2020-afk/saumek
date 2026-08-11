import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { WorkOrderList } from "@/components/work-order-list";
import type { WorkOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WorkOrdersPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: workOrders = [] } = await supabase
    .from("work_orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <WorkOrderList
      workOrders={workOrders as WorkOrder[]}
      canManage={["admin", "supervisor", "foreman"].includes(profile.role)}
    />
  );
}
