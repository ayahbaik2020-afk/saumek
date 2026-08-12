import { StatusBadge } from "@/components/ui";
import {
  BORROWING_STATUS,
  ITEM_STATUS,
  JOB_STATUS,
  WO_STATUS,
  PRIORITY,
  CERT_STATUS,
  DEV_STATUS,
  PERMIT_STATUS,
  EMPLOYMENT_STATUS,
  VIOLATION_SEVERITY,
  JOB_TOOL_STATUS,
} from "@/lib/constants";
import type {
  BorrowingStatus,
  ItemStatus,
  JobStatus,
  WoStatus,
  Priority,
  CertStatus,
  DevStatus,
  PermitStatus,
  EmploymentStatus,
  ViolationSeverity,
  JobToolStatus,
} from "@/lib/types";

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const meta = ITEM_STATUS[status] ?? ITEM_STATUS.INACTIVE;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function BorrowingStatusBadge({ status }: { status: BorrowingStatus }) {
  const meta = BORROWING_STATUS[status] ?? BORROWING_STATUS.BORROWED;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = JOB_STATUS[status] ?? JOB_STATUS.PLANNED;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function WoStatusBadge({ status }: { status: WoStatus }) {
  const meta = WO_STATUS[status] ?? WO_STATUS.OPEN;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY[priority] ?? PRIORITY.NORMAL;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function CertStatusBadge({ status }: { status: CertStatus }) {
  const meta = CERT_STATUS[status] ?? CERT_STATUS.VALID;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function DevStatusBadge({ status }: { status: DevStatus }) {
  const meta = DEV_STATUS[status] ?? DEV_STATUS.PLANNED;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function PermitStatusBadge({ status }: { status: PermitStatus }) {
  const meta = PERMIT_STATUS[status] ?? PERMIT_STATUS.PENDING;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const meta = EMPLOYMENT_STATUS[status] ?? EMPLOYMENT_STATUS.ACTIVE;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function ViolationSeverityBadge({ severity }: { severity: ViolationSeverity }) {
  const meta = VIOLATION_SEVERITY[severity] ?? VIOLATION_SEVERITY.MINOR;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export function JobToolStatusBadge({ status }: { status: JobToolStatus }) {
  const meta = JOB_TOOL_STATUS[status] ?? JOB_TOOL_STATUS.REQUIRED;
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}
