const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  } else {
    console.log("✅ PostgreSQL Connected Successfully");
  }
});

module.exports = pool;
