const express = require("express");
const bcrypt = require("bcryptjs");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { createAuditLog } = require("../utils/auditLogger");
const pool = require("../db/pool");

const router = express.Router();

// ==========================================
// GET ALL USERS
// Administrator only
// ==========================================

router.get(
  "/",
  authenticateToken,
  authorizeRoles("Administrator"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           u.role,
           u.status,
           u.created_at,
           (
             SELECT MAX(a.created_at)
             FROM audit_logs a
             WHERE a.user_id = u.id
               AND a.action = 'LOGIN'
           ) AS last_login
         FROM users u
         ORDER BY u.created_at DESC`
      );

      res.json({
        success: true,
        count: result.rows.length,
        users: result.rows,
      });
    } catch (error) {
      console.error(
        "Get users error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while fetching users.",
      });
    }
  }
);

// ==========================================
// CREATE USER
// Administrator only
// ==========================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles("Administrator"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        status,
      } = req.body;

      const normalizedName = String(name || "").trim();
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedName || !normalizedEmail || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long.",
        });
      }

      const allowedRoles = [
        "Administrator",
        "Investigation Officer",
        "Reviewer",
        "Clerk",
      ];

      const selectedRole =
        role || "Clerk";

      if (
        !allowedRoles.includes(
          selectedRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role.",
        });
      }

      const selectedStatus =
        status || "Active";

      if (
        !["Active", "Inactive"].includes(
          selectedStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user status.",
        });
      }

      const existingUser =
        await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [normalizedEmail]
        );

      if (
        existingUser.rows.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      const result =
        await pool.query(
          `INSERT INTO users
           (
             name,
             email,
             password,
             role,
             status
           )
           VALUES ($1, $2, $3, $4, $5)
           RETURNING
             id,
             name,
             email,
             role,
             status,
             created_at`,
          [
            normalizedName,
            normalizedEmail,
            hashedPassword,
            selectedRole,
            selectedStatus,
          ]
        );

      const newUser =
        result.rows[0];

      await createAuditLog({
        userId: req.user.id,
        action: "USER_CREATED",
        resourceType: "USER",
        resourceId: newUser.id,
        details:
          `User ${newUser.email} created ` +
          `with role ${newUser.role}`,
      });

      res.status(201).json({
        success: true,
        message:
          "User created successfully.",
        user: newUser,
      });
    } catch (error) {
      console.error(
        "Create user error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while creating user.",
      });
    }
  }
);

module.exports = router;