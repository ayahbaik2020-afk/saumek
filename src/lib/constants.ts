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
import type { Tone } from "@/components/ui";

// Status color meaning (spec section 4):
// success=green (valid/available/completed), info=blue (in progress),
// warning=amber (pending/expiring), danger=red (error/critical), neutral=gray (inactive)

export const ITEM_STATUS: Record<ItemStatus, { label: string; tone: Tone }> = {
  AVAILABLE: { label: "Available", tone: "success" },
  BORROWED: { label: "Dipinjam", tone: "warning" },
  MAINTENANCE: { label: "Maintenance", tone: "info" },
  DAMAGED: { label: "Rusak", tone: "danger" },
  LOST: { label: "Hilang", tone: "danger" },
  INACTIVE: { label: "Tidak Aktif", tone: "neutral" },
  RESERVED: { label: "Reserved", tone: "info" },
};

export const BORROWING_STATUS: Record<BorrowingStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Disetujui", tone: "info" },
  BORROWED: { label: "Dipinjam", tone: "warning" },
  PARTIALLY_RETURNED: { label: "Sebagian Dikembalikan", tone: "info" },
  RETURNED: { label: "Selesai", tone: "success" },
  OVERDUE: { label: "Terlambat", tone: "danger" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
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

export const CERT_STATUS: Record<CertStatus, { label: string; tone: Tone }> = {
  VALID: { label: "Valid", tone: "success" },
  EXPIRING_SOON: { label: "Segera Habis", tone: "warning" },
  EXPIRED: { label: "Expired", tone: "danger" },
};

export const EMPLOYMENT_STATUS: Record<EmploymentStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Aktif", tone: "success" },
  INACTIVE: { label: "Tidak Aktif", tone: "neutral" },
  CONTRACT: { label: "Kontrak", tone: "info" },
  PROBATION: { label: "Probation", tone: "warning" },
};

export const VIOLATION_CATEGORY: Record<ViolationCategory, string> = {
  APD: "Pelanggaran APD",
  SAFETY: "Safety / Disiplin Lapangan",
  DISCIPLINE: "Disiplin",
  PROCEDURE: "Prosedur",
  ATTENDANCE: "Kehadiran",
  OTHER: "Lainnya",
};

export const VIOLATION_SEVERITY: Record<ViolationSeverity, { label: string; tone: Tone }> = {
  MINOR: { label: "Ringan", tone: "info" },
  MAJOR: { label: "Sedang", tone: "warning" },
  CRITICAL: { label: "Berat", tone: "danger" },
};

export const DEV_STATUS: Record<DevStatus, { label: string; tone: Tone }> = {
  PLANNED: { label: "Direncanakan", tone: "info" },
  IN_PROGRESS: { label: "Berjalan", tone: "warning" },
  COMPLETED: { label: "Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
};

export const PRIORITY: Record<Priority, { label: string; tone: Tone }> = {
  LOW: { label: "Rendah", tone: "neutral" },
  NORMAL: { label: "Normal", tone: "info" },
  HIGH: { label: "Tinggi", tone: "warning" },
  URGENT: { label: "Urgent", tone: "danger" },
};

export const WO_STATUS: Record<WoStatus, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "info" },
  PLANNED: { label: "Direncanakan", tone: "info" },
  IN_PROGRESS: { label: "Berjalan", tone: "warning" },
  COMPLETED: { label: "Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
};

export const JOB_STATUS: Record<JobStatus, { label: string; tone: Tone }> = {
  PLANNED: { label: "Direncanakan", tone: "info" },
  READY: { label: "Siap", tone: "success" },
  IN_PROGRESS: { label: "Berjalan", tone: "warning" },
  PENDING: { label: "Tertunda", tone: "warning" },
  COMPLETED: { label: "Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
};

export const JOB_TOOL_STATUS: Record<JobToolStatus, { label: string; tone: Tone }> = {
  REQUIRED: { label: "Dibutuhkan", tone: "neutral" },
  RESERVED: { label: "Reserved", tone: "info" },
  ISSUED: { label: "Diserahkan", tone: "warning" },
  RETURNED: { label: "Dikembalikan", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "neutral" },
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

export const PERMIT_STATUS: Record<PermitStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Disetujui", tone: "success" },
  EXPIRED: { label: "Expired", tone: "danger" },
  REJECTED: { label: "Ditolak", tone: "danger" },
  NOT_REQUIRED: { label: "Tidak Diperlukan", tone: "neutral" },
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
