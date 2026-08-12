import { writeFileSync } from "node:fs";
import { query, quoteIdentifier } from "./sqlserver.mjs";

// Kandidat tabel terkait WO/Job berdasarkan pola nama. Bukan asumsi final:
// hanya penanda untuk diprioritaskan dalam review, bukan penentu mapping.
const WO_PATTERN = /wo|work|order|jplan|job|pekerjaan|permintaan|pm|cm/i;

const SAMPLE_SIZE = 5;

export async function discover(pool, outFile) {
  const tables = await query(pool, "select name from sys.tables order by name");

  const report = {
    source: "SAUSIMIP (SQL Server)",
    generated_at: new Date().toISOString(),
    tables: [],
  };

  for (const t of tables) {
    const name = t.name;
    const woCandidate = WO_PATTERN.test(name);

    const columns = await query(
      pool,
      `select c.name, ty.name as data_type, c.is_nullable, c.max_length
         from sys.columns c
         join sys.types ty on c.user_type_id = ty.user_type_id
        where c.object_id = object_id(@name)
        order by c.column_id`,
      { name }
    );

    const pkRows = await query(
      pool,
      `select kcu.column_name
         from information_schema.table_constraints tc
         join information_schema.key_column_usage kcu
           on tc.constraint_name = kcu.constraint_name
          and tc.table_schema = kcu.table_schema
        where tc.table_name = @name
          and tc.constraint_type = 'PRIMARY KEY'
        order by kcu.ordinal_position`,
      { name }
    );

    const sampleRows = woCandidate
      ? await query(pool, `select top ${SAMPLE_SIZE} * from ${quoteIdentifier(name)}`)
      : [];

    report.tables.push({
      name,
      wo_candidate: woCandidate,
      columns,
      primary_key: pkRows.map((r) => r.column_name),
      sample_rows: sampleRows,
    });
  }

  writeFileSync(outFile, JSON.stringify(report, null, 2));

  const candidates = report.tables.filter((t) => t.wo_candidate).map((t) => t.name);
  console.log(
    `Discovery selesai: ${report.tables.length} tabel, ${candidates.length} kandidat WO:`
  );
  for (const c of candidates) console.log("  - " + c);
  console.log("\nLaporan lengkap: " + outFile);
  console.log("\nLangkah berikutnya: review laporan, isi mapping.json, lalu jalankan sync.");
}
