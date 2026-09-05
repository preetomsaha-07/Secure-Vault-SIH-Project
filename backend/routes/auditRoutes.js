const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const pool = require("../db/pool");

const router = express.Router();

// ==========================================
// GET AUDIT LOGS
// ==========================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("Administrator"),
  async (req, res) => {
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
  }
);

module.exports = router;