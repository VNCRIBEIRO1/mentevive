const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split(/\r?\n/)) {
  const idx = line.indexOf("=");
  if (idx === -1 || line.startsWith("#")) continue;
  const key = line.slice(0, idx).trim();
  let val = line.slice(idx + 1).trim();
  val = val.replace(/^"+|"+$/g, "").replace(/\\r\\n/g, "").replace(/\\n/g, "").trim();
  process.env[key] = val;
}
const sql = neon(process.env.DATABASE_URL);
async function q(s) { return sql.query(s); }
(async () => {
  const ledger = await q("SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at");
  console.log("=== MIGRATION LEDGER ===");
  ledger.forEach(r => console.log(r.hash, r.created_at));
  const fks = await q("SELECT count(*) as cnt FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND constraint_name LIKE '%composite%'");
  console.log("\nCOMPOSITE FKs:", fks[0].cnt);
  const uidx = await q("SELECT indexname FROM pg_indexes WHERE indexname LIKE '%tenant%unique%' OR indexname LIKE '%unique%tenant%' ORDER BY indexname");
  console.log("\nUNIQUE TENANT INDEXES");
  uidx.forEach(r => console.log("  " + r.indexname));
  const nc = await q("SELECT table_name,is_nullable FROM information_schema.columns WHERE column_name='tenant_id' AND table_schema='public' ORDER BY table_name");
  console.log("\nTENANT_ID NULLABLE");
  nc.forEach(r => console.log("  " + r.table_name + " " + r.is_nullable));
  const tbls = ["tenants","users","tenant_memberships","patients","appointments","payments","clinical_records","documents","blog_posts","groups","group_members","triages","availability","blocked_dates","settings","notifications","password_reset_tokens"];
  console.log("\nROW COUNTS");
  for (const t of tbls) { try { const r = await q("SELECT count(*) c FROM " + t); console.log("  " + t + " " + r[0].c); } catch(e) { console.log("  " + t + " NOT FOUND"); } }
  console.log("\nNULL TENANT_ID SCAN");
  const tt = ["patients","appointments","payments","clinical_records","documents","blog_posts","groups","group_members","triages","availability","blocked_dates","settings","notifications"];
  let nf = false;
  for (const t of tt) { try { const r = await q("SELECT count(*) c FROM " + t + " WHERE tenant_id IS NULL"); if(parseInt(r[0].c)>0){console.log("  !! " + t + " " + r[0].c);nf=true;} } catch(e){} }
  if (!nf) console.log("  all clean");
  console.log("\nCROSS-TENANT FK CHECK");
  const cks=[["appt->pat","SELECT count(*) c FROM appointments a JOIN patients p ON a.patient_id=p.id WHERE a.tenant_id!=p.tenant_id"],["pay->pat","SELECT count(*) c FROM payments py JOIN patients p ON py.patient_id=p.id WHERE py.tenant_id!=p.tenant_id"],["pay->appt","SELECT count(*) c FROM payments py JOIN appointments a ON py.appointment_id=a.id WHERE py.tenant_id!=a.tenant_id"],["cr->pat","SELECT count(*) c FROM clinical_records cr JOIN patients p ON cr.patient_id=p.id WHERE cr.tenant_id!=p.tenant_id"],["doc->pat","SELECT count(*) c FROM documents d JOIN patients p ON d.patient_id=p.id WHERE d.tenant_id!=p.tenant_id"]];
  let vf=false;
  for (const [n,s] of cks) { const r = await q(s); if(parseInt(r[0].c)>0){console.log("  !! " + n + " " + r[0].c);vf=true;} }
  if (!vf) console.log("  all clean");
  console.log("\nTENANT MEMBERSHIPS");
  const ms = await q("SELECT u.email, tm.role, t.slug FROM tenant_memberships tm JOIN users u ON tm.user_id=u.id JOIN tenants t ON tm.tenant_id=t.id ORDER BY tm.role, u.email");
  ms.forEach(r => console.log("  " + r.role + " " + r.email + " " + r.slug));
  console.log("\nALL FOREIGN KEYS");
  const af = await q("SELECT tc.constraint_name cn, tc.table_name tn, kcu.column_name col, ccu.table_name ft, ccu.column_name fc FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public' ORDER BY tc.table_name,tc.constraint_name");
  af.forEach(r => console.log("  " + r.tn + "." + r.col + " -> " + r.ft + "." + r.fc + " (" + r.cn + ")"));
  console.log("\nTENANT INDEXES");
  const ix = await q("SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_%tenant%' ORDER BY tablename, indexname");
  ix.forEach(r => console.log("  " + r.tablename + ": " + r.indexname));
})();