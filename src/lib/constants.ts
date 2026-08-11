import type {
  ItemStatus,
  BorrowingStatus,
  ItemCondition,
  SkillLevel,
  CertStatus,
  EmploymentStatus,
  ViolationCategory,
  ViolationSeverity,
  DevStatus,
  Priority,
  WoStatus,
  JobStatus,
  JobToolStatus,
  PermitType,
  PermitStatus,
} from "@/lib/types";

export const ITEM_STATUS: Record<ItemStatus, { label: string; color: string }> = {
  AVAILABLE: { label: "Available", color: "bg-emerald-100 text-emerald-700" },
  BORROWED: { label: "Dipinjam", color: "bg-amber-100 text-amber-700" },
  MAINTENANCE: { label: "Maintenance", color: "bg-violet-100 text-violet-700" },
  DAMAGED: { label: "Rusak", color: "bg-rose-100 text-rose-700" },
  LOST: { label: "Hilang", color: "bg-zinc-200 text-zinc-700" },
  INACTIVE: { label: "Tidak Aktif", color: "bg-zinc-100 text-zinc-500" },
  RESERVED: { label: "Reserved", color: "bg-sky-100 text-sky-700" },
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

export const SKILL_LEVEL: Record<SkillLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export const CERT_STATUS: Record<CertStatus, { label: string; color: string }> = {
  VALID: { label: "Valid", color: "bg-emerald-100 text-emerald-700" },
  EXPIRING_SOON: { label: "Segera Habis", color: "bg-amber-100 text-amber-700" },
  EXPIRED: { label: "Expired", color: "bg-rose-100 text-rose-700" },
};

export const EMPLOYMENT_STATUS: Record<EmploymentStatus, { label: string; color: string }> = {
  ACTIVE: { label: "Aktif", color: "bg-emerald-100 text-emerald-700" },
  INACTIVE: { label: "Tidak Aktif", color: "bg-zinc-100 text-zinc-500" },
  CONTRACT: { label: "Kontrak", color: "bg-sky-100 text-sky-700" },
  PROBATION: { label: "Probation", color: "bg-amber-100 text-amber-700" },
};

export const VIOLATION_CATEGORY: Record<ViolationCategory, string> = {
  APD: "Pelanggaran APD",
  SAFETY: "Safety / Disiplin Lapangan",
  DISCIPLINE: "Disiplin",
  PROCEDURE: "Prosedur",
  ATTENDANCE: "Kehadiran",
  OTHER: "Lainnya",
};

export const VIOLATION_SEVERITY: Record<ViolationSeverity, { label: string; color: string }> = {
  MINOR: { label: "Ringan", color: "bg-sky-100 text-sky-700" },
  MAJOR: { label: "Sedang", color: "bg-amber-100 text-amber-700" },
  CRITICAL: { label: "Berat", color: "bg-rose-100 text-rose-700" },
};

export const DEV_STATUS: Record<DevStatus, { label: string; color: string }> = {
  PLANNED: { label: "Direncanakan", color: "bg-sky-100 text-sky-700" },
  IN_PROGRESS: { label: "Berjalan", color: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-zinc-100 text-zinc-500" },
};

export const PRIORITY: Record<Priority, { label: string; color: string }> = {
  LOW: { label: "Rendah", color: "bg-zinc-100 text-zinc-600" },
  NORMAL: { label: "Normal", color: "bg-sky-100 text-sky-700" },
  HIGH: { label: "Tinggi", color: "bg-amber-100 text-amber-700" },
  URGENT: { label: "Urgent", color: "bg-rose-100 text-rose-700" },
};

export const WO_STATUS: Record<WoStatus, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-sky-100 text-sky-700" },
  PLANNED: { label: "Direncanakan", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "Berjalan", color: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-zinc-100 text-zinc-500" },
};

export const JOB_STATUS: Record<JobStatus, { label: string; color: string }> = {
  PLANNED: { label: "Direncanakan", color: "bg-sky-100 text-sky-700" },
  READY: { label: "Siap", color: "bg-teal-100 text-teal-700" },
  IN_PROGRESS: { label: "Berjalan", color: "bg-amber-100 text-amber-700" },
  PENDING: { label: "Tertunda", color: "bg-orange-100 text-orange-700" },
  COMPLETED: { label: "Selesai", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-zinc-100 text-zinc-500" },
};

export const JOB_TOOL_STATUS: Record<JobToolStatus, { label: string; color: string }> = {
  REQUIRED: { label: "Dibutuhkan", color: "bg-zinc-100 text-zinc-600" },
  RESERVED: { label: "Reserved", color: "bg-sky-100 text-sky-700" },
  ISSUED: { label: "Diserahkan", color: "bg-blue-100 text-blue-700" },
  RETURNED: { label: "Dikembalikan", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-zinc-100 text-zinc-500" },
};

export const PERMIT_TYPE: Record<PermitType, string> = {
  WORK_PERMIT: "Work Permit",
  HOT_WORK: "Hot Work",
  WORKING_AT_HEIGHT: "Working at Height",
  CONFINED_SPACE: "Confined Space",
  LIFTING: "Lifting",
  ELECTRICAL: "Electrical",
  OTHER: "Lainnya",
};

export const PERMIT_STATUS: Record<PermitStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Disetujui", color: "bg-emerald-100 text-emerald-700" },
  EXPIRED: { label: "Expired", color: "bg-rose-100 text-rose-700" },
  REJECTED: { label: "Ditolak", color: "bg-rose-100 text-rose-700" },
  NOT_REQUIRED: { label: "Tidak Diperlukan", color: "bg-zinc-100 text-zinc-500" },
};

export const DEFAULT_JOB_CHECKLIST = [
  "WO tersedia",
  "Manpower tersedia",
  "Tool tersedia",
  "Permit tersedia",
  "JSA tersedia",
  "APD tersedia",
  "Toolbox Meeting",
  "Area siap",
  "Material tersedia",
];

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
