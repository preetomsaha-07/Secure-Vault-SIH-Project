const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { createAuditLog } = require("../utils/auditLogger");
const pool = require("../db/pool");

const router = express.Router();

if (process.env.NODE_ENV !== "production") {
  router.get("/test", (req, res) => {
    res.json({
      success: true,
      message: "Auth routes are loaded correctly!",
    });
  });
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, status, created_at`,
      [normalizedName, normalizedEmail, hashedPassword, "Clerk"]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const emailValue = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    if (!emailValue || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password, role, status
       FROM users
       WHERE email = $1`,
      [emailValue]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    try {
      await createAuditLog({
        userId: user.id,
        action: "LOGIN",
        resourceType: "USER",
        resourceId: user.id,
        details: "Successful user login",
      });
    } catch (auditError) {
      console.error("LOGIN AUDIT ERROR:", auditError.message);
    }

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// CURRENT USER
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// ADMIN ONLY
router.get(
  "/admin-only",
  authenticateToken,
  authorizeRoles("Administrator"),
  (req, res) => {
    res.json({
      success: true,
      message: "Administrator access granted.",
      user: req.user,
    });
  }
);

module.exports = router;