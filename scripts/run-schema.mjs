// Applies supabase/schema.sql to the Supabase database.
// Usage:
//   node --env-file=.env.local scripts/run-schema.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

const rawUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  `postgres://${process.env.POSTGRES_USER}:${encodeURIComponent(
    process.env.POSTGRES_PASSWORD
  )}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}`;

const url = rawUrl.replace(/\?.*$/, "");

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  const n = sql.length;

  const readUntilDollar = (start) => {
    let j = start;
    while (j < n && sql[j] !== "$") j++;
    if (j >= n) return n;
    let k = j + 1;
    const tag = sql.slice(j + 1, j + 2) === "$" ? "$$" : "";
    if (tag === "") {
      let t = "";
      while (k < n && sql[k] !== "$") t += sql[k++];
      const close = "$" + t + "$";
      const end = sql.indexOf(close, j);
      return end === -1 ? n : end + close.length;
    }
    const end = sql.indexOf("$$", j + 2);
    return end === -1 ? n : end + 2;
  };

  while (i < n) {
    const c = sql[i];
    if (c === "-" && sql[i + 1] === "-") {
      while (i < n && sql[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === "'") {
      current += c;
      i++;
      while (i < n) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            current += "''";
            i += 2;
            continue;
          }
          current += "'";
          i++;
          break;
        }
        current += sql[i];
        i++;
      }
      continue;
    }
    if (c === "$" && sql[i + 1] === "$") {
      const end = readUntilDollar(i);
      current += sql.slice(i, end);
      i = end;
      continue;
    }
    if (c === "$") {
      // possible $tag$
      let k = i + 1;
      let tag = "";
      while (k < n && sql[k] !== "$" && sql[k] !== " ") tag += sql[k++];
      if (sql[k] === "$" && tag !== "") {
        const end = readUntilDollar(i);
        current += sql.slice(i, end);
        i = end;
        continue;
      }
    }
    if (c === ";") {
      statements.push(current.trim());
      current = "";
      i++;
      continue;
    }
    current += c;
    i++;
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((s) => s.length > 0);
}

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const schema = readFileSync("supabase/schema.sql", "utf8");
const statements = splitStatements(schema);
console.log(`Loaded ${statements.length} SQL statements.`);

let ok = 0;
let skipped = 0;
for (let i = 0; i < statements.length; i++) {
  try {
    await client.query(statements[i]);
    ok++;
  } catch (err) {
    if (/already exists/i.test(err.message)) {
      console.warn(`Skipped (already exists): ${statements[i].slice(0, 80).replace(/\n/g, " ")}...`);
      skipped++;
      continue;
    }
    console.error(`\nStatement ${i + 1} FAILED:`);
    console.error(statements[i].slice(0, 400));
    console.error("Error:", err.message);
    await client.end();
    process.exit(1);
  }
}

console.log(`\n${ok}/${statements.length} statements applied successfully (${skipped} already existed).`);

const tables = await client.query(
  `select table_name from information_schema.tables where table_schema='public' order by table_name`
);
console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

await client.end();
console.log("Schema setup complete.");
