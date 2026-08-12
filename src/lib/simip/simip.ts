import "server-only";
import sql from "mssql";
import { adminDb } from "@/lib/supabase/admin";

export type SimipMode = "test" | "sync";

export interface SimipConnection {
  server: string;
  database: string;
  username: string;
  password: string;
}

export interface SyncStats {
  total_read: number;
  total_inserted: number;
  total_updated: number;
  total_failed: number;
}

export interface SimipSyncResult {
  mode: SimipMode;
  stats: SyncStats;
  first_error: string | null;
}

// ---- Konfigurasi (mirror services/wo-sync/mapping.sausimip.json) ----
// WOPM1 = section pelaksana (MS/MR/MC = mekanikal, diawali huruf "M").
// Status CAN/CLOSE di-skip; nilai status asli Maximo tetap di raw_data.STATUS.
// Status & priority Maximo dipetakan ke status/prioritas aplikasi.
// priority: skala Maximo, angka lebih kecil = lebih urgent (1-2 URGENT, dst).
const SOURCE_SYSTEM = "SAUSIMIP";
const TABLE = "MIP_WORKORDER";

const FIELDS: Record<string, string> = {
  external_wo_id: "WONUM",
  wo_number: "WONUM",
  title: "DESCRIPTION",
  description: "DESCRIPTION",
  area: "WOPM1",
  location: "LOCATION",
  equipment: "EQNUM",
  wo_type: "WORKTYPE",
  priority: "WOPRIORITY",
  external_status: "STATUS",
  requested_at: "REPORTDATE",
  planned_start: "TARGSTARTDATE",
  planned_finish: "TARGCOMPDATE",
  actual_start: "ACTSTART",
  actual_finish: "ACTFINISH",
  external_updated_at: "CHANGEDATE",
};

const STATUS_MAPPING: Record<string, string> = {
  APPREQ: "OPEN",
  PREAP: "OPEN",
  PREAP1: "OPEN",
  PREAP2: "OPEN",
  WAPPR: "OPEN",
  APPR: "PLANNED",
  WSCH: "PLANNED",
  WMATL: "PLANNED",
  PRWMATL: "PLANNED",
  WPCOND: "PLANNED",
  INPRG: "IN_PROGRESS",
  WCOMP: "COMPLETED",
  COMP: "COMPLETED",
  CAN: "CANCELLED",
  CLOSE: "COMPLETED",
};

const PRIORITY_MAPPING: Record<string, string> = {
  "1": "URGENT",
  "2": "URGENT",
  "3": "HIGH",
  "4": "HIGH",
  "5": "NORMAL",
  "6": "NORMAL",
  "7": "LOW",
  "8": "LOW",
  "9": "LOW",
};

type Filter = { column: string; op: "like" | "notin"; value?: string; values?: string[] };

const FILTERS: Filter[] = [
  { column: "WOPM1", op: "like", value: "M%" },
  { column: "STATUS", op: "notin", values: ["CAN", "CLOSE"] },
];

function getCol(row: Record<string, unknown>, column: string) {
  return row[column] ?? row[column.toLowerCase()] ?? row[column.toUpperCase()];
}

function matchesLike(value: unknown, pattern: string) {
  const regex = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/%/g, ".*")
    .replace(/_/g, ".");
  return new RegExp("^" + regex + "$", "i").test(String(value ?? ""));
}

function matchesFilters(row: Record<string, unknown>, filters: Filter[]) {
  return filters.every((f) => {
    const val = getCol(row, f.column);
    switch (f.op) {
      case "like":
        return matchesLike(val, f.value!);
      case "notin":
        return !(f.values ?? []).includes(val as string);
      default:
        return true;
    }
  });
}

function filtersToSql(filters: Filter[]) {
  const q = (v: string) => "'" + String(v).replace(/'/g, "''") + "'";
  return filters
    .map((f) => {
      const col = `[${f.column}]`;
      if (f.op === "like") return `${col} LIKE ${q(f.value!)}`;
      if (f.op === "notin") return `${col} NOT IN (${(f.values ?? []).map(q).join(", ")})`;
      return "";
    })
    .filter(Boolean)
    .join(" AND ");
}

function toIso(value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeRow(row: Record<string, unknown>) {
  const item: Record<string, unknown> = {
    source_system: SOURCE_SYSTEM,
    raw_data: row,
    synced_at: new Date().toISOString(),
  };
  for (const [target, sourceCol] of Object.entries(FIELDS)) {
    const value = toIso(getCol(row, sourceCol));
    if (value === undefined || value === null) continue;
    item[target] = value;
  }
  const rawStatus = item.external_status != null ? String(item.external_status) : "";
  if (rawStatus && STATUS_MAPPING[rawStatus]) {
    item.external_status = STATUS_MAPPING[rawStatus];
  }
  const rawPriority = item.priority != null ? String(item.priority) : "";
  if (rawPriority && PRIORITY_MAPPING[rawPriority]) {
    item.priority = PRIORITY_MAPPING[rawPriority];
  }
  if (!item.wo_number) {
    const snippet = JSON.stringify(row) ?? "";
    throw new Error(`Baris tanpa wo_number: ${snippet.slice(0, 300)}`);
  }
  return item;
}

export async function syncSimip(
  conn: SimipConnection,
  mode: SimipMode
): Promise<SimipSyncResult> {
  const config: sql.config = {
    server: conn.server,
    database: conn.database,
    user: conn.username,
    password: conn.password,
    port: Number(process.env.SIMIP_PORT || 1433),
    connectionTimeout: 15000,
    requestTimeout: 64000,
    pool: { max: 1, min: 0, idleTimeoutMillis: 30000 },
    options: {
      encrypt: process.env.SIMIP_ENCRYPT === "true",
      trustServerCertificate: true,
    },
  };

  const pool = await new sql.ConnectionPool(config).connect();
  let logId: string | null = null;
  const stats: SyncStats = {
    total_read: 0,
    total_inserted: 0,
    total_updated: 0,
    total_failed: 0,
  };

  try {
    const where = filtersToSql(FILTERS);
    const { recordset } = await pool
      .request()
      .query(`select * from [${TABLE}] where ${where}`);

    const rows = (recordset as Record<string, unknown>[]).filter((r) =>
      matchesFilters(r, FILTERS)
    );
    stats.total_read = rows.length;

    if (mode === "test") {
      return { mode, stats, first_error: null };
    }

    const db = adminDb();
    const { data: logRow, error: logErr } = await db
      .from("wo_sync_logs")
      .insert({ status: "RUNNING", started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (logErr) throw new Error("Gagal mencatat wo_sync_logs: " + logErr.message);
    logId = logRow.id;

    const processed: Record<string, unknown>[] = [];
    for (const row of rows) {
      try {
        processed.push(normalizeRow(row));
      } catch {
        stats.total_failed++;
      }
    }

    const CHUNK = 100;
    for (let i = 0; i < processed.length; i += CHUNK) {
      const chunk = processed.slice(i, i + CHUNK);
      const nums = chunk.map((c) => String(c.wo_number));
      const { data: existing } = await db
        .from("external_work_orders")
        .select("wo_number")
        .eq("source_system", SOURCE_SYSTEM)
        .in("wo_number", nums);
      const existingSet = new Set((existing ?? []).map((e) => e.wo_number));

      const { error } = await db
        .from("external_work_orders")
        .upsert(chunk, { onConflict: "source_system,wo_number" });
      if (error) throw error;

      for (const c of chunk) {
        if (existingSet.has(String(c.wo_number))) stats.total_updated++;
        else stats.total_inserted++;
      }
    }

    const finalStatus = stats.total_failed > 0 ? "PARTIAL" : "SUCCESS";
    await db
      .from("wo_sync_logs")
      .update({
        status: finalStatus,
        finished_at: new Date().toISOString(),
        total_read: stats.total_read,
        total_inserted: stats.total_inserted,
        total_updated: stats.total_updated,
        total_failed: stats.total_failed,
      })
      .eq("id", logId);

    return {
      mode,
      stats,
      first_error: stats.total_failed > 0 ? "Sebagian baris gagal diproses." : null,
    };
  } catch (err) {
    if (logId) {
      await adminDb()
        .from("wo_sync_logs")
        .update({
          status: "FAILED",
          finished_at: new Date().toISOString(),
          error_message: err instanceof Error ? err.message : String(err),
        })
        .eq("id", logId)
        .then(
          () => {},
          () => {}
        );
    }
    throw err;
  } finally {
    await pool.close();
  }
}
