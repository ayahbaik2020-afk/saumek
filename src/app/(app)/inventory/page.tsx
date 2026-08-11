import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { InventoryBrowser } from "@/components/inventory-browser";
import type { Category, Item, Location } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: items = [] }, { data: categories = [] }, { data: locations = [] }] =
    await Promise.all([
      supabase
        .from("items")
        .select("*, categories(name), locations(name)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("locations").select("*").order("name"),
    ]);

  return (
    <InventoryBrowser
      items={items as Item[]}
      categories={categories as Category[]}
      locations={locations as Location[]}
      canManage={profile.role === "admin"}
    />
  );
}
