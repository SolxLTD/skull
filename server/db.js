import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "Postgres12345",
  database: "school-intelligence",
});

export default pool;