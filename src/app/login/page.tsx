"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";
import { ErrorMessage, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
            S
          </div>
          <h1 className="text-xl font-bold text-zinc-900">SAUMEK</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sistem Inventory &amp; Peminjaman Barang
          </p>
        </div>

        <form
          action={action}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <Input
              name="login"
              label="Username / Email"
              placeholder="username atau email"
              autoComplete="username"
              required
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <ErrorMessage message={state?.error} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Akses dibatasi. Hubungi Admin jika mengalami kendala login.
        </p>
      </div>
    </div>
  );
}
