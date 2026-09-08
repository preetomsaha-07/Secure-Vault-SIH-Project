-- SECUREVAULT RELATIONAL DATABASE SCHEMA (PostgreSQL & Relational Dialect)

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'ADMINISTRATOR', 'INVESTIGATOR', 'AUDITOR'
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- 'DOC_READ', 'DOC_WRITE', 'AUDIT_VERIFY', etc.
    description TEXT
);

-- 4. USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    badge_number TEXT UNIQUE,
    department_id TEXT REFERENCES departments(id),
    role TEXT NOT NULL DEFAULT 'INVESTIGATOR', -- Primary role denormalized for speed
    is_active INTEGER NOT NULL DEFAULT 1,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    mfa_secret TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. USER_ROLES (M:N mapping)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, role_id)
);

-- 6. CASES
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE, -- 'CASE-2026-104'
    title TEXT NOT NULL,
    description TEXT,
    department_id TEXT NOT NULL REFERENCES departments(id),
    sensitivity_level TEXT NOT NULL DEFAULT 'CONFIDENTIAL', -- 'UNRESTRICTED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'UNDER_REVIEW', 'CLOSED', 'ARCHIVED'
    created_by TEXT REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 7. CASE_MEMBERS
CREATE TABLE IF NOT EXISTS case_members (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_in_case TEXT NOT NULL DEFAULT 'INVESTIGATOR', -- 'LEAD_INVESTIGATOR', 'INVESTIGATOR', 'ANALYST'
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (case_id, user_id)
);

-- 8. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL, -- encrypted storage object key
    sha256_hash TEXT NOT NULL,
    encryption_algo TEXT NOT NULL DEFAULT 'aes-256-gcm',
    encryption_key_id TEXT NOT NULL,
    case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
    department_id TEXT NOT NULL REFERENCES departments(id),
    owner_id TEXT NOT NULL REFERENCES users(id),
    sensitivity_level TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
    current_version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'UNDER_REVIEW', 'ARCHIVED', 'DELETED'
    ai_classification TEXT, -- 'FIR', 'Investigation Report', 'Evidence', etc.
    ai_confidence REAL,
    ai_summary TEXT,
    ai_entities TEXT, -- JSON string of detected entities
    ocr_extracted_text TEXT,
    is_tampered_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- 9. DOCUMENT_VERSIONS
CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    change_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (document_id, version_number)
);

-- 10. DOCUMENT_PERMISSIONS
CREATE TABLE IF NOT EXISTS document_permissions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
    permission TEXT NOT NULL, -- 'READ', 'WRITE', 'DOWNLOAD', 'ADMIN'
    expires_at TEXT,
    granted_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. TAGS
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. DOCUMENT_TAGS
CREATE TABLE IF NOT EXISTS document_tags (
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- 13. EVIDENCE
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    evidence_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
    current_custodian_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'COLLECTED', -- 'COLLECTED', 'LOGGED', 'IN_ANALYSIS', 'IN_CUSTODY', 'PRESENTED_IN_COURT', 'ARCHIVED'
    storage_location TEXT,
    integrity_hash TEXT NOT NULL,
    collected_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. CHAIN_OF_CUSTODY
CREATE TABLE IF NOT EXISTS chain_of_custody (
    id TEXT PRIMARY KEY,
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    previous_custodian TEXT,
    new_custodian TEXT NOT NULL,
    action TEXT NOT NULL, -- 'COLLECTED', 'TRANSFERRED', 'EVIDENCE_REVIEW', 'COURT_SUBMISSION'
    reason TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    performed_by_id TEXT NOT NULL REFERENCES users(id),
    integrity_hash TEXT NOT NULL,
    signature_status TEXT NOT NULL DEFAULT 'PENDING'
);

-- 15. DIGITAL_SIGNATURES
CREATE TABLE IF NOT EXISTS digital_signatures (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    signer_id TEXT NOT NULL REFERENCES users(id),
    signer_name TEXT NOT NULL,
    signed_hash TEXT NOT NULL,
    signature_hex TEXT NOT NULL,
    key_fingerprint TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'RSA-PSS-SHA256',
    certificate_authority TEXT NOT NULL,
    signed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    resource_id TEXT,
    resource_type TEXT,
    case_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL
);

-- 17. AUDIT_CHAIN (Chain state record)
CREATE TABLE IF NOT EXISTS audit_chain (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_block_id TEXT NOT NULL,
    last_hash TEXT NOT NULL,
    block_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 18. SECURITY_ALERTS
CREATE TABLE IF NOT EXISTS security_alerts (
    id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL, -- 'UNAUTHORIZED_ACCESS', 'FAILED_LOGINS', 'TAMPERING_DETECTED', 'BULK_DOWNLOAD'
    severity TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    user_id TEXT,
    resource_id TEXT,
    case_id TEXT,
    description TEXT NOT NULL,
    reasons TEXT, -- JSON string array of explainable reasons
    risk_score INTEGER NOT NULL DEFAULT 50,
    is_resolved INTEGER NOT NULL DEFAULT 0,
    resolved_by TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'SECURITY_ALERT', 'ACCESS_REQUEST'
    resource_id TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. SHARE_LINKS
CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    can_download INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_revoked INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 21. DOCUMENT_INTEGRITY
CREATE TABLE IF NOT EXISTS document_integrity (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    registered_hash TEXT NOT NULL,
    verified_hash TEXT NOT NULL,
    status TEXT NOT NULL, -- 'VERIFIED', 'COMPROMISED'
    verified_by TEXT NOT NULL REFERENCES users(id),
    verified_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 22. ACCESS_REQUESTS
CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    case_id TEXT REFERENCES cases(id),
    reason TEXT NOT NULL,
    duration_hours INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
    reviewed_by TEXT REFERENCES users(id),
    reviewed_at TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 23. RETENTION_POLICIES
CREATE TABLE IF NOT EXISTS retention_policies (
    id TEXT PRIMARY KEY,
    department_id TEXT REFERENCES departments(id),
    sensitivity_level TEXT NOT NULL,
    retention_period_years INTEGER NOT NULL DEFAULT 7,
    auto_archive INTEGER NOT NULL DEFAULT 1,
    authorized_disposal_required INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- INDEXES FOR SPEED & AUTHORIZATION
CREATE INDEX IF NOT EXISTS idx_docs_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_docs_dept ON documents(department_id);
CREATE INDEX IF NOT EXISTS idx_docs_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_docs_hash ON documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_case_members ON case_members(case_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
