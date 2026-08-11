import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PeopleManager } from "@/components/people-manager";
import type { Department } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: departments = [] } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  return (
    <PeopleManager
      departments={departments as Department[]}
      canManage={profile.role === "admin" || profile.role === "supervisor"}
    />
  );
}
