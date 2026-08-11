"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/db";
import { logAudit } from "@/lib/db";
import { adminDb } from "@/lib/supabase/admin";
import type { ItemStatus } from "@/lib/types";

export type MaintState = { error?: string; id?: string } | undefined;

function str(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function num(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function required(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createMaintenance(
  _state: MaintState,
  formData: FormData
): Promise<MaintState> {
  const admin = await requireAdmin();
  const itemId = required(formData, "item_id");
  const problem = required(formData, "problem");
  if (!itemId || !problem) return { error: "Barang dan masalah wajib diisi." };

  const db = adminDb();

  const { data: numData, error: numError } = await db.rpc(
    "generate_transaction_number",
    { prefix: "MNT" }
  );
  if (numError || !numData) return { error: "Gagal membuat nomor maintenance." };

  const { data, error } = await db
    .from("maintenance")
    .insert({
      maintenance_number: String(numData),
      item_id: itemId,
      problem,
      description: str(formData.get("description")),
      technician: str(formData.get("technician")),
      cost: num(formData.get("cost")),
      expected_finish: str(formData.get("expected_finish")),
      status: "ONGOING",
      notes: str(formData.get("notes")),
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Move item to MAINTENANCE status
  const { data: item } = await db
    .from("items")
    .select("status")
    .eq("id", itemId)
    .single();

  if (item && item.status !== "MAINTENANCE") {
    await db.from("items").update({ status: "MAINTENANCE" }).eq("id", itemId);
    await db.from("item_status_history").insert({
      item_id: itemId,
      from_status: item.status,
      to_status: "MAINTENANCE",
      changed_by: admin.id,
      reason: `MNT-${String(numData)}`,
    });
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE MAINTENANCE",
    module: "Maintenance",
    recordId: data.id,
    newValue: { maintenance_number: String(numData), item_id: itemId },
  });

  revalidatePath("/maintenance");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${itemId}`);
  return { id: data.id };
}

export async function completeMaintenance(id: string, status: ItemStatus) {
  const admin = await requireAdmin();
  const db = adminDb();

  const { data: maint } = await db
    .from("maintenance")
    .select("item_id")
    .eq("id", id)
    .single();
  if (!maint) return { error: "Maintenance tidak ditemukan." };

  await db
    .from("maintenance")
    .update({ status: "COMPLETED", actual_finish: new Date().toISOString() })
    .eq("id", id);

  const { data: item } = await db
    .from("items")
    .select("status")
    .eq("id", maint.item_id)
    .single();

  if (item && item.status !== status) {
    await db.from("items").update({ status }).eq("id", maint.item_id);
    await db.from("item_status_history").insert({
      item_id: maint.item_id,
      from_status: item.status,
      to_status: status,
      changed_by: admin.id,
      reason: `complete ${id}`,
    });
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "COMPLETE MAINTENANCE",
    module: "Maintenance",
    recordId: id,
    newValue: { item_id: maint.item_id, status },
  });

  revalidatePath("/maintenance");
  revalidatePath("/inventory");
  return {};
}

export async function createStockOpname(
  _state: MaintState,
  formData: FormData
): Promise<MaintState> {
  const admin = await requireAdmin();
  const db = adminDb();

  const { data: numData, error: numError } = await db.rpc(
    "generate_transaction_number",
    { prefix: "OPN" }
  );
  if (numError || !numData) return { error: "Gagal membuat nomor opname." };

  const { data, error } = await db
    .from("stock_opnames")
    .insert({
      opname_number: String(numData),
      checked_by: admin.id,
      notes: str(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "START STOCK OPNAME",
    module: "Stock Opname",
    recordId: data.id,
    newValue: { opname_number: String(numData) },
  });

  revalidatePath("/stock-opname");
  return { id: data.id };
}

export async function addStockOpnameItem(
  opnameId: string,
  itemId: string,
  physicalQuantity: number
) {
  const admin = await requireAdmin();
  const db = adminDb();

  const { data: item } = await db
    .from("items")
    .select("quantity, condition, status")
    .eq("id", itemId)
    .single();
  if (!item) return { error: "Barang tidak ditemukan." };

  const { data: existing } = await db
    .from("stock_opname_items")
    .select("id")
    .eq("opname_id", opnameId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    return { error: "Barang sudah pernah dicek pada opname ini." };
  }

  const systemQty = Number(item.quantity);
  const physicalQty = Number(physicalQuantity);
  const difference = physicalQty - systemQty;

  const { error } = await db.from("stock_opname_items").insert({
    opname_id: opnameId,
    item_id: itemId,
    system_quantity: systemQty,
    physical_quantity: physicalQty,
    difference,
  });

  if (error) return { error: error.message };
  revalidatePath("/stock-opname");
  return {};
}

export async function completeStockOpname(opnameId: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb()
    .from("stock_opnames")
    .update({ status: "COMPLETED" })
    .eq("id", opnameId);

  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "COMPLETE STOCK OPNAME",
    module: "Stock Opname",
    recordId: opnameId,
  });

  revalidatePath("/stock-opname");
  return {};
}
