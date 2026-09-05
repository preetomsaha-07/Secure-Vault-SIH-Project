function Cases() {
  const cases = [
    {
      id: "CASE-2026-001",
      title: "Financial Fraud Investigation",
      officer: "Officer Rahim",
      status: "Active",
      documents: 18,
    },
    {
      id: "CASE-2026-002",
      title: "Cyber Crime Investigation",
      officer: "Officer Karim",
      status: "Under Review",
      documents: 32,
    },
    {
      id: "CASE-2026-003",
      title: "Document Forgery Investigation",
      officer: "Officer Ayesha",
      status: "Active",
      documents: 11,
    },
  ];

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1>Cases</h1>
          <p>Manage investigation cases securely.</p>
        </div>

        <button className="primary-btn">
          + Create New Case
        </button>
      </div>

      <div className="case-grid">

        {cases.map((item) => (
          <div className="case-card" key={item.id}>

            <div className="case-top">
              <span className="case-id">{item.id}</span>
              <span className="status">{item.status}</span>
            </div>

            <h2>{item.title}</h2>

            <p>
              <strong>Assigned Officer:</strong>{" "}
              {item.officer}
            </p>

            <p>
              <strong>Documents:</strong>{" "}
              {item.documents}
            </p>

            <button className="view-btn">
              View Case
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Cases;