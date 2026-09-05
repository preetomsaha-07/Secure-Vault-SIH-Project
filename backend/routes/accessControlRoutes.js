const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
  getAllPermissions,
  getRolePermissions,
} = require("../middleware/permissionMiddleware");

router.get(
  "/permissions",
  authenticateToken,
  authorizeRoles("Administrator"),
  (req, res) => {
    const permissions = Object.entries(getAllPermissions()).map(
      ([role, values]) => ({
        role,
        ...values,
      })
    );

    res.json({
      success: true,
      permissions,
    });
  }
);

router.get(
  "/permissions/:role",
  authenticateToken,
  authorizeRoles("Administrator"),
  (req, res) => {
    const role = req.params.role;

    const permissions = getRolePermissions(role);

    if (!permissions) {
      return res.status(404).json({
        success: false,
        message: "Role not found.",
      });
    }

    res.json({
      success: true,
      role,
      permissions,
    });
  }
);

module.exports = router;