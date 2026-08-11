export type Role = "admin" | "mechanic" | "supervisor" | "foreman" | "management";

export interface Profile {
  id: string;
  employee_id: string | null;
  username: string | null;
  name: string;
  email: string | null;
  department_id: string | null;
  role: Role;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  departments?: { id: string; name: string } | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type ItemStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "MAINTENANCE"
  | "DAMAGED"
  | "LOST"
  | "INACTIVE"
  | "RESERVED";

export type ItemCondition =
  | "GOOD"
  | "LIGHT_DAMAGE"
  | "HEAVY_DAMAGE"
  | "MAINTENANCE"
  | "LOST";

export interface Item {
  id: string;
  item_code: string;
  name: string;
  category_id: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  unit: string;
  quantity: number;
  location_id: string | null;
  condition: ItemCondition;
  status: ItemStatus;
  photo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string } | null;
  locations?: { id: string; name: string } | null;
}

export type BorrowingStatus =
  | "PENDING"
  | "APPROVED"
  | "BORROWED"
  | "PARTIALLY_RETURNED"
  | "RETURNED"
  | "OVERDUE"
  | "CANCELLED";

export interface BorrowingItem {
  id: string;
  borrowing_id: string;
  item_id: string;
  quantity: number;
  returned_quantity: number;
  status: "OUTSTANDING" | "PARTIAL" | "RETURNED";
  items?: Item | null;
}

export interface Borrowing {
  id: string;
  transaction_number: string;
  borrower_id: string;
  purpose: string | null;
  location_of_use: string | null;
  borrow_date: string;
  expected_return_date: string | null;
  status: BorrowingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
  borrowing_items?: BorrowingItem[];
}

export interface ReturnRecord {
  id: string;
  return_number: string;
  borrowing_id: string;
  returned_by: string;
  return_date: string;
  notes: string | null;
  created_at: string;
  borrowings?: Borrowing | null;
  return_items?: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  return_id: string;
  borrowing_item_id: string;
  item_id: string;
  quantity: number;
  condition: ItemCondition;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  items?: Item | null;
}

export interface MaintenanceRecord {
  id: string;
  maintenance_number: string | null;
  item_id: string;
  start_date: string;
  problem: string | null;
  description: string | null;
  technician: string | null;
  cost: number | null;
  expected_finish: string | null;
  actual_finish: string | null;
  status: "ONGOING" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  items?: Item | null;
}

export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "CONTRACT" | "PROBATION";

export interface Employee {
  id: string;
  employee_id: string;
  nik: string | null;
  name: string;
  photo_url: string | null;
  position: string | null;
  department_id: string | null;
  education: string | null;
  grade: string | null;
  join_date: string | null;
  employment_status: EmploymentStatus;
  qr_code: string | null;
  contact: string | null;
  notes: string | null;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
  departments?: { id: string; name: string } | null;
}

export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  level: SkillLevel;
  status: "VERIFIED" | "PENDING" | "EXPIRED";
  verified_at: string | null;
  notes: string | null;
  skills?: Skill | null;
}

export type CertStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export interface CertificateType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface EmployeeCertificate {
  id: string;
  employee_id: string;
  certificate_name: string;
  certificate_number: string | null;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  certificate_type_id: string | null;
  file_url: string | null;
  status: CertStatus;
  notes: string | null;
  created_at: string;
  employees?: Employee | null;
  certificate_types?: CertificateType | null;
}

export type DevStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface EmployeeDevelopment {
  id: string;
  employee_id: string;
  goal: string;
  target_skill_id: string | null;
  required_training: string | null;
  target_certificate: string | null;
  target_date: string | null;
  status: DevStatus;
  notes: string | null;
  created_at: string;
  skills?: Skill | null;
}

export type ViolationCategory =
  | "APD"
  | "SAFETY"
  | "DISCIPLINE"
  | "PROCEDURE"
  | "ATTENDANCE"
  | "OTHER";

export type ViolationSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export interface EmployeeViolation {
  id: string;
  employee_id: string;
  violation_date: string;
  category: ViolationCategory;
  violation: string;
  description: string | null;
  severity: ViolationSeverity;
  action: string | null;
  pic: string | null;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  attachment_url: string | null;
  notes: string | null;
  created_at: string;
  employees?: { name: string; employee_id: string } | null;
}

export interface ItemUnit {
  id: string;
  item_id: string;
  unit_code: string;
  serial_number: string | null;
  status: ItemStatus;
  condition: ItemCondition;
  location_id: string | null;
  qr_code: string | null;
  notes: string | null;
  created_at: string;
  items?: Item | null;
  locations?: { id: string; name: string } | null;
}

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type WoStatus = "OPEN" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface WorkOrder {
  id: string;
  wo_number: string;
  job_title: string;
  plant: string | null;
  area: string | null;
  location: string | null;
  requester: string | null;
  priority: Priority;
  planned_date: string | null;
  deadline: string | null;
  description: string | null;
  status: WoStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type JobStatus =
  | "PLANNED"
  | "READY"
  | "IN_PROGRESS"
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED";

export interface Job {
  id: string;
  job_number: string;
  wo_id: string | null;
  title: string;
  description: string | null;
  plant: string | null;
  area: string | null;
  location: string | null;
  priority: Priority;
  pic_id: string | null;
  supervisor_id: string | null;
  planned_start: string | null;
  planned_finish: string | null;
  actual_start: string | null;
  actual_finish: string | null;
  status: JobStatus;
  progress: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  work_orders?: WorkOrder | null;
  pic?: Employee | null;
  supervisor?: Employee | null;
  job_manpower?: JobManpower[];
}

export interface JobManpower {
  id: string;
  job_id: string;
  employee_id: string;
  role: string | null;
  is_pic: boolean;
  created_at: string;
  employees?: Employee | null;
}

export interface JobRequirement {
  id: string;
  job_id: string;
  skill_id: string | null;
  required_level: SkillLevel | null;
  required_certificate: string | null;
  created_at: string;
  skills?: Skill | null;
}

export type JobToolStatus = "REQUIRED" | "RESERVED" | "ISSUED" | "RETURNED" | "CANCELLED";

export interface JobTool {
  id: string;
  job_id: string;
  item_id: string;
  quantity: number;
  status: JobToolStatus;
  notes: string | null;
  created_at: string;
  items?: Item | null;
}

export type PermitType =
  | "WORK_PERMIT"
  | "HOT_WORK"
  | "WORKING_AT_HEIGHT"
  | "CONFINED_SPACE"
  | "LIFTING"
  | "ELECTRICAL"
  | "OTHER";

export type PermitStatus = "PENDING" | "APPROVED" | "EXPIRED" | "REJECTED" | "NOT_REQUIRED";

export interface JobPermit {
  id: string;
  job_id: string;
  permit_number: string | null;
  permit_type: PermitType;
  issue_date: string | null;
  expiry_date: string | null;
  status: PermitStatus;
  approved_by: string | null;
  attachment_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface JobChecklist {
  id: string;
  job_id: string;
  item: string;
  is_required: boolean;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  sort: number;
  created_at: string;
}

export interface JobProgress {
  id: string;
  job_id: string;
  progress_date: string;
  progress: number;
  issue: string | null;
  safety_issue: string | null;
  photo_urls: string[] | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface JobDailyReport {
  id: string;
  job_id: string;
  report_date: string;
  work_progress: string | null;
  actual_work: string | null;
  manpower: string | null;
  tools: string | null;
  material: string | null;
  problem: string | null;
  safety_issue: string | null;
  before_photo: string | null;
  progress_photo: string | null;
  after_photo: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  module: string;
  record_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
}
