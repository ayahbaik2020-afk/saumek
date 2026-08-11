import { requireProfile } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { SkillManager } from "@/components/skill-manager";
import type { Skill } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: skills = [] } = await supabase
    .from("skills")
    .select("*")
    .order("name");

  return (
    <SkillManager
      skills={skills as Skill[]}
      canManage={profile.role === "admin" || profile.role === "supervisor"}
    />
  );
}
