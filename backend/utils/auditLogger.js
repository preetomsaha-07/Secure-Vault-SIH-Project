const pool = require("../db/pool");

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