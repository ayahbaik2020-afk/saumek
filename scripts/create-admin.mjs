// Creates the first admin user using the Supabase service role.
// Usage:
//   node --env-file=.env.local scripts/create-admin.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.env.ADMIN_EMAIL ?? "admin@saumek.local";
const password = process.env.ADMIN_PASSWORD ?? "admin123456";
const name = process.env.ADMIN_NAME ?? "Admin SAUMEK";
const username = process.env.ADMIN_USERNAME ?? "admin";
const employeeId = process.env.ADMIN_EMPLOYEE_ID ?? "ADM-001";

const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: name, username, role: "admin" },
});

if (error) {
  console.error("Create user failed:", error.message);
  process.exit(1);
}

// Update profile (created by the auth trigger) with admin role
const { error: profileError } = await db
  .from("profiles")
  .update({ name, username, role: "admin", employee_id: employeeId, email })
  .eq("id", data.user.id);

if (profileError) {
  console.error("Profile update failed:", profileError.message);
  process.exit(1);
}

console.log("Admin user created:");
console.log(`  Email    : ${email}`);
console.log(`  Password : ${password}`);
console.log(`  Role     : admin`);
