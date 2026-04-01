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
  `SELECT column_name, data_type, character_maximum_length
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'usuarios'
   ORDER BY ordinal_position`,
)
  .then((r) => {
    console.log(JSON.stringify(r.rows, null, 2));
    return p.end();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
