export type Role = "admin" | "mechanic" | "supervisor";

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
  | "INACTIVE";

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
