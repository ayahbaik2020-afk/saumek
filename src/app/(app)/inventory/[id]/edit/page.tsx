import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/item-form";
import type { Category, Item, Location } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditItemPage(props: PageProps<"/inventory/[id]/edit">) {
  const { id } = await props.params;
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: item }, { data: categories = [] }, { data: locations = [] }] =
    await Promise.all([
      supabase.from("items").select("*").eq("id", id).maybeSingle(),
      supabase.from("categories").select("*").order("name"),
      supabase.from("locations").select("*").order("name"),
    ]);

  if (!item) notFound();

  return (
    <ItemForm
      item={item as Item}
      categories={categories as Category[]}
      locations={locations as Location[]}
    />
  );
}
