import React, { useCallback, useEffect, useMemo, useState } from "react";
import AuditLogs from "./AuditLogs";
import Users from "./Users";
import AccessControl from "./AccessControl";
import "./App.css";

const TOKEN_KEY = "securevault_token";
const USER_KEY = "securevault_user";

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setLoginError("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      const loginToken = data.token;
      const user = data.user;

      if (!loginToken) {
        throw new Error("Login succeeded but no token was returned.");
      }

      localStorage.setItem(TOKEN_KEY, loginToken);

      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      setToken(loginToken);
      setCurrentUser(user || null);

      setPassword("");
      setActivePage("dashboard");
    } catch (error) {
      setLoginError(
        error.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setToken("");
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setLoginError("");
    setActivePage("dashboard");
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-background-shape login-shape-one"></div>
        <div className="login-background-shape login-shape-two"></div>

        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-icon">🔐</div>

            <h1 className="login-logo">SecureVault</h1>

            <p className="login-subtitle">
              Secure Digital Evidence Management
            </p>
          </div>

          <div className="login-security-badge">
            <span className="security-dot"></span>
            Secure Authentication Portal
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email">Email Address</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon">✉</span>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="login-input"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon">●</span>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="login-input"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="login-error">
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="login-button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <div className="login-security-items">
              <span>✓ Encrypted</span>
              <span>✓ Authorized Users</span>
              <span>✓ Audited</span>
            </div>

            <p className="login-copyright">
              SecureVault Security Platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainApplication
      token={token}
      currentUser={currentUser}
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={handleLogout}
      dashboardRefreshKey={dashboardRefreshKey}
      refreshDashboard={() =>
        setDashboardRefreshKey((value) => value + 1)
      }
    />
  );
}

function MainApplication({
  token,
  currentUser,
  activePage,
  setActivePage,
  onLogout,
  dashboardRefreshKey,
  refreshDashboard,
}) {
  const displayName =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const displayRole = currentUser?.role || "User";

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <main className="main-content">
        <TopBar
          currentUser={currentUser}
          onLogout={onLogout}
        />

        <div className="content-container">
          {activePage === "dashboard" && (
            <Dashboard
              token={token}
              currentUser={currentUser}
              dashboardRefreshKey={dashboardRefreshKey}
              refreshDashboard={refreshDashboard}
            />
          )}

          {activePage === "cases" && (
            <Cases
              token={token}
              currentUser={currentUser}
              refreshDashboard={refreshDashboard}
            />
          )}

          {activePage === "documents" && (
            <Documents
              token={token}
              currentUser={currentUser}
              refreshDashboard={refreshDashboard}
            />
          )}

          {activePage === "audit" && (
            <AuditLogs />
          )}

          {activePage === "users" && (
            <Users />
          )}

          {activePage === "access" && (
            <AccessControl />
          )}

          {activePage === "settings" && (
            <SettingsPage
              currentUser={currentUser}
              displayName={displayName}
              displayRole={displayRole}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function Sidebar({
  activePage,
  setActivePage,
  currentUser,
  onLogout,
}) {
  const role = currentUser?.role || "";

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "▦",
    },
    {
      id: "cases",
      label: "Cases",
      icon: "◈",
    },
    {
      id: "documents",
      label: "Documents",
      icon: "▤",
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: "◉",
    },
    {
      id: "users",
      label: "Users",
      icon: "♙",
      adminOnly: true,
    },
    {
      id: "access",
      label: "Access Control",
      icon: "⚿",
      adminOnly: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🔐</div>

        <div>
          <div className="sidebar-brand-name">
            SecureVault
          </div>

          <div className="sidebar-brand-subtitle">
            Security Platform
          </div>
        </div>
      </div>

      <div className="sidebar-section-label">
        MAIN MENU
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
          if (item.adminOnly && role !== "Administrator") {
            return null;
          }

          const active =
            activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${
                active ? "active" : ""
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="sidebar-nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar">
          {(currentUser?.name || "U")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="sidebar-user-info">
          <strong>
            {currentUser?.name || "User"}
          </strong>

          <span>
            {currentUser?.role || "User"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-logout"
        onClick={onLogout}
      >
        <span>↪</span>
        Sign Out
      </button>
    </aside>
  );
}

/* =========================================================
   TOP BAR
   ========================================================= */

function TopBar({
  currentUser,
  onLogout,
}) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">
          SecureVault
        </div>

        <div className="topbar-subtitle">
          Secure Digital Evidence Management System
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-security-status">
          <span className="topbar-status-dot"></span>
          System Secure
        </div>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {(currentUser?.name || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="topbar-user-info">
            <strong>
              {currentUser?.name || "User"}
            </strong>

            <span>
              {currentUser?.role || "User"}
            </span>
          </div>

          <button
            type="button"
            className="topbar-logout"
            onClick={onLogout}
            title="Sign out"
          >
            ↪
          </button>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  token,
  currentUser,
  dashboardRefreshKey,
}) {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalDocuments: 0,
    totalUsers: 0,
    totalAuditLogs: 0,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load dashboard."
          );
        }

        if (cancelled) {
          return;
        }

        const summary =
          data.summary || data.stats || data;

        setStats({
          totalCases:
            summary.totalCases ??
            summary.total_cases ??
            0,

          totalDocuments:
            summary.totalDocuments ??
            summary.total_documents ??
            0,

          totalUsers:
            summary.totalUsers ??
            summary.total_users ??
            0,

          totalAuditLogs:
            summary.totalAuditLogs ??
            summary.totalAuditLogsCount ??
            summary.total_audit_logs ??
            summary.auditEvents ??
            summary.total_audit_events ??
            0,
        });

        setRecentActivity(
          Array.isArray(data.recentActivity)
            ? data.recentActivity
            : Array.isArray(data.recent_activity)
            ? data.recent_activity
            : []
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError.message ||
              "Failed to load dashboard."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token, dashboardRefreshKey]);

  return (
    <div className="page">
      <div className="page-header dashboard-header">
        <div>
          <p className="eyebrow">
            SECURITY OVERVIEW
          </p>

          <h1>
            Welcome back,{" "}
            {currentUser?.name || "User"}
          </h1>

          <p>
            Monitor cases, documents and security
            activity from one place.
          </p>
        </div>

        <div className="dashboard-secure-badge">
          <span>●</span>
          All systems operational
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <strong>Dashboard Error</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="stat-grid">
        <DashboardStatCard
          label="Total Cases"
          value={
            loading
              ? "—"
              : stats.totalCases
          }
          icon="◈"
          description="Registered cases"
        />

        <DashboardStatCard
          label="Documents"
          value={
            loading
              ? "—"
              : stats.totalDocuments
          }
          icon="▤"
          description="Secured documents"
        />

        <DashboardStatCard
          label="Users"
          value={
            loading
              ? "—"
              : stats.totalUsers
          }
          icon="♙"
          description="System users"
        />

        <DashboardStatCard
          label="Audit Events"
          value={
            loading
              ? "—"
              : stats.totalAuditLogs
          }
          icon="◉"
          description="Recorded activities"
        />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Recent Activity</h2>
              <p>
                Latest security and system events
              </p>
            </div>

            <span className="panel-badge">
              Live Data
            </span>
          </div>

          <div className="activity-list">
            {!loading &&
              recentActivity.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    ◉
                  </div>

                  <strong>
                    No recent activity
                  </strong>

                  <span>
                    Activity will appear here as
                    users interact with SecureVault.
                  </span>
                </div>
              )}

            {recentActivity.map((item, index) => (
              <ActivityItem
                key={
                  item.id ||
                  `${item.action}-${index}`
                }
                item={item}
              />
            ))}
          </div>
        </section>

        <section className="dashboard-panel security-panel">
          <div className="panel-header">
            <div>
              <h2>Security Status</h2>
              <p>
                Current protection controls
              </p>
            </div>

            <span className="security-ok">
              Protected
            </span>
          </div>

          <div className="security-check-list">
            <SecurityCheck
              label="JWT Authentication"
            />

            <SecurityCheck
              label="Role-Based Access Control"
            />

            <SecurityCheck
              label="AES-256-GCM Encryption"
            />

            <SecurityCheck
              label="Audit Logging"
            />

            <SecurityCheck
              label="Security Headers"
            />

            <SecurityCheck
              label="Rate Limiting"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardStatCard({
  label,
  value,
  icon,
  description,
}) {
  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-top">
        <div>
          <span className="dashboard-stat-label">
            {label}
          </span>

          <strong className="dashboard-stat-value">
            {value}
          </strong>
        </div>

        <div className="dashboard-stat-icon">
          {icon}
        </div>
      </div>

      <span className="dashboard-stat-description">
        {description}
      </span>
    </div>
  );
}

function ActivityItem({ item }) {
  const action =
    item.action || "ACTIVITY";

  const description =
    item.details ||
    item.message ||
    `${action.replaceAll("_", " ")} activity`;

  const time =
    item.created_at ||
    item.createdAt ||
    item.timestamp;

  return (
    <div className="activity-item">
      <div className="activity-icon">
        ✓
      </div>

      <div className="activity-content">
        <strong>
          {action.replaceAll("_", " ")}
        </strong>

        <span>{description}</span>

        {time && (
          <small>
            {formatDateTime(time)}
          </small>
        )}
      </div>
    </div>
  );
}

function SecurityCheck({ label }) {
  return (
    <div className="security-check">
      <div className="security-check-icon">
        ✓
      </div>

      <span>{label}</span>

      <strong>Active</strong>
    </div>
  );
}

/* =========================================================
   CASES
   ========================================================= */

function Cases({
  token,
  currentUser,
  refreshDashboard,
}) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [form, setForm] = useState({
    case_number: "",
    title: "",
    description: "",
    status: "Open",
  });

  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] =
    useState("");

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/cases",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load cases."
        );
      }

      setCases(
        Array.isArray(data.cases)
          ? data.cases
          : []
      );
    } catch (loadError) {
      setError(
        loadError.message ||
          "Failed to load cases."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filteredCases = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return cases;
    }

    return cases.filter((item) => {
      return [
        item.case_number,
        item.title,
        item.description,
        item.status,
        item.created_by_name,
        item.created_by_email,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [cases, search]);

  const handleCreateCase = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateMessage("");
      setError("");

      const response = await fetch(
        "/api/cases",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create case."
        );
      }

      setCreateMessage(
        "Case created successfully."
      );

      setForm({
        case_number: "",
        title: "",
        description: "",
        status: "Open",
      });

      setShowCreateForm(false);

      await loadCases();
      refreshDashboard?.();
    } catch (createError) {
      setCreateMessage(
        createError.message ||
          "Failed to create case."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            CASE MANAGEMENT
          </p>

          <h1>Cases</h1>

          <p>
            Manage investigations and secure
            case records.
          </p>
        </div>

        {canEditCases(currentUser) && (
          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              setShowCreateForm((value) => !value)
            }
          >
            {showCreateForm
              ? "Close"
              : "+ Create Case"}
          </button>
        )}
      </div>

      {showCreateForm && (
        <section className="form-panel">
          <div className="panel-header">
            <div>
              <h2>Create New Case</h2>
              <p>
                Add a new secure case record.
              </p>
            </div>
          </div>

          <form
            className="case-form"
            onSubmit={handleCreateCase}
          >
            <div className="form-grid">
              <div className="form-group">
                <label>
                  Case Number
                </label>

                <input
                  value={form.case_number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      case_number:
                        event.target.value,
                    }))
                  }
                  placeholder="CASE-2026-011"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Title
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title:
                        event.target.value,
                    }))
                  }
                  placeholder="Investigation title"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status:
                        event.target.value,
                    }))
                  }
                >
                  <option value="Open">
                    Open
                  </option>

                  <option value="Under Investigation">
                    Under Investigation
                  </option>

                  <option value="Under Review">
                    Under Review
                  </option>

                  <option value="Approved">
                    Approved
                  </option>

                  <option value="Closed">
                    Closed
                  </option>
                </select>
              </div>

              <div className="form-group form-group-wide">
                <label>
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Case description..."
                  rows="4"
                />
              </div>
            </div>

            {createMessage && (
              <div className="inline-message">
                {createMessage}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setShowCreateForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn"
                disabled={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create Case"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search cases..."
          />
        </div>

        <div className="toolbar-meta">
          {filteredCases.length} case
          {filteredCases.length !== 1
            ? "s"
            : ""}
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <strong>Case Error</strong>
          <span>{error}</span>

          <button
            type="button"
            className="small-btn"
            onClick={loadCases}
          >
            Retry
          </button>
        </div>
      )}

      <section className="table-panel">
        {loading ? (
          <LoadingState
            text="Loading cases..."
          />
        ) : filteredCases.length === 0 ? (
          <EmptyState
            title="No cases found"
            description="No case records match your search."
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {filteredCases.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.case_number}
                      </strong>
                    </td>

                    <td>
                      <div className="table-primary">
                        {item.title}
                      </div>

                      {item.description && (
                        <div className="table-secondary">
                          {truncate(
                            item.description,
                            75
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${statusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Open"}
                      </span>
                    </td>

                    <td>
                      {item.created_by_name ||
                        item.created_by_email ||
                        "—"}
                    </td>

                    <td>
                      {formatDateTime(
                        item.created_at
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   DOCUMENTS
   ========================================================= */

function Documents({
  token,
  currentUser,
  refreshDashboard,
}) {
  const [documents, setDocuments] =
    useState([]);

  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] =
    useState("all");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [selectedCase, setSelectedCase] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const loadDocuments = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/documents",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load documents."
          );
        }

        setDocuments(
          Array.isArray(data.documents)
            ? data.documents
            : []
        );
      } catch (loadError) {
        setError(
          loadError.message ||
            "Failed to load documents."
        );
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const loadCasesForUpload =
    useCallback(async () => {
      try {
        const response = await fetch(
          "/api/cases",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setCases(
            Array.isArray(data.cases)
              ? data.cases
              : []
          );
        }
      } catch {
        // Upload remains usable; the main error
        // is shown when upload is attempted.
      }
    }, [token]);

  useEffect(() => {
    loadDocuments();
    loadCasesForUpload();
  }, [
    loadDocuments,
    loadCasesForUpload,
  ]);

  const filteredDocuments = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return documents.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.file_name,
          item.file_type,
          item.case_number,
          item.case_title,
          item.uploaded_by_name,
          item.uploaded_by_email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesCase =
        caseFilter === "all" ||
        String(item.case_id) ===
          String(caseFilter);

      return (
        matchesSearch &&
        matchesCase
      );
    });
  }, [
    documents,
    search,
    caseFilter,
  ]);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage(
        "Please select a file first."
      );
      return;
    }

    if (!selectedCase) {
      setUploadMessage(
        "Please select a case."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");
      setError("");

      const formData = new FormData();

      formData.append(
        "document",
        selectedFile
      );

      formData.append(
        "case_id",
        selectedCase
      );

      const response = await fetch(
        "/api/documents/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Document upload failed."
        );
      }

      setUploadMessage(
        "Document uploaded and encrypted successfully."
      );

      setSelectedFile(null);
      setSelectedCase("");

      const fileInput =
        document.getElementById(
          "document-upload-input"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();
      refreshDashboard?.();
    } catch (uploadError) {
      setUploadMessage(
        uploadError.message ||
          "Document upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (
    documentItem
  ) => {
    try {
      const response = await fetch(
        `/api/documents/${documentItem.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Unable to download document.";

        try {
          const data =
            await response.json();

          message =
            data.message || message;
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const objectUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = objectUrl;

      link.download =
        documentItem.file_name ||
        "document";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        objectUrl
      );

      refreshDashboard?.();
    } catch (downloadError) {
      setError(
        downloadError.message ||
          "Unable to download document."
      );
    }
  };

  const canUpload =
    currentUser?.role ===
      "Administrator" ||
    currentUser?.role ===
      "Investigation Officer" ||
    currentUser?.role === "Clerk";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            SECURE DOCUMENTS
          </p>

          <h1>Documents</h1>

          <p>
            Store, manage and securely retrieve
            encrypted evidence files.
          </p>
        </div>
      </div>

      {canUpload && (
        <section className="form-panel document-upload-panel">
          <div className="panel-header">
            <div>
              <h2>Upload Document</h2>

              <p>
                Files are encrypted before secure
                storage.
              </p>
            </div>

            <span className="panel-badge">
              AES-256-GCM
            </span>
          </div>

          <form
            className="document-upload-form"
            onSubmit={handleUpload}
          >
            <div className="form-group">
              <label>
                Case
              </label>

              <select
                value={selectedCase}
                onChange={(event) =>
                  setSelectedCase(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select a case
                </option>

                {cases.map((caseItem) => (
                  <option
                    key={caseItem.id}
                    value={caseItem.id}
                  >
                    {caseItem.case_number} —{" "}
                    {caseItem.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Document
              </label>

              <input
                id="document-upload-input"
                type="file"
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files?.[0] ||
                      null
                  )
                }
                required
              />

              <small>
                Maximum size: 10 MB
              </small>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={uploading}
            >
              {uploading
                ? "Encrypting..."
                : "Upload & Encrypt"}
            </button>
          </form>

          {uploadMessage && (
            <div className="inline-message">
              {uploadMessage}
            </div>
          )}
        </section>
      )}

      <div className="toolbar document-toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search documents..."
          />
        </div>

        <select
          className="filter-select"
          value={caseFilter}
          onChange={(event) =>
            setCaseFilter(event.target.value)
          }
        >
          <option value="all">
            All Cases
          </option>

          {cases.map((caseItem) => (
            <option
              key={caseItem.id}
              value={caseItem.id}
            >
              {caseItem.case_number}
            </option>
          ))}
        </select>

        <div className="toolbar-meta">
          {filteredDocuments.length} document
          {filteredDocuments.length !== 1
            ? "s"
            : ""}
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <strong>Document Error</strong>
          <span>{error}</span>

          <button
            type="button"
            className="small-btn"
            onClick={loadDocuments}
          >
            Retry
          </button>
        </div>
      )}

      <section className="table-panel">
        {loading ? (
          <LoadingState
            text="Loading documents..."
          />
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="No documents match your current filters."
          />
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Case</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="document-name-cell">
                          <div className="document-file-icon">
                            {getFileIcon(
                              item.file_type
                            )}
                          </div>

                          <div>
                            <strong>
                              {item.file_name}
                            </strong>

                            <span>
                              ID #{item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {item.case_number ||
                          `Case #${item.case_id}`}
                      </td>

                      <td>
                        {item.file_type ||
                          "—"}
                      </td>

                      <td>
                        {formatFileSize(
                          item.file_size
                        )}
                      </td>

                      <td>
                        {item.uploaded_by_name ||
                          item.uploaded_by_email ||
                          "—"}
                      </td>

                      <td>
                        {formatDateTime(
                          item.created_at
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() =>
                            handleDownload(
                              item
                            )
                          }
                          disabled={
                            !canDownloadDocuments(
                              currentUser
                            )
                          }
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function SettingsPage({
  currentUser,
  displayName,
  displayRole,
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            SYSTEM SETTINGS
          </p>

          <h1>Settings</h1>

          <p>
            Review your SecureVault account
            information.
          </p>
        </div>
      </div>

      <section className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-icon">
            ♙
          </div>

          <h2>Account</h2>

          <div className="settings-row">
            <span>Name</span>
            <strong>
              {displayName}
            </strong>
          </div>

          <div className="settings-row">
            <span>Email</span>
            <strong>
              {currentUser?.email || "—"}
            </strong>
          </div>

          <div className="settings-row">
            <span>Role</span>
            <strong>
              {displayRole}
            </strong>
          </div>

          <div className="settings-row">
            <span>Status</span>
            <strong>
              {currentUser?.status ||
                "Active"}
            </strong>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-icon">
            🔐
          </div>

          <h2>Security</h2>

          <div className="settings-feature">
            <span>JWT Authentication</span>
            <strong>Active</strong>
          </div>

          <div className="settings-feature">
            <span>Role-Based Access Control</span>
            <strong>Active</strong>
          </div>

          <div className="settings-feature">
            <span>Encrypted Documents</span>
            <strong>Active</strong>
          </div>

          <div className="settings-feature">
            <span>Audit Logging</span>
            <strong>Active</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SHARED COMPONENTS
   ========================================================= */

function LoadingState({ text }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <span>{text}</span>
    </div>
  );
}

function EmptyState({
  title,
  description,
}) {
  return (
    <div className="empty-state large">
      <div className="empty-state-icon">
        ◌
      </div>

      <strong>{title}</strong>

      <span>{description}</span>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function canEditCases(user) {
  return (
    user?.role === "Administrator" ||
    user?.role ===
      "Investigation Officer" ||
    user?.role === "Clerk"
  );
}

function canDownloadDocuments(user) {
  return (
    user?.role === "Administrator" ||
    user?.role ===
      "Investigation Officer" ||
    user?.role === "Reviewer"
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "—";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    size /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

function truncate(text, length) {
  if (!text) {
    return "";
  }

  const value = String(text);

  if (value.length <= length) {
    return value;
  }

  return `${value.slice(
    0,
    length
  )}...`;
}

function statusClass(status) {
  const value =
    String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

  if (value === "open") {
    return "status-open";
  }

  if (
    value === "closed" ||
    value === "approved"
  ) {
    return "status-success";
  }

  if (
    value === "under-investigation" ||
    value === "under-review"
  ) {
    return "status-warning";
  }

  return "status-neutral";
}

function getFileIcon(fileType) {
  const type =
    String(fileType || "")
      .toLowerCase();

  if (type.includes("pdf")) {
    return "PDF";
  }

  if (type.includes("image")) {
    return "IMG";
  }

  if (
    type.includes("word") ||
    type.includes("document")
  ) {
    return "DOC";
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("csv")
  ) {
    return "XLS";
  }

  if (type.includes("text")) {
    return "TXT";
  }

  return "FILE";
}

export default App;