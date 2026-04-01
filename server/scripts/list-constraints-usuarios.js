require("dotenv").config();
const { Pool } = require("pg");
const p = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
p.query(
  `SELECT conname, pg_get_constraintdef(oid) AS def
   FROM pg_constraint
   WHERE conrelid = 'public.usuarios'::regclass`,
)
  .then((r) => {
    console.log(JSON.stringify(r.rows, null, 2));
    return p.end();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
