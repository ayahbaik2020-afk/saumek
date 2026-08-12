import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { connect, query } from "./sqlserver.mjs";
import { matchesFilters, filtersToSql } from "./filters.mjs";

const CHUNK_SIZE = 100;

function mapField(target, sourceCol, row) {
  if (!sourceCol || sourceCol === "TBD") return;
  const value = row[sourceCol] ?? row[sourceCol.toLowerCase()] ?? row[sourceCol.toUpperCase()];
  if (value === undefined || value === null) return;
  return value;
}

function normalizeRows(mapping, rows) {
  const out = [];
  for (const row of rows) {
    const item = { source_system: mapping.source_system || "SAUSIMIP" };
    if (mapping.save_raw_data !== false) item.raw_data = row;

    for (const [target, sourceCol] of Object.entries(mapping.fields || {})) {
      const value = mapField(target, sourceCol, row);
      if (value !== undefined) item[target] = value;
    }

    if (item.external_status && mapping.status_mapping?.[item.external_status]) {
      item.external_status = mapping.status_mapping[item.external_status];
    }
    if (item.priority && mapping.priority_mapping?.[item.priority]) {
      item.priority = mapping.priority_mapping[item.priority];
    }
    if (!item.wo_number) {
      throw new Error(
        `wo_number tidak terpetakan untuk baris: ${JSON.stringify(row).slice(0, 300)}`
      );
    }
    item.synced_at = new Date().toISOString();
    out.push(item);
  }
  return out;
}

async function fetchSourceRows(pool, mapping, since, limit) {
  if (pool === null) return []; // rows diisi dari sumber JSON oleh pemanggil
  const table = mapping.table;
  if (!table || table === "TBD") {
    throw new Error("Mapping belum lengkap: isi 'table' setelah discovery.");
  }
  const where = [];
  const params = {};
  const filterSql = filtersToSql(mapping.filters || []);
  if (filterSql) where.push(filterSql);
  if (since && mapping.incremental_field && mapping.incremental_field !== "TBD") {
    where.push(`[${mapping.incremental_field}] > @since`);
    params.since = since;
  }
  const sqlText = `select top ${limit || 2147483647} * from [${table}]${where.length ? ` where ${where.join(" and ")}` : ""}`;
  return query(pool, sqlText, params);
}

export async function runSync({ cfg, mappingPath, sourcePath, since, dryRun, limit }) {
  const mapping = JSON.parse(readFileSync(mappingPath, "utf8"));
  const db = createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let pool = null;
  let rows = null;
  try {
    if (sourcePath) {
      rows = JSON.parse(readFileSync(sourcePath, "utf8"));
    } else {
      pool = await connect(cfg.sqlServer);
      rows = await fetchSourceRows(pool, mapping, since, limit);
    }
  } finally {
    if (pool) await pool.close();
  }

  if (limit && rows.length > limit) rows = rows.slice(0, limit);
  const beforeFilter = rows.length;
  rows = rows.filter((r) => matchesFilters(r, mapping.filters || []));
  if (rows.length !== beforeFilter) {
    console.log(`Filter diterapkan: ${beforeFilter} -> ${rows.length} baris (hanya mekanikal).`);
  }
  console.log(`WO dibaca: ${rows.length}`);

  let logId = null;
  if (!dryRun) {
    const { data: logRow, error: logErr } = await db
      .from("wo_sync_logs")
      .insert({ status: "RUNNING", started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (logErr) throw new Error("Gagal membuat wo_sync_logs: " + logErr.message);
    logId = logRow.id;
  }

  const stats = { total_read: rows.length, total_inserted: 0, total_updated: 0, total_skipped: 0, total_failed: 0, error_message: null };

  const errors = [];
  const processed = [];

  for (const row of rows) {
    try {
      const item = normalizeRows(mapping, [row])[0];
      processed.push(item);
    } catch (err) {
      stats.total_failed++;
      errors.push({ wo_number: null, external_wo_id: row?.WO_ID ?? null, error_type: "PARSE", error_message: err.message, raw_data: row });
      console.error("Parse error:", err.message);
    }
  }

  for (let i = 0; i < processed.length; i += CHUNK_SIZE) {
    const chunk = processed.slice(i, i + CHUNK_SIZE);
    if (dryRun) {
      console.log(`[dry-run] upsert ${chunk.length} baris (contoh: ${chunk[0].wo_number})`);
      continue;
    }
    try {
      // klasifikasi insert vs update
      const nums = chunk.map((c) => c.wo_number);
      const { data: existing } = await db
        .from("external_work_orders")
        .select("wo_number")
        .eq("source_system", mapping.source_system || "SAUSIMIP")
        .in("wo_number", nums);
      const existingSet = new Set((existing ?? []).map((e) => e.wo_number));

      const { error } = await db
        .from("external_work_orders")
        .upsert(chunk, { onConflict: "source_system,wo_number" });

      if (error) throw error;

      for (const c of chunk) {
        if (existingSet.has(c.wo_number)) stats.total_updated++;
        else stats.total_inserted++;
      }
    } catch (err) {
      stats.total_failed += chunk.length;
      for (const c of chunk) {
        errors.push({
          external_wo_id: c.external_wo_id ?? null,
          wo_number: c.wo_number,
          error_type: "UPSERT",
          error_message: err.message,
          raw_data: c.raw_data ?? null,
        });
      }
      console.error("Upsert error:", err.message);
    }
  }

  const finalStatus =
    stats.total_failed > 0 && stats.total_inserted + stats.total_updated > 0
      ? "PARTIAL"
      : stats.total_failed > 0
        ? "FAILED"
        : "SUCCESS";

  if (!dryRun) {
    const { error: updateErr } = await db
      .from("wo_sync_logs")
      .update({
        status: finalStatus,
        finished_at: new Date().toISOString(),
        total_read: stats.total_read,
        total_inserted: stats.total_inserted,
        total_updated: stats.total_updated,
        total_skipped: stats.total_skipped,
        total_failed: stats.total_failed,
        error_message: stats.error_message,
      })
      .eq("id", logId);
    if (updateErr) console.error("Gagal finalisasi wo_sync_logs:", updateErr.message);

    for (let i = 0; i < errors.length; i += CHUNK_SIZE) {
      const chunkErr = errors.slice(i, i + CHUNK_SIZE).map((e) => ({ ...e, sync_log_id: logId }));
      const { error: errErr } = await db.from("wo_sync_errors").insert(chunkErr);
      if (errErr) console.error("Gagal simpan wo_sync_errors:", errErr.message);
    }
  }

  console.log(
    `Selesai [${finalStatus}${dryRun ? " / dry-run" : ""}] insert=${stats.total_inserted} update=${stats.total_updated} fail=${stats.total_failed} read=${stats.total_read}`
  );
  return stats;
}
