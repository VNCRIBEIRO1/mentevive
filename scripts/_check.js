const{neon}=require("@neondatabase/serverless");
const sql=neon(process.env.DATABASE_URL);
sql.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='tenant_memberships'")
  .then(r=>console.log(JSON.stringify(r,null,2)));
