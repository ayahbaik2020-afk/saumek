import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const tables = [
  "categories", "departments", "items", "borrowings", "employees",
  "skills", "certificate_types", "work_orders", "jobs", "item_units",
];
for (const t of tables) {
  const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${error ? "ERROR " + error.message : count + " rows"}`);
}

const { data: code, error: codeErr } = await db.rpc("generate_code", { prefix: "EMP", width: 4 });
console.log("generate_code(EMP):", codeErr ? "ERROR " + codeErr.message : code);

const { data: roles, error: rolesErr } = await db.from("roles").select("name").order("name");
console.log("roles:", rolesErr ? "ERROR" : roles.map((r) => r.name).join(", "));

const { data: skills, error: skillsErr } = await db.from("skills").select("name").limit(5);
console.log("skills sample:", skillsErr ? "ERROR " + skillsErr.message : skills.map((s) => s.name).join(", "));
