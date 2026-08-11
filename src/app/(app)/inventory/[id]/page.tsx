import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { ItemDetail } from "@/components/item-detail";
import { formatDateTime } from "@/lib/constants";
import type { Item, MaintenanceRecord, AuditLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage(props: PageProps<"/inventory/[id]">) {
  const { id } = await props.params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*, categories(name), locations(name)")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  const [{ data: statusHistoryRaw }, { data: borrowingsRaw }, { data: maintenanceRaw }, { data: auditRaw }] =
    await Promise.all([
      supabase
        .from("item_status_history")
        .select("*, profiles(name)")
        .eq("item_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("borrowings")
        .select(
          "id, transaction_number, status, borrow_date, expected_return_date, profiles(name), borrowing_items(item_id, quantity, returned_quantity)"
        )
        .eq("borrowing_items.item_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("maintenance")
        .select("*")
        .eq("item_id", id)
        .order("start_date", { ascending: false }),
      supabase
        .from("audit_logs")
        .select("*")
        .eq("record_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const statusHistory = (statusHistoryRaw ?? []) as unknown as { id: string; from_status: string | null; to_status: string; reason: string | null; created_at: string; profiles: { name: string } | null }[];
  const borrowings = (borrowingsRaw ?? []) as unknown as { id: string; transaction_number: string; status: string; borrow_date: string; profiles: { name: string } | null; borrowing_items: { quantity: number }[] }[];
  const maintenance = maintenanceRaw ?? [];
  const audit = auditRaw ?? [];

  const history = [
    ...statusHistory.map((h) => ({
      id: h.id,
      action: `Status: ${h.from_status ?? "-"} → ${h.to_status}`,
      detail: h.reason ?? "",
      who: h.profiles?.name ?? null,
      when: formatDateTime(h.created_at),
    })),
    ...borrowings.map((b) => ({
      id: b.id,
      action: b.transaction_number,
      detail: `Peminjaman · ${b.borrowing_items?.[0]?.quantity ?? ""}x · ${b.status}`,
      who: b.profiles?.name ?? null,
      when: formatDateTime(b.borrow_date),
    })),
  ].sort((a, b) => (a.when < b.when ? 1 : -1));

  return (
    <ItemDetail
      item={item as Item}
      role={profile.role}
      history={history}
      maintenance={maintenance as MaintenanceRecord[]}
      audit={audit as AuditLog[]}
    />
  );
}
