"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/db";
import { logAudit } from "@/lib/db";
import { adminDb } from "@/lib/supabase/admin";
import type { ItemCondition } from "@/lib/types";

export type BorrowState = { error?: string; id?: string } | undefined;

interface BorrowLine {
  itemId: string;
  quantity: number;
}

async function outstandingForItem(itemId: string): Promise<number> {
  const { data, error } = await adminDb()
    .from("borrowing_items")
    .select("quantity, returned_quantity, status")
    .eq("item_id", itemId)
    .neq("status", "RETURNED");

  if (error) return 0;
  return data.reduce(
    (sum, line) => sum + (Number(line.quantity) - Number(line.returned_quantity)),
    0
  );
}

async function setItemBorrowed(itemId: string, changedBy: string, reason: string) {
  const { data: item } = await adminDb()
    .from("items")
    .select("status")
    .eq("id", itemId)
    .single();

  if (item && item.status !== "BORROWED") {
    await adminDb().from("items").update({ status: "BORROWED" }).eq("id", itemId);
    await adminDb().from("item_status_history").insert({
      item_id: itemId,
      from_status: item.status,
      to_status: "BORROWED",
      changed_by: changedBy,
      reason,
    });
  }
}

async function recomputeItemStatus(itemId: string, changedBy: string, reason: string) {
  const outstanding = await outstandingForItem(itemId);
  const { data: item } = await adminDb()
    .from("items")
    .select("status")
    .eq("id", itemId)
    .single();

  if (!item) return;

  const next =
    outstanding > 0 ? "BORROWED" : "AVAILABLE";

  if (item.status !== next) {
    await adminDb()
      .from("items")
      .update({ status: next })
      .eq("id", itemId);
    await adminDb().from("item_status_history").insert({
      item_id: itemId,
      from_status: item.status,
      to_status: next,
      changed_by: changedBy,
      reason,
    });
  }
}

/** Mark job_tools as ISSUED when items are borrowed for a job; create row if missing. */
async function markJobToolsIssued(
  jobId: string,
  lines: BorrowLine[]
) {
  const db = adminDb();
  for (const line of lines) {
    const { data: existing } = await db
      .from("job_tools")
      .select("id, status")
      .eq("job_id", jobId)
      .eq("item_id", line.itemId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "REQUIRED" || existing.status === "RESERVED") {
        await db
          .from("job_tools")
          .update({ status: "ISSUED", quantity: line.quantity })
          .eq("id", existing.id);
      }
    } else {
      await db.from("job_tools").insert({
        job_id: jobId,
        item_id: line.itemId,
        quantity: line.quantity,
        status: "ISSUED",
        notes: "Dari peminjaman",
      });
    }
  }
}

/** When items return for a job, set job_tools RETURNED if no outstanding borrow for that job+item. */
async function refreshJobToolReturnStatus(jobId: string, itemIds: string[]) {
  const db = adminDb();
  for (const itemId of itemIds) {
    const { data: openBorrowings } = await db
      .from("borrowings")
      .select("id, borrowing_items!inner(item_id, status)")
      .eq("job_id", jobId)
      .not("status", "in", "(CANCELLED,RETURNED)")
      .eq("borrowing_items.item_id", itemId)
      .neq("borrowing_items.status", "RETURNED");

    if ((openBorrowings ?? []).length > 0) continue;

    await db
      .from("job_tools")
      .update({ status: "RETURNED" })
      .eq("job_id", jobId)
      .eq("item_id", itemId)
      .eq("status", "ISSUED");
  }
}

export async function createBorrowing(
  _state: BorrowState,
  formData: FormData
): Promise<BorrowState> {
  const borrower = await requireProfile();
  if (borrower.status !== "active") return { error: "User tidak aktif." };

  const purpose = String(formData.get("purpose") ?? "").trim();
  const locationOfUse = String(formData.get("location_of_use") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const expectedReturn = String(formData.get("expected_return_date") ?? "").trim();
  const jobIdRaw = String(formData.get("job_id") ?? "").trim();
  const jobId = jobIdRaw || null;

  if (!purpose) return { error: "Keperluan peminjaman wajib diisi." };

  // Items come as itemId|quantity repeated fields
  const itemKeys = Object.keys(formData as unknown as Record<string, unknown>);
  const lines: BorrowLine[] = [];
  const seen = new Set<string>();

  for (const key of itemKeys) {
    const m = key.match(/^line-item-([\w-]+)$/);
    if (!m) continue;
    const itemId = m[1];
    if (seen.has(itemId)) continue;
    const qty = Number(formData.get(`line-qty-${itemId}`) ?? 1);
    if (!qty || qty <= 0) continue;
    seen.add(itemId);
    lines.push({ itemId, quantity: qty });
  }

  if (lines.length === 0) return { error: "Minimal satu barang wajib dipilih." };

  if (expectedReturn) {
    const borrow = new Date();
    const exp = new Date(expectedReturn);
    if (exp < new Date(borrow.getFullYear(), borrow.getMonth(), borrow.getDate())) {
      return { error: "Tanggal kembali tidak boleh sebelum tanggal peminjaman." };
    }
  }

  const db = adminDb();

  if (jobId) {
    const { data: job } = await db
      .from("jobs")
      .select("id, status")
      .eq("id", jobId)
      .maybeSingle();
    if (!job) return { error: "Job tidak ditemukan." };
    if (job.status === "CANCELLED" || job.status === "COMPLETED") {
      return { error: "Tidak bisa pinjam tool untuk job yang sudah selesai/dibatalkan." };
    }
  }

  // Validate each line
  for (const line of lines) {
    const { data: item, error } = await db
      .from("items")
      .select("id, item_code, name, quantity, status, is_active")
      .eq("id", line.itemId)
      .single();

    if (error || !item) return { error: "Barang tidak ditemukan." };
    if (!item.is_active) return { error: `${item.name} tidak aktif.` };
    if (item.status === "INACTIVE" || item.status === "LOST" || item.status === "MAINTENANCE" || item.status === "DAMAGED") {
      return {
        error: `${item.name} tidak dapat dipinjam (status ${item.status}).`,
      };
    }

    const available = Number(item.quantity) - (await outstandingForItem(item.id));
    if (line.quantity > available) {
      return {
        error: `${item.name} hanya tersedia ${available} dari permintaan ${line.quantity}.`,
      };
    }
  }

  // Generate transaction number
  const { data: numData, error: numError } = await db.rpc(
    "generate_transaction_number",
    { prefix: "BRW" }
  );
  if (numError || !numData) return { error: "Gagal membuat nomor transaksi." };

  const transactionNumber = String(numData);

  const { data: borrowing, error: borrowError } = await db
    .from("borrowings")
    .insert({
      transaction_number: transactionNumber,
      borrower_id: borrower.id,
      job_id: jobId,
      purpose,
      location_of_use: locationOfUse || null,
      expected_return_date: expectedReturn ? new Date(expectedReturn).toISOString() : null,
      status: "BORROWED",
      notes,
      created_by: borrower.id,
    })
    .select("id")
    .single();

  if (borrowError) return { error: borrowError.message };

  for (const line of lines) {
    const { error: liErr } = await db.from("borrowing_items").insert({
      borrowing_id: borrowing.id,
      item_id: line.itemId,
      quantity: line.quantity,
    });
    if (liErr) return { error: liErr.message };
    await setItemBorrowed(line.itemId, borrower.id, transactionNumber);
  }

  if (jobId) {
    await markJobToolsIssued(jobId, lines);
  }

  await db.from("notifications").insert({
    user_id: borrower.id,
    title: "Peminjaman berhasil",
    message: jobId
      ? `Transaksi ${transactionNumber} untuk job tersimpan.`
      : `Transaksi ${transactionNumber} berhasil dibuat.`,
    type: "success",
  });

  await logAudit({
    userId: borrower.id,
    userName: borrower.name,
    action: "BORROW ITEM",
    module: "Transaksi",
    recordId: borrowing.id,
    newValue: {
      transaction_number: transactionNumber,
      lines: lines.length,
      job_id: jobId,
    },
  });

  revalidatePath("/borrow");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/my-items");
  revalidatePath("/history");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/jobs");
  }
  return { id: borrowing.id };
}

interface ReturnLine {
  borrowingItemId: string;
  itemId: string;
  quantity: number;
  condition: ItemCondition;
  notes: string | null;
}

export async function processReturn(
  _state: BorrowState,
  formData: FormData
): Promise<BorrowState> {
  const user = await requireProfile();
  if (user.status !== "active") return { error: "User tidak aktif." };

  const borrowingId = String(formData.get("borrowing_id") ?? "").trim();
  if (!borrowingId) return { error: "Transaksi tidak valid." };

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const db = adminDb();

  const { data: borrowing } = await db
    .from("borrowings")
    .select("id, transaction_number, status, job_id")
    .eq("id", borrowingId)
    .single();

  if (!borrowing) return { error: "Transaksi tidak ditemukan." };
  if (borrowing.status === "RETURNED" || borrowing.status === "CANCELLED") {
    return { error: "Transaksi ini sudah selesai/dibatalkan." };
  }

  const { data: allLines } = await db
    .from("borrowing_items")
    .select("id, item_id, quantity, returned_quantity")
    .eq("borrowing_id", borrowingId);

  if (!allLines) return { error: "Barang transaksi tidak ditemukan." };

  const lines: ReturnLine[] = [];
  for (const line of allLines) {
    const qtyStr = String(formData.get(`ret-qty-${line.id}`) ?? "").trim();
    if (qtyStr === "") continue;
    const qty = Number(qtyStr);
    const outstanding = Number(line.quantity) - Number(line.returned_quantity);
    if (!qty || qty <= 0) continue;
    if (qty > outstanding) {
      return {
        error: `Jumlah kembali melebihi sisa pinjaman (maks ${outstanding}).`,
      };
    }
    lines.push({
      borrowingItemId: line.id,
      itemId: line.item_id,
      quantity: qty,
      condition: (String(formData.get(`ret-cond-${line.id}`) ?? "GOOD")) as ItemCondition,
      notes: String(formData.get(`ret-notes-${line.id}`) ?? "").trim() || null,
    });
  }

  if (lines.length === 0) return { error: "Tidak ada barang yang dikembalikan." };

  const { data: numData, error: numError } = await db.rpc(
    "generate_transaction_number",
    { prefix: "RTN" }
  );
  if (numError || !numData) return { error: "Gagal membuat nomor pengembalian." };

  const returnNumber = String(numData);

  const { data: returnRec, error: returnError } = await db
    .from("returns")
    .insert({
      return_number: returnNumber,
      borrowing_id: borrowingId,
      returned_by: user.id,
      notes,
    })
    .select("id")
    .single();

  if (returnError) return { error: returnError.message };

  let allReturned = true;
  let anyDamage = false;
  let anyMaintenance = false;

  for (const line of lines) {
    const { error: riErr } = await db.from("return_items").insert({
      return_id: returnRec.id,
      borrowing_item_id: line.borrowingItemId,
      item_id: line.itemId,
      quantity: line.quantity,
      condition: line.condition,
      notes: line.notes,
    });
    if (riErr) return { error: riErr.message };

    if (line.condition === "HEAVY_DAMAGE") anyDamage = true;
    if (line.condition === "MAINTENANCE") anyMaintenance = true;

    // Update borrowing item
    const target = allLines.find((l) => l.id === line.borrowingItemId)!;
    const newReturned = Number(target.returned_quantity) + line.quantity;
    const lineStatus =
      newReturned >= Number(target.quantity) ? "RETURNED" : "PARTIAL";

    await db
      .from("borrowing_items")
      .update({ returned_quantity: newReturned, status: lineStatus })
      .eq("id", line.borrowingItemId);

    // Update item status based on outstanding + returned condition
    const outstanding = await outstandingForItem(line.itemId);
    if (outstanding <= 0) {
      const nextStatus = anyMaintenance
        ? "MAINTENANCE"
        : anyDamage
          ? "DAMAGED"
          : "AVAILABLE";
      const { data: item } = await db
        .from("items")
        .select("status")
        .eq("id", line.itemId)
        .single();
      if (item && item.status !== nextStatus) {
        await db.from("items").update({ status: nextStatus }).eq("id", line.itemId);
        await db.from("item_status_history").insert({
          item_id: line.itemId,
          from_status: item.status,
          to_status: nextStatus,
          changed_by: user.id,
          reason: returnNumber,
        });
      }
    } else {
      await recomputeItemStatus(line.itemId, user.id, returnNumber);
    }
  }

  // Update borrowing status
  const { data: updatedLines } = await db
    .from("borrowing_items")
    .select("status")
    .eq("borrowing_id", borrowingId);

  allReturned = (updatedLines ?? []).every((l) => l.status === "RETURNED");
  const nextBorrowingStatus = allReturned ? "RETURNED" : "PARTIALLY_RETURNED";

  await db
    .from("borrowings")
    .update({ status: nextBorrowingStatus })
    .eq("id", borrowingId);

  await db.from("notifications").insert({
    user_id: user.id,
    title: "Pengembalian berhasil",
    message: `Pengembalian ${returnNumber} untuk ${borrowing.transaction_number} tersimpan.`,
    type: "success",
  });

  await logAudit({
    userId: user.id,
    userName: user.name,
    action: "RETURN ITEM",
    module: "Transaksi",
    recordId: borrowingId,
    newValue: { return_number: returnNumber },
  });

  if (borrowing.job_id) {
    await refreshJobToolReturnStatus(
      borrowing.job_id,
      lines.map((l) => l.itemId)
    );
  }

  revalidatePath("/returns");
  revalidatePath("/borrow");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/my-items");
  revalidatePath("/history");
  if (borrowing.job_id) {
    revalidatePath(`/jobs/${borrowing.job_id}`);
    revalidatePath("/jobs");
  }
  return { id: returnRec.id };
}

export async function cancelBorrowing(id: string) {
  const admin = await requireProfile();
  const db = adminDb();

  const { data: borrowing } = await db
    .from("borrowings")
    .select("status, job_id")
    .eq("id", id)
    .single();
  if (!borrowing) return { error: "Transaksi tidak ditemukan." };
  if (!["PENDING", "BORROWED", "PARTIALLY_RETURNED"].includes(borrowing.status)) {
    return { error: "Transaksi tidak dapat dibatalkan." };
  }

  const { data: lines } = await db
    .from("borrowing_items")
    .select("id, item_id, quantity, returned_quantity, status")
    .eq("borrowing_id", id);

  for (const line of lines ?? []) {
    if (line.status === "RETURNED") continue;
    await db.from("borrowing_items").update({ status: "RETURNED", returned_quantity: line.quantity }).eq("id", line.id);
  }

  await db.from("borrowings").update({ status: "CANCELLED" }).eq("id", id);

  // Recompute item statuses
  const itemIds = [...new Set((lines ?? []).map((l) => l.item_id))];
  for (const itemId of itemIds) {
    await recomputeItemStatus(itemId, admin.id, `cancel ${id}`);
  }

  if (borrowing.job_id) {
    await refreshJobToolReturnStatus(borrowing.job_id, itemIds);
  }

  await logAudit({
    userId: admin.id,
    userName: admin.name,
    action: "CANCEL BORROWING",
    module: "Transaksi",
    recordId: id,
  });

  revalidatePath("/borrow");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  if (borrowing.job_id) {
    revalidatePath(`/jobs/${borrowing.job_id}`);
  }
  return {};
}
