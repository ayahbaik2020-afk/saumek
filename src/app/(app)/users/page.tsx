import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { UserManager } from "@/components/user-manager";
import type { Department } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: departments = [] } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  return (
    <UserManager
      currentUserId={admin.id}
      departments={departments as Department[]}
    />
  );
}
