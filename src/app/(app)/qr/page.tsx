import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { QrManager } from "@/components/qr-manager";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: items = [] } = await supabase
    .from("items")
    .select("*, categories(name)")
    .eq("is_active", true)
    .order("item_code");

  return <QrManager initial={items as Item[]} />;
}
