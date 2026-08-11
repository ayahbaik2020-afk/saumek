import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/category-manager";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories = [] } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return <CategoryManager categories={categories as Category[]} />;
}
