const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createAuditLog({
  userId,
  action,
  resourceType = null,
  resourceId = null,
  details = null,
}) {
  try {
    const result = await pool.query(
      `INSERT INTO audit_logs
       (user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        details,
      ]
    );

    console.log(
      `AUDIT LOG CREATED: id=${result.rows[0].id}, action=${action}, userId=${userId}`
    );

    return result.rows[0].id;
  } catch (error) {
    console.error("AUDIT LOG ERROR:", error.message);
    throw error;
  }
}

module.exports = {
  createAuditLog,
};