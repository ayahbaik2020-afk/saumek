import type { ItemStatus, BorrowingStatus, ItemCondition } from "@/lib/types";

export const ITEM_STATUS: Record<ItemStatus, { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "bg-emerald-100 text-emerald-700" },
  BORROWED: { label: "Dipinjam", color: "bg-amber-100 text-amber-700" },
  MAINTENANCE: { label: "Maintenance", color: "bg-violet-100 text-violet-700" },
  DAMAGED: { label: "Rusak", color: "bg-rose-100 text-rose-700" },
  LOST: { label: "Hilang", color: "bg-zinc-200 text-zinc-700" },
  INACTIVE: { label: "Tidak Aktif", color: "bg-zinc-100 text-zinc-500" },
};

export const BORROWING_STATUS: Record<
  BorrowingStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "Pending", color: "bg-sky-100 text-sky-700" },
  APPROVED: { label: "Disetujui", color: "bg-teal-100 text-teal-700" },
  BORROWED: { label: "Dipinjam", color: "bg-amber-100 text-amber-700" },
  PARTIALLY_RETURNED: {
    label: "Sebagian Dikembalikan",
    color: "bg-blue-100 text-blue-700",
  },
  RETURNED: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
  OVERDUE: { label: "Terlambat", color: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-zinc-100 text-zinc-500" },
};

export const ITEM_CONDITION: Record<ItemCondition, string> = {
  GOOD: "Baik",
  LIGHT_DAMAGE: "Rusak Ringan",
  HEAVY_DAMAGE: "Rusak Berat",
  MAINTENANCE: "Maintenance",
  LOST: "Hilang",
};

export const companyName = () =>
  process.env.NEXT_PUBLIC_COMPANY_NAME || "SAUMEK";

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysOverdue(expectedReturn?: string | null, status?: string) {
  if (!expectedReturn) return 0;
  if (status === "RETURNED" || status === "CANCELLED") return 0;
  const exp = new Date(expectedReturn);
  const now = new Date();
  now.setHours(23, 59, 59, 0);
  const diff = Math.floor((now.getTime() - exp.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
