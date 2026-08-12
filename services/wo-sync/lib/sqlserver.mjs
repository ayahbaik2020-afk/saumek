import sql from "mssql";

export async function connect(cfg) {
  const pool = new sql.ConnectionPool({
    server: cfg.server,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    connectionTimeout: 15000,
    requestTimeout: cfg.timeout,
    pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: cfg.encrypt, trustServerCertificate: true },
  });
  await pool.connect();
  return pool;
}

export async function query(pool, statement, params = {}) {
  const request = pool.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }
  const result = await request.query(statement);
  return result.recordset;
}

export function quoteIdentifier(name) {
  return "[" + String(name).replace(/\]/g, "]]") + "]";
}
