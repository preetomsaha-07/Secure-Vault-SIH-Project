import { useEffect, useMemo, useState } from "react";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD REAL AUDIT LOGS
  // ==========================================

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem(
          "secureVaultToken"
        );

        const response = await fetch("/api/audit", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load audit logs."
          );
        }

        setLogs(data.logs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  // ==========================================
  // FILTER LOGS
  // ==========================================

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        (log.user_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (log.user_email || "")
          .toLowerCase()
          .includes(searchText) ||
        (log.action || "")
          .toLowerCase()
          .includes(searchText) ||
        (log.details || "")
          .toLowerCase()
          .includes(searchText) ||
        String(log.resource_id || "")
          .includes(searchText);

      const matchesAction =
        actionFilter === "All Actions" ||
        log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const totalEvents = logs.length;

  const views = logs.filter(
    (log) =>
      log.action === "VIEW" ||
      log.action === "DOCUMENT_VIEWED"
  ).length;

  const uploads = logs.filter(
    (log) =>
      log.action === "UPLOAD" ||
      log.action === "DOCUMENT_UPLOADED"
  ).length;

  const downloads = logs.filter(
    (log) =>
      log.action === "DOWNLOAD" ||
      log.action === "DOCUMENT_DOWNLOADED"
  ).length;

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>

          <p>
            Track every important activity performed in
            SecureVault.
          </p>
        </div>

        <button className="primary-btn">
          Export Logs
        </button>
      </div>

      {/* SUMMARY */}

      <div className="audit-summary">

        <div className="stat-card">
          <h3>Total Events</h3>
          <p>{totalEvents}</p>
        </div>

        <div className="stat-card">
          <h3>Views</h3>
          <p>{views}</p>
        </div>

        <div className="stat-card">
          <h3>Uploads</h3>
          <p>{uploads}</p>
        </div>

        <div className="stat-card">
          <h3>Downloads</h3>
          <p>{downloads}</p>
        </div>

      </div>

      {/* TOOLBAR */}

      <div className="audit-toolbar">

        <input
          className="search-input"
          type="text"
          placeholder="Search audit logs..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          className="filter-select"
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value)
          }
        >
          <option>All Actions</option>
          <option>LOGIN</option>
          <option>CASE_CREATED</option>
          <option>DOCUMENT_UPLOADED</option>
          <option>DOCUMENT_DOWNLOADED</option>
          <option>VIEW</option>
          <option>UPLOAD</option>
          <option>DOWNLOAD</option>
          <option>DELETE</option>
        </select>

      </div>

      {/* ERROR */}

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="stat-card">
          <p>Loading audit logs...</p>
        </div>
      ) : (

        <div className="audit-table">

          <div className="audit-row audit-header">
            <span>User</span>
            <span>Role</span>
            <span>Action</span>
            <span>Resource</span>
            <span>ID</span>
            <span>Time</span>
          </div>

          {filteredLogs.length === 0 ? (

            <div className="audit-row">
              <span>No audit logs found.</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>

          ) : (

            filteredLogs.map((log) => (

              <div
                className="audit-row"
                key={log.id}
              >
                <span>
                  {log.user_name || "Unknown User"}
                </span>

                <span>
                  {log.user_role || "—"}
                </span>

                <span>
                  <strong
                    className={`action-${(
                      log.action || ""
                    ).toLowerCase()}`}
                  >
                    {log.action || "—"}
                  </strong>
                </span>

                <span>
                  {log.resource_type || "—"}
                </span>

                <span>
                  {log.resource_id || "—"}
                </span>

                <span>
                  {formatDateTime(
                    log.created_at
                  )}
                </span>

              </div>

            ))

          )}

        </div>

      )}

    </div>
  );
}

export default AuditLogs;