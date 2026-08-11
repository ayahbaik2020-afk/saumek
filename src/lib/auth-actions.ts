"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";

export type LoginState = {
  error?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Login accepts either an email address, a username, or an employee ID.
 * Username / employee ID are resolved to the account email on the server.
 */
export async function login(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!raw || !password) {
    return { error: "Username/Email dan password wajib diisi." };
  }

  let email = raw;

  if (!isValidEmail(raw)) {
    const { data: profile, error: lookupError } = await adminDb()
      .from("profiles")
      .select("email")
      .or(`username.eq.${raw},employee_id.eq.${raw}`)
      .eq("status", "active")
      .maybeSingle();

    if (lookupError || !profile?.email) {
      return { error: "User tidak ditemukan atau tidak aktif." };
    }
    email = profile.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("invalid")
        ? "Username/Email atau password salah."
        : error.message,
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
