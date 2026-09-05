const ROLE_PERMISSIONS = {
  Administrator: {
    view: true,
    upload: true,
    download: true,
    edit: true,
    delete: true,
  },

  "Investigation Officer": {
    view: true,
    upload: true,
    download: true,
    edit: true,
    delete: false,
  },

  Reviewer: {
    view: true,
    upload: false,
    download: true,
    edit: true,
    delete: false,
  },

  Clerk: {
    view: true,
    upload: true,
    download: false,
    edit: false,
    delete: false,
  },
};

function authorizePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const role = req.user.role;
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) {
      return res.status(403).json({
        success: false,
        message: "No permission policy found for this role.",
      });
    }

    if (!permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`,
      });
    }

    next();
  };
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || null;
}

function getAllPermissions() {
  return ROLE_PERMISSIONS;
}

module.exports = {
  ROLE_PERMISSIONS,
  authorizePermission,
  getRolePermissions,
  getAllPermissions,
};