"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/db";
import { adminDb } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/db";
import type { ItemCondition, ItemStatus } from "@/lib/types";

export type ActionState = { error?: string; id?: string } | undefined;

function required(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberOrNull(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

export async function createItem(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const itemCode = required(formData, "item_code").toUpperCase();
  const name = required(formData, "name");

  if (!itemCode || !name) return { error: "Kode dan nama barang wajib diisi." };

  const quantity = numberOrNull(formData.get("quantity")) ?? 1;
  const payload = {
    item_code: itemCode,
    name,
    category_id: strOrNull(formData.get("category_id")),
    brand: strOrNull(formData.get("brand")),
    model: strOrNull(formData.get("model")),
    serial_number: strOrNull(formData.get("serial_number")),
    unit: required(formData, "unit") || "pcs",
    quantity,
    location_id: strOrNull(formData.get("location_id")),
    condition: (strOrNull(formData.get("condition")) ??
      "GOOD") as ItemCondition,
    status: (strOrNull(formData.get("status")) ?? "AVAILABLE") as ItemStatus,
    photo_url: strOrNull(formData.get("photo_url")),
    description: strOrNull(formData.get("description")),
    is_active: true,
  };

  const { data, error } = await adminDb()
    .from("items")
    .insert(payload)
    .select("id, item_code")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Kode barang ${itemCode} sudah digunakan.` };
    }
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE ITEM",
    module: "Inventory",
    recordId: data.id,
    newValue: { item_code: itemCode, name },
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateItem(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  if (!id) return { error: "ID barang tidak valid." };

  const itemCode = required(formData, "item_code").toUpperCase();
  const name = required(formData, "name");
  if (!itemCode || !name) return { error: "Kode dan nama barang wajib diisi." };

  const quantity = numberOrNull(formData.get("quantity")) ?? 1;
  const payload = {
    item_code: itemCode,
    name,
    category_id: strOrNull(formData.get("category_id")),
    brand: strOrNull(formData.get("brand")),
    model: strOrNull(formData.get("model")),
    serial_number: strOrNull(formData.get("serial_number")),
    unit: required(formData, "unit") || "pcs",
    quantity,
    location_id: strOrNull(formData.get("location_id")),
    condition: (strOrNull(formData.get("condition")) ??
      "GOOD") as ItemCondition,
    photo_url: strOrNull(formData.get("photo_url")),
    description: strOrNull(formData.get("description")),
  };

  const { error } = await adminDb().from("items").update(payload).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: `Kode barang ${itemCode} sudah digunakan.` };
    }
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE ITEM",
    module: "Inventory",
    recordId: id,
    newValue: { item_code: itemCode, name },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/dashboard");
  return { id };
}

export async function toggleItemActive(id: string) {
  const admin = await requireAdmin();

  const { data: item } = await adminDb()
    .from("items")
    .select("is_active, item_code, name")
    .eq("id", id)
    .single();

  if (!item) return { error: "Barang tidak ditemukan." };

  const next = !item.is_active;
  const { error } = await adminDb()
    .from("items")
    .update({ is_active: next })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: next ? "ACTIVATE ITEM" : "DEACTIVATE ITEM",
    module: "Inventory",
    recordId: id,
    oldValue: { is_active: item.is_active },
    newValue: { is_active: next },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  return {};
}

export async function changeItemStatus(
  id: string,
  status: ItemStatus,
  reason?: string
) {
  const admin = await requireAdmin();

  const { data: item } = await adminDb()
    .from("items")
    .select("status, item_code, name")
    .eq("id", id)
    .single();

  if (!item) return { error: "Barang tidak ditemukan." };

  const { error } = await adminDb()
    .from("items")
    .update({ status, condition: status === "DAMAGED" ? "HEAVY_DAMAGE" : undefined })
    .eq("id", id);

  if (error) return { error: error.message };

  await adminDb().from("item_status_history").insert({
    item_id: id,
    from_status: item.status,
    to_status: status,
    changed_by: admin.id,
    reason: reason ?? null,
  });

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CHANGE STATUS",
    module: "Inventory",
    recordId: id,
    oldValue: { status: item.status },
    newValue: { status },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  return {};
}

export async function createCategory(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const name = required(formData, "name");
  if (!name) return { error: "Nama kategori wajib diisi." };

  const { data, error } = await adminDb()
    .from("categories")
    .insert({ name, description: strOrNull(formData.get("description")) })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Kategori sudah ada." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE CATEGORY",
    module: "Master",
    recordId: data.id,
    newValue: { name },
  });

  revalidatePath("/categories");
  revalidatePath("/inventory");
  return { id: data.id };
}

export async function updateCategory(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  const name = required(formData, "name");
  if (!id || !name) return { error: "Data kategori tidak lengkap." };

  const { error } = await adminDb()
    .from("categories")
    .update({ name, description: strOrNull(formData.get("description")) })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Kategori sudah ada." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE CATEGORY",
    module: "Master",
    recordId: id,
    newValue: { name },
  });

  revalidatePath("/categories");
  return { id };
}

export async function deleteCategory(id: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE CATEGORY",
    module: "Master",
    recordId: id,
  });
  revalidatePath("/categories");
  return {};
}

export async function createLocation(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const name = required(formData, "name");
  if (!name) return { error: "Nama lokasi wajib diisi." };

  const { data, error } = await adminDb()
    .from("locations")
    .insert({ name, description: strOrNull(formData.get("description")) })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Lokasi sudah ada." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CREATE LOCATION",
    module: "Master",
    recordId: data.id,
    newValue: { name },
  });

  revalidatePath("/locations");
  return { id: data.id };
}

export async function updateLocation(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = required(formData, "id");
  const name = required(formData, "name");
  if (!id || !name) return { error: "Data lokasi tidak lengkap." };

  const { error } = await adminDb()
    .from("locations")
    .update({ name, description: strOrNull(formData.get("description")) })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Lokasi sudah ada." };
    return { error: error.message };
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "UPDATE LOCATION",
    module: "Master",
    recordId: id,
    newValue: { name },
  });

  revalidatePath("/locations");
  return { id };
}

export async function deleteLocation(id: string) {
  const admin = await requireAdmin();
  const { error } = await adminDb().from("locations").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "DELETE LOCATION",
    module: "Master",
    recordId: id,
  });
  revalidatePath("/locations");
  return {};
}
