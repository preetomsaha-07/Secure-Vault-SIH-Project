const express = require("express");
const { Pool } = require("pg");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ==========================================
// GET AUDIT LOGS
// ==========================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id,
         a.user_id,
         u.name AS user_name,
         u.email AS user_email,
         u.role AS user_role,
         a.action,
         a.resource_type,
         a.resource_id,
         a.details,
         a.created_at
       FROM audit_logs a
       LEFT JOIN users u
         ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 100`
    );

    res.json({
      success: true,
      count: result.rows.length,
      logs: result.rows,
    });
  } catch (error) {
    console.error("Get audit logs error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error while fetching audit logs.",
    });
  }
});

module.exports = router;