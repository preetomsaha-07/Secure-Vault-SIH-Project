function Users() {
  const users = [
    {
      name: "Admin User",
      email: "admin@securevault.com",
      role: "Administrator",
      status: "Active",
      lastLogin: "02 Sep 2026, 10:15 AM",
    },
    {
      name: "Rahim Ahmed",
      email: "rahim@securevault.com",
      role: "Investigation Officer",
      status: "Active",
      lastLogin: "02 Sep 2026, 09:42 AM",
    },
    {
      name: "Karim Hasan",
      email: "karim@securevault.com",
      role: "Investigation Officer",
      status: "Active",
      lastLogin: "02 Sep 2026, 09:20 AM",
    },
    {
      name: "Ayesha Akter",
      email: "ayesha@securevault.com",
      role: "Reviewer",
      status: "Inactive",
      lastLogin: "31 Aug 2026, 04:12 PM",
    },
  ];

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>
            Manage authorized SecureVault users and their roles.
          </p>
        </div>

        <button className="primary-btn">
          + Add New User
        </button>
      </div>

      <div className="user-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search users..."
        />

        <select className="filter-select">
          <option>All Roles</option>
          <option>Administrator</option>
          <option>Investigation Officer</option>
          <option>Reviewer</option>
          <option>Clerk</option>
        </select>

        <select className="filter-select">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="user-table">

        <div className="user-row user-header">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last Login</span>
          <span>Action</span>
        </div>

        {users.map((user) => (
          <div className="user-row" key={user.email}>

            <div className="user-details">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>

            <span>{user.role}</span>

            <span>
              <strong
                className={
                  user.status === "Active"
                    ? "user-active"
                    : "user-inactive"
                }
              >
                {user.status}
              </strong>
            </span>

            <span>{user.lastLogin}</span>

            <button className="small-btn">
              Manage
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Users;