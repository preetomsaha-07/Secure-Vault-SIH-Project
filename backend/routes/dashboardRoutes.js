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
// DASHBOARD SUMMARY + RECENT ACTIVITY
// ==========================================

router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const casesResult = await pool.query(
      "SELECT COUNT(*)::int AS total_cases FROM cases"
    );

    const documentsResult = await pool.query(
      "SELECT COUNT(*)::int AS total_documents FROM documents"
    );

    const auditResult = await pool.query(
      "SELECT COUNT(*)::int AS total_audit_events FROM audit_logs"
    );

    const activityResult = await pool.query(
      `SELECT
         a.id,
         a.action,
         a.resource_type,
         a.resource_id,
         a.details,
         a.created_at,
         u.name AS user_name,
         u.role AS user_role
       FROM audit_logs a
       LEFT JOIN users u
         ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,

      summary: {
        totalCases: casesResult.rows[0].total_cases,
        totalDocuments:
          documentsResult.rows[0].total_documents,
        auditEvents:
          auditResult.rows[0].total_audit_events,
      },

      recentActivity: activityResult.rows,
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while loading dashboard summary.",
    });
  }
});

module.exports = router;