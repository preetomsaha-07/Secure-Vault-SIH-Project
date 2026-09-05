const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  authorizePermission,
} = require("../middleware/permissionMiddleware");

const { createAuditLog } = require("../utils/auditLogger");
const pool = require("../db/pool");

// =====================================================
// GET ALL CASES
// GET /api/cases
// Permission: view
// =====================================================

router.get(
  "/",
  authenticateToken,
  authorizePermission("view"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          c.id,
          c.case_number,
          c.title,
          c.description,
          c.status,
          c.created_by,
          c.created_at,
          u.name AS created_by_name,
          u.email AS created_by_email
        FROM cases c
        LEFT JOIN users u
          ON c.created_by = u.id
        ORDER BY c.created_at DESC
      `);

      res.status(200).json({
        success: true,
        count: result.rows.length,
        cases: result.rows,
      });
    } catch (error) {
      console.error("GET CASES ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to load cases.",
      });
    }
  }
);

// =====================================================
// GET SINGLE CASE
// GET /api/cases/:id
// Permission: view
// =====================================================

router.get(
  "/:id",
  authenticateToken,
  authorizePermission("view"),
  async (req, res) => {
    try {
      const caseId = Number(req.params.id);

      if (!Number.isInteger(caseId) || caseId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid case ID.",
        });
      }

      const result = await pool.query(
        `
        SELECT
          c.id,
          c.case_number,
          c.title,
          c.description,
          c.status,
          c.created_by,
          c.created_at,
          u.name AS created_by_name,
          u.email AS created_by_email
        FROM cases c
        LEFT JOIN users u
          ON c.created_by = u.id
        WHERE c.id = $1
        `,
        [caseId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Case not found.",
        });
      }

      res.status(200).json({
        success: true,
        case: result.rows[0],
      });
    } catch (error) {
      console.error("GET SINGLE CASE ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to load case.",
      });
    }
  }
);

// =====================================================
// CREATE CASE
// POST /api/cases
// Permission: edit
// =====================================================

router.post(
  "/",
  authenticateToken,
  authorizePermission("edit"),
  async (req, res) => {
    try {
      const {
        case_number,
        title,
        description,
        status,
      } = req.body;

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!case_number || !String(case_number).trim()) {
        return res.status(400).json({
          success: false,
          message: "Case number is required.",
        });
      }

      if (!title || !String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Case title is required.",
        });
      }

      const cleanCaseNumber =
        String(case_number).trim();

      const cleanTitle =
        String(title).trim();

      const cleanDescription =
        description !== undefined &&
        description !== null
          ? String(description).trim()
          : "";

      const cleanStatus =
        status && String(status).trim()
          ? String(status).trim()
          : "Open";

      // -----------------------------------------------
      // CHECK DUPLICATE CASE NUMBER
      // -----------------------------------------------

      const existingCase =
        await pool.query(
          `
          SELECT id
          FROM cases
          WHERE case_number = $1
          `,
          [cleanCaseNumber]
        );

      if (existingCase.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "A case with this case number already exists.",
        });
      }

      // -----------------------------------------------
      // CREATE CASE
      // -----------------------------------------------

      const result =
        await pool.query(
          `
          INSERT INTO cases
          (
            case_number,
            title,
            description,
            status,
            created_by
          )
          VALUES
          ($1, $2, $3, $4, $5)
          RETURNING
            id,
            case_number,
            title,
            description,
            status,
            created_by,
            created_at
          `,
          [
            cleanCaseNumber,
            cleanTitle,
            cleanDescription,
            cleanStatus,
            req.user.id,
          ]
        );

      const newCase = result.rows[0];

      // -----------------------------------------------
      // AUDIT LOG
      // -----------------------------------------------

      try {
        await createAuditLog({
          userId: req.user.id,
          action: "CASE_CREATED",
          resourceType: "CASE",
          resourceId: newCase.id,
          details:
            `Case ${newCase.case_number} created by ` +
            `${req.user.email || "user " + req.user.id}`,
        });
      } catch (auditError) {
        console.error(
          "CASE CREATED AUDIT ERROR:",
          auditError.message
        );
      }

      res.status(201).json({
        success: true,
        message: "Case created successfully.",
        case: newCase,
      });
    } catch (error) {
      console.error("CREATE CASE ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create case.",
      });
    }
  }
);

// =====================================================
// UPDATE CASE
// PUT /api/cases/:id
// Permission: edit
// =====================================================

router.put(
  "/:id",
  authenticateToken,
  authorizePermission("edit"),
  async (req, res) => {
    try {
      const caseId = Number(req.params.id);

      if (!Number.isInteger(caseId) || caseId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid case ID.",
        });
      }

      const {
        case_number,
        title,
        description,
        status,
      } = req.body;

      // -----------------------------------------------
      // CHECK EXISTING CASE
      // -----------------------------------------------

      const existingCase =
        await pool.query(
          `
          SELECT
            id,
            case_number,
            title,
            description,
            status
          FROM cases
          WHERE id = $1
          `,
          [caseId]
        );

      if (existingCase.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Case not found.",
        });
      }

      const currentCase =
        existingCase.rows[0];

      // -----------------------------------------------
      // BUILD UPDATED VALUES
      // -----------------------------------------------

      const updatedCaseNumber =
        case_number !== undefined
          ? String(case_number).trim()
          : currentCase.case_number;

      const updatedTitle =
        title !== undefined
          ? String(title).trim()
          : currentCase.title;

      const updatedDescription =
        description !== undefined
          ? String(description).trim()
          : currentCase.description;

      const updatedStatus =
        status !== undefined
          ? String(status).trim()
          : currentCase.status;

      if (!updatedCaseNumber) {
        return res.status(400).json({
          success: false,
          message: "Case number is required.",
        });
      }

      if (!updatedTitle) {
        return res.status(400).json({
          success: false,
          message: "Case title is required.",
        });
      }

      // -----------------------------------------------
      // CHECK DUPLICATE CASE NUMBER
      // -----------------------------------------------

      const duplicateCase =
        await pool.query(
          `
          SELECT id
          FROM cases
          WHERE case_number = $1
          AND id <> $2
          `,
          [
            updatedCaseNumber,
            caseId,
          ]
        );

      if (duplicateCase.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Another case already uses this case number.",
        });
      }

      // -----------------------------------------------
      // UPDATE CASE
      // -----------------------------------------------

      const result =
        await pool.query(
          `
          UPDATE cases
          SET
            case_number = $1,
            title = $2,
            description = $3,
            status = $4
          WHERE id = $5
          RETURNING
            id,
            case_number,
            title,
            description,
            status,
            created_by,
            created_at
          `,
          [
            updatedCaseNumber,
            updatedTitle,
            updatedDescription,
            updatedStatus,
            caseId,
          ]
        );

      const updatedCase =
        result.rows[0];

      // -----------------------------------------------
      // AUDIT LOG
      // -----------------------------------------------

      try {
        await createAuditLog({
          userId: req.user.id,
          action: "CASE_UPDATED",
          resourceType: "CASE",
          resourceId: updatedCase.id,
          details:
            `Case ${updatedCase.case_number} updated by ` +
            `${req.user.email || "user " + req.user.id}`,
        });
      } catch (auditError) {
        console.error(
          "CASE UPDATED AUDIT ERROR:",
          auditError.message
        );
      }

      res.status(200).json({
        success: true,
        message: "Case updated successfully.",
        case: updatedCase,
      });
    } catch (error) {
      console.error("UPDATE CASE ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update case.",
      });
    }
  }
);

// =====================================================
// DELETE CASE
// DELETE /api/cases/:id
// Permission: delete
// =====================================================

router.delete(
  "/:id",
  authenticateToken,
  authorizePermission("delete"),
  async (req, res) => {
    try {
      const caseId = Number(req.params.id);

      if (!Number.isInteger(caseId) || caseId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid case ID.",
        });
      }

      // -----------------------------------------------
      // CHECK CASE EXISTS
      // -----------------------------------------------

      const existingCase =
        await pool.query(
          `
          SELECT
            id,
            case_number
          FROM cases
          WHERE id = $1
          `,
          [caseId]
        );

      if (existingCase.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Case not found.",
        });
      }

      const caseInfo =
        existingCase.rows[0];

      // -----------------------------------------------
      // CHECK RELATED DOCUMENTS
      // -----------------------------------------------

      const documentCheck =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count
          FROM documents
          WHERE case_id = $1
          `,
          [caseId]
        );

      const documentCount =
        documentCheck.rows[0].count;

      if (documentCount > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This case cannot be deleted because it contains related documents.",
        });
      }

      // -----------------------------------------------
      // DELETE CASE
      // -----------------------------------------------

      await pool.query(
        `
        DELETE FROM cases
        WHERE id = $1
        `,
        [caseId]
      );

      // -----------------------------------------------
      // AUDIT LOG
      // -----------------------------------------------

      try {
        await createAuditLog({
          userId: req.user.id,
          action: "CASE_DELETED",
          resourceType: "CASE",
          resourceId: caseInfo.id,
          details:
            `Case ${caseInfo.case_number} deleted by ` +
            `${req.user.email || "user " + req.user.id}`,
        });
      } catch (auditError) {
        console.error(
          "CASE DELETED AUDIT ERROR:",
          auditError.message
        );
      }

      res.status(200).json({
        success: true,
        message: "Case deleted successfully.",
      });
    } catch (error) {
      console.error("DELETE CASE ERROR:", error);

      res.status(500).json({
        success: false,
        message:
          "Failed to delete case.",
      });
    }
  }
);

module.exports = router;