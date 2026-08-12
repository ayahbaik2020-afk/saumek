#!/usr/bin/env node
// WO Sync Service CLI
//   discover           : list tabel SAUSIMIP & kandidat WO -> discovery/report.json
//   sync                : baca WO dari SQL Server per mapping.json -> upsert Supabase
//   sync:json           : uji jalur Supabase dari file JSON lokal (tanpa SQL Server)
import { parseArgs } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./lib/config.mjs";
import { discover } from "./lib/discover.mjs";
import { runSync } from "./lib/sync.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

function help() {
  console.log(`
WO Sync Service - MIPRO/SAUSIMIP (SQL Server) -> Supabase

Usage:
  node wo-sync.mjs discover [--out <file>]
  node wo-sync.mjs sync [--mapping <file>] [--since <ISO>] [--limit <n>] [--dry-run]
  node wo-sync.mjs sync:json [--source <file>] [--mapping <file>] [--dry-run]

Options:
  --mapping   file mapping (default: mapping.json)
  --since     incremental sync: hanya WO dengan incremental_field > waktu ini (ISO 8601)
  --limit     batasi jumlah baris yang dibaca
  --dry-run   tanpa menulis ke Supabase
  --out       output discovery (default: discovery/report.json)
  --source    sumber JSON untuk sync:json (default: sample-source.json)

Env: lihat .env.example. Jalankan dengan node --env-file=.env.local atau .env di direktori ini.
`);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    mapping: { type: "string" },
    since: { type: "string" },
    limit: { type: "string" },
    "dry-run": { type: "boolean" },
    source: { type: "string" },
  },
});

const command = positionals[0];
if (!command) {
  help();
  process.exit(0);
}

const cfg = loadConfig();

if (command === "discover") {
  const outFile = values.out || join(HERE, "discovery", "report.json");
  const { connect } = await import("./lib/sqlserver.mjs");
  const pool = await connect(cfg.sqlServer);
  try {
    await discover(pool, outFile);
  } finally {
    await pool.close();
  }
} else if (command === "sync" || command === "sync:json") {
  const mappingFile = values.mapping || join(HERE, "mapping.json");
  const opts = {
    cfg,
    mappingPath: mappingFile,
    sourcePath: command === "sync:json" ? values.source || join(HERE, "sample-source.json") : null,
    since: values.since,
    dryRun: values["dry-run"] === true,
    limit: values.limit ? Number(values.limit) : undefined,
  };
  await runSync(opts);
} else {
  help();
  process.exit(1);
}
