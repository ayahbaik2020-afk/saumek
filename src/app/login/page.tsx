"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/lib/auth-actions";
import { ErrorMessage, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-xl font-bold text-white transition-all duration-200 ease-out hover:opacity-90">
            S
          </div>
          <h1 className="text-xl font-bold text-zinc-900">SAUMEK</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sistem Inventory &amp; Peminjaman Barang
          </p>
        </div>

        <form
          action={action}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-[var(--shadow-sm)]"
        >
          <div className="space-y-4">
            <Input
              name="login"
              label="Username / Email"
              placeholder="username atau email"
              autoComplete="username"
              disabled={pending}
              required
            />
            <PasswordField pending={pending} show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          </div>
          <ErrorMessage message={state?.error} />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out shadow-[var(--shadow-xs)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-sm)] active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {pending ? "Memproses..." : "Masuk"}
          </button>
          <div className="text-center">
            <a
              href="#"
              className="text-xs font-medium text-zinc-500 underline-offset-2 transition-colors duration-150 ease-out hover:text-[var(--color-primary)] hover:underline"
            >
              Lupa Password?
            </a>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Akses dibatasi. Hubungi Admin jika mengalami kendala login.
        </p>
      </div>
    </div>
  );
}

function PasswordField({
  pending,
  show,
  onToggle,
}: {
  pending: boolean;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
        Password
      </label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={pending}
          required
          className="w-full rounded-[var(--radius-md)] border border-zinc-300 bg-white px-3 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 ease-out hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={onToggle}
          title={show ? "Hide password" : "Show password"}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-1.5 my-1 flex w-8 items-center justify-center rounded-[var(--radius-sm)] text-zinc-500 transition-colors duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-700"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.6 20.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.6 20.6 0 0 1-2.34 3.24M14.12 14.12a3 3 0 1 1-4.24-4.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" strokeLinecap="round" />
    </svg>
  );
}
