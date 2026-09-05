import { useEffect, useState } from "react";

function AccessControl() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("securevault_token");

        const response = await fetch("/api/access-control/permissions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load access control permissions."
          );
        }

        setPermissions(data.permissions || []);
      } catch (err) {
        setError(err.message || "Failed to load permissions.");
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const PermissionIcon = ({ allowed }) => (
    <span className={allowed ? "permission-yes" : "permission-no"}>
      {allowed ? "✓" : "✕"}
    </span>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Access Control</h1>
          <p>
            Control what each user role can do inside SecureVault.
          </p>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={() =>
            alert(
              "Role creation is currently managed by the system administrator."
            )
          }
        >
          + Create Role
        </button>
      </div>

      <div className="security-info">
        <div>
          <h3>Role-Based Access Control</h3>
          <p>
            Users can access only the actions allowed by their assigned role.
          </p>
        </div>

        <div className="rbac-badge">RBAC Enabled</div>
      </div>

      {loading && (
        <div className="security-note">
          Loading permission policy...
        </div>
      )}

      {error && (
        <div className="security-note">
          <strong>Access Control Error:</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="permission-table">
          <div className="permission-row permission-header">
            <span>Role</span>
            <span>View</span>
            <span>Upload</span>
            <span>Download</span>
            <span>Edit</span>
            <span>Delete</span>
          </div>

          {permissions.map((item) => (
            <div className="permission-row" key={item.role}>
              <strong>{item.role}</strong>

              <PermissionIcon allowed={item.view} />

              <PermissionIcon allowed={item.upload} />

              <PermissionIcon allowed={item.download} />

              <PermissionIcon allowed={item.edit} />

              <PermissionIcon allowed={item.delete} />
            </div>
          ))}
        </div>
      )}

      <div className="security-note">
        <strong>Security Policy:</strong>
        <p>
          Every sensitive request is checked against the authenticated
          user's role and permission before the operation is performed.
        </p>
      </div>
    </div>
  );
}

export default AccessControl;