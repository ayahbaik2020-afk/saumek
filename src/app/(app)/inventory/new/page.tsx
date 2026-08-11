import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/item-form";
import type { Category, Location } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: categories = [] }, { data: locations = [] }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("locations").select("*").order("name"),
  ]);

  return (
    <ItemForm
      categories={categories as Category[]}
      locations={locations as Location[]}
    />
  );
}
