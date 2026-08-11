"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/auth-actions";
import type { Profile, Role } from "@/lib/types";
import { cn } from "@/components/ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ["admin", "mechanic", "supervisor", "foreman", "management"] },
  { href: "/scan", label: "Scan QR", icon: "📷", roles: ["admin", "mechanic", "supervisor", "foreman"] },
  { href: "/jobs", label: "Pekerjaan (Job)", icon: "🔧", roles: ["admin", "mechanic", "supervisor", "foreman", "management"] },
  { href: "/jobs/calendar", label: "Kalender Job", icon: "📅", roles: ["admin", "supervisor", "foreman", "management"] },
  { href: "/work-orders", label: "Work Order", icon: "📋", roles: ["admin", "supervisor", "foreman"] },
  { href: "/people", label: "Personel", icon: "👷", roles: ["admin", "supervisor", "foreman"] },
  { href: "/skills", label: "Skills", icon: "🎓", roles: ["admin", "supervisor"] },
  { href: "/certificates", label: "Sertifikat", icon: "📜", roles: ["admin", "supervisor", "management"] },
  { href: "/violations", label: "Pelanggaran", icon: "🚨", roles: ["admin", "supervisor"] },
  { href: "/inventory", label: "Daftar Barang", icon: "📦", roles: ["admin", "mechanic", "supervisor"] },
  { href: "/borrow", label: "Peminjaman", icon: "🔄", roles: ["admin", "mechanic"] },
  { href: "/returns", label: "Pengembalian", icon: "↩️", roles: ["admin", "mechanic"] },
  { href: "/my-items", label: "Barang Saya", icon: "🎒", roles: ["admin", "mechanic"] },
  { href: "/history", label: "Riwayat", icon: "🕘", roles: ["admin", "mechanic", "supervisor"] },
  { href: "/overdue", label: "Overdue", icon: "⚠️", roles: ["admin", "supervisor"] },
  { href: "/qr", label: "QR Code", icon: "🔳", roles: ["admin"] },
  { href: "/categories", label: "Kategori", icon: "🏷️", roles: ["admin"] },
  { href: "/locations", label: "Lokasi", icon: "📍", roles: ["admin"] },
  { href: "/maintenance", label: "Maintenance", icon: "🔧", roles: ["admin"] },
  { href: "/stock-opname", label: "Stock Opname", icon: "📋", roles: ["admin"] },
  { href: "/reports", label: "Laporan", icon: "📊", roles: ["admin", "supervisor"] },
  { href: "/users", label: "User", icon: "👥", roles: ["admin"] },
  { href: "/audit", label: "Audit Trail", icon: "🧾", roles: ["admin"] },
];

function visibleNav(role: Role) {
  return NAV.filter((item) => item.roles.includes(role));
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = visibleNav(profile.role);

  const mobileNav = [
    { href: "/dashboard", label: "Home", icon: "🏠" },
    { href: "/scan", label: "Scan", icon: "📷" },
    { href: "/history", label: "Riwayat", icon: "🕘" },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-100 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">SAUMEK</p>
            <p className="text-xs text-zinc-500">Mechanical Ops & Inventory</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                isActive(item.href) && "bg-blue-50 text-blue-700"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-100 p-3">
          <div className="mb-2 px-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {profile.name}
            </p>
            <p className="text-xs capitalize text-zinc-500">{profile.role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            S
          </div>
          <p className="text-sm font-bold text-zinc-900">SAUMEK</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-y-0 right-0 w-72 overflow-y-auto bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 border-b border-zinc-100 pb-3">
              <p className="font-semibold text-zinc-900">{profile.name}</p>
              <p className="text-xs capitalize text-zinc-500">
                {profile.role} · {profile.employee_id ?? profile.username}
              </p>
            </div>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100",
                  isActive(item.href) && "bg-blue-50 text-blue-700"
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <form action={logout} className="mt-4 border-t border-zinc-100 pt-3">
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-60">
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-zinc-500",
              isActive(item.href) && "text-blue-600"
            )}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
